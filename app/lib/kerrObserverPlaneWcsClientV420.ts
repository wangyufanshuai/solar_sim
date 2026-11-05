"use client";

import { parseKerrObserverPlaneWcsResponseV420, type KerrObserverPlaneWcsSummaryV420 } from "./kerrObserverPlaneWcsV420";

export type KerrObserverPlaneWcsSnapshotV420 = Readonly<{ status: "idle" | "loading" | "ready" | "unavailable"; reason: string | null; requestCount: 0 | 1; responseBytes: number; summary: KerrObserverPlaneWcsSummaryV420 | null }>;
const INITIAL = Object.freeze({ status: "idle" as const, reason: null, requestCount: 0 as const, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot: KerrObserverPlaneWcsSnapshotV420 = INITIAL;
let requestPromise: Promise<KerrObserverPlaneWcsSummaryV420> | null = null;
const safe = (value: unknown) => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrObserverPlaneWcsSnapshotV420) => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };
export function loadKerrObserverPlaneWcsSummaryV420(): Promise<KerrObserverPlaneWcsSummaryV420> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v420/observer-wcs", { cache: "no-store" }).then(async (response) => {
    const declared = Number(response.headers.get("Content-Length"));
    if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
    const body = await response.text(), responseBytes = new TextEncoder().encode(body).byteLength;
    if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const result = parseKerrObserverPlaneWcsResponseV420(JSON.parse(body));
    if (!response.ok || !result.available || !result.summary) { publish({ status: "unavailable", reason: safe(result.reason), requestCount: 1, responseBytes, summary: null }); throw new Error(`v420-WCS-${safe(result.reason)}`); }
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary }); return result.summary;
  }).catch((error: unknown) => { if (snapshot.status !== "unavailable") publish({ status: "unavailable", reason: safe(error instanceof Error ? error.message.replace(/^v420-WCS-/, "") : null), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null }); throw error; });
  return requestPromise;
}
export const getKerrObserverPlaneWcsSnapshotV420 = () => snapshot;
export function subscribeKerrObserverPlaneWcsV420(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetKerrObserverPlaneWcsClientForTestsV420(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
