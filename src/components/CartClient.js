"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { rupees } from "@/lib/format";

const json = (method, body) => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export default function CartClient() {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Load the cart; if the session expired, send the user to login
  useEffect(() => {
    fetch("/api/cart")
      .then(async (r) => {
        if (r.status === 401) return router.push("/login?next=/cart");
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Could not load your cart.");
        setCart(data);
      })
      .catch((loadError) => setError(loadError.message || "Could not load your cart."));
  }, [router]);

  // Every cart API returns the full, recalculated summary, so we just store it
  async function call(url, options) {
    setBusy(true); setError("");
    const res = await fetch(url, options).catch(() => null);
    setBusy(false);
    if (!res) return setError("Network error, try again");
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setCart(data);
    router.refresh();                                  // keeps the Navbar badge in sync
  }

  const setQty = (productId, qty) => call("/api/cart", json("PATCH", { productId, qty }));   // qty 0 removes
  const remove = (productId) => call(`/api/cart?productId=${productId}`, { method: "DELETE" });
  const applyCoupon = () => call("/api/cart/coupon", json("POST", { code }));
  const removeCoupon = () => call("/api/cart/coupon", { method: "DELETE" });

  if (!cart && error) return <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</p>;
  if (!cart) return <p className="py-10 text-center text-sm text-slate-500">Loading your cart…</p>;
  if (cart.lines.length === 0)
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your cart is empty</h1>
        <p className="mt-2 text-sm text-slate-500">Find something you love and it will show up here.</p>
        <Link href="/" className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">Continue shopping</Link>
      </div>
    );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-3 lg:gap-8">
      <section className="space-y-4 lg:col-span-2">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Ready when you are</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Shopping cart</h1>
          <p className="mt-2 text-sm text-slate-500">{cart.lines.length} item{cart.lines.length === 1 ? "" : "s"} in your cart</p>
        </div>
        {cart.lines.map((l) => (
          <article key={l.product} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="shrink-0 rounded-xl bg-slate-50 p-1">
                <Image src={l.thumbnail} alt={l.title} width={88} height={88} className="h-20 w-20 rounded-lg object-contain sm:h-[88px] sm:w-[88px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-semibold text-slate-900">{l.title}</p>
                <p className="mt-1 text-sm text-slate-500">{rupees(l.price)} <span className="text-xs">each</span></p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div className="inline-flex items-center rounded-xl border border-slate-200 p-1">
                <button aria-label={`Decrease quantity of ${l.title}`} onClick={() => setQty(l.product, l.qty - 1)} disabled={busy} className="h-8 w-8 rounded-lg text-lg text-slate-600 transition hover:bg-slate-100 disabled:opacity-40">−</button>
                <span className="w-9 text-center text-sm font-semibold text-slate-800">{l.qty}</span>
                <button aria-label={`Increase quantity of ${l.title}`} onClick={() => setQty(l.product, l.qty + 1)} disabled={busy || l.qty >= l.stock} className="h-8 w-8 rounded-lg text-lg text-slate-600 transition hover:bg-slate-100 disabled:opacity-40">+</button>
              </div>
              <p className="w-24 text-right font-bold text-slate-900">{rupees(l.price * l.qty)}</p>
              <button onClick={() => remove(l.product)} disabled={busy} className="rounded-lg px-2 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-40">Remove</button>
            </div>
          </article>
        ))}
      </section>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm lg:sticky lg:top-24">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">Order summary</h2>
        <p className="mt-1 text-sm text-slate-500">Review your order before checkout.</p>
        <div className="my-5 border-t border-slate-100" />

        {cart.couponCode ? (
          <p className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-emerald-800">
            <span><span aria-hidden="true">✓</span> {cart.couponCode} applied</span>
            <button onClick={removeCoupon} disabled={busy} className="font-semibold underline underline-offset-2 disabled:opacity-40">Remove</button>
          </p>
        ) : (
          <div className="mb-4 flex gap-2">
            <input aria-label="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" />
            <button onClick={applyCoupon} disabled={busy || !code.trim()} className="rounded-xl border border-slate-200 px-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40">Apply</button>
          </div>
        )}
        {(error || cart.couponError) && <p role="alert" className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error || cart.couponError}</p>}

        <div className="flex justify-between py-1.5 text-slate-600"><span>Subtotal</span><span className="font-medium text-slate-900">{rupees(cart.subtotal)}</span></div>
        {cart.discount > 0 && <div className="flex justify-between py-1.5 text-emerald-700"><span>Discount</span><span>− {rupees(cart.discount)}</span></div>}
        <p className="mt-1 text-xs leading-relaxed text-slate-500">Delivery is calculated at checkout</p>
        <div className="my-4 border-t border-slate-100" />

        <Link href="/checkout" className="block rounded-xl bg-slate-900 py-3 text-center font-semibold text-white transition hover:bg-slate-700">Proceed to checkout</Link>
        <Link href="/" className="mt-3 block text-center text-sm font-medium text-slate-500 transition hover:text-slate-900">Continue shopping</Link>
      </aside>
    </div>
  );
}
