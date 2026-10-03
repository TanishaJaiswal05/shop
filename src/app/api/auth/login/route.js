import bcrypt from "bcryptjs";
import { route, ok, HttpError } from "@/lib/api";
import { createSession } from "@/lib/auth";
import User from "@/models/User";

export const POST = route(async (req) => {
  const { email, password } = await req.json();
  const user = await User.findOne({ email: email?.toLowerCase() });
  // Same message for "no user" and "wrong password" so attackers can't probe emails
  if (!user || !(await bcrypt.compare(password || "", user.password))) throw new HttpError(401, "Wrong email or password");
  await createSession(user._id);
  return ok({ user: { id: user._id, name: user.name, email: user.email } });
});
