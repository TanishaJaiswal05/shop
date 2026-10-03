import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Product from "@/models/Product";
import { connectDB } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { queryProducts } from "@/lib/productService";
import { getUserId } from "@/lib/auth";
import User from "@/models/User";

export default async function Home({ searchParams }) {
  const sp = await searchParams;                         // e.g. ?q=phone&category=laptops&sort=price-asc
  const page = Number(sp.page) || 1;
  await connectDB();
  await ensureSeeded();                                  // first visit: fills an empty database from dummyjson

  const userId = await getUserId();
  const [{ items, total, pages }, categories, user] = await Promise.all([
    queryProducts({ ...sp, page }),
    Product.distinct("category"),
    userId ? User.findById(userId).select("wishlist").lean() : null,
  ]);
  const wishlistIds = new Set((user?.wishlist || []).map(String));

  // Link that keeps the current filters but changes some of them (empty values are dropped)
  const withParams = (changes) => {
    const params = new URLSearchParams({ ...sp, ...changes });
    for (const [k, v] of [...params]) if (!v) params.delete(k);
    return `/?${params}`;
  };
  return (
    <>
      <section className="mb-6 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Fresh picks</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Shop smarter</h1>
          </div>
          <p className="text-sm text-slate-600">{total} product{total === 1 ? "" : "s"} ready to ship</p>
        </div>
      </section>

      <form className="mb-5 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm transition focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100">
        <div className="flex h-12 w-full">
          <label className="relative shrink-0 border-r border-slate-300 bg-slate-100">
            <span className="sr-only">Search category</span>
            <select
              name="category"
              defaultValue={sp.category || ""}
              className="h-full w-24 cursor-pointer appearance-none rounded-l-xl bg-transparent pl-3 pr-7 text-sm text-slate-700 outline-none"
            >
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category.replace("-", " ")}</option>
              ))}
            </select>
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500">
              <path fillRule="evenodd" d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </label>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Search products</span>
            <input
              name="q"
              defaultValue={sp.q}
              placeholder="Search products"
              className="h-full w-full px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:px-4"
            />
          </label>
          <button aria-label="Search" className="flex w-14 shrink-0 items-center justify-center bg-amber-500 text-slate-900 transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-700 sm:w-16">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="2.2" />
              <path d="m16 16 5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-3 py-2.5">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M3 5h14M5.5 10h9M8 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            Filter
          </span>
          <label>
            <span className="sr-only">Minimum price</span>
            <input
              name="minPrice"
              type="number"
              min="0"
              defaultValue={sp.minPrice}
              placeholder="Min ₹"
              className="h-8 w-24 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </label>
          <span aria-hidden="true" className="text-xs text-slate-400">—</span>
          <label>
            <span className="sr-only">Maximum price</span>
            <input
              name="maxPrice"
              type="number"
              min="0"
              defaultValue={sp.maxPrice}
              placeholder="Max ₹"
              className="h-8 w-24 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </label>
          <label className="ml-auto">
            <span className="sr-only">Sort products</span>
            <select
              name="sort"
              defaultValue={sp.sort || "new"}
              className="h-8 max-w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            >
              <option value="new">Sort: Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
          </label>
        </div>
      </form>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <span aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-500">⌕</span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">No products found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
            {total === 0 && !sp.q && !sp.category ? "Products could not be loaded from dummyjson.com; check your internet connection and refresh." : "Try a different search or adjust your filters to see more products."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((p) => <ProductCard key={p._id} p={p} wishlisted={wishlistIds.has(String(p._id))} />)}
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-4 text-sm text-slate-600">
        {page > 1 && (
          <Link href={withParams({ page: page - 1 })} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 font-medium transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700">
            ← Previous
          </Link>
        )}
        <span aria-current="page" className="rounded-full bg-slate-900 px-4 py-2.5 font-semibold text-white">Page {page} of {pages || 1}</span>
        {page < pages && (
          <Link href={withParams({ page: page + 1 })} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 font-medium transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700">
            Next →
          </Link>
        )}
      </div>
    </>
  );
}
