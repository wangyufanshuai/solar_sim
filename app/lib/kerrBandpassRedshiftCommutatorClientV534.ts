"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  parseKerrBandpassRedshiftCommutatorApiV534,
  type KerrBandpassRedshiftCommutatorSummaryV534,
} from "./kerrBandpassRedshiftCommutatorV534";

export const KERR_BANDPASS_REDSHIFT_SUMMARY_MAX_BYTES_V534 = 128 * 1024;
type Snapshot = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrBandpassRedshiftCommutatorSummaryV534 | null;
}>;

const INITIAL: Snapshot = Object.freeze({ status: "idle", reason: null, requestCount: 0, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot: Snapshot = INITIAL;
let requestPromise: Promise<KerrBandpassRedshiftCommutatorSummaryV534> | null = null;

const publish = (next: Snapshot) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrBandpassRedshiftCommutatorSummaryV534() {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v534/bandpass-redshift", { cache: "no-store" })
    .then(async (response) => {
      const declared = Number(response.headers.get("Content-Length"));
      if (Number.isFinite(declared) && declared > KERR_BANDPASS_REDSHIFT_SUMMARY_MAX_BYTES_V534) {
        throw new Error("response-too-large");
      }
      const body = await response.text();
      const responseBytes = new TextEncoder().encode(body).byteLength;
      if (responseBytes > KERR_BANDPASS_REDSHIFT_SUMMARY_MAX_BYTES_V534) throw new Error("response-too-large");
      const api = parseKerrBandpassRedshiftCommutatorApiV534(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) throw new Error(`v534-bandpass-redshift-${api.reason}`);
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      publish({
        status: "unavailable",
        reason: error instanceof Error ? error.message : "request-failed",
        requestCount: 1,
        responseBytes: snapshot.responseBytes,
        summary: null,
      });
      throw error;
    });
  return requestPromise;
}

export const getKerrBandpassRedshiftCommutatorSnapshotV534 = () => snapshot;

export function subscribeKerrBandpassRedshiftCommutatorV534(listener: () => void): () => void {
  listeners.add(listener);
  const release = acquireAtlasResource("subscription", "relativity-lab", "v534-bandpass-redshift", {
    owner: "v534-bandpass-redshift",
    estimatedBytes: 0,
  });
  let done = false;
  return () => {
    if (done) return;
    done = true;
    listeners.delete(listener);
    release();
  };
}

export function getKerrBandpassRedshiftCommutatorTelemetryV534() {
  return Object.freeze({
    listenerCount: listeners.size,
    requestCount: snapshot.requestCount,
    status: snapshot.status,
    sceneRevisionDelta: 0 as const,
    scientificFieldMutationAllowed: false as const,
  });
}

export function resetKerrBandpassRedshiftCommutatorClientForTestsV534(): void {
  if (listeners.size) throw new Error("v534-listener-leak");
  snapshot = INITIAL;
  requestPromise = null;
}
