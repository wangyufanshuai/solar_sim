"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  parseKerrCalibrationExcitationDesignApiV525,
  type KerrCalibrationExcitationDesignSummaryV525,
} from "./kerrCalibrationExcitationDesignV525";

export const KERR_CALIBRATION_EXCITATION_DESIGN_SUMMARY_MAX_BYTES_V525 = 128 * 1024;
export type KerrCalibrationExcitationDesignSnapshotV525 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrCalibrationExcitationDesignSummaryV525 | null;
}>;
const INITIAL: KerrCalibrationExcitationDesignSnapshotV525 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrCalibrationExcitationDesignSummaryV525> | null = null;
const safeReason = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value)
    ? value
    : "request-failed";
const publish = (next: KerrCalibrationExcitationDesignSnapshotV525) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrCalibrationExcitationDesignSummaryV525(): Promise<KerrCalibrationExcitationDesignSummaryV525> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch(
    "/api/atlas/relativity-evidence/v525/calibration-excitation-design",
    { cache: "no-store" },
  )
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (
        Number.isFinite(declared)
        && declared > KERR_CALIBRATION_EXCITATION_DESIGN_SUMMARY_MAX_BYTES_V525
      ) throw new Error("response-too-large");
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > KERR_CALIBRATION_EXCITATION_DESIGN_SUMMARY_MAX_BYTES_V525) {
        throw new Error("response-too-large");
      }
      const api = parseKerrCalibrationExcitationDesignApiV525(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v525-calibration-design-${reason}`);
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
              ? error.message.replace(/^v525-calibration-design-/, "")
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

export const getKerrCalibrationExcitationDesignSnapshotV525 = () => snapshot;
export function subscribeKerrCalibrationExcitationDesignV525(listener: () => void) {
  listeners.add(listener);
  const releaseResource = acquireAtlasResource(
    "subscription",
    "relativity-lab",
    "v525-calibration-excitation-design",
    { owner: "v525-calibration-excitation-design", estimatedBytes: 0 },
  );
  let released = false;
  return () => {
    if (released) return;
    released = true;
    listeners.delete(listener);
    releaseResource();
  };
}
export function getKerrCalibrationExcitationDesignTelemetryV525() {
  return Object.freeze({
    listenerCount: listeners.size,
    requestCount: snapshot.requestCount,
    status: snapshot.status,
    sceneRevisionDelta: 0 as const,
    scientificFieldMutationAllowed: false as const,
  });
}
export function resetKerrCalibrationExcitationDesignClientForTestsV525() {
  if (listeners.size !== 0) throw new Error("v525-calibration-design-listener-leak");
  requestPromise = null;
  snapshot = INITIAL;
}
