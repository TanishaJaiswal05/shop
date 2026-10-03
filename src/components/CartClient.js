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
    fetch("/api/cart").then(async (r) => {
      if (r.status === 401) return router.push("/login?next=/cart");
      setCart(await r.json());
    });
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

  if (!cart) return <p>Loading…</p>;
  if (cart.lines.length === 0)
    return <p>Your cart is empty. <Link href="/" className="underline">Continue shopping</Link></p>;

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="space-y-3 md:col-span-2">
        {cart.lines.map((l) => (
          <div key={l.product} className="flex items-center gap-4 rounded-lg border bg-white p-3">
            <Image src={l.thumbnail} alt={l.title} width={80} height={80} className="rounded object-contain" />
            <div className="flex-1">
              <p className="font-medium">{l.title}</p>
              <p className="text-sm text-gray-500">{rupees(l.price)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(l.product, l.qty - 1)} disabled={busy} className="h-8 w-8 rounded border disabled:opacity-40">−</button>
              <span className="w-6 text-center">{l.qty}</span>
              <button onClick={() => setQty(l.product, l.qty + 1)} disabled={busy || l.qty >= l.stock} className="h-8 w-8 rounded border disabled:opacity-40">+</button>
            </div>
            <p className="w-24 text-right font-semibold">{rupees(l.price * l.qty)}</p>
            <button onClick={() => remove(l.product)} disabled={busy} className="text-sm text-red-600">Remove</button>
          </div>
        ))}
      </div>

      <aside className="h-fit rounded-lg border bg-white p-4 text-sm">
        <h2 className="mb-3 font-semibold">Summary</h2>

        {cart.couponCode ? (
          <p className="mb-3 flex justify-between text-green-700">
            {cart.couponCode} applied <button onClick={removeCoupon} className="underline">remove</button>
          </p>
        ) : (
          <div className="mb-3 flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code (try WELCOME10)" className="w-full rounded border px-2 py-1.5" />
            <button onClick={applyCoupon} disabled={busy || !code} className="rounded border px-3 disabled:opacity-40">Apply</button>
          </div>
        )}
        {(error || cart.couponError) && <p className="mb-2 text-red-600">{error || cart.couponError}</p>}

        <div className="flex justify-between py-0.5"><span>Subtotal</span><span>{rupees(cart.subtotal)}</span></div>
        {cart.discount > 0 && <div className="flex justify-between py-0.5"><span>Discount</span><span>− {rupees(cart.discount)}</span></div>}
        <p className="mt-1 text-xs text-gray-500">Delivery is calculated at checkout</p>

        <Link href="/checkout" className="mt-4 block rounded bg-black py-3 text-center text-white">Proceed to checkout</Link>
      </aside>
    </div>
  );
}
