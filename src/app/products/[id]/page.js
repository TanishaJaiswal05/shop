import Image from "next/image";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/productService";
import { rupees } from "@/lib/format";
import AddToCartButton from "@/components/AddToCartButton";

export default async function ProductPage({ params }) {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) notFound();

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Image src={p.images[0] || p.thumbnail} alt={p.title} width={600} height={600} className="rounded-lg border bg-white object-contain" />
      <div>
        <p className="text-sm capitalize text-gray-500">{p.brand} · {p.category.replace("-", " ")}</p>
        <h1 className="mt-1 text-3xl font-bold">{p.title}</h1>
        <p className="mt-2 text-yellow-600">★ {p.rating}</p>
        <p className="mt-4 text-3xl font-semibold">
          {rupees(p.price)} <span className="text-base text-gray-400 line-through">{rupees(p.mrp)}</span>
        </p>
        <p className="mt-4 text-gray-700">{p.description}</p>
        <p className="mt-4 text-sm">{p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</p>
        <AddToCartButton productId={p._id} disabled={p.stock < 1} />
      </div>
    </div>
  );
}
