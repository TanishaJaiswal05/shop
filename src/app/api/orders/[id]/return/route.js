import { route, ok, HttpError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { setStatus } from "@/lib/orderService";
import Order from "@/models/Order";

const RETURN_WINDOW_DAYS = 7;

export const POST = route(async (req, { params }) => {
  const { id } = await params;
  const { reason } = await req.json();
  const order = await Order.findOne({ _id: id, user: await requireUser() });
  if (!order) throw new HttpError(404, "Order not found");
  if (order.status !== "delivered") throw new HttpError(400, "Only delivered orders can be returned");
  if (Date.now() - order.deliveredAt > RETURN_WINDOW_DAYS * 864e5) throw new HttpError(400, "Return window has closed");
  if (!reason) throw new HttpError(400, "Please tell us why you're returning this");

  order.returnRequest = { reason, requestedAt: new Date() };
  await setStatus(order, "return_requested", reason);
  return ok({ order });
});
