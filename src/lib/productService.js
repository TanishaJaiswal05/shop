import mongoose from "mongoose";
import Product from "@/models/Product";
import { connectDB } from "./db";

const SORTS = {
  new: { createdAt: -1 }, rating: { rating: -1 },
  "price-asc": { price: 1 }, "price-desc": { price: -1 },
};

// Search + category + price filter + sort + pagination
export async function queryProducts({ q, category, minPrice, maxPrice, sort = "new", page = 1, limit = 12 }) {
  await connectDB();
  const filter = {};
  if (q) filter.$text = { $search: q };
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice) * 100;   // UI sends rupees
    if (maxPrice) filter.price.$lte = Number(maxPrice) * 100;
  }
  const [items, total] = await Promise.all([
    Product.find(filter).sort(SORTS[sort] || SORTS.new).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  // JSON round-trip turns ObjectIds/Dates into plain strings (safe to pass to client components)
  return JSON.parse(JSON.stringify({ items, total, pages: Math.ceil(total / limit) }));
}

export async function getProduct(id) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  const p = await Product.findById(id).lean();
  return p ? JSON.parse(JSON.stringify(p)) : null;
}
