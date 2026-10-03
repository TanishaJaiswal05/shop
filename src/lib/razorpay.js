import Razorpay from "razorpay";

// Created lazily so the app can build without keys; fails with a clear message at runtime if missing
let instance;
export function getRazorpay() {
  if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
    throw new Error("Razorpay keys are not set (check .env.local)");
  instance ||= new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return instance;
}
