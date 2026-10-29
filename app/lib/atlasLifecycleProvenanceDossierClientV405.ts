"use client";

import {
  parseAtlasLifecycleDossierResponseV405,
  type AtlasLifecycleProvenanceDossierV405,
} from "./atlasLifecycleProvenanceDossierV405";

export type AtlasLifecycleDossierClientSnapshotV405 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  dossier: AtlasLifecycleProvenanceDossierV405 | null;
}>;
const INITIAL = Object.freeze({ status: "idle" as const, reason: null, requestCount: 0 as const, responseBytes: 0, dossier: null });
const listeners = new Set<() => void>();
let snapshot: AtlasLifecycleDossierClientSnapshotV405 = INITIAL;
let requestPromise: Promise<AtlasLifecycleProvenanceDossierV405> | null = null;
const publish = (next: AtlasLifecycleDossierClientSnapshotV405) => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };
const safeReason = (value: unknown) => typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "request-failed";

export function loadAtlasLifecycleProvenanceDossierV405(): Promise<AtlasLifecycleProvenanceDossierV405> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, dossier: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v405/lifecycle-dossier", { cache: "no-store" }).then(async (response) => {
    const declared = Number(response.headers.get("Content-Length"));
    if (Number.isFinite(declared) && declared > 128 * 1024) throw new Error("response-too-large");
    const body = await response.text();
    const responseBytes = new TextEncoder().encode(body).byteLength;
    if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const result = parseAtlasLifecycleDossierResponseV405(JSON.parse(body));
    if (!response.ok || !result.available || !result.dossier) {
      publish({ status: "unavailable", reason: safeReason(result.reason), requestCount: 1, responseBytes, dossier: null });
      throw new Error(`v405-dossier-${safeReason(result.reason)}`);
    }
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, dossier: result.dossier });
    return result.dossier;
  }).catch((error: unknown) => {
    if (snapshot.status !== "unavailable") publish({ status: "unavailable", reason: safeReason(error instanceof Error ? error.message.replace(/^v405-dossier-/, "") : null), requestCount: 1, responseBytes: snapshot.responseBytes, dossier: null });
    throw error;
  });
  return requestPromise;
}
export function getAtlasLifecycleProvenanceDossierSnapshotV405(): AtlasLifecycleDossierClientSnapshotV405 { return snapshot; }
export function subscribeAtlasLifecycleProvenanceDossierV405(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function resetAtlasLifecycleProvenanceDossierClientForTestsV405(): void { requestPromise = null; snapshot = INITIAL; listeners.clear(); }
