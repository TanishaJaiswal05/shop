import { route, ok, HttpError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { buildSummary } from "@/lib/pricing";
import Cart from "@/models/Cart";
import Product from "@/models/Product";

// Find (or create) the user's cart with product details attached
async function loadCart(userId) {
  const cart = (await Cart.findOne({ user: userId })) || (await Cart.create({ user: userId, items: [] }));
  return cart.populate("items.product");
}
const reply = async (cart, delivery) => ok(await buildSummary(cart, delivery));

// GET /api/cart?delivery=express  -> items + subtotal/discount/delivery/total
export const GET = route(async (req) => {
  const userId = await requireUser();
  const delivery = new URL(req.url).searchParams.get("delivery") || "standard";
  return reply(await loadCart(userId), delivery);
});

// POST { productId, qty }  -> add to cart (adds to existing qty, capped at stock)
export const POST = route(async (req) => {
  const userId = await requireUser();
  const { productId, qty = 1 } = await req.json();
  const product = await Product.findById(productId);
  if (!product || product.stock < 1) throw new HttpError(400, "Product unavailable");

  const cart = (await Cart.findOne({ user: userId })) || new Cart({ user: userId, items: [] });
  const line = cart.items.find((i) => String(i.product) === productId);
  if (line) line.qty = Math.min(line.qty + qty, product.stock);
  else cart.items.push({ product: productId, qty: Math.min(qty, product.stock) });
  await cart.save();
  return reply(await loadCart(userId));
});

// PATCH { productId, qty }  -> set quantity (qty 0 removes the item)
export const PATCH = route(async (req) => {
  const userId = await requireUser();
  const { productId, qty } = await req.json();
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new HttpError(404, "Cart not found");
  const product = await Product.findById(productId);

  const line = cart.items.find((i) => String(i.product) === productId);
  if (!line) throw new HttpError(404, "Item not in cart");
  if (qty <= 0) cart.items = cart.items.filter((i) => i !== line);
  else line.qty = Math.min(qty, product?.stock ?? qty);
  await cart.save();
  return reply(await loadCart(userId));
});

// DELETE ?productId=...  -> remove one item
export const DELETE = route(async (req) => {
  const userId = await requireUser();
  const productId = new URL(req.url).searchParams.get("productId");
  await Cart.updateOne({ user: userId }, { $pull: { items: { product: productId } } });
  return reply(await loadCart(userId));
});
