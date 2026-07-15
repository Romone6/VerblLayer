import { NextRequest, NextResponse } from "next/server";
import { applySecurityHeaders, corsResponse, isApiKeyRoute, isOriginAllowed } from "@/lib/api-security";

function withRequestContext(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("x-request-id", requestId);
  return applySecurityHeaders(response);
}

export default function proxy(request: NextRequest) {
  if (isApiKeyRoute(request.nextUrl.pathname)) {
    if (request.method === "OPTIONS") return applySecurityHeaders(corsResponse(request));
    if (!isOriginAllowed(request.headers.get("origin"))) {
      return applySecurityHeaders(NextResponse.json({ error: { code: "cors_forbidden", message: "Origin is not allowed." } }, { status: 403 }));
    }
  }
  return withRequestContext(request);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
