"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  parseKerrPolarizationFrequencySensitivityApiV522,
  type KerrPolarizationFrequencySensitivitySummaryV522,
} from "./kerrPolarizationFrequencySensitivityV522";

export type KerrPolarizationFrequencySensitivitySnapshotV522 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrPolarizationFrequencySensitivitySummaryV522 | null;
}>;

const INITIAL: KerrPolarizationFrequencySensitivitySnapshotV522 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrPolarizationFrequencySensitivitySummaryV522> | null = null;
const safeReason = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value)
    ? value
    : "request-failed";
const publish = (next: KerrPolarizationFrequencySensitivitySnapshotV522) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrPolarizationFrequencySensitivitySummaryV522(): Promise<KerrPolarizationFrequencySensitivitySummaryV522> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v522/polarization-sensitivity", {
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
      const api = parseKerrPolarizationFrequencySensitivityApiV522(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v522-sensitivity-${reason}`);
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
              ? error.message.replace(/^v522-sensitivity-/, "")
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

export const getKerrPolarizationFrequencySensitivitySnapshotV522 = () => snapshot;

export function subscribeKerrPolarizationFrequencySensitivityV522(listener: () => void) {
  listeners.add(listener);
  const releaseResource = acquireAtlasResource(
    "subscription",
    "relativity-lab",
    "v522-polarization-frequency-sensitivity",
    { owner: "v522-polarization-frequency-sensitivity", estimatedBytes: 0 },
  );
  let released = false;
  return () => {
    if (released) return;
    released = true;
    listeners.delete(listener);
    releaseResource();
  };
}

export function getKerrPolarizationFrequencySensitivityTelemetryV522() {
  return Object.freeze({
    listenerCount: listeners.size,
    requestCount: snapshot.requestCount,
    status: snapshot.status,
    sceneRevisionDelta: 0 as const,
    scientificFieldMutationAllowed: false as const,
  });
}

export function resetKerrPolarizationFrequencySensitivityClientForTestsV522() {
  if (listeners.size !== 0) throw new Error("v522-sensitivity-listener-leak");
  requestPromise = null;
  snapshot = INITIAL;
}
