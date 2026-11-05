"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  parseKerrAllocationRegretApiV530,
  type KerrAllocationRegretSummaryV530,
} from "./kerrAllocationRegretV530";

export const KERR_ALLOCATION_REGRET_SUMMARY_MAX_BYTES_V530 = 128 * 1024;
export type KerrAllocationRegretSnapshotV530 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrAllocationRegretSummaryV530 | null;
}>;
const INITIAL: KerrAllocationRegretSnapshotV530 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrAllocationRegretSummaryV530> | null = null;
const safeReason = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrAllocationRegretSnapshotV530) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};
export function loadKerrAllocationRegretSummaryV530(): Promise<KerrAllocationRegretSummaryV530> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v530/allocation-regret", {
    cache: "no-store",
  })
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declared) && declared > KERR_ALLOCATION_REGRET_SUMMARY_MAX_BYTES_V530) {
        throw new Error("response-too-large");
      }
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > KERR_ALLOCATION_REGRET_SUMMARY_MAX_BYTES_V530) {
        throw new Error("response-too-large");
      }
      const api = parseKerrAllocationRegretApiV530(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v530-regret-${reason}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(error instanceof Error ? error.message.replace(/^v530-regret-/, "") : null),
          requestCount: 1,
          responseBytes: snapshot.responseBytes,
          summary: null,
        });
      }
      throw error;
    });
  return requestPromise;
}
export const getKerrAllocationRegretSnapshotV530 = () => snapshot;
export function subscribeKerrAllocationRegretV530(listener: () => void) {
  listeners.add(listener);
  const releaseResource = acquireAtlasResource("subscription", "relativity-lab", "v530-regret", {
    owner: "v530-allocation-regret",
    estimatedBytes: 0,
  });
  let released = false;
  return () => {
    if (released) return;
    released = true;
    listeners.delete(listener);
    releaseResource();
  };
}
export function getKerrAllocationRegretTelemetryV530() {
  return Object.freeze({
    listenerCount: listeners.size,
    requestCount: snapshot.requestCount,
    status: snapshot.status,
    sceneRevisionDelta: 0 as const,
    scientificFieldMutationAllowed: false as const,
  });
}
export function resetKerrAllocationRegretClientForTestsV530() {
  if (listeners.size !== 0) throw new Error("v530-regret-listener-leak");
  requestPromise = null;
  snapshot = INITIAL;
}
