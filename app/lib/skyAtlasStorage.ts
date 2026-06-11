"use client";

import type { SkyAtlasCustomRoute, SkyAtlasStorageV1 } from "./skyAtlas";

export const SKY_ATLAS_STORAGE_KEY = "solar-sim:sky-atlas:v1";

export const EMPTY_SKY_ATLAS_STORAGE: SkyAtlasStorageV1 = {
  schemaVersion: 1,
  favorites: [],
  recent: [],
  customRoutes: [],
};

function sanitizeCustomRoute(value: unknown): SkyAtlasCustomRoute | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<SkyAtlasCustomRoute>;
  if (typeof raw.id !== "string" || typeof raw.name !== "string" || !Array.isArray(raw.stops)) return null;
  const stops = raw.stops
    .map((stop, index) => {
      if (!stop || typeof stop !== "object") return null;
      const item = stop as { id?: unknown; objectId?: unknown; holdMs?: unknown; note?: unknown };
      if (typeof item.objectId !== "string") return null;
      return {
        id: typeof item.id === "string" ? item.id : `custom-stop-${index + 1}`,
        objectId: item.objectId,
        holdMs: typeof item.holdMs === "number" && Number.isFinite(item.holdMs) ? item.holdMs : 7500,
        note: typeof item.note === "string" ? item.note : "Custom Sky Atlas stop",
      };
    })
    .filter(Boolean) as SkyAtlasCustomRoute["stops"];
  if (!stops.length) return null;
  return {
    id: raw.id,
    name: raw.name,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date(0).toISOString(),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date(0).toISOString(),
    stops,
  };
}

export function sanitizeSkyAtlasStorage(value: unknown): SkyAtlasStorageV1 {
  if (!value || typeof value !== "object") return EMPTY_SKY_ATLAS_STORAGE;
  const raw = value as Partial<SkyAtlasStorageV1>;
  return {
    schemaVersion: 1,
    favorites: Array.isArray(raw.favorites) ? raw.favorites.filter((item): item is string => typeof item === "string") : [],
    recent: Array.isArray(raw.recent) ? raw.recent.filter((item): item is string => typeof item === "string") : [],
    customRoutes: Array.isArray(raw.customRoutes)
      ? raw.customRoutes.map(sanitizeCustomRoute).filter(Boolean).slice(0, 8) as SkyAtlasCustomRoute[]
      : [],
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

export function upsertCustomRoute(storage: SkyAtlasStorageV1, route: SkyAtlasCustomRoute): SkyAtlasStorageV1 {
  const routes = [route, ...(storage.customRoutes ?? []).filter((item) => item.id !== route.id)].slice(0, 8);
  return { ...storage, customRoutes: routes };
}

export function removeCustomRoute(storage: SkyAtlasStorageV1, routeId: string): SkyAtlasStorageV1 {
  return { ...storage, customRoutes: (storage.customRoutes ?? []).filter((route) => route.id !== routeId) };
}
