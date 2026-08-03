"use client";

import { parseKerrRedshiftDoubleEdgeIdentifiabilityApiV495, type KerrRedshiftDoubleEdgeIdentifiabilitySummaryV495 } from "./kerrRedshiftDoubleEdgeIdentifiabilityV495";
export type KerrRedshiftDoubleEdgeIdentifiabilitySnapshotV495 = Readonly<{ status: "idle" | "loading" | "ready" | "unavailable"; reason: string | null; requestCount: 0 | 1; responseBytes: number; summary: KerrRedshiftDoubleEdgeIdentifiabilitySummaryV495 | null }>;
const INITIAL: KerrRedshiftDoubleEdgeIdentifiabilitySnapshotV495 = Object.freeze({ status: "idle", reason: null, requestCount: 0, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrRedshiftDoubleEdgeIdentifiabilitySummaryV495> | null = null;
const safeReason = (value: unknown) => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrRedshiftDoubleEdgeIdentifiabilitySnapshotV495) => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };
export function loadKerrRedshiftDoubleEdgeIdentifiabilitySummaryV495(): Promise<KerrRedshiftDoubleEdgeIdentifiabilitySummaryV495> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v495/redshift-double-edge-identifiability", { cache: "no-store" }).then(async (response) => {
    const declared = Number(response.headers.get("Content-Length"));
    if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
    const body = await response.text(), responseBytes = new TextEncoder().encode(body).byteLength;
    if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const api = parseKerrRedshiftDoubleEdgeIdentifiabilityApiV495(JSON.parse(body));
    if (!response.ok || !api.available || !api.summary) { const reason = safeReason(api.reason); publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null }); throw new Error(`v495-response-${reason}`); }
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
    return api.summary;
  }).catch((error: unknown) => { if (snapshot.status !== "unavailable") publish({ status: "unavailable", reason: safeReason(error instanceof Error ? error.message.replace(/^v495-response-/i, "") : null), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null }); throw error; });
  return requestPromise;
}
export const getKerrRedshiftDoubleEdgeIdentifiabilitySnapshotV495 = () => snapshot;
export function subscribeKerrRedshiftDoubleEdgeIdentifiabilityV495(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetKerrRedshiftDoubleEdgeIdentifiabilityClientForTestsV495(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
