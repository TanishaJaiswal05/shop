import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

// Items are SNAPSHOTS: later product edits must not change past orders
const itemSchema = new mongoose.Schema({
  product: { type: ObjectId, ref: "Product" },
  title: String, thumbnail: String, price: Number, qty: Number,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: ObjectId, ref: "User", index: true },
  items: [itemSchema],
  address: { name: String, phone: String, line1: String, line2: String, city: String, state: String, pincode: String },
  delivery: { method: String, fee: Number },
  coupon: { code: String, discount: { type: Number, default: 0 } },
  subtotal: Number,
  total: Number,                                 // what Razorpay charges (paise)
  status: {
    type: String, index: true, default: "pending_payment",
    enum: ["pending_payment", "confirmed", "processing", "shipped", "out_for_delivery",
           "delivered", "cancelled", "return_requested", "refunded"],
  },
  payment: {
    razorpayOrderId: String, razorpayPaymentId: String, signature: String,
    status: { type: String, default: "created" }, // created | failed | cancelled | paid | refunded
    error: String,
  },
  timeline: [{ status: String, note: String, at: { type: Date, default: Date.now } }], // powers "Track order"
  deliveredAt: Date,
  returnRequest: { reason: String, requestedAt: Date },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
