"use client";

import {
  parseKerrSpectralSensitivityApiV483,
  type KerrSpectralSensitivitySummaryV483,
} from "./kerrSpectralSensitivityModesV483";

export type KerrSpectralSensitivitySnapshotV483 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrSpectralSensitivitySummaryV483 | null;
}>;
const INITIAL: KerrSpectralSensitivitySnapshotV483 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrSpectralSensitivitySummaryV483> | null = null;
const safeReason = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrSpectralSensitivitySnapshotV483) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrSpectralSensitivitySummaryV483(): Promise<KerrSpectralSensitivitySummaryV483> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v483/spectral-sensitivity-modes", {
    cache: "no-store",
  })
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > 128 * 1024) throw new Error("response-too-large");
      const api = parseKerrSpectralSensitivityApiV483(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v483-response-${reason}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(
            error instanceof Error ? error.message.replace(/^v483-response-/i, "") : null,
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

export const getKerrSpectralSensitivitySnapshotV483 = () => snapshot;
export function subscribeKerrSpectralSensitivityV483(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function resetKerrSpectralSensitivityClientForTestsV483(): void {
  requestPromise = null;
  snapshot = INITIAL;
  listeners.clear();
}
