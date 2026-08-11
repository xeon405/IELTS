"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth-shell";
import GoogleSignIn from "@/components/google-sign-in";
import { authApi, setAuth, isAuthenticated } from "@/lib/backend";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Already signed in (e.g. pressing the back arrow after logging in)?
  // Never wipe the session - send the student straight back to the app.
  if (isAuthenticated()) {
    router.replace("/app");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const auth = await authApi.login(email.trim(), password);
      setAuth(auth.access_token, auth.profile);
      router.replace("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
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
    <AuthShell title="Welcome back" subtitle="Log in to continue training with your AI examiner.">
      {googleLoading ? (
        <div className="py-4 text-center text-sm font-bold text-[#17342f]">Signing in with Google…</div>
      ) : (
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
            disabled={loading}
            className="w-full rounded-2xl bg-[#17342f] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log in & continue"}
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="flex-1 rounded-2xl border border-[#d8c8a8] bg-white px-4 py-3 text-sm font-bold text-[#17342f] transition hover:bg-[#fff6e3]"
            >
              Forgot password?
            </button>
            <button
              type="button"
              onClick={() => router.push("/app")}
              className="flex-1 rounded-2xl border border-[#d8c8a8] bg-white px-4 py-3 text-sm font-bold text-[#17342f] transition hover:bg-[#fff6e3]"
            >
              Continue as guest (demo)
            </button>
          </div>

          <Divider />
          <GoogleSignIn clientId={GOOGLE_CLIENT_ID} onCredential={handleGoogle} />
        </form>
      )}
      <p className="mt-5 text-center text-sm text-[#5c6b64]">
        No account yet?{" "}
        <a href="/register" className="font-bold text-[#17342f] underline underline-offset-2">
          Create one
        </a>
      </p>
    </AuthShell>
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