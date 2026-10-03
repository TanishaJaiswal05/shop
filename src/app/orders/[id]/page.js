import Image from "next/image";
import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { rupees, statusLabel } from "@/lib/format";
import Order from "@/models/Order";
import OrderActions from "@/components/OrderActions";

// The happy-path steps shown in the tracker
const STEPS = ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"];

export default async function OrderPage({ params, searchParams }) {
  const { id } = await params;
  const { confirmed } = await searchParams;                     // ?confirmed=1 right after payment
  if (!mongoose.isValidObjectId(id)) notFound();

  await connectDB();
  // Filtering by user means you can only ever open your own orders
  const raw = await Order.findOne({ _id: id, user: await getUserId() }).lean();
  if (!raw) notFound();
  const o = JSON.parse(JSON.stringify(raw));

  const reached = STEPS.indexOf(o.status);                      // -1 for cancelled / returns / pending
  const canPay = o.status === "pending_payment";                 // payment not completed yet
  const canCancel = ["pending_payment", "confirmed", "processing"].includes(o.status);
  const canReturn = o.status === "delivered";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {confirmed && o.status === "confirmed" && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-800">
          🎉 Order confirmed! We've received your payment of {rupees(o.total)}.
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">Order #{o._id.slice(-8).toUpperCase()}</h1>
        <p className="capitalize text-gray-600">Status: {statusLabel(o.status)}</p>
      </div>

      {/* Tracker: filled dots = steps reached */}
      {reached >= 0 && (
        <ol className="flex justify-between text-center text-xs">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1">
              <div className={`mx-auto mb-1 h-3 w-3 rounded-full ${i <= reached ? "bg-green-600" : "bg-gray-300"}`} />
              <span className="capitalize">{statusLabel(s)}</span>
            </li>
          ))}
        </ol>
      )}

      <section className="rounded-lg border bg-white p-4">
        {o.items.map((it) => (
          <div key={it.product} className="flex items-center gap-3 py-2">
            <Image src={it.thumbnail} alt={it.title} width={56} height={56} className="rounded object-contain" />
            <span className="flex-1">{it.title} × {it.qty}</span>
            <span>{rupees(it.price * it.qty)}</span>
          </div>
        ))}
        <hr className="my-2" />
        <div className="space-y-0.5 text-sm">
          <p className="flex justify-between"><span>Subtotal</span><span>{rupees(o.subtotal)}</span></p>
          {o.coupon?.discount > 0 && <p className="flex justify-between"><span>Coupon {o.coupon.code}</span><span>− {rupees(o.coupon.discount)}</span></p>}
          <p className="flex justify-between"><span>Delivery ({o.delivery.method})</span><span>{o.delivery.fee ? rupees(o.delivery.fee) : "Free"}</span></p>
          <p className="flex justify-between text-base font-semibold"><span>Total</span><span>{rupees(o.total)}</span></p>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4 text-sm">
        <h2 className="mb-1 font-semibold">Delivering to</h2>
        {o.address.name}, {o.address.line1} {o.address.line2}, {o.address.city}, {o.address.state} {o.address.pincode} · {o.address.phone}
      </section>

      {/* Full history, newest last */}
      <section className="rounded-lg border bg-white p-4 text-sm">
        <h2 className="mb-2 font-semibold">History</h2>
        {o.timeline.map((t, i) => (
          <p key={i} className="py-0.5">
            <span className="capitalize">{statusLabel(t.status)}</span>
            {t.note && <span className="text-gray-500"> · {t.note}</span>}
            <span className="float-right text-gray-400">{new Date(t.at).toLocaleString("en-IN")}</span>
          </p>
        ))}
      </section>

      <OrderActions orderId={o._id} canPay={canPay} canCancel={canCancel} canReturn={canReturn} />
    </div>
  );
}
