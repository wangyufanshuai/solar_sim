"use client";

import { parseKerrObservationApiV436, type KerrObservationSummaryV436 } from "./kerrObservationProvenanceV436";

export type KerrObservationSnapshotV436 = Readonly<{ status: "idle" | "loading" | "ready" | "unavailable"; reason: string | null; requestCount: 0 | 1; responseBytes: number; summary: KerrObservationSummaryV436 | null }>;
const INITIAL: KerrObservationSnapshotV436 = Object.freeze({ status: "idle", reason: null, requestCount: 0, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot: KerrObservationSnapshotV436 = INITIAL;
let requestPromise: Promise<KerrObservationSummaryV436> | null = null;
const safeReason = (value: unknown): string => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrObservationSnapshotV436): void => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };

export function loadKerrObservationProvenanceSummaryV436(): Promise<KerrObservationSummaryV436> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v436/observation-provenance", { cache: "no-store" }).then(async (response) => {
    const declared = Number(response.headers.get("Content-Length"));
    if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
    const body = await response.text();
    const responseBytes = new TextEncoder().encode(body).byteLength;
    if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const result = parseKerrObservationApiV436(JSON.parse(body));
    if (!response.ok || !result.available || !result.summary) { publish({ status: "unavailable", reason: safeReason(result.reason), requestCount: 1, responseBytes, summary: null }); throw new Error(`v436-response-${safeReason(result.reason)}`); }
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary });
    return result.summary;
  }).catch((error: unknown) => { if (snapshot.status !== "unavailable") publish({ status: "unavailable", reason: safeReason(error instanceof Error ? error.message.replace(/^v436-response-/, "") : null), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null }); throw error; });
  return requestPromise;
}

export const getKerrObservationProvenanceSnapshotV436 = (): KerrObservationSnapshotV436 => snapshot;
export function subscribeKerrObservationProvenanceV436(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetKerrObservationProvenanceClientForTestsV436(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
