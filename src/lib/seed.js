import Product from "@/models/Product";
import Coupon from "@/models/Coupon";

const USD_TO_INR = 83; // dummyjson prices are in USD; adjust as you like

// Imports ALL dummyjson products (limit=0) + a demo coupon. Safe to re-run (upserts).
export async function seedProducts() {
  const res = await fetch("https://dummyjson.com/products?limit=0");
  if (!res.ok) throw new Error("Could not fetch products from dummyjson.com");
  const { products } = await res.json();

  const docs = products.map((p) => {
    const mrp = Math.round(p.price * USD_TO_INR * 100);                       // paise
    return {
      dummyId: p.id, title: p.title, description: p.description, brand: p.brand || "Generic", category: p.category,
      mrp, price: Math.round(mrp * (1 - p.discountPercentage / 100)),
      discountPercentage: p.discountPercentage, rating: p.rating, stock: p.stock,
      thumbnail: p.thumbnail, images: p.images,
    };
  });

  await Product.bulkWrite(
    docs.map((d) => ({ updateOne: { filter: { dummyId: d.dummyId }, update: { $set: d }, upsert: true } })),
    { ordered: false }
  );

  // Demo coupon: WELCOME10 = 10% off above ₹499, max ₹200
  await Coupon.updateOne({ code: "WELCOME10" },
    { $set: { type: "percent", value: 10, minOrder: 49900, maxDiscount: 20000, active: true } }, { upsert: true });

  return docs.length;
}

// Called by the home page: if the products collection is empty, fill it automatically.
// The shared promise stops two simultaneous visitors from seeding twice.
let seeding = null;
export async function ensureSeeded() {
  if ((await Product.estimatedDocumentCount()) > 0) return;
  seeding ||= seedProducts().catch((e) => console.error("Auto-seed failed:", e.message)).finally(() => { seeding = null; });
  await seeding;
}
