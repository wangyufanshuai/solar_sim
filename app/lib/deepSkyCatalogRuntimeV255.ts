"use client";

import { fetchAtlasAsset } from "./atlasAssetResolver";
import type { AsterismDef } from "../data/asterismCatalog";
import { NEBULAE, type NebulaDef } from "../data/nebulaCatalog";
import { STAR_CLUSTERS, type StarClusterDef } from "../data/starClusterCatalog";

/**
 * v255 presentation assets are intent-lazy, but their parsed values are shared
 * across scene mounts. This keeps a scene-mode cycle from allocating a fresh
 * JSON graph for the same immutable catalog.
 */
let asterismPromise: Promise<readonly AsterismDef[]> | null = null;
let nebulaPromise: Promise<readonly NebulaDef[]> | null = null;
let clusterPromise: Promise<readonly StarClusterDef[]> | null = null;
let asterismCatalogCache: readonly AsterismDef[] | null = null;
let nebulaCatalogCache: readonly NebulaDef[] | null = null;
let clusterCatalogCache: readonly StarClusterDef[] | null = null;

async function readAsset<T>(path: string): Promise<readonly T[]> {
  try {
    const response = await fetchAtlasAsset(path, { cache: "force-cache" });
    if (!response.ok) return [];
    const parsed = await response.json() as unknown;
    return Array.isArray(parsed) ? parsed as readonly T[] : [];
  } catch {
    // Product-layer fallback is fail-closed and intentionally not retried.
    return [];
  }
}

export function loadAsterismsV255(): Promise<readonly AsterismDef[]> {
  asterismPromise ??= readAsset<AsterismDef>("/data/asterisms-v255.json").then((next) => {
    asterismCatalogCache = Object.freeze([...next]);
    return asterismCatalogCache;
  });
  return asterismPromise;
}

export function loadNebulaeV255(): Promise<readonly NebulaDef[]> {
  nebulaPromise ??= readAsset<NebulaDef>("/data/nebulae-v255-additions.json")
    .then((additions) => {
      nebulaCatalogCache = Object.freeze([...NEBULAE, ...additions]);
      return nebulaCatalogCache;
    });
  return nebulaPromise;
}

export function loadStarClustersV255(): Promise<readonly StarClusterDef[]> {
  clusterPromise ??= readAsset<StarClusterDef>("/data/star-clusters-v255-additions.json")
    .then((additions) => {
      clusterCatalogCache = Object.freeze([...STAR_CLUSTERS, ...additions.slice(0, 52)]);
      return clusterCatalogCache;
    });
  return clusterPromise;
}

export function getAsterismsV255Sync(): readonly AsterismDef[] {
  return asterismCatalogCache ?? [];
}

export function getNebulaeV255Sync(): readonly NebulaDef[] {
  return nebulaCatalogCache ?? NEBULAE;
}

export function getStarClustersV255Sync(): readonly StarClusterDef[] {
  return clusterCatalogCache ?? STAR_CLUSTERS;
}

/** Used by tests and evidence runners to clear only module-local loader state. */
export function resetDeepSkyCatalogRuntimeV255ForTests(): void {
  asterismPromise = null;
  nebulaPromise = null;
  clusterPromise = null;
  asterismCatalogCache = null;
  nebulaCatalogCache = null;
  clusterCatalogCache = null;
}
