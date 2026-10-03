import { route, ok, HttpError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { refundOrder, setStatus } from "@/lib/orderService";
import Order from "@/models/Order";

export const POST = route(async (_req, { params }) => {
  const { id } = await params;
  const order = await Order.findOne({ _id: id, user: await requireUser() });
  if (!order) throw new HttpError(404, "Order not found");

  // Only before it ships
  if (!["pending_payment", "confirmed", "processing"].includes(order.status))
    throw new HttpError(400, "This order can no longer be cancelled");

  await refundOrder(order);                        // refunds + restocks only if it was paid
  await setStatus(order, "cancelled", "Cancelled by customer");
  return ok({ order });
});
