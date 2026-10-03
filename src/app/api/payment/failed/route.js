import { route, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { setStatus } from "@/lib/orderService";
import Order from "@/models/Order";

// POST { orderId, reason: "failed" | "cancelled", message }
// The order stays "pending_payment" so the user can retry on the same Razorpay order.
export const POST = route(async (req) => {
  const userId = await requireUser();
  const { orderId, reason, message } = await req.json();
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (order && order.status === "pending_payment") {
    order.payment.status = reason === "cancelled" ? "cancelled" : "failed";
    order.payment.error = message;
    await setStatus(order, "pending_payment", `Payment ${order.payment.status}${message ? `: ${message}` : ""}`);
  }
  return ok({ recorded: true });
});
