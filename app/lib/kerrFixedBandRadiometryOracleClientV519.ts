"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  parseKerrFixedBandRadiometryOracleApiV519,
  type KerrFixedBandRadiometryOracleSummaryV519,
} from "./kerrFixedBandRadiometryOracleV519";

export type KerrFixedBandRadiometryOracleSnapshotV519 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrFixedBandRadiometryOracleSummaryV519 | null;
}>;

const INITIAL: KerrFixedBandRadiometryOracleSnapshotV519 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrFixedBandRadiometryOracleSummaryV519> | null = null;
const safeReason = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value)
    ? value
    : "request-failed";
const publish = (next: KerrFixedBandRadiometryOracleSnapshotV519) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrFixedBandRadiometryOracleSummaryV519(): Promise<KerrFixedBandRadiometryOracleSummaryV519> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v519/radiometry-oracle", {
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
      const api = parseKerrFixedBandRadiometryOracleApiV519(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v519-radiometry-${reason}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(
            error instanceof Error ? error.message.replace(/^v519-radiometry-/, "") : null,
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

export const getKerrFixedBandRadiometryOracleSnapshotV519 = () => snapshot;

export function subscribeKerrFixedBandRadiometryOracleV519(listener: () => void) {
  listeners.add(listener);
  const releaseResource = acquireAtlasResource(
    "subscription",
    "relativity-lab",
    "v519-fixed-band-radiometry-oracle",
    { owner: "v519-fixed-band-radiometry-oracle", estimatedBytes: 0 },
  );
  let released = false;
  return () => {
    if (released) return;
    released = true;
    listeners.delete(listener);
    releaseResource();
  };
}

export function getKerrFixedBandRadiometryOracleTelemetryV519() {
  return Object.freeze({
    listenerCount: listeners.size,
    requestCount: snapshot.requestCount,
    status: snapshot.status,
    sceneRevisionDelta: 0 as const,
    scientificFieldMutationAllowed: false as const,
  });
}

export function resetKerrFixedBandRadiometryOracleClientForTestsV519() {
  if (listeners.size !== 0) throw new Error("v519-radiometry-listener-leak");
  requestPromise = null;
  snapshot = INITIAL;
}
