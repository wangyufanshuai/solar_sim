"use client";
import type {
  KerrDetectorObservationInputApiV446,
  KerrDetectorObservationInputSummaryV446,
} from "./kerrDetectorObservationInputsV446";

const KERR_DETECTOR_OBSERVATION_INPUTS_API_VERSION_CLIENT_V446 =
  "v446-kerr-detector-observation-inputs-api-v1" as const;
const KERR_DETECTOR_OBSERVATION_INPUT_REASONS_CLIENT_V446 = new Set([
  "ready",
  "lite-boundary",
  "local-shadow-only",
  "evidence-corrupt",
  "request-failed",
]);

function freezeClientObservationInputV446<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      freezeClientObservationInputV446(child);
    }
  }
  return value;
}

export function parseKerrDetectorObservationInputApiClientV446(
  value: unknown,
): KerrDetectorObservationInputApiV446 {
  const api = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
  if (
    !api
    || api.version !== KERR_DETECTOR_OBSERVATION_INPUTS_API_VERSION_CLIENT_V446
    || typeof api.available !== "boolean"
    || !KERR_DETECTOR_OBSERVATION_INPUT_REASONS_CLIENT_V446.has(String(api.reason))
    || (api.available && !api.summary)
    || (!api.available && api.summary !== null)
  ) {
    throw new Error("v446-api-identity");
  }
  return freezeClientObservationInputV446(value as KerrDetectorObservationInputApiV446);
}
export type KerrDetectorObservationInputSnapshotV446 = Readonly<{ status: "idle" | "loading" | "ready" | "unavailable"; reason: string | null; requestCount: 0 | 1; responseBytes: number; summary: KerrDetectorObservationInputSummaryV446 | null }>;
const INITIAL: KerrDetectorObservationInputSnapshotV446 = Object.freeze({ status: "idle", reason: null, requestCount: 0, responseBytes: 0, summary: null }); const listeners = new Set<() => void>(); let snapshot = INITIAL; let requestPromise: Promise<KerrDetectorObservationInputSummaryV446> | null = null; const safe = (value: unknown): string => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed"; const publish = (next: KerrDetectorObservationInputSnapshotV446): void => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };
export function loadKerrDetectorObservationInputSummaryV446(): Promise<KerrDetectorObservationInputSummaryV446> { if (requestPromise) return requestPromise; publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null }); requestPromise = fetch("/api/atlas/relativity-evidence/v446/detector-observation-inputs", { cache: "no-store" }).then(async (response) => { const declared = Number(response.headers.get("Content-Length")); if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large"); const body = await response.text(), responseBytes = new TextEncoder().encode(body).byteLength; if (responseBytes > 128 * 1024) throw new Error("response-too-large"); const result = parseKerrDetectorObservationInputApiClientV446(JSON.parse(body)); if (!response.ok || !result.available || !result.summary) { publish({ status: "unavailable", reason: safe(result.reason), requestCount: 1, responseBytes, summary: null }); throw new Error(`v446-response-${safe(result.reason)}`); } publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: result.summary }); return result.summary; }).catch((error: unknown) => { if (snapshot.status !== "unavailable") publish({ status: "unavailable", reason: safe(error instanceof Error ? error.message.replace(/^v446-response-/, "") : null), requestCount: 1, responseBytes: snapshot.responseBytes, summary: null }); throw error; }); return requestPromise; }
export const getKerrDetectorObservationInputSnapshotV446 = (): KerrDetectorObservationInputSnapshotV446 => snapshot;
export function subscribeKerrDetectorObservationInputsV446(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetKerrDetectorObservationInputsClientForTestsV446(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
