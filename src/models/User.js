import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  name: String, phone: String, line1: String, line2: String,
  city: String, state: String, pincode: String,
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },   // bcrypt hash, never plain text
  addresses: [addressSchema],                   // saved delivery addresses
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
