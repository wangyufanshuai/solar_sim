"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  parseKerrScienceProductEligibilityGraphApiV512,
  type KerrScienceProductEligibilityGraphSummaryV512,
} from "./kerrScienceProductEligibilityGraphV512";

export type KerrScienceProductEligibilityGraphSnapshotV512 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrScienceProductEligibilityGraphSummaryV512 | null;
}>;

const INITIAL: KerrScienceProductEligibilityGraphSnapshotV512 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrScienceProductEligibilityGraphSummaryV512> | null = null;
const safeReason = (value: unknown): string =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value)
    ? value
    : "request-failed";
const publish = (next: KerrScienceProductEligibilityGraphSnapshotV512): void => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrScienceProductEligibilityGraphSummaryV512(): Promise<KerrScienceProductEligibilityGraphSummaryV512> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch(
    "/api/atlas/relativity-evidence/v512/science-product-eligibility",
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
      const api = parseKerrScienceProductEligibilityGraphApiV512(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v512-product-graph-${reason}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(
            error instanceof Error
              ? error.message.replace(/^v512-product-graph-/, "")
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

export const getKerrScienceProductEligibilityGraphSnapshotV512 =
  (): KerrScienceProductEligibilityGraphSnapshotV512 => snapshot;

export function subscribeKerrScienceProductEligibilityGraphV512(
  listener: () => void,
): () => void {
  listeners.add(listener);
  const releaseResource = acquireAtlasResource(
    "subscription",
    "relativity-lab",
    "v512-science-product-eligibility",
    { owner: "v512-science-product", estimatedBytes: 0 },
  );
  let released = false;
  return () => {
    if (released) return;
    released = true;
    listeners.delete(listener);
    releaseResource();
  };
}

export function getKerrScienceProductEligibilityGraphTelemetryV512() {
  return Object.freeze({
    listenerCount: listeners.size,
    requestCount: snapshot.requestCount,
    responseBytes: snapshot.responseBytes,
    status: snapshot.status,
    hasSummary: snapshot.summary !== null,
    sceneRevisionDelta: 0 as const,
    scientificFieldMutationAllowed: false as const,
  });
}

export function resetKerrScienceProductEligibilityGraphClientForTestsV512(): void {
  if (listeners.size !== 0) throw new Error("v512-product-graph-listener-leak-before-reset");
  requestPromise = null;
  snapshot = INITIAL;
}
