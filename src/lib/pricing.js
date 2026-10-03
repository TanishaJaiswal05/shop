import Coupon from "@/models/Coupon";
import { HttpError } from "./api";

export const DELIVERY = {
  standard: { label: "Standard (4–6 days)", fee: 4900, freeAbove: 49900 },
  express:  { label: "Express (1–2 days)",  fee: 14900, freeAbove: Infinity },
};

// Validates a coupon and returns the discount in paise
export async function couponDiscount(code, subtotal) {
  const c = await Coupon.findOne({ code: code?.toUpperCase(), active: true });
  if (!c) throw new HttpError(400, "Invalid coupon");
  if (c.expiresAt && c.expiresAt < new Date()) throw new HttpError(400, "Coupon expired");
  if (subtotal < c.minOrder) throw new HttpError(400, `Minimum order ₹${c.minOrder / 100} for this coupon`);
  let d = c.type === "percent" ? Math.floor((subtotal * c.value) / 100) : c.value;
  if (c.maxDiscount) d = Math.min(d, c.maxDiscount);
  return Math.min(d, subtotal);
}

// Builds the full price breakdown from a POPULATED cart.
// strict=true (used when creating an order) throws on a bad coupon; otherwise it's just dropped.
export async function buildSummary(cart, deliveryMethod = "standard", { strict = false } = {}) {
  const lines = cart.items
    .filter((i) => i.product)                    // skip products that were deleted
    .map((i) => ({
      product: i.product._id, title: i.product.title, thumbnail: i.product.thumbnail,
      price: i.product.price, qty: i.qty, stock: i.product.stock,
    }));

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

  let discount = 0, couponCode = null, couponError = null;
  if (cart.coupon) {
    try { discount = await couponDiscount(cart.coupon, subtotal); couponCode = cart.coupon; }
    catch (e) { if (strict) throw e; couponError = e.message; }
  }

  const method = DELIVERY[deliveryMethod] ? deliveryMethod : "standard";
  const d = DELIVERY[method];
  const afterDiscount = subtotal - discount;
  const deliveryFee = lines.length === 0 || afterDiscount >= d.freeAbove ? 0 : d.fee;

  return { lines, subtotal, discount, couponCode, couponError, deliveryMethod: method,
           deliveryFee, total: afterDiscount + deliveryFee };
}
