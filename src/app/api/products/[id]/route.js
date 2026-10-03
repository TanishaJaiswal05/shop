// GET /api/products/:id
import { route, ok, HttpError } from "@/lib/api";
import { getProduct } from "@/lib/productService";

export const GET = route(async (_req, { params }) => {
  const { id } = await params;                    // params is a Promise in Next 15+
  const product = await getProduct(id);
  if (!product) throw new HttpError(404, "Product not found");
  return ok({ product });
});
