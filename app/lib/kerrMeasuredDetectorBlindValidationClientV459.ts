"use client";

import {
  parseKerrMeasuredDetectorBlindValidationApiV459,
  type KerrMeasuredDetectorBlindValidationSummaryV459,
} from "./kerrMeasuredDetectorBlindValidationV459";

export type KerrMeasuredDetectorBlindValidationSnapshotV459 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrMeasuredDetectorBlindValidationSummaryV459 | null;
}>;
const INITIAL: KerrMeasuredDetectorBlindValidationSnapshotV459 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrMeasuredDetectorBlindValidationSummaryV459> | null = null;
const safeReason = (value: unknown): string =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value)
    ? value
    : "request-failed";
const publish = (next: KerrMeasuredDetectorBlindValidationSnapshotV459): void => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrMeasuredDetectorBlindValidationSummaryV459(): Promise<KerrMeasuredDetectorBlindValidationSummaryV459> {
  if (requestPromise) return requestPromise;
  publish({
    status: "loading",
    reason: null,
    requestCount: 1,
    responseBytes: 0,
    summary: null,
  });
  requestPromise = fetch(
    "/api/atlas/relativity-evidence/v459/measured-detector-blind-validation",
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
      const api = parseKerrMeasuredDetectorBlindValidationApiV459(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v459-response-${reason}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(
            error instanceof Error ? error.message.replace(/^v459-response-/, "") : null,
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

export const getKerrMeasuredDetectorBlindValidationSnapshotV459 =
  (): KerrMeasuredDetectorBlindValidationSnapshotV459 => snapshot;
export function subscribeKerrMeasuredDetectorBlindValidationV459(
  listener: () => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function resetKerrMeasuredDetectorBlindValidationClientForTestsV459(): void {
  requestPromise = null;
  snapshot = INITIAL;
  listeners.clear();
}
