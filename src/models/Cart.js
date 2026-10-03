import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
  items: [{
    _id: false,
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    qty: { type: Number, min: 1 },
  }],
  coupon: String,                                // applied coupon code (re-validated at checkout)
}, { timestamps: true });

export default mongoose.models.Cart || mongoose.model("Cart", cartSchema);
