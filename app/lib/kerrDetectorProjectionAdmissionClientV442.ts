"use client";
import { parseKerrDetectorProjectionAdmissionApiV442, type KerrDetectorProjectionAdmissionSummaryV442 } from "./kerrDetectorProjectionAdmissionV442";
export type KerrDetectorProjectionAdmissionSnapshotV442 = Readonly<{ status: "idle" | "loading" | "ready" | "unavailable"; reason: string | null; requestCount: 0 | 1; responseBytes: number; summary: KerrDetectorProjectionAdmissionSummaryV442 | null }>;
const INITIAL: KerrDetectorProjectionAdmissionSnapshotV442 = Object.freeze({ status: "idle", reason: null, requestCount: 0, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrDetectorProjectionAdmissionSummaryV442> | null = null;
const safe = (value: unknown): string => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrDetectorProjectionAdmissionSnapshotV442): void => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };
export function loadKerrDetectorProjectionAdmissionSummaryV442(): Promise<KerrDetectorProjectionAdmissionSummaryV442> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v442/detector-projection-admission", { cache: "no-store" }).then(async (response) => {
    const declared = Number(response.headers.get("Content-Length"));
    if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
    const body = await response.text();
    const responseBytes = new TextEncoder().encode(body).byteLength;
    if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const result = parseKerrDetectorProjectionAdmissionApiV442(JSON.parse(body));
    if (!response.ok || !result.available || !result.summary) { publish({ status: "unavailable", reason: safe(result.reason), requestCount: 1, responseBytes, summary: null }); throw new Error(`v442-response-${safe(result.reason)}`); }
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary });
    return result.summary;
  }).catch((error: unknown) => { if (snapshot.status !== "unavailable") publish({ status: "unavailable", reason: safe(error instanceof Error ? error.message.replace(/^v442-response-/, "") : null), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null }); throw error; });
  return requestPromise;
}
export const getKerrDetectorProjectionAdmissionSnapshotV442 = (): KerrDetectorProjectionAdmissionSnapshotV442 => snapshot;
export function subscribeKerrDetectorProjectionAdmissionV442(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetKerrDetectorProjectionAdmissionClientForTestsV442(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
