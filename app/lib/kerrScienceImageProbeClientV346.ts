"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import { parseKerrScienceImagePixelProbeArtifactV346, type KerrScienceImagePixelProbeArtifactV346 } from "./kerrScienceImagePixelProbeV346";

export const KERR_SCIENCE_IMAGE_PROBE_CLIENT_VERSION_V346 = "v346-kerr-science-image-probe-client-v1" as const;
export type KerrScienceImageProbeClientSnapshotV346 = Readonly<{ version: typeof KERR_SCIENCE_IMAGE_PROBE_CLIENT_VERSION_V346; cacheEntries: number; inFlightCount: number; referenceCount: number; fetchCount: number; boundary: "intent-only-single-flight-exact-response-sha-bounded-json-release-baseline" }>;
export type AcquiredKerrScienceImageProbeV346 = Readonly<{ artifact: KerrScienceImagePixelProbeArtifactV346; release: () => void }>;
type Entry = { promise: Promise<Readonly<{ artifact: KerrScienceImagePixelProbeArtifactV346; bytes: Uint8Array; responseSha256: string }>>; bytes: Uint8Array | null; artifact: KerrScienceImagePixelProbeArtifactV346 | null; pending: number; references: number; releaseCache: (() => void) | null };
let entry: Entry | null = null;
let fetchCount = 0;
const LIMIT = 64 * 1024;

function canonicalize(value: unknown): unknown { if (Array.isArray(value)) return value.map(canonicalize); if (!value || typeof value !== "object") return value; return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, canonicalize(item)])); }
async function exactSha(bytes: Uint8Array | string): Promise<string> { const source = typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes; const digest = await crypto.subtle.digest("SHA-256", source.slice().buffer); return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join(""); }
async function load(): Promise<Readonly<{ artifact: KerrScienceImagePixelProbeArtifactV346; bytes: Uint8Array; responseSha256: string }>> {
  fetchCount += 1;
  const response = await fetch("/api/atlas/relativity-evidence/v346/probe", { cache: "no-store" });
  const length = Number(response.headers.get("content-length"));
  const etag = response.headers.get("etag")?.replaceAll('"', "") ?? "";
  if (!response.ok || response.headers.get("content-type")?.split(";", 1)[0] !== "application/json"
    || !Number.isSafeInteger(length) || length <= 0 || length > LIMIT
    || response.headers.get("x-atlas-science-probe") !== "v346") throw new Error("v346-probe-response-identity");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength !== length || await exactSha(bytes) !== etag) throw new Error("v346-probe-response-sha");
  const artifact = parseKerrScienceImagePixelProbeArtifactV346(JSON.parse(new TextDecoder().decode(bytes)));
  if (await exactSha(JSON.stringify(canonicalize(artifact))) !== artifact.artifactSha256) throw new Error("v346-probe-canonical-sha");
  return { artifact, bytes, responseSha256: etag };
}
function cleanup(current: Entry): void { if (current.pending !== 0 || current.references !== 0) return; current.releaseCache?.(); current.releaseCache = null; current.bytes = null; current.artifact = null; if (entry === current) entry = null; }
function getEntry(): Entry {
  if (entry) return entry;
  const current: Entry = { promise: undefined as unknown as Entry["promise"], bytes: null, artifact: null, pending: 0, references: 0, releaseCache: null };
  current.promise = load().then((result) => { current.bytes = result.bytes; current.artifact = result.artifact; current.releaseCache = acquireAtlasResource("typed-array-cache", "relativity-lab", "v346:science-image-probe:verified-json", { owner: "v346-science-image-probe", estimatedBytes: result.bytes.byteLength, contentSha256: result.responseSha256, manifestSha256: result.artifact.artifactSha256 }); return result; }).catch((error: unknown) => { if (entry === current) entry = null; throw error; });
  entry = current; return current;
}
export async function acquireKerrScienceImageProbeV346(options: Readonly<{ signal?: AbortSignal }> = {}): Promise<AcquiredKerrScienceImageProbeV346> {
  if (options.signal?.aborted) throw new DOMException("Science image probe acquisition aborted", "AbortError");
  const current = getEntry(); current.pending += 1;
  let result: Awaited<Entry["promise"]>;
  try { result = await current.promise; } finally { current.pending = Math.max(0, current.pending - 1); }
  if (options.signal?.aborted) { cleanup(current); throw new DOMException("Science image probe acquisition aborted", "AbortError"); }
  current.references += 1; let released = false;
  return Object.freeze({ artifact: result.artifact, release: () => { if (released) return; released = true; current.references = Math.max(0, current.references - 1); cleanup(current); } });
}
export function getKerrScienceImageProbeClientSnapshotV346(): KerrScienceImageProbeClientSnapshotV346 { return Object.freeze({ version: KERR_SCIENCE_IMAGE_PROBE_CLIENT_VERSION_V346, cacheEntries: entry ? 1 : 0, inFlightCount: entry && entry.artifact == null ? 1 : 0, referenceCount: entry?.references ?? 0, fetchCount, boundary: "intent-only-single-flight-exact-response-sha-bounded-json-release-baseline" }); }
export function resetKerrScienceImageProbeClientV346ForTests(): void { if (entry && (entry.pending !== 0 || entry.references !== 0)) throw new Error("v346-probe-reset-with-live-consumer"); entry?.releaseCache?.(); entry = null; fetchCount = 0; }
