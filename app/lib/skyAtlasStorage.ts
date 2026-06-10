"use client";

import type { SkyAtlasStorageV1 } from "./skyAtlas";

export const SKY_ATLAS_STORAGE_KEY = "solar-sim:sky-atlas:v1";

export const EMPTY_SKY_ATLAS_STORAGE: SkyAtlasStorageV1 = {
  schemaVersion: 1,
  favorites: [],
  recent: [],
};

export function sanitizeSkyAtlasStorage(value: unknown): SkyAtlasStorageV1 {
  if (!value || typeof value !== "object") return EMPTY_SKY_ATLAS_STORAGE;
  const raw = value as Partial<SkyAtlasStorageV1>;
  return {
    schemaVersion: 1,
    favorites: Array.isArray(raw.favorites) ? raw.favorites.filter((item): item is string => typeof item === "string") : [],
    recent: Array.isArray(raw.recent) ? raw.recent.filter((item): item is string => typeof item === "string") : [],
  };
}

export function loadSkyAtlasStorage(): SkyAtlasStorageV1 {
  if (typeof window === "undefined") return EMPTY_SKY_ATLAS_STORAGE;
  try {
    const raw = window.localStorage.getItem(SKY_ATLAS_STORAGE_KEY);
    return raw ? sanitizeSkyAtlasStorage(JSON.parse(raw)) : EMPTY_SKY_ATLAS_STORAGE;
  } catch {
    return EMPTY_SKY_ATLAS_STORAGE;
  }
}

export function saveSkyAtlasStorage(storage: SkyAtlasStorageV1): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SKY_ATLAS_STORAGE_KEY, JSON.stringify(sanitizeSkyAtlasStorage(storage)));
  } catch {
    // Storage is an enhancement; Atlas remains functional without persistence.
  }
}

export function withRecent(storage: SkyAtlasStorageV1, objectId: string): SkyAtlasStorageV1 {
  return {
    ...storage,
    recent: [objectId, ...storage.recent.filter((id) => id !== objectId)].slice(0, 16),
  };
}

export function toggleFavorite(storage: SkyAtlasStorageV1, objectId: string): SkyAtlasStorageV1 {
  const exists = storage.favorites.includes(objectId);
  return {
    ...storage,
    favorites: exists ? storage.favorites.filter((id) => id !== objectId) : [objectId, ...storage.favorites].slice(0, 32),
  };
}
