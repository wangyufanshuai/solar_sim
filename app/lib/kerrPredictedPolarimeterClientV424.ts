"use client";

import {
  parseKerrPredictedPolarimeterResponseV424,
  type KerrPredictedPolarimeterSummaryV424,
} from "./kerrPredictedPolarimeterV424";

export type KerrPredictedPolarimeterSnapshotV424 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrPredictedPolarimeterSummaryV424 | null;
}>;

const INITIAL = Object.freeze({ status: "idle" as const, reason: null, requestCount: 0 as const, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot: KerrPredictedPolarimeterSnapshotV424 = INITIAL;
let requestPromise: Promise<KerrPredictedPolarimeterSummaryV424> | null = null;
const safe = (value: unknown) => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrPredictedPolarimeterSnapshotV424) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrPredictedPolarimeterSummaryV424(): Promise<KerrPredictedPolarimeterSummaryV424> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v424/predicted-polarimeter", { cache: "no-store" })
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > 128 * 1024) throw new Error("response-too-large");
      const result = parseKerrPredictedPolarimeterResponseV424(JSON.parse(body));
      if (!response.ok || !result.available || !result.summary) {
        publish({ status: "unavailable", reason: safe(result.reason), requestCount: 1, responseBytes, summary: null });
        throw new Error(`v424-polarimeter-${safe(result.reason)}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary });
      return result.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        const reason = error instanceof Error ? error.message.replace(/^v424-polarimeter-/, "") : null;
        publish({ status: "unavailable", reason: safe(reason), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null });
      }
      throw error;
    });
  return requestPromise;
}

export const getKerrPredictedPolarimeterSnapshotV424 = () => snapshot;
export function subscribeKerrPredictedPolarimeterV424(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function resetKerrPredictedPolarimeterClientForTestsV424(): void {
  requestPromise = null;
  snapshot = INITIAL;
  listeners.clear();
}
