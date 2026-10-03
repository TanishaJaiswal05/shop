import { route, ok, HttpError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { buildSummary } from "@/lib/pricing";
import { getRazorpay } from "@/lib/razorpay";
import { paymentPayload } from "@/lib/orderService";
import User from "@/models/User";
import Cart from "@/models/Cart";
import Order from "@/models/Order";

// GET -> my orders, newest first
export const GET = route(async () => {
  const orders = await Order.find({ user: await requireUser() }).sort({ createdAt: -1 });
  return ok({ orders });
});

// POST { addressId, delivery } -> creates our Order + a Razorpay order, returns what the checkout popup needs
export const POST = route(async (req) => {
  const userId = await requireUser();
  const { addressId, delivery = "standard" } = await req.json();

  const user = await User.findById(userId);
  const address = user.addresses.id(addressId);
  if (!address) throw new HttpError(400, "Please select a delivery address");

  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart?.items.length) throw new HttpError(400, "Your cart is empty");

  // NEVER trust prices from the browser: recompute everything from the database
  const s = await buildSummary(cart, delivery, { strict: true });
  for (const l of s.lines) {
    if (l.qty > l.stock) throw new HttpError(409, `Only ${l.stock} left of "${l.title}"`);
  }

  const order = await Order.create({
    user: userId,
    items: s.lines.map(({ stock, ...line }) => line),            // drop `stock`, keep the snapshot
    address: address.toObject(),
    delivery: { method: s.deliveryMethod, fee: s.deliveryFee },
    coupon: { code: s.couponCode, discount: s.discount },
    subtotal: s.subtotal, total: s.total,
    timeline: [{ status: "pending_payment", note: "Order created" }],
  });

  // Create the matching order on Razorpay (amount in paise)
  const rp = await getRazorpay().orders.create({
    amount: s.total, currency: "INR", receipt: String(order._id), notes: { orderId: String(order._id) },
  });
  order.payment.razorpayOrderId = rp.id;
  await order.save();

  return ok(paymentPayload(order, user), 201);
});
