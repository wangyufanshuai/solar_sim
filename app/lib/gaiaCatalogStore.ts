"use client";

import { useSyncExternalStore } from "react";
import {
  GAIA_DR3_CATALOG_URL,
  GAIA_DR3_LEGACY_CATALOG_URL,
  generatePlaceholderCatalog,
  loadGaiaCatalogFromJson,
  type GaiaStarCatalogData,
} from "../data/gaiaStarCatalog";
import { setGaiaCatalogSource } from "./gaiaCatalogSourceState";
import { fetchAtlasAsset } from "./atlasAssetResolver";

export type GaiaCatalogSnapshot = {
  status: "idle" | "loading" | "ready";
  catalog: GaiaStarCatalogData | null;
  source: "gaia-dr3" | "placeholder" | "pending";
};

const listeners = new Set<() => void>();
let snapshot: GaiaCatalogSnapshot = {
  status: "idle",
  catalog: null,
  source: "pending",
};
let loadPromise: Promise<GaiaCatalogSnapshot> | null = null;

function emit(next: GaiaCatalogSnapshot): GaiaCatalogSnapshot {
  snapshot = next;
  listeners.forEach((listener) => listener());
  return snapshot;
}

export function ensureGaiaCatalogLoaded(): Promise<GaiaCatalogSnapshot> {
  if (snapshot.status === "ready") return Promise.resolve(snapshot);
  if (loadPromise) return loadPromise;
  emit({ ...snapshot, status: "loading" });
  loadPromise = fetchAtlasAsset(GAIA_DR3_CATALOG_URL, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Gaia v255 fetch failed: ${response.status}`);
      const catalog = loadGaiaCatalogFromJson(await response.text());
      setGaiaCatalogSource("gaia-dr3");
      return emit({ status: "ready", catalog, source: "gaia-dr3" });
    })
    .catch(() =>
      fetchAtlasAsset(GAIA_DR3_LEGACY_CATALOG_URL, { cache: "force-cache" })
        .then(async (response) => {
          if (!response.ok) throw new Error(`Legacy Gaia fetch failed: ${response.status}`);
          const catalog = loadGaiaCatalogFromJson(await response.text());
          setGaiaCatalogSource("gaia-dr3");
          return emit({ status: "ready", catalog, source: "gaia-dr3" });
        })
        .catch(() => {
          const catalog = generatePlaceholderCatalog(5000);
          setGaiaCatalogSource("placeholder");
          return emit({ status: "ready", catalog, source: "placeholder" });
        }),
    );
  return loadPromise;
}

export function getGaiaCatalogSnapshot(): GaiaCatalogSnapshot {
  return snapshot;
}

export function subscribeGaiaCatalog(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useGaiaCatalogSnapshot(): GaiaCatalogSnapshot {
  return useSyncExternalStore(
    subscribeGaiaCatalog,
    getGaiaCatalogSnapshot,
    getGaiaCatalogSnapshot,
  );
}
