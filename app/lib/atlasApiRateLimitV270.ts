export const ATLAS_API_RATE_LIMIT_VERSION = "v270-bounded-api-rate-limit-v1" as const;

type WindowEntry = { startedAt: number; touchedAt: number; count: number };
const windows = new Map<string, WindowEntry>();
const MAX_WINDOWS = 1024;

function clientKey(request: Request): string {
  if (process.env.ATLAS_TRUST_PROXY_HEADERS !== "1") return "local-untrusted-proxy";
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  return (forwarded || real || "trusted-proxy-unknown").slice(0, 96);
}

function prune(now: number, windowMs: number): void {
  for (const [key, entry] of windows) {
    if (now - entry.touchedAt >= windowMs * 2) windows.delete(key);
  }
  while (windows.size >= MAX_WINDOWS) {
    const oldest = windows.keys().next().value as string | undefined;
    if (!oldest) break;
    windows.delete(oldest);
  }
}

export function consumeAtlasApiRateLimitV270(args: {
  request: Request;
  service: string;
  limit: number;
  windowMs?: number;
  now?: number;
}): { allowed: boolean; retryAfterSeconds: number; remaining: number } {
  const windowMs = args.windowMs ?? 60_000;
  const now = args.now ?? Date.now();
  prune(now, windowMs);
  const key = `${args.service}\0${clientKey(args.request)}`;
  const current = windows.get(key);
  if (!current || now - current.startedAt >= windowMs) {
    windows.set(key, { startedAt: now, touchedAt: now, count: 1 });
    return { allowed: true, retryAfterSeconds: 0, remaining: Math.max(0, args.limit - 1) };
  }
  current.count += 1;
  current.touchedAt = now;
  windows.delete(key);
  windows.set(key, current);
  const retryAfterSeconds = Math.max(1, Math.ceil((current.startedAt + windowMs - now) / 1000));
  return { allowed: current.count <= args.limit, retryAfterSeconds, remaining: Math.max(0, args.limit - current.count) };
}

export function resetAtlasApiRateLimitsForTestsV270(): void {
  windows.clear();
}

export function atlasApiRateLimitWindowCountForTestsV270(): number {
  return windows.size;
}
