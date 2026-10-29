"use client";

import {
  parseKerrDetectorExpectedImageApiV450,
  type KerrDetectorExpectedImageSummaryV450,
} from "./kerrDetectorExpectedImageFormationV450";

export type KerrDetectorExpectedImageSnapshotV450 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrDetectorExpectedImageSummaryV450 | null;
}>;

const INITIAL: KerrDetectorExpectedImageSnapshotV450 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrDetectorExpectedImageSummaryV450> | null = null;

const safeReason = (value: unknown): string =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value)
    ? value
    : "request-failed";
const publish = (next: KerrDetectorExpectedImageSnapshotV450): void => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrDetectorExpectedImageSummaryV450(): Promise<KerrDetectorExpectedImageSummaryV450> {
  if (requestPromise) return requestPromise;
  publish({
    status: "loading",
    reason: null,
    requestCount: 1,
    responseBytes: 0,
    summary: null,
  });
  requestPromise = fetch(
    "/api/atlas/relativity-evidence/v450/expected-image-formation",
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
      const parsed = parseKerrDetectorExpectedImageApiV450(JSON.parse(body));
      if (!response.ok || !parsed.available || !parsed.summary) {
        const reason = safeReason(parsed.reason);
        publish({
          status: "unavailable",
          reason,
          requestCount: 1,
          responseBytes,
          summary: null,
        });
        throw new Error(`v450-response-${reason}`);
      }
      publish({
        status: "ready",
        reason: null,
        requestCount: 1,
        responseBytes,
        summary: parsed.summary,
      });
      return parsed.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(
            error instanceof Error
              ? error.message.replace(/^v450-response-/, "")
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

export const getKerrDetectorExpectedImageSnapshotV450 =
  (): KerrDetectorExpectedImageSnapshotV450 => snapshot;
export function subscribeKerrDetectorExpectedImageV450(
  listener: () => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function resetKerrDetectorExpectedImageClientForTestsV450(): void {
  requestPromise = null;
  snapshot = INITIAL;
  listeners.clear();
}
