import { NextResponse } from "next/server";

// Quick UX gate only: redirects to /login if there's no cookie.
// Real security is requireUser() inside every API route.
export function proxy(req) {
  if (!req.cookies.get("token")) {
    return NextResponse.redirect(new URL(`/login?next=${req.nextUrl.pathname}`, req.url));
  }
  return NextResponse.next();
}

// Only these pages require login
export const config = { matcher: ["/cart/:path*", "/checkout/:path*", "/orders/:path*"] };
