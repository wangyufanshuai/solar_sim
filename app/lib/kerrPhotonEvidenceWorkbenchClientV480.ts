"use client";

import {
  parseKerrPhotonEvidenceWorkbenchApiV480,
  type KerrPhotonEvidenceWorkbenchSummaryV480,
} from "./kerrPhotonEvidenceWorkbenchV480";

export type KerrPhotonEvidenceWorkbenchSnapshotV480 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrPhotonEvidenceWorkbenchSummaryV480 | null;
}>;

const INITIAL: KerrPhotonEvidenceWorkbenchSnapshotV480 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrPhotonEvidenceWorkbenchSummaryV480> | null = null;
const safeReason = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrPhotonEvidenceWorkbenchSnapshotV480) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrPhotonEvidenceWorkbenchSummaryV480(): Promise<KerrPhotonEvidenceWorkbenchSummaryV480> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v480/photon-evidence-workbench", {
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
      const api = parseKerrPhotonEvidenceWorkbenchApiV480(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v480-response-${reason}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(
            error instanceof Error ? error.message.replace(/^v480-response-/i, "") : null,
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

export const getKerrPhotonEvidenceWorkbenchSnapshotV480 = () => snapshot;
export function subscribeKerrPhotonEvidenceWorkbenchV480(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function resetKerrPhotonEvidenceWorkbenchClientForTestsV480(): void {
  requestPromise = null;
  snapshot = INITIAL;
  listeners.clear();
}
