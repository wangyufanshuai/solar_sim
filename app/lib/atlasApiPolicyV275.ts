import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { consumeAtlasApiRateLimitV270 } from "./atlasApiRateLimitV270";
import { atlasUtf8ByteLengthV270 } from "./atlasApiSecurityV270";

export const ATLAS_API_POLICY_VERSION_V275 = "v275-unified-bounded-api-policy-v1" as const;

export type AtlasApiServiceV275 =
  | "catalog"
  | "science-workbench"
  | "science-record"
  | "relativity-evidence"
  | "cosmicflows"
  | "openngc"
  | "weather"
  | "locations";

export type AtlasApiPolicyV275 = {
  rateLimit: number;
  timeoutMs: number;
  requestMaxBytes: number;
  responseMaxBytes: number;
};

export const ATLAS_API_POLICIES_V275: Readonly<Record<AtlasApiServiceV275, AtlasApiPolicyV275>> = {
  catalog: { rateLimit: 30, timeoutMs: 12_000, requestMaxBytes: 16 * 1024, responseMaxBytes: 5 * 1024 * 1024 },
  "science-workbench": { rateLimit: 30, timeoutMs: 5_000, requestMaxBytes: 16 * 1024, responseMaxBytes: 2 * 1024 * 1024 },
  "science-record": { rateLimit: 60, timeoutMs: 3_000, requestMaxBytes: 0, responseMaxBytes: 2 * 1024 * 1024 },
  "relativity-evidence": { rateLimit: 30, timeoutMs: 3_000, requestMaxBytes: 0, responseMaxBytes: 128 * 1024 },
  cosmicflows: { rateLimit: 12, timeoutMs: 3_000, requestMaxBytes: 0, responseMaxBytes: 4 * 1024 * 1024 },
  openngc: { rateLimit: 30, timeoutMs: 3_000, requestMaxBytes: 0, responseMaxBytes: 1024 * 1024 },
  weather: { rateLimit: 12, timeoutMs: 12_000, requestMaxBytes: 4 * 1024, responseMaxBytes: 1024 * 1024 },
  locations: { rateLimit: 30, timeoutMs: 12_000, requestMaxBytes: 0, responseMaxBytes: 256 * 1024 },
};

type ImmutableFile = { bytes: Buffer; etag: string; lastModifiedMs: number };
const immutableFiles = new Map<string, Promise<ImmutableFile>>();
const MAX_IMMUTABLE_FILES = 16;

export function consumeAtlasApiPolicyV275(request: Request, service: AtlasApiServiceV275): Response | null {
  const policy = ATLAS_API_POLICIES_V275[service];
  const result = consumeAtlasApiRateLimitV270({ request, service: `v275:${service}`, limit: policy.rateLimit });
  if (result.allowed) return null;
  return atlasJsonResponseV275(service, { error: "Atlas API rate limit exceeded" }, {
    status: 429,
    headers: { "Retry-After": String(result.retryAfterSeconds) },
  });
}

export function atlasTimeoutSignalV275(service: AtlasApiServiceV275): AbortSignal {
  return AbortSignal.timeout(ATLAS_API_POLICIES_V275[service].timeoutMs);
}

export function atlasStrongEtagV275(value: string | Uint8Array): string {
  return `"sha256-${createHash("sha256").update(value).digest("base64url")}"`;
}

export function atlasJsonResponseV275(
  service: AtlasApiServiceV275,
  payload: unknown,
  init: ResponseInit = {},
): Response {
  const serialized = JSON.stringify(payload);
  if (atlasUtf8ByteLengthV270(serialized) > ATLAS_API_POLICIES_V275[service].responseMaxBytes) {
    return new Response(JSON.stringify({ error: "Atlas API response exceeds its byte limit" }), {
      status: 413,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("X-Atlas-Api-Policy", ATLAS_API_POLICY_VERSION_V275);
  return new Response(serialized, { ...init, headers });
}

export function atlasSanitizedUnavailableV275(
  service: AtlasApiServiceV275,
  boundary: string,
  status = 503,
): Response {
  return atlasJsonResponseV275(service, {
    error: "Atlas data is temporarily unavailable",
    boundary,
  }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function readImmutableAtlasFileV275(
  path: string,
  service: AtlasApiServiceV275,
): Promise<ImmutableFile> {
  const cached = immutableFiles.get(path);
  if (cached) return cached;
  while (immutableFiles.size >= MAX_IMMUTABLE_FILES) {
    const oldest = immutableFiles.keys().next().value as string | undefined;
    if (!oldest) break;
    immutableFiles.delete(oldest);
  }
  const pending = (async () => {
    const metadata = await stat(path);
    if (!metadata.isFile() || metadata.size > ATLAS_API_POLICIES_V275[service].responseMaxBytes) {
      throw new Error("immutable-file-boundary");
    }
    const bytes = await readFile(path);
    if (bytes.byteLength !== metadata.size) throw new Error("immutable-file-changed-during-read");
    return { bytes, etag: atlasStrongEtagV275(bytes), lastModifiedMs: metadata.mtimeMs };
  })();
  immutableFiles.set(path, pending);
  try {
    return await pending;
  } catch (error) {
    immutableFiles.delete(path);
    throw error;
  }
}

export function atlasNotModifiedV275(request: Request, etag: string): Response | null {
  return request.headers.get("if-none-match") === etag
    ? new Response(null, { status: 304, headers: { ETag: etag, "X-Atlas-Api-Policy": ATLAS_API_POLICY_VERSION_V275 } })
    : null;
}

export function resetAtlasImmutableFileCacheForTestsV275(): void {
  immutableFiles.clear();
}
