import { route, ok, HttpError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import Product from "@/models/Product";
import User from "@/models/User";

export const GET = route(async () => {
  const user = await User.findById(await requireUser())
    .select("wishlist")
    .populate({ path: "wishlist", select: "title thumbnail price mrp rating category discountPercentage stock" })
    .lean();
  if (!user) throw new HttpError(404, "User not found");
  return ok({ products: user.wishlist });
});

export const POST = route(async (req) => {
  const userId = await requireUser();
  const { productId } = await req.json();
  if (!productId || !(await Product.exists({ _id: productId })))
    throw new HttpError(404, "Product not found");
  const user = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { wishlist: productId } },
    { new: true },
  ).select("wishlist");
  if (!user) throw new HttpError(404, "User not found");
  return ok({ wishlist: user.wishlist.map(String) });
});

export const DELETE = route(async (req) => {
  const userId = await requireUser();
  const productId = new URL(req.url).searchParams.get("productId");
  if (!productId) throw new HttpError(400, "Product id is required");
  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { wishlist: productId } },
    { new: true },
  ).select("wishlist");
  if (!user) throw new HttpError(404, "User not found");
  return ok({ wishlist: user.wishlist.map(String) });
});
