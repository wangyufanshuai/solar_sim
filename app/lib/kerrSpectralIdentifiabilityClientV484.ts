"use client";

import {
  parseKerrSpectralIdentifiabilityApiV484,
  type KerrSpectralIdentifiabilitySummaryV484,
} from "./kerrSpectralIdentifiabilityV484";

export type KerrSpectralIdentifiabilitySnapshotV484 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrSpectralIdentifiabilitySummaryV484 | null;
}>;
const INITIAL: KerrSpectralIdentifiabilitySnapshotV484 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrSpectralIdentifiabilitySummaryV484> | null = null;
const safeReason = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrSpectralIdentifiabilitySnapshotV484) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrSpectralIdentifiabilitySummaryV484(): Promise<KerrSpectralIdentifiabilitySummaryV484> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v484/spectral-identifiability", {
    cache: "no-store",
  })
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > 128 * 1024) throw new Error("response-too-large");
      const api = parseKerrSpectralIdentifiabilityApiV484(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v484-response-${reason}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(
            error instanceof Error ? error.message.replace(/^v484-response-/i, "") : null,
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

export const getKerrSpectralIdentifiabilitySnapshotV484 = () => snapshot;
export function subscribeKerrSpectralIdentifiabilityV484(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function resetKerrSpectralIdentifiabilityClientForTestsV484(): void {
  requestPromise = null;
  snapshot = INITIAL;
  listeners.clear();
}
