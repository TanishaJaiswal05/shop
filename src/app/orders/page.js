import Link from "next/link";
import { getUserId } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { rupees, statusLabel } from "@/lib/format";
import Order from "@/models/Order";

export default async function OrdersPage() {
  await connectDB();
  const orders = await Order.find({ user: await getUserId() }).sort({ createdAt: -1 }).lean();

  if (!orders.length) return <p>No orders yet. <Link href="/" className="underline">Start shopping</Link></p>;

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">My orders</h1>
      {orders.map((o) => (
        <Link key={String(o._id)} href={`/orders/${o._id}`} className="flex items-center justify-between rounded-lg border bg-white p-4 hover:shadow">
          <div>
            <p className="font-medium">#{String(o._id).slice(-8).toUpperCase()} · {o.items.length} item(s)</p>
            <p className="text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{rupees(o.total)}</p>
            <p className="text-sm capitalize text-gray-600">{statusLabel(o.status)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
