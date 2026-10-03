import Link from "next/link";
import Image from "next/image";
import { rupees } from "@/lib/format";
import AddToCartButton from "./AddToCartButton";

export default function ProductCard({ p }) {
  return (
    <div className="flex flex-col rounded-lg border bg-white p-3 transition hover:shadow-md">
      {/* The image + text link to the details page; the button below is outside the link */}
      <Link href={`/products/${p._id}`} className="flex-1">
        <div className="relative">
          <Image src={p.thumbnail} alt={p.title} width={300} height={300} className="aspect-square w-full object-contain" />
          {p.discountPercentage > 0 && (
            <span className="absolute left-0 top-0 rounded bg-green-600 px-1.5 py-0.5 text-xs text-white">
              −{Math.round(p.discountPercentage)}%
            </span>
          )}
        </div>
        <h3 className="mt-2 line-clamp-1 font-medium">{p.title}</h3>
        <p className="text-xs capitalize text-gray-500">{p.category.replace("-", " ")} · ★ {p.rating}</p>
        <p className="mt-1">
          <span className="font-semibold">{rupees(p.price)}</span>{" "}
          <span className="text-xs text-gray-400 line-through">{rupees(p.mrp)}</span>
        </p>
      </Link>
      <AddToCartButton productId={p._id} disabled={p.stock < 1} compact />
    </div>
  );
}
