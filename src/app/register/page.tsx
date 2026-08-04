"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth-shell";
import { saveAuthUser } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in every field.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    saveAuthUser({ name: name.trim(), email: email.trim() });
    router.push("/app");
  };

  return (
    <AuthShell title="Create your profile" subtitle="The AI Brain needs a student to teach. Set up your account to start your diagnostic.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <p className="rounded-xl bg-[#f8e1d6] px-4 py-3 text-sm font-semibold text-[#9a3b1f]">{error}</p>
        ) : null}
        <Field label="Full name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah Mitchell"
            className="w-full rounded-xl border border-[#d8c8a8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#17342f]"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[#d8c8a8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#17342f]"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-xl border border-[#d8c8a8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#17342f]"
          />
        </Field>
        <Field label="Confirm password">
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            className="w-full rounded-xl border border-[#d8c8a8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#17342f]"
          />
        </Field>
        <button
          type="submit"
          className="w-full rounded-2xl bg-[#17342f] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
        >
          Create account &amp; start diagnostic
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-[#5c6b64]">
        Already have an account?{" "}
        <a href="/login" className="font-bold text-[#17342f] underline underline-offset-2">
          Log in
        </a>
      </p>
    </AuthShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-[#8b6f39]">{label}</span>
      {children}
    </label>
  );
}
