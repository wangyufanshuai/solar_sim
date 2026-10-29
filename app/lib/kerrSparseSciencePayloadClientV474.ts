"use client";

import {
  parseKerrSparseSciencePayloadApiV474,
  type KerrSparseSciencePayloadSummaryV474,
} from "./kerrSparseSciencePayloadV474";

export type KerrSparseSciencePayloadSnapshotV474 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrSparseSciencePayloadSummaryV474 | null;
}>;
const INITIAL: KerrSparseSciencePayloadSnapshotV474 = Object.freeze({
  status: "idle",
  reason: null,
  requestCount: 0,
  responseBytes: 0,
  summary: null,
});
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrSparseSciencePayloadSummaryV474> | null = null;
const safeReason = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrSparseSciencePayloadSnapshotV474) => {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
};

export function loadKerrSparseSciencePayloadSummaryV474(): Promise<KerrSparseSciencePayloadSummaryV474> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v474/sparse-science-payload", {
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
      const api = parseKerrSparseSciencePayloadApiV474(JSON.parse(body));
      if (!response.ok || !api.available || !api.summary) {
        const reason = safeReason(api.reason);
        publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
        throw new Error("v474-response-" + reason);
      }
      publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
      return api.summary;
    })
    .catch((error: unknown) => {
      if (snapshot.status !== "unavailable") {
        publish({
          status: "unavailable",
          reason: safeReason(
            error instanceof Error ? error.message.replace(/^v474-response-/i, "") : null,
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

export const getKerrSparseSciencePayloadSnapshotV474 =
  (): KerrSparseSciencePayloadSnapshotV474 => snapshot;

export function subscribeKerrSparseSciencePayloadV474(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetKerrSparseSciencePayloadClientForTestsV474(): void {
  requestPromise = null;
  snapshot = INITIAL;
  listeners.clear();
}
