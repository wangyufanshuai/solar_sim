"use client";

import { useSyncExternalStore } from "react";
import type { AtlasSceneModeV2 } from "./atlasRuntimeStore";
import type { Texture } from "three";

export type AtlasRuntimeResourceKind =
  | "worker"
  | "gpu-render-target"
  | "gpu-buffer"
  | "gpu-compute-pipeline"
  | "gpu-query"
  | "texture"
  | "model"
  | "subscription"
  | "object-url"
  | "typed-array-cache"
  | "camera-lock";

export type AtlasRuntimeResourceSnapshot = {
  total: number;
  workers: number;
  gpuRenderTargets: number;
  gpuBuffers: number;
  gpuComputePipelines: number;
  gpuQueries: number;
  textures: number;
  models: number;
  subscriptions: number;
  objectUrls: number;
  typedArrayCaches: number;
  cameraLocks: number;
  estimatedBytes: number;
  estimatedGpuBytes: number;
  byOwner: Readonly<Record<string, { count: number; estimatedBytes: number }>>;
  byKind: Readonly<Record<AtlasRuntimeResourceKind, { count: number; estimatedBytes: number }>>;
  byIdentity: Readonly<Record<string, { kind: AtlasRuntimeResourceKind; sceneMode: AtlasSceneModeV2; owner: string; label: string; count: number; estimatedBytes: number; contentSha256: string | null; manifestSha256: string | null }>>;
  identityDigest: string;
  revision: number;
};

export type AtlasRuntimeResourceRecord = {
  kind: AtlasRuntimeResourceKind;
  sceneMode: AtlasSceneModeV2;
  owner: string;
  label: string;
  estimatedBytes: number;
  contentSha256: string | null;
  manifestSha256: string | null;
  acquiredAtMs: number;
};

export type AtlasResourceAcquisitionV275 = {
  owner?: string;
  estimatedBytes?: number;
  contentSha256?: string;
  manifestSha256?: string;
};

export type AtlasTrackedTextureRecordV289 = {
  width: number;
  height: number;
  bytesPerPixel: number;
  mipmapFactor: number;
  estimatedBytes: number;
};

export type AtlasResourceBaselineDiffV300 = {
  status: "baseline" | "drift";
  total: number;
  workers: number;
  gpuRenderTargets: number;
  gpuBuffers: number;
  gpuComputePipelines: number;
  gpuQueries: number;
  textures: number;
  models: number;
  subscriptions: number;
  objectUrls: number;
  typedArrayCaches: number;
  cameraLocks: number;
  estimatedBytes: number;
  estimatedGpuBytes: number;
  identityChanged: boolean;
  ownerChanged: boolean;
};

const resources = new Map<number, AtlasRuntimeResourceRecord>();
const sharedTextureResources = new WeakMap<Texture, { references: number; releaseRegistry: () => void }>();
const listeners = new Set<() => void>();
let nextId = 1;
let revision = 0;
let cachedSnapshot: AtlasRuntimeResourceSnapshot = createSnapshot();

