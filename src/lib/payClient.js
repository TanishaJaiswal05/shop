// Browser-side Razorpay helper, shared by the checkout page and the "Pay now" button on orders.

const post = (url, body) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

// Loads Razorpay's checkout.js on demand (once)
function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Could not load Razorpay. Check your connection or disable ad-blockers."));
    document.body.appendChild(s);
  });
}

// payload = response of POST /api/orders or POST /api/orders/:id/pay
// callbacks: onSuccess(orderId) | onError(message) | onClose()  (user dismissed the popup)
export async function startPayment(payload, { onSuccess, onError, onClose }) {
  await loadRazorpay();

  const rzp = new window.Razorpay({
    key: payload.key, amount: payload.amount, currency: payload.currency,
    order_id: payload.razorpayOrderId, name: "MyShop", description: "Order payment",
    prefill: payload.prefill,

    // SUCCESS: hand the 3 values to our server, which verifies the signature
    handler: async (response) => {
      const res = await post("/api/payment/verify", response);
      if (res.ok) onSuccess(payload.orderId);
      else onError("Payment could not be verified. If money was deducted, it will be refunded.");
    },

    // CANCELLED: user closed the popup without paying
    modal: { ondismiss: () => { post("/api/payment/failed", { orderId: payload.orderId, reason: "cancelled" }); onClose?.(); } },
  });

  // FAILED: card declined, UPI failure, etc. (popup stays open so the user can try another method)
  rzp.on("payment.failed", (r) => {
    post("/api/payment/failed", { orderId: payload.orderId, reason: "failed", message: r.error.description });
    onError(r.error.description);
  });

  rzp.open();
}
