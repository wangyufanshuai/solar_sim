"use client";
import { parseKerrSciencePayloadAdmissionApiV463, type KerrSciencePayloadAdmissionSummaryV463 } from "./kerrSciencePayloadAdmissionV463";

export type KerrSciencePayloadAdmissionSnapshotV463 = Readonly<{ status: "idle" | "loading" | "ready" | "unavailable"; reason: string | null; requestCount: 0 | 1; responseBytes: number; summary: KerrSciencePayloadAdmissionSummaryV463 | null }>;
const INITIAL: KerrSciencePayloadAdmissionSnapshotV463 = Object.freeze({ status: "idle", reason: null, requestCount: 0, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrSciencePayloadAdmissionSummaryV463> | null = null;
const safeReason = (value: unknown) => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrSciencePayloadAdmissionSnapshotV463) => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };

export function loadKerrSciencePayloadAdmissionSummaryV463(): Promise<KerrSciencePayloadAdmissionSummaryV463> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v463/science-payload-admission", { cache: "no-store" }).then(async (response) => {
    const declared = Number(response.headers.get("Content-Length"));
    if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
    const body = await response.text();
    const responseBytes = new TextEncoder().encode(body).byteLength;
    if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const api = parseKerrSciencePayloadAdmissionApiV463(JSON.parse(body));
    if (!response.ok || !api.available || !api.summary) {
      const reason = safeReason(api.reason);
      publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null });
      throw new Error(`v463-response-${reason}`);
    }
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
    return api.summary;
  }).catch((error: unknown) => {
    if (snapshot.status !== "unavailable") publish({ status: "unavailable", reason: safeReason(error instanceof Error ? error.message.replace(/^v463-response-/, "") : null), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null });
    throw error;
  });
  return requestPromise;
}
export const getKerrSciencePayloadAdmissionSnapshotV463 = (): KerrSciencePayloadAdmissionSnapshotV463 => snapshot;
export function subscribeKerrSciencePayloadAdmissionV463(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetKerrSciencePayloadAdmissionClientForTestsV463(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
