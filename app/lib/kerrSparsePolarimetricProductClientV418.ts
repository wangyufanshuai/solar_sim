"use client";

import {
  parseKerrSparsePolarimetricResponseV418,
  type KerrSparsePolarimetricSummaryV418,
} from "./kerrSparsePolarimetricProductV418";

export type KerrSparsePolarimetricSnapshotV418 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrSparsePolarimetricSummaryV418 | null;
}>;
const INITIAL = Object.freeze({ status: "idle" as const, reason: null, requestCount: 0 as const, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot: KerrSparsePolarimetricSnapshotV418 = INITIAL;
let requestPromise: Promise<KerrSparsePolarimetricSummaryV418> | null = null;
const safe = (value: unknown) => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrSparsePolarimetricSnapshotV418) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrSparsePolarimetricSummaryV418(): Promise<KerrSparsePolarimetricSummaryV418> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v418/sparse-polarimetry", { cache: "no-store" })
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > 128 * 1024) throw new Error("response-too-large");
      const result = parseKerrSparsePolarimetricResponseV418(JSON.parse(body));
      if (!response.ok || !result.available || !result.summary) {
        publish({ status: "unavailable", reason: safe(result.reason), requestCount: 1, responseBytes, summary: null });
        throw new Error(`v418-product-${safe(result.reason)}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary });
      return result.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") publish({ status: "unavailable", reason: safe(error instanceof Error ? error.message.replace(/^v418-product-/, "") : null), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null });
      throw error;
    });
  return requestPromise;
}
export const getKerrSparsePolarimetricSnapshotV418 = () => snapshot;
export function subscribeKerrSparsePolarimetricV418(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function resetKerrSparsePolarimetricClientForTestsV418(): void {
  requestPromise = null;
  snapshot = INITIAL;
  listeners.clear();
}
