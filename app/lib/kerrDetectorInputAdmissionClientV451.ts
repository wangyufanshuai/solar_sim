"use client";

import {
  parseKerrDetectorInputAdmissionApiV451,
  type KerrDetectorInputAdmissionSummaryV451,
} from "./kerrDetectorInputAdmissionV451";

export type KerrDetectorInputAdmissionSnapshotV451 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrDetectorInputAdmissionSummaryV451 | null;
}>;

const INITIAL: KerrDetectorInputAdmissionSnapshotV451 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrDetectorInputAdmissionSummaryV451> | null = null;
const safeReason = (value: unknown): string =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value)
    ? value
    : "request-failed";
const publish = (next: KerrDetectorInputAdmissionSnapshotV451): void => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrDetectorInputAdmissionSummaryV451(): Promise<KerrDetectorInputAdmissionSummaryV451> {
  if (requestPromise) return requestPromise;
  publish({
    status: "loading",
    reason: null,
    requestCount: 1,
    responseBytes: 0,
    summary: null,
  });
  requestPromise = fetch(
    "/api/atlas/relativity-evidence/v451/detector-admission",
    { cache: "no-store" },
  )
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declared) && declared > 128 * 1024) {
        throw new Error("response-too-large");
      }
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > 128 * 1024) throw new Error("response-too-large");
      const api = parseKerrDetectorInputAdmissionApiV451(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({
          status: "unavailable",
          reason,
          requestCount: 1,
          responseBytes,
          summary: null,
        });
        throw new Error(`v451-response-${reason}`);
      }
      publish({
        status: "ready",
        reason: null,
        requestCount: 1,
        responseBytes,
        summary: api.summary,
      });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(
            error instanceof Error
              ? error.message.replace(/^v451-response-/, "")
              : null,
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

export const getKerrDetectorInputAdmissionSnapshotV451 =
  (): KerrDetectorInputAdmissionSnapshotV451 => snapshot;
export function subscribeKerrDetectorInputAdmissionV451(
  listener: () => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function resetKerrDetectorInputAdmissionClientForTestsV451(): void {
  requestPromise = null;
  snapshot = INITIAL;
  listeners.clear();
}
