"use client";

import {
  parseKerrPolarimeterDetectorLikelihoodResponseV415,
  type KerrPolarimeterDetectorLikelihoodSummaryV415,
} from "./kerrPolarimeterDetectorLikelihoodV415";

export type KerrPolarimeterDetectorLikelihoodSnapshotV415 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrPolarimeterDetectorLikelihoodSummaryV415 | null;
}>;

const INITIAL = Object.freeze({
  status: "idle" as const,
  reason: null,
  requestCount: 0 as const,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot: KerrPolarimeterDetectorLikelihoodSnapshotV415 = INITIAL;
let requestPromise: Promise<KerrPolarimeterDetectorLikelihoodSummaryV415> | null = null;
const publish = (next: KerrPolarimeterDetectorLikelihoodSnapshotV415) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};
const safe = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";

export function loadKerrPolarimeterDetectorLikelihoodSummaryV415(): Promise<KerrPolarimeterDetectorLikelihoodSummaryV415> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v415/polarimeter-detector-likelihood", {
    cache: "no-store",
  })
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > 128 * 1024) throw new Error("response-too-large");
      const result = parseKerrPolarimeterDetectorLikelihoodResponseV415(JSON.parse(body));
      if (!response.ok || !result.available || !result.summary) {
        publish({
          status: "unavailable",
          reason: safe(result.reason),
          requestCount: 1,
          responseBytes,
          summary: null,
        });
        throw new Error(`v415-likelihood-${safe(result.reason)}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary });
      return result.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safe(error instanceof Error ? error.message.replace(/^v415-likelihood-/, "") : null),
          requestCount: 1,
          responseBytes: snapshot.responseBytes,
          summary: null,
        });
      }
      throw error;
    });
  return requestPromise;
}

export function getKerrPolarimeterDetectorLikelihoodSnapshotV415(): KerrPolarimeterDetectorLikelihoodSnapshotV415 {
  return snapshot;
}

export function subscribeKerrPolarimeterDetectorLikelihoodV415(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetKerrPolarimeterDetectorLikelihoodClientForTestsV415(): void {
  requestPromise = null;
  snapshot = INITIAL;
  listeners.clear();
}
