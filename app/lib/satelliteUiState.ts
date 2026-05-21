"use client";

export type SatelliteUiSnapshot = {
  selectedSatelliteId: string | null;
  selectedSatelliteName: string | null;
  fsplFrequencyMHz: number;
  fsplDistanceKm: number | null;
  fsplDb: number | null;
  overTokyo: boolean;
  groupFilter: "all" | "stations" | "qzss" | "starlink";
};

const state: SatelliteUiSnapshot = {
  selectedSatelliteId: null,
  selectedSatelliteName: null,
  fsplFrequencyMHz: 2200,
  fsplDistanceKm: null,
  fsplDb: null,
  overTokyo: false,
  groupFilter: "all",
};

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((cb) => cb());
}

export function getSatelliteUiSnapshot(): SatelliteUiSnapshot {
  return { ...state };
}

export function subscribeSatelliteUi(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setSatelliteFrequencyMHz(next: number): void {
  state.fsplFrequencyMHz = Math.max(10, Math.min(60000, next));
  emit();
}

export function setSatelliteSelection(id: string | null, name: string | null): void {
  state.selectedSatelliteId = id;
  state.selectedSatelliteName = name;
  emit();
}

export function setSatelliteLinkMetrics(
  distanceKm: number | null,
  fsplDb: number | null,
  overTokyo: boolean
): void {
  state.fsplDistanceKm = distanceKm;
  state.fsplDb = fsplDb;
  state.overTokyo = overTokyo;
  emit();
}

export function setSatelliteGroupFilter(
  next: "all" | "stations" | "qzss" | "starlink"
): void {
  state.groupFilter = next;
  emit();
}

