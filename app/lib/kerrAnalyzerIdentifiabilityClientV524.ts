"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  parseKerrAnalyzerIdentifiabilityApiV524,
  type KerrAnalyzerIdentifiabilitySummaryV524,
} from "./kerrAnalyzerIdentifiabilityV524";

export const KERR_ANALYZER_IDENTIFIABILITY_SUMMARY_MAX_BYTES_V524 = 128 * 1024;
export type KerrAnalyzerIdentifiabilitySnapshotV524 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrAnalyzerIdentifiabilitySummaryV524 | null;
}>;

const INITIAL: KerrAnalyzerIdentifiabilitySnapshotV524 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrAnalyzerIdentifiabilitySummaryV524> | null = null;
const safeReason = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value)
    ? value
    : "request-failed";
const publish = (next: KerrAnalyzerIdentifiabilitySnapshotV524) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrAnalyzerIdentifiabilitySummaryV524(): Promise<KerrAnalyzerIdentifiabilitySummaryV524> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch(
    "/api/atlas/relativity-evidence/v524/analyzer-identifiability",
    { cache: "no-store" },
  )
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (
        Number.isFinite(declared)
        && declared > KERR_ANALYZER_IDENTIFIABILITY_SUMMARY_MAX_BYTES_V524
      ) {
        throw new Error("response-too-large");
      }
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > KERR_ANALYZER_IDENTIFIABILITY_SUMMARY_MAX_BYTES_V524) {
        throw new Error("response-too-large");
      }
      const api = parseKerrAnalyzerIdentifiabilityApiV524(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v524-identifiability-${reason}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(
            error instanceof Error
              ? error.message.replace(/^v524-identifiability-/, "")
              : null,
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

export const getKerrAnalyzerIdentifiabilitySnapshotV524 = () => snapshot;

export function subscribeKerrAnalyzerIdentifiabilityV524(listener: () => void) {
  listeners.add(listener);
  const releaseResource = acquireAtlasResource(
    "subscription",
    "relativity-lab",
    "v524-analyzer-identifiability",
    { owner: "v524-analyzer-identifiability", estimatedBytes: 0 },
  );
  let released = false;
  return () => {
    if (released) return;
    released = true;
    listeners.delete(listener);
    releaseResource();
  };
}

export function getKerrAnalyzerIdentifiabilityTelemetryV524() {
  return Object.freeze({
    listenerCount: listeners.size,
    requestCount: snapshot.requestCount,
    status: snapshot.status,
    sceneRevisionDelta: 0 as const,
    scientificFieldMutationAllowed: false as const,
  });
}

export function resetKerrAnalyzerIdentifiabilityClientForTestsV524() {
  if (listeners.size !== 0) throw new Error("v524-identifiability-listener-leak");
  requestPromise = null;
  snapshot = INITIAL;
}
