"use client";
import { acquireAtlasResource } from "./atlasResourceLifecycle";
import { parseKerrSparseScienceImageProductsApiV556, type KerrSparseScienceImageProductsArtifactV556 } from "./kerrSparseScienceImageProductsV556";

type SnapshotV556 = Readonly<{ status: "idle" | "loading" | "ready" | "unavailable"; reason: string | null; requestCount: 0 | 1; responseBytes: number; summary: KerrSparseScienceImageProductsArtifactV556 | null }>;
const INITIAL: SnapshotV556 = Object.freeze({ status: "idle", reason: null, requestCount: 0, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrSparseScienceImageProductsArtifactV556> | null = null;
const publish = (next: SnapshotV556) => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };

export function loadKerrSparseScienceImageProductsSummaryV556(): Promise<KerrSparseScienceImageProductsArtifactV556> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v556/sparse-science-products", { cache: "no-store" }).then(async (response) => { const body = await response.text(), responseBytes = new TextEncoder().encode(body).byteLength; if (responseBytes > 128 * 1024) throw new Error("response-too-large"); const api = parseKerrSparseScienceImageProductsApiV556(JSON.parse(body)); if (!response.ok || !api.available || !api.summary) throw new Error(`v556-products-${api.reason}`); publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary }); return api.summary; }).catch((error: unknown) => { publish({ status: "unavailable", reason: error instanceof Error ? error.message : "request-failed", requestCount: 1, responseBytes: snapshot.responseBytes, summary: null }); throw error; });
  return requestPromise;
}
export const getKerrSparseScienceImageProductsSnapshotV556 = () => snapshot;
export function subscribeKerrSparseScienceImageProductsV556(listener: () => void): () => void { listeners.add(listener); const release = acquireAtlasResource("subscription", "relativity-lab", "v556-sparse-science-products", { owner: "v556-sparse-science-products", estimatedBytes: 0 }); let done = false; return () => { if (done) return; done = true; listeners.delete(listener); release(); }; }
export const getKerrSparseScienceImageProductsTelemetryV556 = () => Object.freeze({ listenerCount: listeners.size, requestCount: snapshot.requestCount, status: snapshot.status });
export function resetKerrSparseScienceImageProductsClientForTestsV556(): void { if (listeners.size) throw new Error("v556-products-listener-leak"); snapshot = INITIAL; requestPromise = null; }
