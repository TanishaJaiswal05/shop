import { NextResponse } from "next/server";
import { connectDB } from "./db";

// Throw this anywhere in a route to return a clean JSON error
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const ok = (data, status = 200) => NextResponse.json(data, { status });

// Wraps a route handler: connects to DB and converts errors into JSON responses
export function route(handler) {
  return async (req, ctx) => {
    try {
      await connectDB();
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e.name === "CastError") return NextResponse.json({ error: "Invalid id" }, { status: 400 });
      console.error(e);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
}
