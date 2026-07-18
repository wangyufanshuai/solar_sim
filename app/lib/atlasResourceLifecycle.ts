"use client";

import { useSyncExternalStore } from "react";
import type { AtlasSceneModeV2 } from "./atlasRuntimeStore";

export type AtlasRuntimeResourceKind =
  | "worker"
  | "gpu-render-target"
  | "texture"
  | "model"
  | "subscription"
  | "camera-lock";

export type AtlasRuntimeResourceSnapshot = {
  total: number;
  workers: number;
  gpuRenderTargets: number;
  textures: number;
  models: number;
  subscriptions: number;
  cameraLocks: number;
  revision: number;
};

type ResourceRecord = {
  kind: AtlasRuntimeResourceKind;
  sceneMode: AtlasSceneModeV2;
  label: string;
  acquiredAtMs: number;
};

const resources = new Map<number, ResourceRecord>();
const listeners = new Set<() => void>();
let nextId = 1;
let revision = 0;
let cachedSnapshot: AtlasRuntimeResourceSnapshot = createSnapshot();

function createSnapshot(): AtlasRuntimeResourceSnapshot {
  const counts: Record<AtlasRuntimeResourceKind, number> = {
    worker: 0,
    "gpu-render-target": 0,
    texture: 0,
    model: 0,
    subscription: 0,
    "camera-lock": 0,
  };
  resources.forEach((resource) => {
    counts[resource.kind] += 1;
  });
  return {
    total: resources.size,
    workers: counts.worker,
    gpuRenderTargets: counts["gpu-render-target"],
    textures: counts.texture,
    models: counts.model,
    subscriptions: counts.subscription,
    cameraLocks: counts["camera-lock"],
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
): () => void {
  const id = nextId++;
  resources.set(id, {
    kind,
    sceneMode,
    label,
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

export function getAtlasResourceSnapshot(): AtlasRuntimeResourceSnapshot {
  return cachedSnapshot;
}

export function listAtlasRuntimeResources(): readonly ResourceRecord[] {
  return Array.from(resources.values());
}

export function useAtlasResourceSnapshot(): AtlasRuntimeResourceSnapshot {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getAtlasResourceSnapshot,
    getAtlasResourceSnapshot,
  );
}
