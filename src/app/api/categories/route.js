// GET /api/categories
import { route, ok } from "@/lib/api";
import Product from "@/models/Product";

export const GET = route(async () => ok({ categories: await Product.distinct("category") }));
