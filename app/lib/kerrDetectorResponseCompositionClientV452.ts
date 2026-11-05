"use client";

import { parseKerrDetectorResponseCompositionApiV452, type KerrDetectorResponseCompositionSummaryV452 } from "./kerrDetectorResponseCompositionV452";
export type KerrDetectorResponseCompositionSnapshotV452 = Readonly<{ status: "idle" | "loading" | "ready" | "unavailable"; reason: string | null; requestCount: 0 | 1; responseBytes: number; summary: KerrDetectorResponseCompositionSummaryV452 | null }>;
const INITIAL: KerrDetectorResponseCompositionSnapshotV452 = Object.freeze({ status: "idle", reason: null, requestCount: 0, responseBytes: 0, summary: null });
const listeners = new Set<() => void>(); let snapshot = INITIAL; let requestPromise: Promise<KerrDetectorResponseCompositionSummaryV452> | null = null;
const safeReason = (value: unknown): string => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrDetectorResponseCompositionSnapshotV452): void => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };
export function loadKerrDetectorResponseCompositionSummaryV452(): Promise<KerrDetectorResponseCompositionSummaryV452> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v452/response-composition", { cache: "no-store" }).then(async (response) => {
    const declared = Number(response.headers.get("Content-Length")); if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
    const body = await response.text(); const responseBytes = new TextEncoder().encode(body).byteLength; if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const api = parseKerrDetectorResponseCompositionApiV452(JSON.parse(body));
    if (!response.ok || !api.available || !api.summary) { const reason = safeReason(api.reason); publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null }); throw new Error(`v452-response-${reason}`); }
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary }); return api.summary;
  }).catch((error: unknown) => { if (snapshot.status !== "unavailable") publish({ status: "unavailable", reason: safeReason(error instanceof Error ? error.message.replace(/^v452-response-/, "") : null), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null }); throw error; });
  return requestPromise;
}
export const getKerrDetectorResponseCompositionSnapshotV452 = (): KerrDetectorResponseCompositionSnapshotV452 => snapshot;
export function subscribeKerrDetectorResponseCompositionV452(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetKerrDetectorResponseCompositionClientForTestsV452(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
