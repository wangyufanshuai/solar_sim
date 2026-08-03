"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import { parseKerrResponseAwareFitsColumnSchemaApiV538, type KerrResponseAwareFitsColumnSchemaSummaryV538 } from "./kerrResponseAwareFitsColumnSchemaV538";

type SnapshotV538 = Readonly<{ status: "idle" | "loading" | "ready" | "unavailable"; reason: string | null; requestCount: 0 | 1; responseBytes: number; summary: KerrResponseAwareFitsColumnSchemaSummaryV538 | null }>;
const INITIAL: SnapshotV538 = Object.freeze({ status: "idle", reason: null, requestCount: 0, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrResponseAwareFitsColumnSchemaSummaryV538> | null = null;
const publish = (next: SnapshotV538) => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };
export function loadKerrResponseAwareFitsColumnSchemaSummaryV538(): Promise<KerrResponseAwareFitsColumnSchemaSummaryV538> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v538/response-aware-fits-column-schema", { cache: "no-store" }).then(async (response) => {
    const body = await response.text();
    const responseBytes = new TextEncoder().encode(body).byteLength;
    if (responseBytes > 256 * 1024) throw new Error("response-too-large");
    const api = parseKerrResponseAwareFitsColumnSchemaApiV538(JSON.parse(body));
    if (!response.ok || !api.available || !api.summary) throw new Error(`v538-column-schema-${api.reason}`);
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
    return api.summary;
  }).catch((error: unknown) => { publish({ status: "unavailable", reason: error instanceof Error ? error.message : "request-failed", requestCount: 1, responseBytes: snapshot.responseBytes, summary: null }); throw error; });
  return requestPromise;
}
export const getKerrResponseAwareFitsColumnSchemaSnapshotV538 = () => snapshot;
export function subscribeKerrResponseAwareFitsColumnSchemaV538(listener: () => void): () => void { listeners.add(listener); const release = acquireAtlasResource("subscription", "relativity-lab", "v538-response-aware-fits-column-schema", { owner: "v538-response-aware-fits-column-schema", estimatedBytes: 0 }); let done = false; return () => { if (done) return; done = true; listeners.delete(listener); release(); }; }
export function getKerrResponseAwareFitsColumnSchemaTelemetryV538() { return Object.freeze({ listenerCount: listeners.size, requestCount: snapshot.requestCount, status: snapshot.status }); }
export function resetKerrResponseAwareFitsColumnSchemaClientForTestsV538(): void { if (listeners.size) throw new Error("v538-listener-leak"); snapshot = INITIAL; requestPromise = null; }
