"use client";

import { parseKerrScreenCoordinateResponseV419, type KerrScreenCoordinateSummaryV419 } from "./kerrScreenCoordinateProvenanceV419";

export type KerrScreenCoordinateSnapshotV419 = Readonly<{ status: "idle" | "loading" | "ready" | "unavailable"; reason: string | null; requestCount: 0 | 1; responseBytes: number; summary: KerrScreenCoordinateSummaryV419 | null }>;
const INITIAL = Object.freeze({ status: "idle" as const, reason: null, requestCount: 0 as const, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot: KerrScreenCoordinateSnapshotV419 = INITIAL;
let requestPromise: Promise<KerrScreenCoordinateSummaryV419> | null = null;
const safe = (value: unknown) => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrScreenCoordinateSnapshotV419) => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };
export function loadKerrScreenCoordinateSummaryV419(): Promise<KerrScreenCoordinateSummaryV419> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v419/screen-coordinates", { cache: "no-store" }).then(async (response) => {
    const declared = Number(response.headers.get("Content-Length"));
    if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
    const body = await response.text();
    const responseBytes = new TextEncoder().encode(body).byteLength;
    if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const result = parseKerrScreenCoordinateResponseV419(JSON.parse(body));
    if (!response.ok || !result.available || !result.summary) { publish({ status: "unavailable", reason: safe(result.reason), requestCount: 1, responseBytes, summary: null }); throw new Error(`v419-coordinates-${safe(result.reason)}`); }
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary });
    return result.summary;
  }).catch((error: unknown) => { if (snapshot.status !== "unavailable") publish({ status: "unavailable", reason: safe(error instanceof Error ? error.message.replace(/^v419-coordinates-/, "") : null), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null }); throw error; });
  return requestPromise;
}
export const getKerrScreenCoordinateSnapshotV419 = () => snapshot;
export function subscribeKerrScreenCoordinateV419(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetKerrScreenCoordinateClientForTestsV419(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
