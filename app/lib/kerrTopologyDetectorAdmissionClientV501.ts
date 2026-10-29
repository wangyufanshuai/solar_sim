"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  parseKerrTopologyDetectorAdmissionApiV501,
  type KerrTopologyDetectorAdmissionSummaryV501,
} from "./kerrTopologyDetectorAdmissionV501";

export type KerrTopologyDetectorAdmissionSnapshotV501 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrTopologyDetectorAdmissionSummaryV501 | null;
}>;

const INITIAL: KerrTopologyDetectorAdmissionSnapshotV501 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrTopologyDetectorAdmissionSummaryV501> | null = null;
const safeReason = (value: unknown): string =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value)
    ? value
    : "request-failed";
const publish = (next: KerrTopologyDetectorAdmissionSnapshotV501): void => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrTopologyDetectorAdmissionSummaryV501(): Promise<KerrTopologyDetectorAdmissionSummaryV501> {
  if (requestPromise) return requestPromise;
  publish({
    status: "loading",
    reason: null,
    requestCount: 1,
    responseBytes: 0,
    summary: null,
  });
  requestPromise = fetch(
    "/api/atlas/relativity-evidence/v501/topology-detector-admission",
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
      const api = parseKerrTopologyDetectorAdmissionApiV501(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({
          status: "unavailable",
          reason,
          requestCount: 1,
          responseBytes,
          summary: null,
        });
        throw new Error(`v501-response-${reason}`);
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
              ? error.message.replace(/^v501-response-/i, "")
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

export const getKerrTopologyDetectorAdmissionSnapshotV501 =
  (): KerrTopologyDetectorAdmissionSnapshotV501 => snapshot;

export function subscribeKerrTopologyDetectorAdmissionV501(
  listener: () => void,
): () => void {
  listeners.add(listener);
  const releaseResource = acquireAtlasResource(
    "subscription",
    "relativity-lab",
    "topology-detector-admission-evidence",
    { owner: "detector-evidence-v509", estimatedBytes: 0 },
  );
  let released = false;
  return () => {
    if (released) return;
    released = true;
    listeners.delete(listener);
    releaseResource();
  };
}

export function getKerrTopologyDetectorAdmissionTelemetryV509() {
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

export function resetKerrTopologyDetectorAdmissionClientForTestsV501(): void {
  if (listeners.size !== 0) throw new Error("v509-admission-listener-leak-before-reset");
  requestPromise = null;
  snapshot = INITIAL;
}
