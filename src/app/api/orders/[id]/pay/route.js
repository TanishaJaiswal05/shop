import { route, ok, HttpError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { paymentPayload } from "@/lib/orderService";
import Order from "@/models/Order";
import User from "@/models/User";
import Product from "@/models/Product";

// POST -> re-open payment for an order that is still "pending_payment"
// (user cancelled the popup, payment failed, or closed the tab).
// Razorpay allows many attempts on the same Razorpay order, so we reuse it.
export const POST = route(async (_req, { params }) => {
  const userId = await requireUser();
  const { id } = await params;
  const order = await Order.findOne({ _id: id, user: userId });
  if (!order) throw new HttpError(404, "Order not found");
  if (order.status !== "pending_payment") throw new HttpError(400, "This order is not awaiting payment");

  // Stock may have changed since the order was created
  for (const it of order.items) {
    const p = await Product.findById(it.product).select("stock title");
    if (!p || p.stock < it.qty) throw new HttpError(409, `"${it.title}" is no longer available in this quantity`);
  }

  const user = await User.findById(userId).select("name email");
  return ok(paymentPayload(order, user));
});
