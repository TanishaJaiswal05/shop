import WishlistClient from "@/components/WishlistClient";

export const metadata = { title: "Wishlist | MyShop" };

export default function WishlistPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Saved for later</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Your wishlist</h1>
        <p className="mt-2 text-sm text-slate-500">All the things you love, in one place.</p>
      </div>
      <WishlistClient />
    </section>
  );
}
