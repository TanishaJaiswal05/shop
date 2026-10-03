// GET /api/products?q=phone&category=smartphones&minPrice=100&maxPrice=5000&sort=price-asc&page=2
import { route, ok } from "@/lib/api";
import { queryProducts } from "@/lib/productService";

export const GET = route(async (req) => {
  const p = Object.fromEntries(new URL(req.url).searchParams);
  return ok(await queryProducts({ ...p, page: Number(p.page) || 1 }));
});
