"use client";

import {
  parseKerrSpectralLandmarkCovarianceApiV482,
  type KerrSpectralLandmarkCovarianceSummaryV482,
} from "./kerrSpectralLandmarkCovarianceV482";

export type KerrSpectralLandmarkCovarianceSnapshotV482 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrSpectralLandmarkCovarianceSummaryV482 | null;
}>;
const INITIAL: KerrSpectralLandmarkCovarianceSnapshotV482 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrSpectralLandmarkCovarianceSummaryV482> | null = null;
const safeReason = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrSpectralLandmarkCovarianceSnapshotV482) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrSpectralLandmarkCovarianceSummaryV482(): Promise<KerrSpectralLandmarkCovarianceSummaryV482> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v482/spectral-landmark-covariance", {
    cache: "no-store",
  })
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > 128 * 1024) throw new Error("response-too-large");
      const api = parseKerrSpectralLandmarkCovarianceApiV482(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v482-response-${reason}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(
            error instanceof Error ? error.message.replace(/^v482-response-/i, "") : null,
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

export const getKerrSpectralLandmarkCovarianceSnapshotV482 = () => snapshot;
export function subscribeKerrSpectralLandmarkCovarianceV482(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function resetKerrSpectralLandmarkCovarianceClientForTestsV482(): void {
  requestPromise = null;
  snapshot = INITIAL;
  listeners.clear();
}
