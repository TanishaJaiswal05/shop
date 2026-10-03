// paise -> "₹1,234.50"
export const rupees = (paise) =>
  (paise / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });

// "out_for_delivery" -> "out for delivery"; "pending_payment" reads better as "awaiting payment"
export const statusLabel = (s) => (s === "pending_payment" ? "awaiting payment" : s.replaceAll("_", " "));
