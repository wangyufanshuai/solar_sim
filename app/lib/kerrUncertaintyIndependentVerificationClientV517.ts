"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  parseKerrUncertaintyIndependentVerificationApiV517,
  type KerrUncertaintyIndependentVerificationSummaryV517,
} from "./kerrUncertaintyIndependentVerificationV517";

export type KerrUncertaintyIndependentVerificationSnapshotV517 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrUncertaintyIndependentVerificationSummaryV517 | null;
}>;

const INITIAL: KerrUncertaintyIndependentVerificationSnapshotV517 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrUncertaintyIndependentVerificationSummaryV517> | null = null;
const safeReason = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value)
    ? value
    : "request-failed";
const publish = (next: KerrUncertaintyIndependentVerificationSnapshotV517) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrUncertaintyIndependentVerificationSummaryV517(): Promise<KerrUncertaintyIndependentVerificationSummaryV517> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v517/independent-verification", {
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
      const api = parseKerrUncertaintyIndependentVerificationApiV517(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v517-verification-${reason}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(
            error instanceof Error ? error.message.replace(/^v517-verification-/, "") : null,
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

export const getKerrUncertaintyIndependentVerificationSnapshotV517 = () => snapshot;

export function subscribeKerrUncertaintyIndependentVerificationV517(listener: () => void) {
  listeners.add(listener);
  const releaseResource = acquireAtlasResource(
    "subscription",
    "relativity-lab",
    "v517-independent-verification",
    { owner: "v517-independent-verification", estimatedBytes: 0 },
  );
  let released = false;
  return () => {
    if (released) return;
    released = true;
    listeners.delete(listener);
    releaseResource();
  };
}

export function getKerrUncertaintyIndependentVerificationTelemetryV517() {
  return Object.freeze({
    listenerCount: listeners.size,
    requestCount: snapshot.requestCount,
    status: snapshot.status,
    sceneRevisionDelta: 0 as const,
    scientificFieldMutationAllowed: false as const,
  });
}

export function resetKerrUncertaintyIndependentVerificationClientForTestsV517() {
  if (listeners.size !== 0) throw new Error("v517-verification-listener-leak");
  requestPromise = null;
  snapshot = INITIAL;
}
