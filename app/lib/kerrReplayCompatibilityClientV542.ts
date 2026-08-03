"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import { parseKerrReplayCompatibilityApiV542, type KerrReplayCompatibilityArtifactV542 } from "./kerrReplayCompatibilityV542";

type SnapshotV542 = Readonly<{ status: "idle" | "loading" | "ready" | "unavailable"; reason: string | null; requestCount: 0 | 1; responseBytes: number; summary: KerrReplayCompatibilityArtifactV542 | null }>;
const INITIAL: SnapshotV542 = Object.freeze({ status: "idle", reason: null, requestCount: 0, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrReplayCompatibilityArtifactV542> | null = null;
const publish = (next: SnapshotV542) => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };

export function loadKerrReplayCompatibilitySummaryV542(): Promise<KerrReplayCompatibilityArtifactV542> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v542/replay-compatibility", { cache: "no-store" }).then(async (response) => {
    const body = await response.text(), responseBytes = new TextEncoder().encode(body).byteLength;
    if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const api = parseKerrReplayCompatibilityApiV542(JSON.parse(body));
    if (!response.ok || !api.available || !api.summary) throw new Error(`v542-replay-compatibility-${api.reason}`);
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
    return api.summary;
  }).catch((error: unknown) => { publish({ status: "unavailable", reason: error instanceof Error ? error.message : "request-failed", requestCount: 1, responseBytes: snapshot.responseBytes, summary: null }); throw error; });
  return requestPromise;
}
export const getKerrReplayCompatibilitySnapshotV542 = () => snapshot;
export function subscribeKerrReplayCompatibilityV542(listener: () => void): () => void { listeners.add(listener); const release = acquireAtlasResource("subscription", "relativity-lab", "v542-replay-compatibility", { owner: "v542-replay-compatibility", estimatedBytes: 0 }); let done = false; return () => { if (done) return; done = true; listeners.delete(listener); release(); }; }
export function getKerrReplayCompatibilityTelemetryV542() { return Object.freeze({ listenerCount: listeners.size, requestCount: snapshot.requestCount, status: snapshot.status }); }
export function resetKerrReplayCompatibilityClientForTestsV542(): void { if (listeners.size) throw new Error("v542-listener-leak"); snapshot = INITIAL; requestPromise = null; }
