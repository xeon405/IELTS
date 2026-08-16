import type { NextConfig } from "next";

// Loader path from @ideavo/webpack-tagger - use direct resolve to get the actual file
const loaderPath = require.resolve('@ideavo/webpack-tagger');

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://apis.google.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "font-src 'self' data:; " +
      "img-src 'self' data: blob: https:; " +
      "connect-src 'self' http://127.0.0.1:8000 http://localhost:8000 https:; " +
      "frame-src https://accounts.google.com; " +
      "media-src 'self' blob: data:; " +
      "object-src 'none'; base-uri 'self'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  poweredByHeader: false,
  allowedDevOrigins: ['*.e2b.app', '*.ideavo.app', '*.ideavo.ai'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  turbopack: {
    rules: {
      "*.{jsx,tsx}": {
        loaders: [loaderPath]
      }
    }
  }
} as NextConfig;

export default nextConfig;