import crypto from "crypto";
import { route, ok, HttpError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { confirmOrder, setStatus } from "@/lib/orderService";
import Order from "@/models/Order";

// Browser calls this after Razorpay reports success.
// We don't trust the browser: we recompute the signature with our secret key.
export const POST = route(async (req) => {
  const userId = await requireUser();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  const order = await Order.findOne({ "payment.razorpayOrderId": razorpay_order_id, user: userId });
  if (!order) throw new HttpError(404, "Order not found");
  if (order.status !== "pending_payment") return ok({ orderId: order._id, status: order.status }); // already handled

  // Razorpay's signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
  const valid = razorpay_signature?.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));

  if (!valid) {
    order.payment.status = "failed";
    order.payment.error = "Signature mismatch";
    await setStatus(order, "pending_payment", "Payment verification failed");
    throw new HttpError(400, "Payment verification failed");
  }

  const confirmed = await confirmOrder(order, razorpay_payment_id, razorpay_signature);
  return ok({ orderId: confirmed._id, status: confirmed.status });
});
