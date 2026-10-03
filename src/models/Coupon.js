import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, unique: true, uppercase: true },
  type: { type: String, enum: ["percent", "flat"] },
  value: Number,                                 // percent (10 = 10%) or flat paise
  minOrder: { type: Number, default: 0 },        // paise
  maxDiscount: Number,                           // paise cap for percent coupons
  expiresAt: Date,
  active: { type: Boolean, default: true },
});

export default mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
