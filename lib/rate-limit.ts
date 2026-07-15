import { env } from "@/lib/env";

type RateLimitResult = { allowed: boolean; limit: number; remaining: number; resetSeconds: number };
const counters = new Map<string, { count: number; resetAt: number }>();

function requestIdentity(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

/** In-process limiter for the single-instance public core; use a gateway for distributed deployments. */
export async function enforceRateLimit(request: Request, keyPrefix: string, perMinute = env.API_RATE_LIMIT_PER_MINUTE): Promise<RateLimitResult> {
  const key = `${keyPrefix}:${requestIdentity(request)}`;
  const now = Date.now();
  const current = counters.get(key);
  if (!current || current.resetAt <= now) {
    counters.set(key, { count: 1, resetAt: now + 60_000 });
    return { allowed: true, limit: perMinute, remaining: perMinute - 1, resetSeconds: 60 };
  }
  current.count += 1;
  return { allowed: current.count <= perMinute, limit: perMinute, remaining: Math.max(0, perMinute - current.count), resetSeconds: Math.ceil((current.resetAt - now) / 1000) };
}
