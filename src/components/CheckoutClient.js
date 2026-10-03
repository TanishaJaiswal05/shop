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

  useEffect(() => {
    fetch("/api/addresses")
      .then(async (r) => {
        if (r.status === 401) return router.push("/login?next=/checkout");
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Could not load your saved addresses.");
        setAddresses(d.addresses || []);
        setAddressId(d.addresses?.[0]?._id || "");
      })
      .catch((loadError) => setError(loadError.message || "Could not load your saved addresses."));
  }, [router]);

  useEffect(() => {
    fetch(`/api/cart?delivery=${delivery}`)
      .then(async (r) => {
        if (r.status === 401) return router.push("/login?next=/checkout");
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Could not load your order summary.");
        setSummary(data);
      })
      .catch((loadError) => setError(loadError.message || "Could not load your order summary."));
  }, [delivery, router]);

  async function addAddress(e) {
    e.preventDefault();
    const form = e.target;
    try {
      const res = await fetch("/api/addresses", json(Object.fromEntries(new FormData(form))));
      const d = await res.json();
      if (!res.ok) return setError(d.error || "Could not save this address.");
      setError("");
      setAddresses(d.addresses);
      setAddressId(d.addresses.at(-1)._id);
      form.reset();
    } catch {
      setError("Network error while saving your address. Please try again.");
    }
  }

  async function pay() {
    setError("");
    setPaying(true);

    let payload;
    try {
      const res = await fetch("/api/orders", json({ addressId, delivery }));
      payload = await res.json();
      if (!res.ok) {
        setError(payload.error || "Could not create your order.");
        return setPaying(false);
      }
    } catch {
      setError("Network error while creating your order. Please try again.");
      return setPaying(false);
    }

    try {
      await startPayment(payload, {
        onSuccess: (orderId) => router.push(`/orders/${orderId}?confirmed=1`),
        onError: (msg) => {
          setError(msg);
          setPaying(false);
        },
        onClose: () => {
          setError("Payment cancelled. Your order is saved in My Orders, where you can pay later.");
          setPaying(false);
        },
      });
    } catch (e) {
      setError(e.message);
      setPaying(false);
    }
  }

  if (!summary && error) return <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</p>;
  if (!summary) return <div className="py-10 text-center text-sm text-slate-500">Loading checkout…</div>;
  if (summary.lines.length === 0) return <div className="text-center py-8"><p className="text-gray-600">Your cart is empty.</p></div>;

  const input = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";

  return (
    <div className="grid items-start gap-6 lg:grid-cols-3 lg:gap-8">
      <section className="space-y-5 lg:col-span-2">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Almost there</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Checkout</h1>
          <p className="mt-2 text-sm text-slate-500">Confirm delivery details and choose how your order arrives.</p>
        </div>
        {/* Delivery Address Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-5 flex items-center gap-3 text-lg font-bold text-slate-900">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">1</span>
            Delivery Address
          </h2>

          {/* Saved Addresses */}
          {addresses.length > 0 && (
            <div className="mb-5 space-y-3">
              {addresses.map((a) => (
                <label key={a._id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${addressId === a._id ? "border-violet-400 bg-violet-50/60 ring-2 ring-violet-100" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
                  <input
                    type="radio"
                    checked={addressId === a._id}
                    onChange={() => setAddressId(a._id)}
                    className="mt-1 h-4 w-4 cursor-pointer accent-violet-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{a.name}</p>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-600">{a.line1}</p>
                    <p className="text-sm text-slate-600">
                      {a.city}, {a.state} {a.pincode} · {a.phone}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Add New Address Form */}
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 font-semibold text-slate-800 transition hover:border-violet-300 hover:bg-violet-50 [&::-webkit-details-marker]:hidden">
              <span className="text-lg text-violet-600 transition group-open:rotate-45">+</span> Add a new address
            </summary>
            <form onSubmit={addAddress} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input key="name" name="name" placeholder="Full name" required className={input} />
                <input key="phone" name="phone" placeholder="Phone" required className={input} />
              </div>
              <input key="line1" name="line1" placeholder="Address line 1" required className={input} />
              <input key="line2" name="line2" placeholder="Address line 2 (optional)" className={input} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input key="city" name="city" placeholder="City" required className={input} />
                <input key="state" name="state" placeholder="State" required className={input} />
              </div>
              <input key="pincode" name="pincode" placeholder="Pincode" required className={input} />
              <button className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-700">
                Save Address
              </button>
            </form>
          </details>
        </div>

        {/* Delivery Options Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-5 flex items-center gap-3 text-lg font-bold text-slate-900">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">2</span>
            Delivery Method
          </h2>
          <div className="space-y-3">
            {[
              ["standard", "Standard Delivery (4–6 days)", "Free on orders above ₹499, else ₹49"],
              ["express", "Express Delivery (1–2 days)", "₹149"],
            ].map(([k, label, desc]) => (
              <label key={k} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${delivery === k ? "border-violet-400 bg-violet-50/60 ring-2 ring-violet-100" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
                <input
                  type="radio"
                  checked={delivery === k}
                  onChange={() => setDelivery(k)}
                  className="h-4 w-4 cursor-pointer accent-violet-600"
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{label}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Order Summary Sidebar */}
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 sm:p-6">
        <h2 className="mb-5 flex items-center gap-3 text-lg font-bold text-slate-900">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">3</span>
          Payment
        </h2>
        <p className="mb-4 text-sm font-semibold text-slate-700">Order summary</p>

        {/* Items */}
        <div className="mb-4 max-h-48 space-y-2 overflow-y-auto border-b border-slate-100 pb-4">
          {summary.lines.map((l) => (
            <div key={l.product} className="flex justify-between gap-2 text-sm">
              <span className="line-clamp-1 text-slate-600">{l.title}</span>
              <span className="flex-shrink-0">
                <span className="font-medium text-slate-900">{rupees(l.price * l.qty)}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Pricing Breakdown */}
        <div className="space-y-2 border-b border-slate-100 pb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium text-slate-900">{rupees(summary.subtotal)}</span>
          </div>
          {summary.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Coupon {summary.couponCode}</span>
              <span>− {rupees(summary.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-600">Delivery</span>
            <span className="font-medium text-slate-900">
              {summary.deliveryFee ? rupees(summary.deliveryFee) : "Free"}
            </span>
          </div>
        </div>

        {/* Total */}
        <div className="mb-4 mt-4 flex justify-between border-t border-slate-100 pt-4">
          <span className="text-lg font-bold text-slate-900">Total</span>
          <span className="text-lg font-bold text-slate-900">{rupees(summary.total)}</span>
        </div>

        {/* Error Message */}
        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={pay}
          disabled={!addressId || paying}
          className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {paying ? "Processing Payment…" : `Pay ${rupees(summary.total)}`}
        </button>

        {!addressId && (
          <p className="mt-3 text-center text-xs text-slate-500">
            ↑ Add a delivery address to continue
          </p>
        )}
      </aside>
    </div>
  );
}
