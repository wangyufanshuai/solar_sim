"use client";

import { parseKerrRedshiftEdgeRedundancyApiV493, type KerrRedshiftEdgeRedundancySummaryV493 } from "./kerrRedshiftEdgeRedundancyV493";

export type KerrRedshiftEdgeRedundancySnapshotV493 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrRedshiftEdgeRedundancySummaryV493 | null;
}>;

const INITIAL: KerrRedshiftEdgeRedundancySnapshotV493 = Object.freeze({ status: "idle", reason: null, requestCount: 0, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrRedshiftEdgeRedundancySummaryV493> | null = null;
const safeReason = (value: unknown) => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrRedshiftEdgeRedundancySnapshotV493) => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };

export function loadKerrRedshiftEdgeRedundancySummaryV493(): Promise<KerrRedshiftEdgeRedundancySummaryV493> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v493/redshift-edge-redundancy", { cache: "no-store" }).then(async (response) => {
    const declared = Number(response.headers.get("Content-Length"));
    if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
    const body = await response.text();
    const responseBytes = new TextEncoder().encode(body).byteLength;
    if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const api = parseKerrRedshiftEdgeRedundancyApiV493(JSON.parse(body));
    if (!response.ok || !api.available || !api.summary) {
      const reason = safeReason(api.reason);
      publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
      throw new Error(`v493-response-${reason}`);
    }
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
    return api.summary;
  }).catch((error: unknown) => {
    if (snapshot.status !== "unavailable") publish({ status: "unavailable", reason: safeReason(error instanceof Error ? error.message.replace(/^v493-response-/i, "") : null), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null });
    throw error;
  });
  return requestPromise;
}

export const getKerrRedshiftEdgeRedundancySnapshotV493 = () => snapshot;
export function subscribeKerrRedshiftEdgeRedundancyV493(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetKerrRedshiftEdgeRedundancyClientForTestsV493(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
