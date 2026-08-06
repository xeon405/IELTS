"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth-shell";
import { authApi } from "@/lib/backend";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [devToken, setDevToken] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const result = await authApi.forgotPassword(email.trim());
      if (result.reset_token) setDevToken(result.reset_token);
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request a reset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const resetToken = devToken || token;
    if (!resetToken) {
      setError("Enter the reset code from your email.");
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
    setLoading(true);
    try {
      await authApi.resetPassword(resetToken, password);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset the password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a one-time reset code to create a new password.">
      <form onSubmit={step === "request" ? handleRequest : handleReset} className="space-y-4">
        {error ? <p className="rounded-xl bg-[#f8e1d6] px-4 py-3 text-sm font-semibold text-[#9a3b1f]">{error}</p> : null}

        {step === "request" ? (
          <>
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
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#17342f] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send reset code"}
            </button>
          </>
        ) : (
          <>
            {devToken ? (
              <div className="rounded-2xl border border-[#e3dac6] bg-[#f5eddc] px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8b6f39]">Development preview</p>
                <p className="mt-1 break-all font-mono text-sm font-black text-[#17342f]">{devToken}</p>
                <p className="mt-1 text-xs text-[#66746e]">No email provider is configured, so the reset code is shown here.</p>
              </div>
            ) : null}
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-[#8b6f39]">Reset code</span>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste the code from your email"
                className="w-full rounded-xl border border-[#d8c8a8] bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-[#17342f]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-[#8b6f39]">New password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-[#d8c8a8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#17342f]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-[#8b6f39]">Confirm new password</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className="w-full rounded-xl border border-[#d8c8a8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#17342f]"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#17342f] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Resetting…" : "Reset password"}
            </button>
          </>
        )}
      </form>
      <p className="mt-5 text-center text-sm text-[#5c6b64]">
        Remembered it?{" "}
        <a href="/login" className="font-bold text-[#17342f] underline underline-offset-2">
          Back to login
        </a>
      </p>
    </AuthShell>
  );
}