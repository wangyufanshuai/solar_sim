"use client";

import { parseKerrScatteringAtmosphereResponseV407, type KerrScatteringAtmosphereSummaryV407 } from "./kerrScatteringAtmosphereV407";

export type KerrScatteringAtmosphereClientSnapshotV407 = Readonly<{ status: "idle" | "loading" | "ready" | "unavailable"; reason: string | null; requestCount: 0 | 1; responseBytes: number; summary: KerrScatteringAtmosphereSummaryV407 | null }>;
const INITIAL = Object.freeze({ status: "idle" as const, reason: null, requestCount: 0 as const, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot: KerrScatteringAtmosphereClientSnapshotV407 = INITIAL;
let requestPromise: Promise<KerrScatteringAtmosphereSummaryV407> | null = null;
const publish = (next: KerrScatteringAtmosphereClientSnapshotV407) => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };
const safeReason = (value: unknown) => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";

export function loadKerrScatteringAtmosphereSummaryV407(): Promise<KerrScatteringAtmosphereSummaryV407> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v407/scattering-atmosphere", { cache: "no-store" }).then(async (response) => {
    const declared = Number(response.headers.get("Content-Length"));
    if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
    const body = await response.text();
    const responseBytes = new TextEncoder().encode(body).byteLength;
    if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const result = parseKerrScatteringAtmosphereResponseV407(JSON.parse(body));
    if (!response.ok || !result.available || !result.summary) {
      publish({ status: "unavailable", reason: safeReason(result.reason), requestCount: 1, responseBytes, summary: null });
      throw new Error(`v407-scattering-${safeReason(result.reason)}`);
    }
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary });
    return result.summary;
  }).catch((error: unknown) => {
    if (snapshot.status !== "unavailable") publish({ status: "unavailable", reason: safeReason(error instanceof Error ? error.message.replace(/^v407-scattering-/, "") : null), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null });
    throw error;
  });
  return requestPromise;
}

export function getKerrScatteringAtmosphereSnapshotV407(): KerrScatteringAtmosphereClientSnapshotV407 { return snapshot; }
export function subscribeKerrScatteringAtmosphereV407(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetKerrScatteringAtmosphereClientForTestsV407(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
