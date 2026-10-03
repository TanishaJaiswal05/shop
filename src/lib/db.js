import mongoose from "mongoose";

// Cache the connection on `global` so dev hot-reloads don't open a new connection each time
let cached = global._mongoose || (global._mongoose = { conn: null, promise: null });

export async function connectDB() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set (check .env.local)");
  if (cached.conn) return cached.conn;
  cached.promise ||= mongoose.connect(process.env.MONGODB_URI, { dbName: "shop" });
  cached.conn = await cached.promise;
  return cached.conn;
}
