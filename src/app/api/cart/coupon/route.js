import { route, ok, HttpError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { couponDiscount, buildSummary } from "@/lib/pricing";
import Cart from "@/models/Cart";

// POST { code } -> validate and attach to cart
export const POST = route(async (req) => {
  const userId = await requireUser();
  const { code } = await req.json();
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart) throw new HttpError(404, "Cart not found");
  const subtotal = (await buildSummary(cart)).subtotal;
  await couponDiscount(code, subtotal);           // throws a readable error if invalid
  cart.coupon = code.toUpperCase();
  await cart.save();
  return ok(await buildSummary(cart));
});

// DELETE -> remove coupon
export const DELETE = route(async () => {
  const userId = await requireUser();
  const cart = await Cart.findOneAndUpdate({ user: userId }, { $unset: { coupon: "" } }, { new: true }).populate("items.product");
  if (!cart) throw new HttpError(404, "Cart not found");
  return ok(await buildSummary(cart));
});
