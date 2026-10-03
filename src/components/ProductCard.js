import Link from "next/link";
import Image from "next/image";
import { rupees } from "@/lib/format";
import AddToCartButton from "./AddToCartButton";
import WishlistButton from "./WishlistButton";

export default function ProductCard({ p, wishlisted = false, onWishlistChange }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl">
      <Link href={`/products/${p._id}`} className="flex-1">
        <div className="relative overflow-hidden rounded-xl bg-slate-50">
          <Image
            src={p.thumbnail}
            alt={p.title}
            width={300}
            height={300}
            className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
          {p.discountPercentage > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              −{Math.round(p.discountPercentage)}%
            </span>
          )}
          {p.stock < 1 && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45">
              <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-900">Out of stock</span>
            </div>
          )}
        </div>

        <div className="mt-3 space-y-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800">{p.title}</h3>
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="truncate capitalize text-slate-500">{p.category.replace("-", " ")}</span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">
              <span aria-hidden="true">★</span>{p.rating}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-lg font-bold text-slate-900">{rupees(p.price)}</span>
            <span className="text-xs text-slate-400 line-through">{rupees(p.mrp)}</span>
          </div>
        </div>
      </Link>

      <div className="mt-3 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <AddToCartButton productId={p._id} disabled={p.stock < 1} compact />
        </div>
        <WishlistButton product={p} wishlisted={wishlisted} onWishlistChange={onWishlistChange} />
      </div>
    </div>
  );
}
