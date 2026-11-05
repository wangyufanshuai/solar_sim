"use client";

import {
  ATLAS_OBSERVATION_LIFECYCLE_SUMMARY_MAXIMUM_RESPONSE_BYTES_V404,
  parseRelativityLifecycleEvidenceResponseV404,
  type AtlasObservationLifecycleReplaySummaryV404,
} from "./atlasObservationLifecycleReplaySummaryV404";

export type RelativityLifecycleEvidenceClientStatusV404 = "idle" | "loading" | "ready" | "unavailable";
export type RelativityLifecycleEvidenceClientSnapshotV404 = Readonly<{
  status: RelativityLifecycleEvidenceClientStatusV404;
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: AtlasObservationLifecycleReplaySummaryV404 | null;
}>;

const INITIAL_SNAPSHOT = Object.freeze({
  status: "idle" as const,
  reason: null,
  requestCount: 0 as const,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot: RelativityLifecycleEvidenceClientSnapshotV404 = INITIAL_SNAPSHOT;
let requestPromise: Promise<AtlasObservationLifecycleReplaySummaryV404> | null = null;

function publish(next: RelativityLifecycleEvidenceClientSnapshotV404): void {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
}

function safeReason(value: unknown): string {
  return typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
}

export function loadRelativityLifecycleEvidenceV404(): Promise<AtlasObservationLifecycleReplaySummaryV404> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v404/lifecycle-summary", { cache: "no-store" })
    .then(async (response) => {
      const declaredBytes = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declaredBytes) && declaredBytes > ATLAS_OBSERVATION_LIFECYCLE_SUMMARY_MAXIMUM_RESPONSE_BYTES_V404) {
        throw new Error("response-too-large");
      }
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > ATLAS_OBSERVATION_LIFECYCLE_SUMMARY_MAXIMUM_RESPONSE_BYTES_V404) {
        throw new Error("response-too-large");
      }
      const result = parseRelativityLifecycleEvidenceResponseV404(JSON.parse(body));
      if (!response.ok || !result.available || !result.summary) {
        publish({ status: "unavailable", reason: safeReason(result.reason), requestCount: 1, responseBytes, summary: null });
        throw new Error(`v404-lifecycle-evidence-${safeReason(result.reason)}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary });
      return result.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(error instanceof Error ? error.message.replace(/^v404-lifecycle-evidence-/, "") : null),
          requestCount: 1,
          responseBytes: snapshot.responseBytes,
          summary: null,
        });
      }
      throw error;
    });
  return requestPromise;
}

export function getRelativityLifecycleEvidenceSnapshotV404(): RelativityLifecycleEvidenceClientSnapshotV404 {
  return snapshot;
}

export function subscribeRelativityLifecycleEvidenceV404(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetRelativityLifecycleEvidenceClientForTestsV404(): void {
  requestPromise = null;
  snapshot = INITIAL_SNAPSHOT;
  listeners.clear();
}
