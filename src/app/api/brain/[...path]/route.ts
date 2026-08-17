import { NextRequest, NextResponse } from "next/server";

// Run this proxy in Portland - geographically closest Vercel region to
// Render's Oregon backend, shaving round-trip latency on every API call.
export const config = { region: "pdx1" };

// Server-side proxy: the app calls relative /api/brain/* paths when its
// direct-backend calls fall back (e.g. Render free-tier cold starts, or
// endpoints with no local route handler like /check and /vocab). Requests
// reach here when no static handler (e.g. /mock, /evaluate) matched first,
// and are forwarded to the real backend with the browser's Authorization
// header intact. Courier every status code and body through unchanged.
const BACKEND_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "").replace(/\/api\/?$/, "");

type Context = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: Context): Promise<NextResponse> {
  if (!BACKEND_ORIGIN) {
    return NextResponse.json({ detail: "Backend URL is not configured" }, { status: 503 });
  }
  const { path } = await context.params;
  const target = new URL(`${BACKEND_ORIGIN}/api/brain/${path.join("/")}${request.nextUrl.search}`);
  let upstream: Response;
  try {
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("connection");
    headers.delete("content-length");
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      duplex: "half",
    } as RequestInit);
  } catch {
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }
  const response = new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    statusText: upstream.statusText,
  });
  const passthrough = ["content-type", "content-length", "cache-control", "etag"];
  for (const key of passthrough) {
    const value = upstream.headers.get(key);
    if (value) response.headers.set(key, value);
  }
  return response;
}

export const GET = (request: NextRequest, context: Context) => proxy(request, context);
export const POST = (request: NextRequest, context: Context) => proxy(request, context);
export const PATCH = (request: NextRequest, context: Context) => proxy(request, context);
export const PUT = (request: NextRequest, context: Context) => proxy(request, context);
export const DELETE = (request: NextRequest, context: Context) => proxy(request, context);
export const HEAD = (request: NextRequest, context: Context) => proxy(request, context);
export const OPTIONS = (request: NextRequest, context: Context) => proxy(request, context);