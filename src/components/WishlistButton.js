"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readWishlist, updateWishlist } from "@/lib/wishlistStorage";

export default function WishlistButton({ product, productId = product?._id, wishlisted = false, onWishlistChange }) {
  const router = useRouter();
  const [saved, setSaved] = useState(wishlisted);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (readWishlist().some((item) => String(item._id) === String(productId))) setSaved(true);
  }, [productId]);

  async function toggle() {
    setError("");
    const nextSaved = !saved;
    try {
      updateWishlist(product, nextSaved);
    } catch {
      return setError("Could not save this product in your browser. Check storage settings and try again.");
    }
    setSaved(nextSaved);
    onWishlistChange?.(nextSaved);

    setBusy(true);
    const response = await fetch(
      saved ? `/api/wishlist?productId=${productId}` : "/api/wishlist",
      {
        method: saved ? "DELETE" : "POST",
        signal: AbortSignal.timeout(5000),
        ...(saved ? {} : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        }),
      },
    ).catch(() => null);
    setBusy(false);

    if (response?.ok || response?.status === 401) {
      router.refresh();
      return;
    }

    setError(nextSaved
      ? "Saved to Wishlist."
      : "Removed from Wishlist.");
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={saved}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-wait disabled:opacity-60 ${saved ? "border-rose-200 text-rose-600" : "border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-600"}`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} className="h-5 w-5">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {error && <p role="alert" className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
