import { route, ok, HttpError } from "@/lib/api";
import { refundOrder, setStatus } from "@/lib/orderService";
import Order from "@/models/Order";

// PATCH with header  x-admin-key: <ADMIN_KEY>   body { "status": "shipped", "note": "Courier: Delhivery" }
// Statuses: processing -> shipped -> out_for_delivery -> delivered, or "refunded" to approve a return
export const PATCH = route(async (req, { params }) => {
  if (!process.env.ADMIN_KEY || req.headers.get("x-admin-key") !== process.env.ADMIN_KEY)
    throw new HttpError(403, "Forbidden");
  const { id } = await params;
  const { status, note } = await req.json();
  const order = await Order.findById(id);
  if (!order) throw new HttpError(404, "Order not found");

  if (status === "refunded") await refundOrder(order);   // sends money back via Razorpay
  await setStatus(order, status, note);
  return ok({ order });
});
