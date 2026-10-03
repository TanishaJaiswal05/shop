import Link from "next/link";
import { getUserId } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Cart from "@/models/Cart";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  const id = await getUserId();
  let user = null, cartCount = 0;
  if (id) {
    await connectDB();
    user = await User.findById(id).select("wishlist").lean();
    const cart = await Cart.findOne({ user: id }).select("items").lean();
    cartCount = cart?.items.reduce((n, i) => n + i.qty, 0) || 0;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
        <Link href="/" className="text-lg font-black tracking-tight text-slate-900">
          MyShop
        </Link>

        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 md:gap-4">
          <Link href="/cart" className="group inline-flex items-center gap-2 rounded-full px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900">
            Cart
            {cartCount > 0 && (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <Link href="/wishlist" className="inline-flex items-center gap-2 rounded-full px-3 py-2 transition hover:bg-rose-50 hover:text-rose-700">
            Wishlist
            {user?.wishlist?.length > 0 && (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-bold text-white">
                {user.wishlist.length}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <Link href="/orders" className="rounded-full px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900">
                My Orders
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900">
                Login
              </Link>
              <Link href="/register" className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:translate-y-[-1px] hover:shadow-xl">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
