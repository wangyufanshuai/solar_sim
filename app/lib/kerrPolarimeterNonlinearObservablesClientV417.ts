"use client";

import {
  parseKerrPolarimeterNonlinearObservablesResponseV417,
  type KerrPolarimeterNonlinearObservablesSummaryV417,
} from "./kerrPolarimeterNonlinearObservablesV417";

export type KerrPolarimeterNonlinearObservablesSnapshotV417 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrPolarimeterNonlinearObservablesSummaryV417 | null;
}>;
const INITIAL = Object.freeze({
  status: "idle" as const,
  reason: null,
  requestCount: 0 as const,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot: KerrPolarimeterNonlinearObservablesSnapshotV417 = INITIAL;
let requestPromise: Promise<KerrPolarimeterNonlinearObservablesSummaryV417> | null = null;
const publish = (next: KerrPolarimeterNonlinearObservablesSnapshotV417) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};
const safe = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";

export function loadKerrPolarimeterNonlinearObservablesSummaryV417(): Promise<KerrPolarimeterNonlinearObservablesSummaryV417> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v417/polarimeter-nonlinear-observables", {
    cache: "no-store",
  })
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > 128 * 1024) throw new Error("response-too-large");
      const result = parseKerrPolarimeterNonlinearObservablesResponseV417(JSON.parse(body));
      if (!response.ok || !result.available || !result.summary) {
        publish({ status: "unavailable", reason: safe(result.reason), requestCount: 1, responseBytes, summary: null });
        throw new Error(`v417-observables-${safe(result.reason)}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary });
      return result.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safe(error instanceof Error ? error.message.replace(/^v417-observables-/, "") : null),
          requestCount: 1,
          responseBytes: snapshot.responseBytes,
          summary: null,
        });
      }
      throw error;
    });
  return requestPromise;
}
export function getKerrPolarimeterNonlinearObservablesSnapshotV417(): KerrPolarimeterNonlinearObservablesSnapshotV417 {
  return snapshot;
}
export function subscribeKerrPolarimeterNonlinearObservablesV417(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function resetKerrPolarimeterNonlinearObservablesClientForTestsV417(): void {
  requestPromise = null;
  snapshot = INITIAL;
  listeners.clear();
}