function createSnapshot(): AtlasRuntimeResourceSnapshot {
  const counts: Record<AtlasRuntimeResourceKind, number> = {
    worker: 0,
    "gpu-render-target": 0,
    "gpu-buffer": 0,
    "gpu-compute-pipeline": 0,
    "gpu-query": 0,
    texture: 0,
    model: 0,
    subscription: 0,
    "object-url": 0,
    "typed-array-cache": 0,
    "camera-lock": 0,
  };
  let estimatedBytes = 0;
  let estimatedGpuBytes = 0;
  const byOwner: Record<string, { count: number; estimatedBytes: number }> = {};
  const byKind = Object.fromEntries(Object.keys(counts).map((kind) => [kind, { count: 0, estimatedBytes: 0 }])) as Record<AtlasRuntimeResourceKind, { count: number; estimatedBytes: number }>;
  const byIdentity: Record<string, { kind: AtlasRuntimeResourceKind; sceneMode: AtlasSceneModeV2; owner: string; label: string; count: number; estimatedBytes: number; contentSha256: string | null; manifestSha256: string | null }> = {};
  resources.forEach((resource) => {
    counts[resource.kind] += 1;
    estimatedBytes += resource.estimatedBytes;
    if (resource.kind === "gpu-buffer" || resource.kind === "gpu-render-target" || resource.kind === "texture") {
      estimatedGpuBytes += resource.estimatedBytes;
    }
    const owner = byOwner[resource.owner] ?? { count: 0, estimatedBytes: 0 };
    owner.count += 1;
    owner.estimatedBytes += resource.estimatedBytes;
    byOwner[resource.owner] = owner;
    byKind[resource.kind].count += 1;
    byKind[resource.kind].estimatedBytes += resource.estimatedBytes;
    const identityKey = JSON.stringify([resource.kind, resource.sceneMode, resource.owner, resource.label, resource.contentSha256, resource.manifestSha256]);
    const identity = byIdentity[identityKey] ?? { kind: resource.kind, sceneMode: resource.sceneMode, owner: resource.owner, label: resource.label, count: 0, estimatedBytes: 0, contentSha256: resource.contentSha256, manifestSha256: resource.manifestSha256 };
    identity.count += 1;
    identity.estimatedBytes += resource.estimatedBytes;
    byIdentity[identityKey] = identity;
  });
  const sortedOwners = Object.fromEntries(Object.entries(byOwner).sort(([left], [right]) => left.localeCompare(right)));
  const sortedIdentities = Object.fromEntries(Object.entries(byIdentity).sort(([left], [right]) => left.localeCompare(right)));
  const identityText = JSON.stringify(sortedIdentities);
  let identityHash = 0x811c9dc5;
  for (let index = 0; index < identityText.length; index += 1) {
    identityHash ^= identityText.charCodeAt(index);
    identityHash = Math.imul(identityHash, 0x01000193) >>> 0;
  }
  return {
    total: resources.size,
    workers: counts.worker,
    gpuRenderTargets: counts["gpu-render-target"],
    gpuBuffers: counts["gpu-buffer"],
    gpuComputePipelines: counts["gpu-compute-pipeline"],
    gpuQueries: counts["gpu-query"],
    textures: counts.texture,
    models: counts.model,
    subscriptions: counts.subscription,
    objectUrls: counts["object-url"],
    typedArrayCaches: counts["typed-array-cache"],
    cameraLocks: counts["camera-lock"],
    estimatedBytes,
    estimatedGpuBytes,
    byOwner: sortedOwners,
    byKind,
    byIdentity: sortedIdentities,
    identityDigest: identityHash.toString(16).padStart(8, "0"),
    revision,
  };
}

function publish(): void {
  revision += 1;
  cachedSnapshot = createSnapshot();
  listeners.forEach((listener) => listener());
}

export function acquireAtlasResource(
  kind: AtlasRuntimeResourceKind,
  sceneMode: AtlasSceneModeV2,
  label: string,
  acquisition: AtlasResourceAcquisitionV275 = {},
): () => void {
  const id = nextId++;
  const estimatedBytes = Number.isFinite(acquisition.estimatedBytes)
    ? Math.max(0, Math.trunc(acquisition.estimatedBytes ?? 0))
    : 0;
  const normalizeSha = (value: string | undefined, field: string): string | null => {
    if (value === undefined) return null;
    if (!/^[a-f0-9]{64}$/.test(value)) throw new Error(`invalid atlas resource ${field}`);
    return value;
  };
  resources.set(id, {
    kind,
    sceneMode,
    owner: acquisition.owner?.trim() || sceneMode,
    label,
    estimatedBytes,
    contentSha256: normalizeSha(acquisition.contentSha256, "content SHA"),
    manifestSha256: normalizeSha(acquisition.manifestSha256, "manifest SHA"),
    acquiredAtMs: typeof performance === "undefined" ? Date.now() : performance.now(),
  });
  publish();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    resources.delete(id);
    publish();
  };
}

