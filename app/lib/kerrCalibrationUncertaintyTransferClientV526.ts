"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  parseKerrCalibrationUncertaintyTransferApiV526,
  type KerrCalibrationUncertaintyTransferSummaryV526,
} from "./kerrCalibrationUncertaintyTransferV526";

export const KERR_CALIBRATION_UNCERTAINTY_TRANSFER_SUMMARY_MAX_BYTES_V526 = 128 * 1024;
export type KerrCalibrationUncertaintyTransferSnapshotV526 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrCalibrationUncertaintyTransferSummaryV526 | null;
}>;
const INITIAL: KerrCalibrationUncertaintyTransferSnapshotV526 = Object.freeze({ status: "idle", reason: null, requestCount: 0, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrCalibrationUncertaintyTransferSummaryV526> | null = null;
const safeReason = (value: unknown) => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrCalibrationUncertaintyTransferSnapshotV526) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrCalibrationUncertaintyTransferSummaryV526(): Promise<KerrCalibrationUncertaintyTransferSummaryV526> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v526/calibration-uncertainty-transfer", { cache: "no-store" })
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declared) && declared > KERR_CALIBRATION_UNCERTAINTY_TRANSFER_SUMMARY_MAX_BYTES_V526) throw new Error("response-too-large");
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > KERR_CALIBRATION_UNCERTAINTY_TRANSFER_SUMMARY_MAX_BYTES_V526) throw new Error("response-too-large");
      const api = parseKerrCalibrationUncertaintyTransferApiV526(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error(`v526-uncertainty-transfer-${reason}`);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(error instanceof Error ? error.message.replace(/^v526-uncertainty-transfer-/, "") : null),
          requestCount: 1,
          responseBytes: snapshot.responseBytes,
          summary: null,
        });
      }
      throw error;
    });
  return requestPromise;
}
export const getKerrCalibrationUncertaintyTransferSnapshotV526 = () => snapshot;
export function subscribeKerrCalibrationUncertaintyTransferV526(listener: () => void) {
  listeners.add(listener);
  const releaseResource = acquireAtlasResource("subscription", "relativity-lab", "v526-calibration-uncertainty-transfer", { owner: "v526-calibration-uncertainty-transfer", estimatedBytes: 0 });
  let released = false;
  return () => {
    if (released) return;
    released = true;
    listeners.delete(listener);
    releaseResource();
  };
}
export function getKerrCalibrationUncertaintyTransferTelemetryV526() {
  return Object.freeze({ listenerCount: listeners.size, requestCount: snapshot.requestCount, status: snapshot.status, sceneRevisionDelta: 0 as const, scientificFieldMutationAllowed: false as const });
}
export function resetKerrCalibrationUncertaintyTransferClientForTestsV526() {
  if (listeners.size !== 0) throw new Error("v526-uncertainty-transfer-listener-leak");
  requestPromise = null;
  snapshot = INITIAL;
}
