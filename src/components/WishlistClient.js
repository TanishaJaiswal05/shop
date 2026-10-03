"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { clearWishlist, readWishlist, saveWishlist } from "@/lib/wishlistStorage";

export default function WishlistClient() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/wishlist")
      .then(async (response) => {
        const localProducts = readWishlist();
        if (response.status === 401) {
          setProducts(localProducts);
          return;
        }
        const data = await response.json();
        if (!response.ok) {
          if (localProducts.length) {
            setProducts(localProducts);
            return;
          }
          throw new Error(data.error || "Could not load wishlist.");
        }
        if (localProducts.length) {
          await Promise.all(localProducts.map((product) =>
            fetch("/api/wishlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId: product._id }),
            }).then(async (result) => {
              if (!result.ok) {
                const errorData = await result.json();
                throw new Error(errorData.error || "Could not sync saved products.");
              }
            }),
          ));
          clearWishlist();
          const refreshedResponse = await fetch("/api/wishlist");
          const refreshed = await refreshedResponse.json();
          if (!refreshedResponse.ok) throw new Error(refreshed.error || "Could not load wishlist.");
          setProducts(refreshed.products);
          return;
        }
        setProducts(data.products);
      })
      .catch((loadError) => {
        const localProducts = readWishlist();
        if (localProducts.length) {
          setProducts(localProducts);
          return;
        }
        setError(loadError.message || "Could not load wishlist.");
      });
  }, []);

  if (error) return <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</p>;
  if (!products) return <p className="py-10 text-center text-sm text-slate-500">Loading your wishlist…</p>;
  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-900">Your wishlist is waiting for a favorite.</p>
        <p className="mt-2 text-sm text-slate-500">Save products you love and come back to them anytime.</p>
        <Link href="/" className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">Explore products</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product._id}
          p={product}
          wishlisted
          onWishlistChange={(saved) => {
            if (!saved) {
              setProducts((current) => current.filter((item) => item._id !== product._id));
              if (typeof window !== "undefined") {
                const remaining = readWishlist().filter((item) => String(item._id) !== String(product._id));
                saveWishlist(remaining);
              }
            }
          }}
        />
      ))}
    </div>
  );
}
