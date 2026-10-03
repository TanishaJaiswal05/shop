import bcrypt from "bcryptjs";
import { route, ok, HttpError } from "@/lib/api";
import { createSession } from "@/lib/auth";
import User from "@/models/User";

export const POST = route(async (req) => {
  const { name, email, password } = await req.json();
  if (!name || !email || !password || password.length < 6)
    throw new HttpError(400, "Name, email and a password of 6+ characters are required");
  if (await User.findOne({ email: email.toLowerCase() })) throw new HttpError(409, "Email already registered");

  const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  await createSession(user._id);
  return ok({ user: { id: user._id, name: user.name, email: user.email } }, 201);
});
