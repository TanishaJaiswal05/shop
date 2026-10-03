"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/";
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!res.ok) return setError((await res.json()).error);
    router.push(next); router.refresh();                     // refresh so the Navbar updates
  }

  const input = "w-full rounded border px-3 py-2";
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-3 rounded-lg border bg-white p-6">
      <h1 className="text-xl font-semibold">{mode === "login" ? "Log in" : "Create account"}</h1>
      {mode === "register" && <input name="name" placeholder="Full name" required className={input} />}
      <input name="email" type="email" placeholder="Email" required className={input} />
      <input name="password" type="password" placeholder="Password (6+ chars)" required className={input} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="w-full rounded bg-black py-2 text-white">{mode === "login" ? "Log in" : "Register"}</button>
    </form>
  );
}
