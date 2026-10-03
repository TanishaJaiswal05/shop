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
        className={`rounded bg-black text-white disabled:opacity-40 ${compact ? "w-full py-1.5 text-sm" : "px-6 py-3"}`}
      >
        {disabled ? "Out of stock" : busy ? "Adding…" : "Add to cart"}
      </button>
      {msg && <p className={`mt-1 text-green-700 ${compact ? "text-xs" : "text-sm"}`}>{msg}</p>}
    </div>
  );
}
