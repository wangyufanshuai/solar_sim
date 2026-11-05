"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  parseKerrInstrumentAuthorityMatrixApiV511,
  type KerrInstrumentAuthorityMatrixSummaryV511,
} from "./kerrInstrumentAuthorityMatrixV511";

export type KerrInstrumentAuthorityMatrixSnapshotV511 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrInstrumentAuthorityMatrixSummaryV511 | null;
}>;

const INITIAL: KerrInstrumentAuthorityMatrixSnapshotV511 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrInstrumentAuthorityMatrixSummaryV511> | null = null;
const safeReason = (value: unknown): string =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value)
    ? value
    : "request-failed";
const publish = (next: KerrInstrumentAuthorityMatrixSnapshotV511): void => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrInstrumentAuthorityMatrixSummaryV511(): Promise<KerrInstrumentAuthorityMatrixSummaryV511> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch(
    "/api/atlas/relativity-evidence/v511/instrument-authority-matrix",
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
      const api = parseKerrInstrumentAuthorityMatrixApiV511(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v511-matrix-${reason}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(
            error instanceof Error ? error.message.replace(/^v511-matrix-/, "") : null,
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

export const getKerrInstrumentAuthorityMatrixSnapshotV511 =
  (): KerrInstrumentAuthorityMatrixSnapshotV511 => snapshot;

export function subscribeKerrInstrumentAuthorityMatrixV511(
  listener: () => void,
): () => void {
  listeners.add(listener);
  const releaseResource = acquireAtlasResource(
    "subscription",
    "relativity-lab",
    "v511-instrument-authority-matrix",
    { owner: "v511-instrument-authority", estimatedBytes: 0 },
  );
  let released = false;
  return () => {
    if (released) return;
    released = true;
    listeners.delete(listener);
    releaseResource();
  };
}

export function getKerrInstrumentAuthorityMatrixTelemetryV511() {
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

export function resetKerrInstrumentAuthorityMatrixClientForTestsV511(): void {
  if (listeners.size !== 0) throw new Error("v511-matrix-listener-leak-before-reset");
  requestPromise = null;
  snapshot = INITIAL;
}
