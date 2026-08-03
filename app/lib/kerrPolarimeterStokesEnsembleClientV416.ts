"use client";

import {
  parseKerrPolarimeterStokesEnsembleResponseV416,
  type KerrPolarimeterStokesEnsembleSummaryV416,
} from "./kerrPolarimeterStokesEnsembleV416";

export type KerrPolarimeterStokesEnsembleSnapshotV416 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrPolarimeterStokesEnsembleSummaryV416 | null;
}>;
const INITIAL = Object.freeze({
  status: "idle" as const,
  reason: null,
  requestCount: 0 as const,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot: KerrPolarimeterStokesEnsembleSnapshotV416 = INITIAL;
let requestPromise: Promise<KerrPolarimeterStokesEnsembleSummaryV416> | null = null;
const publish = (next: KerrPolarimeterStokesEnsembleSnapshotV416) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};
const safe = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";

export function loadKerrPolarimeterStokesEnsembleSummaryV416(): Promise<KerrPolarimeterStokesEnsembleSummaryV416> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v416/polarimeter-stokes-ensemble", { cache: "no-store" })
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > 128 * 1024) throw new Error("response-too-large");
      const result = parseKerrPolarimeterStokesEnsembleResponseV416(JSON.parse(body));
      if (!response.ok || !result.available || !result.summary) {
        publish({ status: "unavailable", reason: safe(result.reason), requestCount: 1, responseBytes, summary: null });
        throw new Error(`v416-ensemble-${safe(result.reason)}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary });
      return result.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safe(error instanceof Error ? error.message.replace(/^v416-ensemble-/, "") : null),
          requestCount: 1,
          responseBytes: snapshot.responseBytes,
          summary: null,
        });
      }
      throw error;
    });
  return requestPromise;
}

export function getKerrPolarimeterStokesEnsembleSnapshotV416(): KerrPolarimeterStokesEnsembleSnapshotV416 {
  return snapshot;
}
export function subscribeKerrPolarimeterStokesEnsembleV416(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function resetKerrPolarimeterStokesEnsembleClientForTestsV416(): void {
  requestPromise = null;
  snapshot = INITIAL;
  listeners.clear();
}
