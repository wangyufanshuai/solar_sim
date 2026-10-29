"use client";

import {
  parseKerrScienceProductAdmissionApiV476,
  type KerrScienceProductAdmissionSummaryV476,
} from "./kerrScienceProductAdmissionV476";

export type KerrScienceProductAdmissionSnapshotV476 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrScienceProductAdmissionSummaryV476 | null;
}>;

const INITIAL: KerrScienceProductAdmissionSnapshotV476 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrScienceProductAdmissionSummaryV476> | null = null;
const safeReason = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrScienceProductAdmissionSnapshotV476) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrScienceProductAdmissionSummaryV476(): Promise<KerrScienceProductAdmissionSummaryV476> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v476/science-product-admission", {
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
      const api = parseKerrScienceProductAdmissionApiV476(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error("v476-response-" + reason);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(
            error instanceof Error ? error.message.replace(/^v476-response-/i, "") : null,
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

export const getKerrScienceProductAdmissionSnapshotV476 =
  (): KerrScienceProductAdmissionSnapshotV476 => snapshot;

export function subscribeKerrScienceProductAdmissionV476(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetKerrScienceProductAdmissionClientForTestsV476(): void {
  requestPromise = null;
  snapshot = INITIAL;
  listeners.clear();
}
