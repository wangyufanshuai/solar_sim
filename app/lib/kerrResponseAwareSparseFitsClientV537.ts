"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import { parseKerrResponseAwareSparseFitsApiV537, type KerrResponseAwareSparseFitsSummaryV537 } from "./kerrResponseAwareSparseFitsV537";

type SnapshotV537 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrResponseAwareSparseFitsSummaryV537 | null;
}>;

const INITIAL: SnapshotV537 = Object.freeze({ status: "idle", reason: null, requestCount: 0, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrResponseAwareSparseFitsSummaryV537> | null = null;
const publish = (next: SnapshotV537) => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };

export function loadKerrResponseAwareSparseFitsSummaryV537(): Promise<KerrResponseAwareSparseFitsSummaryV537> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v537/response-aware-sparse-fits", { cache: "no-store" })
    .then(async (response) => {
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > 128 * 1024) throw new Error("response-too-large");
      const api = parseKerrResponseAwareSparseFitsApiV537(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) throw new Error(`v537-sparse-fits-${api.reason}`);
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      publish({ status: "unavailable", reason: error instanceof Error ? error.message : "request-failed", requestCount: 1, responseBytes: snapshot.responseBytes, summary: null });
      throw error;
    });
  return requestPromise;
}

export const getKerrResponseAwareSparseFitsSnapshotV537 = () => snapshot;
export function subscribeKerrResponseAwareSparseFitsV537(listener: () => void): () => void {
  listeners.add(listener);
  const release = acquireAtlasResource("subscription", "relativity-lab", "v537-response-aware-sparse-fits", { owner: "v537-response-aware-sparse-fits", estimatedBytes: 0 });
  let done = false;
  return () => {
    if (done) return;
    done = true;
    listeners.delete(listener);
    release();
  };
}
export function getKerrResponseAwareSparseFitsTelemetryV537() { return Object.freeze({ listenerCount: listeners.size, requestCount: snapshot.requestCount, status: snapshot.status }); }
export function resetKerrResponseAwareSparseFitsClientForTestsV537(): void {
  if (listeners.size) throw new Error("v537-listener-leak");
  snapshot = INITIAL;
  requestPromise = null;
}
