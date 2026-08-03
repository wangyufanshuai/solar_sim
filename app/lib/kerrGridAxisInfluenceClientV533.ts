"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  parseKerrGridAxisInfluenceApiV533,
  type KerrGridAxisInfluenceSummaryV533,
} from "./kerrGridAxisInfluenceV533";

export const KERR_GRID_AXIS_INFLUENCE_SUMMARY_MAX_BYTES_V533 = 128 * 1024;

type Snapshot = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrGridAxisInfluenceSummaryV533 | null;
}>;

const INITIAL: Snapshot = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot: Snapshot = INITIAL;
let requestPromise: Promise<KerrGridAxisInfluenceSummaryV533> | null = null;

const publish = (next: Snapshot) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrGridAxisInfluenceSummaryV533(): Promise<KerrGridAxisInfluenceSummaryV533> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v533/grid-axis-influence", { cache: "no-store" })
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declared) && declared > KERR_GRID_AXIS_INFLUENCE_SUMMARY_MAX_BYTES_V533) {
        throw new Error("response-too-large");
      }
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > KERR_GRID_AXIS_INFLUENCE_SUMMARY_MAX_BYTES_V533) {
        throw new Error("response-too-large");
      }
      const api = parseKerrGridAxisInfluenceApiV533(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) throw new Error(`v533-grid-axis-${api.reason}`);
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      publish({
        status: "unavailable",
        reason: error instanceof Error ? error.message : "request-failed",
        requestCount: 1,
        responseBytes: snapshot.responseBytes,
        summary: null,
      });
      throw error;
    });
  return requestPromise;
}

export const getKerrGridAxisInfluenceSnapshotV533 = () => snapshot;

export function subscribeKerrGridAxisInfluenceV533(listener: () => void): () => void {
  listeners.add(listener);
  const release = acquireAtlasResource("subscription", "relativity-lab", "v533-grid-axis-influence", {
    owner: "v533-grid-axis-influence",
    estimatedBytes: 0,
  });
  let done = false;
  return () => {
    if (done) return;
    done = true;
    listeners.delete(listener);
    release();
  };
}

export function getKerrGridAxisInfluenceTelemetryV533() {
  return Object.freeze({
    listenerCount: listeners.size,
    requestCount: snapshot.requestCount,
    status: snapshot.status,
    sceneRevisionDelta: 0 as const,
    scientificFieldMutationAllowed: false as const,
  });
}

export function resetKerrGridAxisInfluenceClientForTestsV533(): void {
  if (listeners.size) throw new Error("v533-listener-leak");
  snapshot = INITIAL;
  requestPromise = null;
}
