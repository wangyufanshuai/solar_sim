"use client";

import {
  parseKerrAxialPolarizationVectorResponseV421,
  type KerrAxialPolarizationVectorSummaryV421,
} from "./kerrAxialPolarizationVectorCatalogV421";

export type KerrAxialPolarizationVectorSnapshotV421 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrAxialPolarizationVectorSummaryV421 | null;
}>;
const INITIAL = Object.freeze({ status: "idle" as const, reason: null, requestCount: 0 as const, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot: KerrAxialPolarizationVectorSnapshotV421 = INITIAL;
let requestPromise: Promise<KerrAxialPolarizationVectorSummaryV421> | null = null;
const safe = (value: unknown) => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrAxialPolarizationVectorSnapshotV421) => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };

export function loadKerrAxialPolarizationVectorSummaryV421(): Promise<KerrAxialPolarizationVectorSummaryV421> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v421/axial-vectors", { cache: "no-store" }).then(async (response) => {
    const declared = Number(response.headers.get("Content-Length"));
    if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
    const body = await response.text();
    const responseBytes = new TextEncoder().encode(body).byteLength;
    if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const result = parseKerrAxialPolarizationVectorResponseV421(JSON.parse(body));
    if (!response.ok || !result.available || !result.summary) {
      publish({ status: "unavailable", reason: safe(result.reason), requestCount: 1, responseBytes, summary: null });
      throw new Error(`v421-axial-${safe(result.reason)}`);
    }
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary });
    return result.summary;
  }).catch((error: unknown) => {
    if (snapshot.status !== "unavailable") publish({ status: "unavailable", reason: safe(error instanceof Error ? error.message.replace(/^v421-axial-/, "") : null), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null });
    throw error;
  });
  return requestPromise;
}
export const getKerrAxialPolarizationVectorSnapshotV421 = () => snapshot;
export function subscribeKerrAxialPolarizationVectorV421(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetKerrAxialPolarizationVectorClientForTestsV421(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