export function estimateAtlasTextureBytesV289(texture: Texture): AtlasTrackedTextureRecordV289 {
  const image = texture.image as { width?: number; height?: number } | undefined;
  const width = Math.max(0, Math.trunc(Number(image?.width ?? 0)));
  const height = Math.max(0, Math.trunc(Number(image?.height ?? 0)));
  const bytesPerPixel = 4;
  const mipmapFactor = texture.generateMipmaps ? 4 / 3 : 1;
  return {
    width,
    height,
    bytesPerPixel,
    mipmapFactor,
    estimatedBytes: Math.ceil(width * height * bytesPerPixel * mipmapFactor),
  };
}

export function acquireAtlasTextureResourceV289(
  texture: Texture,
  sceneMode: AtlasSceneModeV2,
  label: string,
  owner: string,
): () => void {
  const shared = sharedTextureResources.get(texture);
  if (shared) {
    shared.references += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      shared.references -= 1;
      if (shared.references > 0) return;
      sharedTextureResources.delete(texture);
      shared.releaseRegistry();
    };
  }
  const estimate = estimateAtlasTextureBytesV289(texture);
  const contentSha256 = texture.userData.atlasVisualAssetSha256;
  const manifestSha256 = texture.userData.atlasVisualAssetManifestSha256;
  if ((contentSha256 !== undefined && (typeof contentSha256 !== "string" || !/^[a-f0-9]{64}$/.test(contentSha256)))
    || (manifestSha256 !== undefined && (typeof manifestSha256 !== "string" || !/^[a-f0-9]{64}$/.test(manifestSha256)))) throw new Error("invalid tracked texture provenance");
  const releaseRegistry = acquireAtlasResource("texture", sceneMode, label, {
    owner,
    estimatedBytes: estimate.estimatedBytes,
    contentSha256,
    manifestSha256,
  });
  const entry = { references: 1, releaseRegistry };
  sharedTextureResources.set(texture, entry);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    entry.references -= 1;
    if (entry.references > 0) return;
    sharedTextureResources.delete(texture);
    entry.releaseRegistry();
  };
}

export function getAtlasTextureReferenceCountV300(texture: Texture): number {
  return sharedTextureResources.get(texture)?.references ?? 0;
}

export function diffAtlasResourceSnapshotsV300(
  baseline: AtlasRuntimeResourceSnapshot,
  current: AtlasRuntimeResourceSnapshot,
): AtlasResourceBaselineDiffV300 {
  const diff = {
    total: current.total - baseline.total,
    workers: current.workers - baseline.workers,
    gpuRenderTargets: current.gpuRenderTargets - baseline.gpuRenderTargets,
    gpuBuffers: current.gpuBuffers - baseline.gpuBuffers,
    gpuComputePipelines: current.gpuComputePipelines - baseline.gpuComputePipelines,
    gpuQueries: current.gpuQueries - baseline.gpuQueries,
    textures: current.textures - baseline.textures,
    models: current.models - baseline.models,
    subscriptions: current.subscriptions - baseline.subscriptions,
    objectUrls: current.objectUrls - baseline.objectUrls,
    typedArrayCaches: current.typedArrayCaches - baseline.typedArrayCaches,
    cameraLocks: current.cameraLocks - baseline.cameraLocks,
    estimatedBytes: current.estimatedBytes - baseline.estimatedBytes,
    estimatedGpuBytes: current.estimatedGpuBytes - baseline.estimatedGpuBytes,
  };
  const identityChanged = current.identityDigest !== baseline.identityDigest;
  const ownerChanged = JSON.stringify(current.byOwner) !== JSON.stringify(baseline.byOwner);
  return {
    status: Object.values(diff).every((value) => value === 0) && !identityChanged && !ownerChanged ? "baseline" : "drift",
    ...diff,
    identityChanged,
    ownerChanged,
  };
}

export function getAtlasResourceSnapshot(): AtlasRuntimeResourceSnapshot {
  return cachedSnapshot;
}

export function subscribeAtlasResourceSnapshot(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function listAtlasRuntimeResources(): readonly AtlasRuntimeResourceRecord[] {
  return Array.from(resources.values());
}

export function useAtlasResourceSnapshot(): AtlasRuntimeResourceSnapshot {
  return useSyncExternalStore(
    subscribeAtlasResourceSnapshot,
    getAtlasResourceSnapshot,
    getAtlasResourceSnapshot,
  );
}
