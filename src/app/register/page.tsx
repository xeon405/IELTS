"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth-shell";
import GoogleSignIn from "@/components/google-sign-in";
import { authApi, setAuth, isAuthenticated, IS_DEV } from "@/lib/backend";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  // Already signed in? Never wipe the session on mount (back arrow safety).
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/app");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in every field.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const result = await authApi.register(name.trim(), email.trim(), password);
      if (result.dev_code) setDevCode(result.dev_code);
      setVerifiedEmail(email.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!verifiedEmail) return;
    if (code.trim().length < 4) {
      setError("Enter the 6-digit code we sent.");
      return;
    }
    setLoading(true);
    try {
      const auth = await authApi.verify(verifiedEmail, code.trim());
      setAuth(auth.access_token, auth.profile);
      router.replace("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code did not work. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!verifiedEmail) return;
    setError("");
    try {
      const result = await authApi.resendVerification(verifiedEmail);
      if (result.dev_code) setDevCode(result.dev_code);
      toast(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the code.");
    }
  };

  const handleGoogle = useCallback(
    async (credential: string) => {
      setGoogleLoading(true);
      setError("");
      try {
        const auth = await authApi.google(credential, GOOGLE_CLIENT_ID);
        setAuth(auth.access_token, auth.profile);
        router.replace("/app");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
      } finally {
        setGoogleLoading(false);
      }
    },
    [router],
  );

  return (
    <AuthShell
      title={verifiedEmail ? "Confirm your email" : "Create your profile"}
      subtitle={
        verifiedEmail
          ? `We sent a 6-digit code to ${verifiedEmail}. Enter it below to activate your account.`
          : "The AI Brain needs a student to teach. Set up your account to start your diagnostic."
      }
    >
      {googleLoading ? (
        <div className="py-4 text-center text-sm font-bold text-[#17342f]">Signing in with Google…</div>
      ) : verifiedEmail ? (
        <form onSubmit={handleVerify} className="space-y-4">
          {error ? <p className="rounded-xl bg-[#f8e1d6] px-4 py-3 text-sm font-semibold text-[#9a3b1f]">{error}</p> : null}
          {IS_DEV && devCode ? (
            <div className="rounded-2xl border border-[#e3dac6] bg-[#f5eddc] px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8b6f39]">Development preview</p>
              <p className="mt-1 font-mono text-2xl font-black tracking-[0.5em] text-[#17342f]">{devCode}</p>
              <p className="mt-1 text-xs text-[#66746e]">No email provider is configured, so the code is shown here.</p>
            </div>
          ) : null}
          <Field label="6-digit code">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              className="w-full rounded-xl border border-[#d8c8a8] bg-white px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-[#17342f] outline-none transition focus:border-[#17342f]"
            />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#17342f] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Verify & continue"}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="w-full rounded-2xl border border-[#d8c8a8] bg-white px-6 py-3 text-sm font-bold text-[#17342f] transition hover:bg-[#fff6e3] disabled:opacity-50"
          >
            Resend code
          </button>
          <button
            type="button"
            onClick={() => setVerifiedEmail(null)}
            className="w-full text-center text-xs font-semibold text-[#66746e] hover:text-[#17342f]"
          >
            Back to registration
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? <p className="rounded-xl bg-[#f8e1d6] px-4 py-3 text-sm font-semibold text-[#9a3b1f]">{error}</p> : null}
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
              placeholder="At least 8 characters"
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
            disabled={loading}
            className="w-full rounded-2xl bg-[#17342f] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account & start diagnostic"}
          </button>

          <Divider />
          <GoogleSignIn clientId={GOOGLE_CLIENT_ID} onCredential={handleGoogle} />
        </form>
      )}
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

function Divider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-[#e3dac6]" />
      <span className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">or</span>
      <span className="h-px flex-1 bg-[#e3dac6]" />
    </div>
  );
}

function toast(message: string) {
  // Lightweight inline notice appended near the error slot; real toast lives in the app shell.
  const banner = document.createElement("div");
  banner.textContent = message;
  banner.style.position = "fixed";
  banner.style.bottom = "1rem";
  banner.style.left = "50%";
  banner.style.transform = "translateX(-50%)";
  banner.style.background = "#17342f";
  banner.style.color = "#fff";
  banner.style.padding = "0.6rem 1rem";
  banner.style.borderRadius = "0.75rem";
  banner.style.fontSize = "0.875rem";
  banner.style.zIndex = "9999";
  banner.style.boxShadow = "0 8px 30px rgba(0,0,0,0.25)";
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 4000);
}