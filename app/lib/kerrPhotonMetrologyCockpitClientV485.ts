"use client";

import {
  parseKerrPhotonMetrologyCockpitApiV485,
  type KerrPhotonMetrologyCockpitSummaryV485,
} from "./kerrPhotonMetrologyCockpitV485";

export type KerrPhotonMetrologyCockpitSnapshotV485 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrPhotonMetrologyCockpitSummaryV485 | null;
}>;
const INITIAL: KerrPhotonMetrologyCockpitSnapshotV485 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrPhotonMetrologyCockpitSummaryV485> | null = null;
const safeReason = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrPhotonMetrologyCockpitSnapshotV485) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrPhotonMetrologyCockpitSummaryV485(): Promise<KerrPhotonMetrologyCockpitSummaryV485> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v485/photon-metrology-cockpit", {
    cache: "no-store",
  })
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > 128 * 1024) throw new Error("response-too-large");
      const api = parseKerrPhotonMetrologyCockpitApiV485(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v485-response-${reason}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(
            error instanceof Error ? error.message.replace(/^v485-response-/i, "") : null,
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

export const getKerrPhotonMetrologyCockpitSnapshotV485 = () => snapshot;
export function subscribeKerrPhotonMetrologyCockpitV485(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function resetKerrPhotonMetrologyCockpitClientForTestsV485(): void {
  requestPromise = null;
  snapshot = INITIAL;
  listeners.clear();
}
