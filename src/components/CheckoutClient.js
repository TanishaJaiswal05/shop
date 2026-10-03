"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { rupees } from "@/lib/format";
import { startPayment } from "@/lib/payClient";

const json = (body) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const FIELDS = ["name", "phone", "line1", "line2", "city", "state", "pincode"];

export default function CheckoutClient() {
  const router = useRouter();
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [delivery, setDelivery] = useState("standard");
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  // Load saved addresses once (a 401 means the session expired)
  useEffect(() => {
    fetch("/api/addresses").then(async (r) => {
      if (r.status === 401) return router.push("/login?next=/checkout");
      const d = await r.json();
      setAddresses(d.addresses || []);
      setAddressId(d.addresses?.[0]?._id || "");
    });
  }, [router]);

  // Recalculate the total whenever the delivery option changes (the server does the math)
  useEffect(() => {
    fetch(`/api/cart?delivery=${delivery}`).then(async (r) => {
      if (r.status === 401) return router.push("/login?next=/checkout");
      setSummary(await r.json());
    });
  }, [delivery, router]);

  async function addAddress(e) {
    e.preventDefault();
    const form = e.target;
    const res = await fetch("/api/addresses", json(Object.fromEntries(new FormData(form))));
    const d = await res.json();
    if (!res.ok) return setError(d.error);
    setError(""); setAddresses(d.addresses); setAddressId(d.addresses.at(-1)._id); form.reset();
  }

  async function pay() {
    setError(""); setPaying(true);

    // 1. Create our order + the Razorpay order on the server (it recalculates the price itself)
    const res = await fetch("/api/orders", json({ addressId, delivery }));
    const payload = await res.json();
    if (!res.ok) { setError(payload.error); return setPaying(false); }

    // 2. Open the Razorpay popup; the helper verifies the payment on our backend
    try {
      await startPayment(payload, {
        onSuccess: (orderId) => router.push(`/orders/${orderId}?confirmed=1`),
        onError: (msg) => { setError(msg); setPaying(false); },
        onClose: () => { setError("Payment cancelled. Your order is saved in My Orders, where you can pay later."); setPaying(false); },
      });
    } catch (e) { setError(e.message); setPaying(false); }
  }

  if (!summary) return <p>Loading…</p>;
  if (summary.lines.length === 0) return <p>Your cart is empty.</p>;
  const input = "rounded border px-3 py-2 text-sm";

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="space-y-6 md:col-span-2">
        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-semibold">1. Delivery address</h2>
          {addresses.map((a) => (
            <label key={a._id} className="mb-2 flex gap-2 text-sm">
              <input type="radio" checked={addressId === a._id} onChange={() => setAddressId(a._id)} />
              <span>{a.name}, {a.line1}, {a.city}, {a.state} {a.pincode} · {a.phone}</span>
            </label>
          ))}
          <form onSubmit={addAddress} className="mt-3 grid grid-cols-2 gap-2">
            {FIELDS.map((f) => <input key={f} name={f} placeholder={f === "line2" ? "line2 (optional)" : f} required={f !== "line2"} className={input} />)}
            <button className="col-span-2 rounded border py-2 text-sm">Save new address</button>
          </form>
        </section>

        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-semibold">2. Delivery</h2>
          {[["standard", "Standard (4–6 days): free above ₹499, else ₹49"], ["express", "Express (1–2 days): ₹149"]].map(([k, label]) => (
            <label key={k} className="mb-1 flex gap-2 text-sm">
              <input type="radio" checked={delivery === k} onChange={() => setDelivery(k)} /> {label}
            </label>
          ))}
        </section>
      </div>

      <aside className="h-fit rounded-lg border bg-white p-4 text-sm">
        <h2 className="mb-3 font-semibold">Order summary</h2>
        {summary.lines.map((l) => (
          <div key={l.product} className="flex justify-between py-1">
            <span className="line-clamp-1">{l.title} × {l.qty}</span><span>{rupees(l.price * l.qty)}</span>
          </div>
        ))}
        <hr className="my-2" />
        <Row label="Subtotal" value={rupees(summary.subtotal)} />
        {summary.discount > 0 && <Row label={`Coupon ${summary.couponCode}`} value={`− ${rupees(summary.discount)}`} />}
        <Row label="Delivery" value={summary.deliveryFee ? rupees(summary.deliveryFee) : "Free"} />
        <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold"><span>Total</span><span>{rupees(summary.total)}</span></div>
        {error && <p className="mt-3 text-red-600">{error}</p>}
        <button onClick={pay} disabled={!addressId || paying} className="mt-4 w-full rounded bg-black py-3 text-white disabled:opacity-40">
          {paying ? "Processing…" : `Pay ${rupees(summary.total)}`}
        </button>
        {!addressId && <p className="mt-2 text-xs text-gray-500">Add a delivery address to continue.</p>}
      </aside>
    </div>
  );
}

const Row = ({ label, value }) => <div className="flex justify-between py-0.5"><span>{label}</span><span>{value}</span></div>;
