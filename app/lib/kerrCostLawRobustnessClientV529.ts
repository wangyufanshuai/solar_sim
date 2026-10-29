"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  parseKerrCostLawRobustnessApiV529,
  type KerrCostLawRobustnessSummaryV529,
} from "./kerrCostLawRobustnessV529";

export const KERR_COST_LAW_ROBUSTNESS_SUMMARY_MAX_BYTES_V529 = 128 * 1024;
export type KerrCostLawRobustnessSnapshotV529 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrCostLawRobustnessSummaryV529 | null;
}>;
const INITIAL: KerrCostLawRobustnessSnapshotV529 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrCostLawRobustnessSummaryV529> | null = null;
const safeReason = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrCostLawRobustnessSnapshotV529) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};
export function loadKerrCostLawRobustnessSummaryV529(): Promise<KerrCostLawRobustnessSummaryV529> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v529/cost-law-robustness", {
    cache: "no-store",
  })
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (
        Number.isFinite(declared) &&
        declared > KERR_COST_LAW_ROBUSTNESS_SUMMARY_MAX_BYTES_V529
      ) {
        throw new Error("response-too-large");
      }
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > KERR_COST_LAW_ROBUSTNESS_SUMMARY_MAX_BYTES_V529) {
        throw new Error("response-too-large");
      }
      const api = parseKerrCostLawRobustnessApiV529(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v529-cost-law-${reason}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(error instanceof Error ? error.message.replace(/^v529-cost-law-/, "") : null),
          requestCount: 1,
          responseBytes: snapshot.responseBytes,
          summary: null,
        });
      }
      throw error;
    });
  return requestPromise;
}
export const getKerrCostLawRobustnessSnapshotV529 = () => snapshot;
export function subscribeKerrCostLawRobustnessV529(listener: () => void) {
  listeners.add(listener);
  const releaseResource = acquireAtlasResource(
    "subscription",
    "relativity-lab",
    "v529-cost-law-robustness",
    { owner: "v529-cost-law-robustness", estimatedBytes: 0 },
  );
  let released = false;
  return () => {
    if (released) return;
    released = true;
    listeners.delete(listener);
    releaseResource();
  };
}
export function getKerrCostLawRobustnessTelemetryV529() {
  return Object.freeze({
    listenerCount: listeners.size,
    requestCount: snapshot.requestCount,
    status: snapshot.status,
    sceneRevisionDelta: 0 as const,
    scientificFieldMutationAllowed: false as const,
  });
}
export function resetKerrCostLawRobustnessClientForTestsV529() {
  if (listeners.size !== 0) throw new Error("v529-cost-law-listener-leak");
  requestPromise = null;
  snapshot = INITIAL;
}
