"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth-shell";
import { getAuthUser, saveAuthUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    const existing = getAuthUser();
    if (existing && existing.email === email.trim()) {
      router.push("/app");
      return;
    }
    const nameGuess = email.split("@")[0].replace(/[._-]+/g, " ").trim();
    saveAuthUser({ name: nameGuess ? nameGuess.charAt(0).toUpperCase() + nameGuess.slice(1) : "Student", email: email.trim() });
    router.push("/app");
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue training with your AI examiner.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <p className="rounded-xl bg-[#f8e1d6] px-4 py-3 text-sm font-semibold text-[#9a3b1f]">{error}</p>
        ) : null}
        <label className="block">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-[#8b6f39]">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[#d8c8a8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#17342f]"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-[#8b6f39]">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="w-full rounded-xl border border-[#d8c8a8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#17342f]"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-2xl bg-[#17342f] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
        >
          Log in &amp; continue
        </button>
      </form>
      <div className="mt-4">
        <button
          type="button"
          onClick={() => router.push("/app")}
          className="w-full rounded-2xl border border-[#d8c8a8] bg-white px-6 py-4 text-sm font-bold text-[#17342f] transition hover:bg-[#fff6e3]"
        >
          Continue as guest (demo)
        </button>
      </div>
      <p className="mt-5 text-center text-sm text-[#5c6b64]">
        No account yet?{" "}
        <a href="/register" className="font-bold text-[#17342f] underline underline-offset-2">
          Create one
        </a>
      </p>
    </AuthShell>
  );
}
