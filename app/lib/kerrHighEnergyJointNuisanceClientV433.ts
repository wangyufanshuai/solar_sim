"use client";

import { parseKerrHighEnergyJointNuisanceApiV433, type KerrHighEnergyJointNuisanceSummaryV433 } from "./kerrHighEnergyJointNuisanceV433";

export type KerrHighEnergyJointNuisanceSnapshotV433 = Readonly<{ status: "idle" | "loading" | "ready" | "unavailable"; reason: string | null; requestCount: 0 | 1; responseBytes: number; summary: KerrHighEnergyJointNuisanceSummaryV433 | null }>;
const INITIAL = Object.freeze({ status: "idle" as const, reason: null, requestCount: 0 as const, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot: KerrHighEnergyJointNuisanceSnapshotV433 = INITIAL;
let requestPromise: Promise<KerrHighEnergyJointNuisanceSummaryV433> | null = null;
const safe = (value: unknown) => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrHighEnergyJointNuisanceSnapshotV433) => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };

export function loadKerrHighEnergyJointNuisanceSummaryV433(): Promise<KerrHighEnergyJointNuisanceSummaryV433> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v433/high-energy-joint-nuisance", { cache: "no-store" }).then(async (response) => {
    const declared = Number(response.headers.get("Content-Length"));
    if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
    const body = await response.text();
    const responseBytes = new TextEncoder().encode(body).byteLength;
    if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const result = parseKerrHighEnergyJointNuisanceApiV433(JSON.parse(body));
    if (!response.ok || !result.available || !result.summary) {
      publish({ status: "unavailable", reason: safe(result.reason), requestCount: 1, responseBytes, summary: null });
      throw new Error(`v433-response-${safe(result.reason)}`);
    }
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary });
    return result.summary;
  }).catch((error: unknown) => {
    if (snapshot.status !== "unavailable") {
      const reason = error instanceof Error ? error.message.replace(/^v433-response-/, "") : null;
      publish({ status: "unavailable", reason: safe(reason), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null });
    }
    throw error;
  });
  return requestPromise;
}

export const getKerrHighEnergyJointNuisanceSnapshotV433 = () => snapshot;
export function subscribeKerrHighEnergyJointNuisanceV433(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetKerrHighEnergyJointNuisanceClientForTestsV433(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
