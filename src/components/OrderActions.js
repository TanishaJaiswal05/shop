"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { startPayment } from "@/lib/payClient";

export default function OrderActions({ orderId, canPay, canCancel, canReturn }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function act(path, body) {
    setError("");
    const res = await fetch(`/api/orders/${orderId}/${path}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}),
    });
    if (!res.ok) return setError((await res.json()).error);
    router.refresh();                                           // re-render the server page with the new status
  }

  // Retry payment for an order that is still awaiting payment
  async function payNow() {
    setError(""); setBusy(true);
    const res = await fetch(`/api/orders/${orderId}/pay`, { method: "POST" });
    const payload = await res.json();
    if (!res.ok) { setError(payload.error); return setBusy(false); }
    try {
      await startPayment(payload, {
        onSuccess: (id) => router.push(`/orders/${id}?confirmed=1`),
        onError: (msg) => { setError(msg); setBusy(false); },
        onClose: () => setBusy(false),
      });
    } catch (e) { setError(e.message); setBusy(false); }
  }

  const cancel = () => confirm("Cancel this order? Any payment will be refunded.") && act("cancel");
  const requestReturn = () => {
    const reason = prompt("Why are you returning this order?");
    if (reason) act("return", { reason });
  };

  if (!canPay && !canCancel && !canReturn) return null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {canPay && <button onClick={payNow} disabled={busy} className="rounded bg-black px-4 py-2 text-white disabled:opacity-40">{busy ? "Processing…" : "Pay now"}</button>}
      {canCancel && <button onClick={cancel} className="rounded border border-red-600 px-4 py-2 text-red-600">Cancel order</button>}
      {canReturn && <button onClick={requestReturn} className="rounded border px-4 py-2">Request return / refund</button>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
