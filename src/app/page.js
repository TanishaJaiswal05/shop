import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Product from "@/models/Product";
import { connectDB } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { queryProducts } from "@/lib/productService";

export default async function Home({ searchParams }) {
  const sp = await searchParams;                         // e.g. ?q=phone&category=laptops&sort=price-asc
  const page = Number(sp.page) || 1;
  await connectDB();
  await ensureSeeded();                                  // first visit: fills an empty database from dummyjson

  const [{ items, total, pages }, categories] = await Promise.all([
    queryProducts({ ...sp, page }),
    Product.distinct("category"),
  ]);

  // Link that keeps the current filters but changes some of them (empty values are dropped)
  const withParams = (changes) => {
    const params = new URLSearchParams({ ...sp, ...changes });
    for (const [k, v] of [...params]) if (!v) params.delete(k);
    return `/?${params}`;
  };
  const chip = (active) => `rounded-full border px-3 py-1 text-xs capitalize ${active ? "bg-black text-white" : "bg-white hover:bg-gray-100"}`;

  return (
    <>
      {/* Plain GET form: filters live in the URL, so no client JS is needed */}
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Search products…" className="min-w-52 flex-1 rounded border px-3 py-2" />
        <input name="minPrice" type="number" defaultValue={sp.minPrice} placeholder="Min ₹" className="w-24 rounded border px-3 py-2" />
        <input name="maxPrice" type="number" defaultValue={sp.maxPrice} placeholder="Max ₹" className="w-24 rounded border px-3 py-2" />
        <select name="sort" defaultValue={sp.sort || "new"} className="rounded border px-3 py-2">
          <option value="new">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
        {sp.category && <input type="hidden" name="category" value={sp.category} />}
        <button className="rounded bg-black px-4 py-2 text-white">Apply</button>
      </form>

      {/* Category chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={withParams({ category: "", page: "" })} className={chip(!sp.category)}>All</Link>
        {categories.map((c) => (
          <Link key={c} href={withParams({ category: c, page: "" })} className={chip(sp.category === c)}>{c.replace("-", " ")}</Link>
        ))}
      </div>

      <p className="mb-3 text-sm text-gray-500">{total} product{total === 1 ? "" : "s"}</p>

      {items.length === 0 ? (
        <p>No products found. {total === 0 && !sp.q && !sp.category ? "Products could not be loaded from dummyjson.com; check your internet connection and refresh." : "Try different filters."}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((p) => <ProductCard key={p._id} p={p} />)}
        </div>
      )}

      <div className="mt-8 flex justify-center gap-4 text-sm">
        {page > 1 && <Link href={withParams({ page: page - 1 })}>← Previous</Link>}
        <span>Page {page} of {pages || 1}</span>
        {page < pages && <Link href={withParams({ page: page + 1 })}>Next →</Link>}
      </div>
    </>
  );
}
