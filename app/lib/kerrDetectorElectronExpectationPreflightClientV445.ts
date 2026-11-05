"use client";
import { parseKerrDetectorElectronExpectationApiV445, type KerrDetectorElectronExpectationSummaryV445 } from "./kerrDetectorElectronExpectationPreflightV445";

export type KerrDetectorElectronExpectationSnapshotV445 = Readonly<{ status: "idle" | "loading" | "ready" | "unavailable"; reason: string | null; requestCount: 0 | 1; responseBytes: number; summary: KerrDetectorElectronExpectationSummaryV445 | null }>;
const INITIAL: KerrDetectorElectronExpectationSnapshotV445 = Object.freeze({ status: "idle", reason: null, requestCount: 0, responseBytes: 0, summary: null });
const listeners = new Set<() => void>(); let snapshot = INITIAL; let requestPromise: Promise<KerrDetectorElectronExpectationSummaryV445> | null = null;
const safe = (value: unknown): string => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrDetectorElectronExpectationSnapshotV445): void => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };

export function loadKerrDetectorElectronExpectationSummaryV445(): Promise<KerrDetectorElectronExpectationSummaryV445> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v445/detector-electron-expectation", { cache: "no-store" }).then(async (response) => {
    const declared = Number(response.headers.get("Content-Length")); if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
    const body = await response.text(), responseBytes = new TextEncoder().encode(body).byteLength; if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const result = parseKerrDetectorElectronExpectationApiV445(JSON.parse(body));
    if (!response.ok || !result.available || !result.summary) { publish({ status: "unavailable", reason: safe(result.reason), requestCount: 1, responseBytes, summary: null }); throw new Error(`v445-response-${safe(result.reason)}`); }
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary }); return result.summary;
  }).catch((error: unknown) => { if (snapshot.status !== "unavailable") publish({ status: "unavailable", reason: safe(error instanceof Error ? error.message.replace(/^v445-response-/, "") : null), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null }); throw error; });
  return requestPromise;
}
export const getKerrDetectorElectronExpectationSnapshotV445 = (): KerrDetectorElectronExpectationSnapshotV445 => snapshot;
export function subscribeKerrDetectorElectronExpectationV445(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetKerrDetectorElectronExpectationClientForTestsV445(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
