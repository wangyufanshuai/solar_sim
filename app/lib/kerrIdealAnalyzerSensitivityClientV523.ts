"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  parseKerrIdealAnalyzerSensitivityApiV523,
  type KerrIdealAnalyzerSensitivitySummaryV523,
} from "./kerrIdealAnalyzerSensitivityV523";

export type KerrIdealAnalyzerSensitivitySnapshotV523 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrIdealAnalyzerSensitivitySummaryV523 | null;
}>;

const INITIAL: KerrIdealAnalyzerSensitivitySnapshotV523 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrIdealAnalyzerSensitivitySummaryV523> | null = null;
const safeReason = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value)
    ? value
    : "request-failed";
const publish = (next: KerrIdealAnalyzerSensitivitySnapshotV523) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrIdealAnalyzerSensitivitySummaryV523(): Promise<KerrIdealAnalyzerSensitivitySummaryV523> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v523/ideal-analyzer", {
    cache: "no-store",
  })
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declared) && declared > 128 * 1024) {
        throw new Error("response-too-large");
      }
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > 128 * 1024) throw new Error("response-too-large");
      const api = parseKerrIdealAnalyzerSensitivityApiV523(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v523-analyzer-${reason}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(
            error instanceof Error ? error.message.replace(/^v523-analyzer-/, "") : null,
          ),
          requestCount: 1,
          responseBytes: snapshot.responseBytes,
          summary: null,
        });
      }
      throw error;
    });
  return requestPromise;
}

export const getKerrIdealAnalyzerSensitivitySnapshotV523 = () => snapshot;

export function subscribeKerrIdealAnalyzerSensitivityV523(listener: () => void) {
  listeners.add(listener);
  const releaseResource = acquireAtlasResource(
    "subscription",
    "relativity-lab",
    "v523-ideal-analyzer-sensitivity",
    { owner: "v523-ideal-analyzer-sensitivity", estimatedBytes: 0 },
  );
  let released = false;
  return () => {
    if (released) return;
    released = true;
    listeners.delete(listener);
    releaseResource();
  };
}

export function getKerrIdealAnalyzerSensitivityTelemetryV523() {
  return Object.freeze({
    listenerCount: listeners.size,
    requestCount: snapshot.requestCount,
    status: snapshot.status,
    sceneRevisionDelta: 0 as const,
    scientificFieldMutationAllowed: false as const,
  });
}

export function resetKerrIdealAnalyzerSensitivityClientForTestsV523() {
  if (listeners.size !== 0) throw new Error("v523-analyzer-listener-leak");
  requestPromise = null;
  snapshot = INITIAL;
}
