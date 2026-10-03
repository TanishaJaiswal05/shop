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

  const input = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-sm sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "login" ? "Sign in to continue shopping" : "Join MyShop and start exploring"}
          </p>
        </div>

        <div className="space-y-3">
          {mode === "register" && <input name="name" placeholder="Full name" required className={input} />}
          <input name="email" type="email" placeholder="Email address" required className={input} />
          <input name="password" type="password" placeholder="Password (6+ chars)" required className={input} />
        </div>

        {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:translate-y-[-1px] hover:shadow-xl">
          {mode === "login" ? "Log in" : "Register"}
        </button>

        <p className="mt-5 text-center text-sm text-slate-500">
          {mode === "login" ? "New to MyShop?" : "Already have an account?"}{" "}
          <a href={mode === "login" ? "/register" : "/login"} className="font-semibold text-violet-600 hover:text-violet-700">
            {mode === "login" ? "Create an account" : "Log in"}
          </a>
        </p>
      </form>
    </div>
  );
}
