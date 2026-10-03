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
    user = await User.findById(id).select("name").lean();
    // Total quantity across all cart lines (shown as a badge)
    const cart = await Cart.findOne({ user: id }).select("items").lean();
    cartCount = cart?.items.reduce((n, i) => n + i.qty, 0) || 0;
  }

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold">MyShop</Link>
        <div className="flex items-center gap-5 text-sm">
          <Link href="/cart" className="flex items-center gap-1">
            Cart
            {cartCount > 0 && <span className="rounded-full bg-black px-2 text-xs text-white">{cartCount}</span>}
          </Link>
          {user ? (
            <>
              <Link href="/orders">My Orders</Link>
              <span className="text-gray-500">Hi, {user.name.split(" ")[0]}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register" className="rounded bg-black px-3 py-1.5 text-white">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
