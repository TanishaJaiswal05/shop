"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

// compact = small version used on product cards in the listing
export default function AddToCartButton({ productId, disabled, compact = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function add() {
    setBusy(true); setMsg("");
    const res = await fetch("/api/cart", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, qty: 1 }),
    }).catch(() => null);
    setBusy(false);

    if (!res) return setMsg("Network error, try again");
    if (res.status === 401) return router.push(`/login?next=${encodeURIComponent(pathname)}`);   // must be logged in
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);

    setMsg("Added to cart ✓");
    router.refresh();                                  // re-renders the Navbar cart count
  }

  return (
    <div className={compact ? "mt-2" : "mt-6"}>
      <button
        onClick={add}
        disabled={disabled || busy}
        className={`rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${compact ? "w-full bg-gradient-to-r from-violet-600 to-indigo-600 py-2 text-sm text-white shadow-md shadow-violet-500/25 hover:shadow-lg" : "bg-slate-900 px-6 py-3 text-white hover:bg-slate-800"}`}
      >
        {disabled ? "Out of stock" : busy ? "Adding…" : "Add to cart"}
      </button>
      {msg && <p className={`mt-2 ${compact ? "text-xs text-emerald-700" : "text-sm text-emerald-700"}`}>{msg}</p>}
    </div>
  );
}
