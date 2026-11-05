"use client";

import {
  parseKerrPhotonRadiometryTransferApiV477,
  type KerrPhotonRadiometryTransferSummaryV477,
} from "./kerrPhotonRadiometryTransferV477";

export type KerrPhotonRadiometryTransferSnapshotV477 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrPhotonRadiometryTransferSummaryV477 | null;
}>;

const INITIAL: KerrPhotonRadiometryTransferSnapshotV477 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrPhotonRadiometryTransferSummaryV477> | null = null;
const safeReason = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrPhotonRadiometryTransferSnapshotV477) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrPhotonRadiometryTransferSummaryV477(): Promise<KerrPhotonRadiometryTransferSummaryV477> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v477/photon-radiometry-transfer", {
    cache: "no-store",
  })
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declared) && declared > 128 * 1024) {
        throw new Error("response-too-large");
      }
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > 128 * 1024) throw new Error("response-too-large");
      const api = parseKerrPhotonRadiometryTransferApiV477(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error("v477-response-" + reason);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(
            error instanceof Error ? error.message.replace(/^v477-response-/i, "") : null,
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

export const getKerrPhotonRadiometryTransferSnapshotV477 =
  (): KerrPhotonRadiometryTransferSnapshotV477 => snapshot;

export function subscribeKerrPhotonRadiometryTransferV477(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetKerrPhotonRadiometryTransferClientForTestsV477(): void {
  requestPromise = null;
  snapshot = INITIAL;
  listeners.clear();
}
