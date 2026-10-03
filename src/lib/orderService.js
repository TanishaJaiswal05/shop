import Product from "@/models/Product";
import Cart from "@/models/Cart";
import { getRazorpay } from "./razorpay";

// Everything the browser needs to open the Razorpay popup for an order
export function paymentPayload(order, user) {
  return {
    orderId: order._id,
    razorpayOrderId: order.payment.razorpayOrderId,
    amount: order.total,                                          // paise
    currency: "INR",
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,                 // public key id (safe for the browser)
    prefill: { name: user.name, email: user.email },              // pre-fills the popup form
  };
}

// Change status and log it on the timeline (this is what "Track order" displays)
export async function setStatus(order, status, note = "") {
  order.status = status;
  order.timeline.push({ status, note });
  if (status === "delivered") order.deliveredAt = new Date();
  await order.save();
  return order;
}

// Called after a payment is verified (by /verify AND by the webhook). Safe to call twice.
export async function confirmOrder(order, paymentId, signature) {
  if (order.status !== "pending_payment") return order;           // idempotent

  // Reserve stock atomically: only decrements if enough stock remains
  const reserved = [];
  for (const it of order.items) {
    const r = await Product.updateOne({ _id: it.product, stock: { $gte: it.qty } }, { $inc: { stock: -it.qty } });
    if (r.modifiedCount === 0) {
      // Someone bought the last unit first: undo, refund, cancel
      for (const d of reserved) await Product.updateOne({ _id: d.product }, { $inc: { stock: d.qty } });
      await getRazorpay().payments.refund(paymentId, { amount: order.total });
      order.payment.status = "refunded";
      return setStatus(order, "cancelled", "Item went out of stock. Payment refunded.");
    }
    reserved.push(it);
  }

  order.payment.razorpayPaymentId = paymentId;
  if (signature) order.payment.signature = signature;
  order.payment.status = "paid";
  await Cart.deleteOne({ user: order.user });                     // empty the cart
  return setStatus(order, "confirmed", "Payment received");
}

// Refund via Razorpay and put stock back (only if payment was taken)
export async function refundOrder(order) {
  if (order.payment.status !== "paid") return;
  await getRazorpay().payments.refund(order.payment.razorpayPaymentId, { amount: order.total });
  order.payment.status = "refunded";
  for (const it of order.items) await Product.updateOne({ _id: it.product }, { $inc: { stock: it.qty } });
}
