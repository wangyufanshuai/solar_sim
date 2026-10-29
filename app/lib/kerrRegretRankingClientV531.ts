"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  parseKerrRegretRankingApiV531,
  type KerrRegretRankingSummaryV531,
} from "./kerrRegretRankingV531";

export const KERR_REGRET_RANKING_SUMMARY_MAX_BYTES_V531 = 128 * 1024;
export type KerrRegretRankingSnapshotV531 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrRegretRankingSummaryV531 | null;
}>;
const INITIAL: KerrRegretRankingSnapshotV531 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrRegretRankingSummaryV531> | null = null;
const safeReason = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrRegretRankingSnapshotV531) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};
export function loadKerrRegretRankingSummaryV531(): Promise<KerrRegretRankingSummaryV531> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v531/regret-ranking", {
    cache: "no-store",
  })
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declared) && declared > KERR_REGRET_RANKING_SUMMARY_MAX_BYTES_V531) {
        throw new Error("response-too-large");
      }
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > KERR_REGRET_RANKING_SUMMARY_MAX_BYTES_V531) {
        throw new Error("response-too-large");
      }
      const api = parseKerrRegretRankingApiV531(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v531-ranking-${reason}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(error instanceof Error ? error.message.replace(/^v531-ranking-/, "") : null),
          requestCount: 1,
          responseBytes: snapshot.responseBytes,
          summary: null,
        });
      }
      throw error;
    });
  return requestPromise;
}
export const getKerrRegretRankingSnapshotV531 = () => snapshot;
export function subscribeKerrRegretRankingV531(listener: () => void) {
  listeners.add(listener);
  const releaseResource = acquireAtlasResource("subscription", "relativity-lab", "v531-ranking", {
    owner: "v531-regret-ranking",
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
export function getKerrRegretRankingTelemetryV531() {
  return Object.freeze({
    listenerCount: listeners.size,
    requestCount: snapshot.requestCount,
    status: snapshot.status,
    sceneRevisionDelta: 0 as const,
    scientificFieldMutationAllowed: false as const,
  });
}
export function resetKerrRegretRankingClientForTestsV531() {
  if (listeners.size !== 0) throw new Error("v531-ranking-listener-leak");
  requestPromise = null;
  snapshot = INITIAL;
}
