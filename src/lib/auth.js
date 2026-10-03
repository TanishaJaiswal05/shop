import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { HttpError } from "./api";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET);

// Create a 7-day session stored in an httpOnly cookie (JS in the browser can't read it)
export async function createSession(userId) {
  const token = await new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret());
  (await cookies()).set("token", token, {
    httpOnly: true, sameSite: "lax", path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() { (await cookies()).delete("token"); }

// Returns the logged-in user's id, or null
export async function getUserId() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, secret())).payload.sub; } catch { return null; }
}

// Use in protected routes: throws 401 if not logged in
export async function requireUser() {
  const id = await getUserId();
  if (!id) throw new HttpError(401, "Please log in");
  return id;
}
