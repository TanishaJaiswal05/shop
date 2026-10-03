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
    fetch("/api/addresses").then(async (r) => {
      if (r.status === 401) return router.push("/login?next=/checkout");
      const d = await r.json();
      setAddresses(d.addresses || []);
      setAddressId(d.addresses?.[0]?._id || "");
    });
  }, [router]);

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
    setError("");
    setAddresses(d.addresses);
    setAddressId(d.addresses.at(-1)._id);
    form.reset();
  }

  async function pay() {
    setError("");
    setPaying(true);

    const res = await fetch("/api/orders", json({ addressId, delivery }));
    const payload = await res.json();
    if (!res.ok) {
      setError(payload.error);
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

  if (!summary) return <div className="text-center py-8"><p className="text-gray-600">Loading…</p></div>;
  if (summary.lines.length === 0) return <div className="text-center py-8"><p className="text-gray-600">Your cart is empty.</p></div>;

  const input = "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none";

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Delivery Address Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white text-sm font-semibold">1</span>
            Delivery Address
          </h2>

          {/* Saved Addresses */}
          {addresses.length > 0 && (
            <div className="mb-4 space-y-2">
              {addresses.map((a) => (
                <label key={a._id} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-gray-400 transition">
                  <input
                    type="radio"
                    checked={addressId === a._id}
                    onChange={() => setAddressId(a._id)}
                    className="mt-1 h-4 w-4 accent-black cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{a.name}</p>
                    <p className="text-sm text-gray-600 line-clamp-1">{a.line1}</p>
                    <p className="text-sm text-gray-600">
                      {a.city}, {a.state} {a.pincode} · {a.phone}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Add New Address Form */}
          <details className="cursor-pointer">
            <summary className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 font-medium text-gray-900 hover:bg-gray-100 transition">
              <span className="text-lg">+</span> Add new address
            </summary>
            <form onSubmit={addAddress} className="mt-4 space-y-3 border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <input key="name" name="name" placeholder="Full name" required className={input} />
                <input key="phone" name="phone" placeholder="Phone" required className={input} />
              </div>
              <input key="line1" name="line1" placeholder="Address line 1" required className={input} />
              <input key="line2" name="line2" placeholder="Address line 2 (optional)" className={input} />
              <div className="grid grid-cols-2 gap-3">
                <input key="city" name="city" placeholder="City" required className={input} />
                <input key="state" name="state" placeholder="State" required className={input} />
              </div>
              <input key="pincode" name="pincode" placeholder="Pincode" required className={input} />
              <button className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 font-medium text-gray-900 hover:bg-gray-100 transition">
                Save Address
              </button>
            </form>
          </details>
        </div>

        {/* Delivery Options Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white text-sm font-semibold">2</span>
            Delivery Method
          </h2>
          <div className="space-y-2">
            {[
              ["standard", "Standard Delivery (4–6 days)", "Free on orders above ₹499, else ₹49"],
              ["express", "Express Delivery (1–2 days)", "₹149"],
            ].map(([k, label, desc]) => (
              <label key={k} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-gray-400 transition">
                <input
                  type="radio"
                  checked={delivery === k}
                  onChange={() => setDelivery(k)}
                  className="h-4 w-4 accent-black cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{label}</p>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Order Summary Sidebar */}
      <div className="h-fit rounded-lg border border-gray-200 bg-white p-6 shadow-sm sticky top-20">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Order Summary</h2>

        {/* Items */}
        <div className="mb-4 space-y-2 border-b border-gray-200 pb-4 max-h-48 overflow-y-auto">
          {summary.lines.map((l) => (
            <div key={l.product} className="flex justify-between gap-2 text-sm">
              <span className="text-gray-600 line-clamp-1">{l.title}</span>
              <span className="flex-shrink-0">
                <span className="font-medium text-gray-900">{rupees(l.price * l.qty)}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Pricing Breakdown */}
        <div className="space-y-2 border-b border-gray-200 pb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">{rupees(summary.subtotal)}</span>
          </div>
          {summary.discount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Coupon {summary.couponCode}</span>
              <span>− {rupees(summary.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery</span>
            <span className="font-medium text-gray-900">
              {summary.deliveryFee ? rupees(summary.deliveryFee) : "Free"}
            </span>
          </div>
        </div>

        {/* Total */}
        <div className="mb-4 mt-4 flex justify-between border-t border-gray-200 pt-4">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-lg font-bold text-gray-900">{rupees(summary.total)}</span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={pay}
          disabled={!addressId || paying}
          className="w-full rounded-lg bg-black py-3 font-medium text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paying ? "Processing Payment…" : `Pay ${rupees(summary.total)}`}
        </button>

        {!addressId && (
          <p className="mt-3 text-xs text-gray-500 text-center">
            ↑ Add a delivery address to continue
          </p>
        )}
      </div>
    </div>
  );
}
