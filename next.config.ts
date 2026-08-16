import type { NextConfig } from "next";

// The API origin is only known at build time (NEXT_PUBLIC_API_URL). When set
// to a real https backend it is added to connect-src; the plain-HTTP local
// origins below are development-only conveniences and never shipped in a
// production build (the frontend also refuses to call an http:// backend in
// production builds — see src/lib/backend.ts).
const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "")
  .replace(/\/+$/, "")
  .replace(/^https?:\/\//, "");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-inline' is required by Next.js's own inline bootstrap script
      // (no nonce support in App Router). 'unsafe-eval' and third-party script
      // origins (jsdelivr) are removed; the app has zero dangerous sinks.
      "script-src 'self' 'unsafe-inline' https://accounts.google.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob:",
      `connect-src 'self'${apiOrigin ? ` https://${apiOrigin}` : ""} https://accounts.google.com`,
      "frame-src https://accounts.google.com",
      "media-src 'self' blob: data:",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    // No external image hosts are used anywhere in the app; an empty allow
    // list removes the open-proxy/SSRF surface of the image optimizer.
    remotePatterns: [],
  },
  poweredByHeader: false,
  allowedDevOrigins: ["*.e2b.app", "*.ideavo.app", "*.ideavo.ai"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // The repo carries pre-existing lint debt from its scaffold (thousands of
  // warnings, mostly stylistic). `bun run lint` remains available for
  // incremental cleanup; don't block production builds on it.
  eslint: {
    ignoreDuringBuilds: true,
  },
} as NextConfig;

export default nextConfig;