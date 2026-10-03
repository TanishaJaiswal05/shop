import Image from "next/image";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/productService";
import { rupees } from "@/lib/format";
import AddToCartButton from "@/components/AddToCartButton";
import WishlistButton from "@/components/WishlistButton";
import { getUserId } from "@/lib/auth";
import User from "@/models/User";

export default async function ProductPage({ params }) {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) notFound();
  const userId = await getUserId();
  const user = userId ? await User.findById(userId).select("wishlist").lean() : null;
  const wishlisted = (user?.wishlist || []).some((productId) => String(productId) === String(p._id));

  return (
    <div className="grid gap-8 md:grid-cols-2 md:items-start">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <Image src={p.images[0] || p.thumbnail} alt={p.title} width={600} height={600} className="aspect-square w-full rounded-2xl bg-slate-50 object-contain" />
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm capitalize text-slate-500">{p.brand} · {p.category.replace("-", " ")}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{p.title}</h1>
        <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">★ {p.rating}</p>
        <p className="mt-5 flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-bold text-slate-900">{rupees(p.price)}</span>
          <span className="text-base text-slate-400 line-through">{rupees(p.mrp)}</span>
        </p>
        <p className="mt-5 leading-relaxed text-slate-600">{p.description}</p>
        <p className={`mt-5 text-sm font-medium ${p.stock > 0 ? "text-emerald-700" : "text-rose-700"}`}>{p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div>
            <AddToCartButton productId={p._id} disabled={p.stock < 1} />
          </div>
          <div className="mt-6">
            <WishlistButton product={p} wishlisted={wishlisted} />
          </div>
        </div>
      </div>
    </div>
  );
}
