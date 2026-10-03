import { route, ok } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import User from "@/models/User";

export const GET = route(async () => {
  const id = await getUserId();
  const user = id && (await User.findById(id).select("name email"));
  return ok({ user: user || null });
});
