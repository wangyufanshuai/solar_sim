"use client";

import { parseKerrHighEnergyResponseIntakeApiV428, type KerrHighEnergyResponseIntakeSummaryV428 } from "./kerrHighEnergyResponseIntakeV428";

export type KerrHighEnergyResponseIntakeSnapshotV428 = Readonly<{ status: "idle" | "loading" | "ready" | "unavailable"; reason: string | null; requestCount: 0 | 1; responseBytes: number; summary: KerrHighEnergyResponseIntakeSummaryV428 | null }>;
const INITIAL = Object.freeze({ status: "idle" as const, reason: null, requestCount: 0 as const, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot: KerrHighEnergyResponseIntakeSnapshotV428 = INITIAL;
let requestPromise: Promise<KerrHighEnergyResponseIntakeSummaryV428> | null = null;
const safeReason = (value: unknown) => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
function publish(next: KerrHighEnergyResponseIntakeSnapshotV428): void { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); }

export function loadKerrHighEnergyResponseIntakeSummaryV428(): Promise<KerrHighEnergyResponseIntakeSummaryV428> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v428/high-energy-response-intake", { cache: "no-store" }).then(async (response) => {
    const declared = Number(response.headers.get("Content-Length"));
    if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
    const body = await response.text();
    const responseBytes = new TextEncoder().encode(body).byteLength;
    if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const result = parseKerrHighEnergyResponseIntakeApiV428(JSON.parse(body));
    if (!response.ok || !result.available || !result.summary) { publish({ status: "unavailable", reason: safeReason(result.reason), requestCount: 1, responseBytes, summary: null }); throw new Error(`v428-response-${safeReason(result.reason)}`); }
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary });
    return result.summary;
  }).catch((error: unknown) => {
    if (snapshot.status !== "unavailable") { const reason = error instanceof Error ? error.message.replace(/^v428-response-/, "") : null; publish({ status: "unavailable", reason: safeReason(reason), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null }); }
    throw error;
  });
  return requestPromise;
}
export const getKerrHighEnergyResponseIntakeSnapshotV428 = () => snapshot;
export function subscribeKerrHighEnergyResponseIntakeV428(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetKerrHighEnergyResponseIntakeClientForTestsV428(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
