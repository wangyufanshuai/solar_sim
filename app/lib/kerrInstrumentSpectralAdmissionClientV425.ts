"use client";

import {
  parseKerrInstrumentSpectralAdmissionResponseV425,
  type KerrInstrumentSpectralAdmissionSummaryV425,
} from "./kerrInstrumentSpectralAdmissionV425";

export type KerrInstrumentSpectralAdmissionSnapshotV425 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrInstrumentSpectralAdmissionSummaryV425 | null;
}>;
const INITIAL = Object.freeze({ status: "idle" as const, reason: null, requestCount: 0 as const, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot: KerrInstrumentSpectralAdmissionSnapshotV425 = INITIAL;
let requestPromise: Promise<KerrInstrumentSpectralAdmissionSummaryV425> | null = null;
const safe = (value: unknown) => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrInstrumentSpectralAdmissionSnapshotV425) => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };

export function loadKerrInstrumentSpectralAdmissionSummaryV425(): Promise<KerrInstrumentSpectralAdmissionSummaryV425> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v425/spectral-admission", { cache: "no-store" }).then(async (response) => {
    const declared = Number(response.headers.get("Content-Length"));
    if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
    const body = await response.text(), responseBytes = new TextEncoder().encode(body).byteLength;
    if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const result = parseKerrInstrumentSpectralAdmissionResponseV425(JSON.parse(body));
    if (!response.ok || !result.available || !result.summary) {
      publish({ status: "unavailable", reason: safe(result.reason), requestCount: 1, responseBytes, summary: null });
      throw new Error(`v425-spectral-${safe(result.reason)}`);
    }
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary });
    return result.summary;
  }).catch((error: unknown) => {
    if (snapshot.status !== "unavailable") {
      const reason = error instanceof Error ? error.message.replace(/^v425-spectral-/, "") : null;
      publish({ status: "unavailable", reason: safe(reason), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null });
    }
    throw error;
  });
  return requestPromise;
}
export const getKerrInstrumentSpectralAdmissionSnapshotV425 = () => snapshot;
export function subscribeKerrInstrumentSpectralAdmissionV425(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetKerrInstrumentSpectralAdmissionClientForTestsV425(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
