"use client";

import {
  parseKerrMeasuredDetectorIntakeApiV458,
  type KerrMeasuredDetectorIntakeSummaryV458,
} from "./kerrMeasuredDetectorIntakeEnvelopeV458";

export type KerrMeasuredDetectorIntakeSnapshotV458 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrMeasuredDetectorIntakeSummaryV458 | null;
}>;

const INITIAL: KerrMeasuredDetectorIntakeSnapshotV458 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrMeasuredDetectorIntakeSummaryV458> | null = null;
const safeReason = (value: unknown): string =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value)
    ? value
    : "request-failed";
const publish = (next: KerrMeasuredDetectorIntakeSnapshotV458): void => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrMeasuredDetectorIntakeSummaryV458(): Promise<KerrMeasuredDetectorIntakeSummaryV458> {
  if (requestPromise) return requestPromise;
  publish({
    status: "loading",
    reason: null,
    requestCount: 1,
    responseBytes: 0,
    summary: null,
  });
  requestPromise = fetch(
    "/api/atlas/relativity-evidence/v458/measured-detector-intake",
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
      const api = parseKerrMeasuredDetectorIntakeApiV458(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({
          status: "unavailable",
          reason,
          requestCount: 1,
          responseBytes,
          summary: null,
        });
        throw new Error(`v458-response-${reason}`);
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
              ? error.message.replace(/^v458-response-/, "")
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

export const getKerrMeasuredDetectorIntakeSnapshotV458 =
  (): KerrMeasuredDetectorIntakeSnapshotV458 => snapshot;
export function subscribeKerrMeasuredDetectorIntakeV458(
  listener: () => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function resetKerrMeasuredDetectorIntakeClientForTestsV458(): void {
  requestPromise = null;
  snapshot = INITIAL;
  listeners.clear();
}
