"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  parseKerrMeasuredCalibrationReadinessApiV503,
  type KerrMeasuredCalibrationReadinessSummaryV503,
} from "./kerrMeasuredCalibrationReadinessV503";
import {
  parseKerrMeasuredCalibrationPreflightApiV504,
  type KerrMeasuredCalibrationPreflightSummaryV504,
} from "./kerrMeasuredCalibrationPreflightV504";

export type AtlasCalibrationEvidenceSnapshotV508<T> = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: T | null;
}>;

type ParsedApi<T> = Readonly<{
  available: boolean;
  reason: string;
  summary: T | null;
}>;

function createEvidenceChannelV508<T>(
  id: "readiness" | "preflight",
  url: string,
  parseApi: (value: unknown) => ParsedApi<T>,
) {
  const initial: AtlasCalibrationEvidenceSnapshotV508<T> = Object.freeze({
    status: "idle",
    reason: null,
    requestCount: 0,
    responseBytes: 0,
    summary: null,
  });
  const listeners = new Set<() => void>();
  let snapshot = initial;
  let requestPromise: Promise<T> | null = null;
  const safeReason = (value: unknown): string =>
    typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value)
      ? value
      : "request-failed";
  const publish = (next: AtlasCalibrationEvidenceSnapshotV508<T>) => {
    snapshot = Object.freeze(next);
    listeners.forEach((listener) => listener());
  };
  return Object.freeze({
    getSnapshot: (): AtlasCalibrationEvidenceSnapshotV508<T> => snapshot,
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener);
      const releaseResource = acquireAtlasResource(
        "subscription",
        "relativity-lab",
        `calibration-evidence-${id}`,
        { owner: "calibration-evidence-v508", estimatedBytes: 0 },
      );
      let released = false;
      return () => {
        if (released) return;
        released = true;
        listeners.delete(listener);
        releaseResource();
      };
    },
    load: (): Promise<T> => {
      if (requestPromise) return requestPromise;
      publish({
        status: "loading",
        reason: null,
        requestCount: 1,
        responseBytes: 0,
        summary: null,
      });
      requestPromise = fetch(url, { cache: "no-store" })
        .then(async (response) => {
          const declared = Number(response.headers.get("Content-Length"));
          if (Number.isFinite(declared) && declared > 128 * 1024) {
            throw new Error("response-too-large");
          }
          const body = await response.text();
          const responseBytes = new TextEncoder().encode(body).byteLength;
          if (responseBytes > 128 * 1024) throw new Error("response-too-large");
          const api = parseApi(JSON.parse(body));
          if (!response.ok || !api.available || !api.summary) {
            const reason = safeReason(api.reason);
            publish({
              status: "unavailable",
              reason,
              requestCount: 1,
              responseBytes,
              summary: null,
            });
            throw new Error(`v508-${id}-${reason}`);
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
            const reason = safeReason(
              error instanceof Error
                ? error.message.replace(new RegExp(`^v508-${id}-`), "")
                : null,
            );
            publish({
              status: "unavailable",
              reason,
              requestCount: 1,
              responseBytes: snapshot.responseBytes,
              summary: null,
            });
          }
          throw error;
        });
      return requestPromise;
    },
    telemetry: () =>
      Object.freeze({
        listenerCount: listeners.size,
        requestCount: snapshot.requestCount,
        responseBytes: snapshot.responseBytes,
        status: snapshot.status,
        hasSummary: snapshot.summary !== null,
      }),
    resetForTests: () => {
      if (listeners.size !== 0) throw new Error(`v508-${id}-listener-leak-before-reset`);
      requestPromise = null;
      snapshot = initial;
    },
  });
}

const readiness = createEvidenceChannelV508<KerrMeasuredCalibrationReadinessSummaryV503>(
  "readiness",
  "/api/atlas/relativity-evidence/v503/detector-calibration-readiness",
  parseKerrMeasuredCalibrationReadinessApiV503,
);
const preflight = createEvidenceChannelV508<KerrMeasuredCalibrationPreflightSummaryV504>(
  "preflight",
  "/api/atlas/relativity-evidence/v504/detector-calibration-preflight",
  parseKerrMeasuredCalibrationPreflightApiV504,
);

export const getAtlasCalibrationReadinessSnapshotV508 = readiness.getSnapshot;
export const subscribeAtlasCalibrationReadinessV508 = readiness.subscribe;
export const loadAtlasCalibrationReadinessV508 = readiness.load;
export const getAtlasCalibrationPreflightSnapshotV508 = preflight.getSnapshot;
export const subscribeAtlasCalibrationPreflightV508 = preflight.subscribe;
export const loadAtlasCalibrationPreflightV508 = preflight.load;

export function getAtlasCalibrationEvidenceTelemetryV508() {
  return Object.freeze({
    readiness: readiness.telemetry(),
    preflight: preflight.telemetry(),
    totalListenerCount:
      readiness.telemetry().listenerCount + preflight.telemetry().listenerCount,
    totalRequestCount:
      readiness.telemetry().requestCount + preflight.telemetry().requestCount,
    sceneRevisionDelta: 0 as const,
    scientificFieldMutationAllowed: false as const,
  });
}

export function resetAtlasCalibrationEvidenceClientForTestsV508(): void {
  readiness.resetForTests();
  preflight.resetForTests();
}
