import { route, ok, HttpError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import Order from "@/models/Order";

// GET -> full order including `timeline` for the tracking UI
export const GET = route(async (_req, { params }) => {
  const { id } = await params;
  const order = await Order.findOne({ _id: id, user: await requireUser() });
  if (!order) throw new HttpError(404, "Order not found");
  return ok({ order });
});
