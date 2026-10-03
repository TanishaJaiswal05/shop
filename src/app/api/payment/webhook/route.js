import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { confirmOrder } from "@/lib/orderService";
import Order from "@/models/Order";

// Safety net: Razorpay calls this even if the user closes the tab right after paying
export async function POST(req) {
  const raw = await req.text();                                   // signature is over the RAW body
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "").update(raw).digest("hex");
  if (req.headers.get("x-razorpay-signature") !== expected) return new Response("Bad signature", { status: 400 });

  const event = JSON.parse(raw);
  if (event.event === "payment.captured") {
    await connectDB();
    const p = event.payload.payment.entity;
    const order = await Order.findOne({ "payment.razorpayOrderId": p.order_id });
    if (order) await confirmOrder(order, p.id, null);             // idempotent, safe if /verify already ran
  }
  return new Response("ok");                                      // always 200 so Razorpay stops retrying
}
