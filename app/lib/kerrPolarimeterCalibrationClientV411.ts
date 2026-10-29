"use client";

import { parsePolarimeterCalibrationResponseV411, type PolarimeterCalibrationSummaryV411 } from "./kerrPolarimeterCalibrationV411";

export type PolarimeterCalibrationClientSnapshotV411 = Readonly<{ status: "idle" | "loading" | "ready" | "unavailable"; reason: string | null; requestCount: 0 | 1; responseBytes: number; summary: PolarimeterCalibrationSummaryV411 | null }>;
const INITIAL = Object.freeze({ status: "idle" as const, reason: null, requestCount: 0 as const, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot: PolarimeterCalibrationClientSnapshotV411 = INITIAL;
let requestPromise: Promise<PolarimeterCalibrationSummaryV411> | null = null;
const publish = (next: PolarimeterCalibrationClientSnapshotV411) => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };
const safeReason = (value: unknown) => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";

export function loadPolarimeterCalibrationSummaryV411(): Promise<PolarimeterCalibrationSummaryV411> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v411/polarimeter-calibration", { cache: "no-store" }).then(async (response) => {
    const declared = Number(response.headers.get("Content-Length"));
    if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
    const body = await response.text();
    const responseBytes = new TextEncoder().encode(body).byteLength;
    if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const result = parsePolarimeterCalibrationResponseV411(JSON.parse(body));
    if (!response.ok || !result.available || !result.summary) {
      publish({ status: "unavailable", reason: safeReason(result.reason), requestCount: 1, responseBytes, summary: null });
      throw new Error(`v411-calibration-${safeReason(result.reason)}`);
    }
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary });
    return result.summary;
  }).catch((error: unknown) => {
    if (snapshot.status !== "unavailable") publish({ status: "unavailable", reason: safeReason(error instanceof Error ? error.message.replace(/^v411-calibration-/, "") : null), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null });
    throw error;
  });
  return requestPromise;
}

export function getPolarimeterCalibrationSnapshotV411(): PolarimeterCalibrationClientSnapshotV411 { return snapshot; }
export function subscribePolarimeterCalibrationV411(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetPolarimeterCalibrationClientForTestsV411(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
