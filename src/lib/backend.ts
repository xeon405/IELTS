import type { StudentLearningProfile } from "@/lib/ielts-brain";

export const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
export const API_BASE = `${BACKEND_URL}/api`;

export const tokenKey = "ielts_access_token";
export const profileKey = "ai-ielts-examiner-profile";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(tokenKey);
}

export function setAuth(token: string, profile: StudentLearningProfile): void {
  window.localStorage.setItem(tokenKey, token);
  window.localStorage.setItem(profileKey, JSON.stringify(profile));
}

export function clearAuth(): void {
  window.localStorage.removeItem(tokenKey);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
  profile: StudentLearningProfile;
  requires_diagnostic: boolean;
  first_login: boolean;
}

export interface RegisterResponse {
  requires_verification: boolean;
  message: string;
  dev_code?: string | null;
}

export interface ResendResponse {
  message: string;
  dev_code?: string | null;
}

async function request<T>(path: string, init: RequestInit = {}, withAuth = true): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  const token = getToken();
  if (withAuth && token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (response.status === 401 && withAuth) clearAuth();
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const detail =
      (data as { detail?: string }).detail ??
      (data as { message?: string }).message ??
      `Backend request failed (${response.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return response.json() as Promise<T>;
}

export async function isBackendUp(timeoutMs = 1600): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE}/brain/health`, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export const authApi = {
  register(full_name: string, email: string, password: string): Promise<RegisterResponse> {
    return request<RegisterResponse>("/auth/register", { method: "POST", body: JSON.stringify({ full_name, email, password }) }, false);
  },
  login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }, false);
  },
  verify(email: string, code: string): Promise<AuthResponse> {
    return request<AuthResponse>("/auth/verify", { method: "POST", body: JSON.stringify({ email, code }) }, false);
  },
  resendVerification(email: string): Promise<ResendResponse> {
    return request<ResendResponse>("/auth/verify/resend", { method: "POST", body: JSON.stringify({ email }) }, false);
  },
  forgotPassword(email: string): Promise<{ message: string; reset_token?: string }> {
    return request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }, false);
  },
  resetPassword(token: string, password: string): Promise<{ message: string }> {
    return request("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }, false);
  },
  me(): Promise<AuthResponse> {
    return request<AuthResponse>("/auth/me");
  },
};
