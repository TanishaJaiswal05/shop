import { route, ok, HttpError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import User from "@/models/User";

export const GET = route(async () => {
  const user = await User.findById(await requireUser());
  return ok({ addresses: user.addresses });
});

export const POST = route(async (req) => {
  const user = await User.findById(await requireUser());
  const a = await req.json();
  if (!a.name || !a.phone || !a.line1 || !a.city || !a.state || !/^\d{6}$/.test(a.pincode))
    throw new HttpError(400, "Please fill all address fields (6-digit pincode)");
  user.addresses.push(a);
  await user.save();
  return ok({ addresses: user.addresses }, 201);
});
