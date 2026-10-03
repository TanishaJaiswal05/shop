import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  dummyId: { type: Number, unique: true },       // id from dummyjson, used for upserts
  title: String, description: String, brand: String,
  category: { type: String, index: true },
  mrp: Number,                                   // original price (paise)
  price: Number,                                 // selling price after discount (paise)
  discountPercentage: Number, rating: Number, stock: Number,
  thumbnail: String, images: [String],
}, { timestamps: true });

productSchema.index({ title: "text", description: "text", brand: "text" }); // powers search

export default mongoose.models.Product || mongoose.model("Product", productSchema);
