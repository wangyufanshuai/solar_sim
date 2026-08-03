"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import { parseKerrLicenseConfirmationPacketApiV552, type KerrLicenseConfirmationPacketApiV552, type KerrLicenseConfirmationPacketArtifactV552 } from "./kerrLicenseConfirmationPacketV552";

export type KerrLicenseConfirmationPacketClientSnapshotV552 = Readonly<{
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  summary: KerrLicenseConfirmationPacketArtifactV552 | null;
}>;
const INITIAL: KerrLicenseConfirmationPacketClientSnapshotV552 = Object.freeze({ status: "idle", reason: null, requestCount: 0, responseBytes: 0, summary: null });
const listeners = new Set<() => void>();
let snapshot = INITIAL;
let requestPromise: Promise<KerrLicenseConfirmationPacketArtifactV552> | null = null;
const publish = (next: KerrLicenseConfirmationPacketClientSnapshotV552) => { snapshot = Object.freeze(next); listeners.forEach((listener) => listener()); };

export function loadKerrLicenseConfirmationPacketSummaryV552(): Promise<KerrLicenseConfirmationPacketArtifactV552> {
  if (requestPromise) return requestPromise;
  publish({ status: "loading", reason: null, requestCount: 1, responseBytes: 0, summary: null });
  requestPromise = fetch("/api/atlas/relativity-evidence/v552/license-confirmation-packet", { cache: "no-store" }).then(async (response) => {
    const body = await response.text();
    const responseBytes = new TextEncoder().encode(body).byteLength;
    if (responseBytes > 128 * 1024) throw new Error("response-too-large");
    const api: KerrLicenseConfirmationPacketApiV552 = parseKerrLicenseConfirmationPacketApiV552(JSON.parse(body));
    if (!response.ok || !api.available || !api.summary) throw new Error(`v552-license-${api.reason}`);
    publish({ status: "ready", reason: null, requestCount: 1, responseBytes, summary: api.summary });
    return api.summary;
  }).catch((error: unknown) => {
    publish({ status: "unavailable", reason: error instanceof Error ? error.message : "request-failed", requestCount: 1, responseBytes: snapshot.responseBytes, summary: null });
    throw error;
  });
  return requestPromise;
}
export const getKerrLicenseConfirmationPacketSnapshotV552 = () => snapshot;
export function subscribeKerrLicenseConfirmationPacketV552(listener: () => void): () => void {
  listeners.add(listener);
  const release = acquireAtlasResource("subscription", "relativity-lab", "v552-license-confirmation-packet", { owner: "v552-license-confirmation-packet", estimatedBytes: 0 });
  let done = false;
  return () => { if (done) return; done = true; listeners.delete(listener); release(); };
}
export function getKerrLicenseConfirmationPacketTelemetryV552() { return Object.freeze({ listenerCount: listeners.size, requestCount: snapshot.requestCount, status: snapshot.status }); }
export function resetKerrLicenseConfirmationPacketClientForTestsV552(): void { if (listeners.size) throw new Error("v552-listener-leak"); snapshot = INITIAL; requestPromise = null; }
