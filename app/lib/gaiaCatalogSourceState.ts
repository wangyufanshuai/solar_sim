"use client";

import { useSyncExternalStore } from "react";
import type { GaiaCatalogSource } from "../data/gaiaStarCatalog";

let currentSource: GaiaCatalogSource = "placeholder";
const listeners = new Set<() => void>();

export function getGaiaCatalogSource(): GaiaCatalogSource {
  return currentSource;
}

export function setGaiaCatalogSource(source: GaiaCatalogSource): void {
  if (source === currentSource) return;
  currentSource = source;
  listeners.forEach((listener) => listener());
}

export function useGaiaCatalogSource(): GaiaCatalogSource {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => currentSource,
    () => "placeholder",
  );
}
