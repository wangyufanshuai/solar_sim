"use client";
import { parseKerrRedshiftContrastLatticeApiV489, type KerrRedshiftContrastLatticeSummaryV489 } from "./kerrRedshiftContrastLatticeV489";
export type KerrRedshiftContrastLatticeSnapshotV489 = Readonly<{ status: "idle" | "loading" | "ready" | "unavailable"; reason: string | null; requestCount: 0 | 1; responseBytes: number; summary: KerrRedshiftContrastLatticeSummaryV489 | null }>;
const INITIAL: KerrRedshiftContrastLatticeSnapshotV489 = Object.freeze({ status: "idle", reason: null, requestCount: 0, responseBytes: 0, summary: null });
const listeners = new Set<() => void>(); let snapshot = INITIAL; let requestPromise: Promise<KerrRedshiftContrastLatticeSummaryV489> | null = null;
const safeReason = (value: unknown) => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";
const publish = (next: KerrRedshiftContrastLatticeSnapshotV489) => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };
export function loadKerrRedshiftContrastLatticeSummaryV489(): Promise<KerrRedshiftContrastLatticeSummaryV489> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v489/redshift-contrast-lattice", { cache: "no-store" }).then(async (response) => {
    const declared = Number(response.headers.get("Content-Length")); if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
    const body = await response.text(), responseBytes = new TextEncoder().encode(body).byteLength; if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const api = parseKerrRedshiftContrastLatticeApiV489(JSON.parse(body));
    if (!response.ok || !api.available || !api.summary) { const reason = safeReason(api.reason); publish({ status: "unavailable", reason, requestCount: 1, responseBytes, summary: null }); throw new Error(`v489-response-${reason}`); }
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary }); return api.summary;
  }).catch((error: unknown) => { if (snapshot.status !== "unavailable") publish({ status: "unavailable", reason: safeReason(error instanceof Error ? error.message.replace(/^v489-response-/i, "") : null), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null }); throw error; });
  return requestPromise;
}
export const getKerrRedshiftContrastLatticeSnapshotV489 = () => snapshot;
export function subscribeKerrRedshiftContrastLatticeV489(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetKerrRedshiftContrastLatticeClientForTestsV489(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
