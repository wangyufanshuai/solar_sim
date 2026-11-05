import type { CelestialObjectKind } from "./simulationDiagnosticsTypes";
import type { StellarHeroIdV592 } from "./stellarHeroesV592";

export const SKY_TARGET_DISTANCE_SCENE = 9500;
export const SKY_TARGET_CAMERA_DISTANCE_SCENE = 820;
export const SKY_TARGET_CAMERA_HEIGHT_SCENE = 110;
export const SKY_TARGET_ZOOM_MIN_DISTANCE_SCENE = 80;
export const SKY_TARGET_ZOOM_MAX_DISTANCE_SCENE = 6800;

type SkyTargetFocusDescriptorBase = {
  id: string;
  label: string;
  kind: "catalog" | "gaia";
  source: string;
  direction: readonly [number, number, number];
};

export type SkyTargetVariabilityState =
  | Readonly<{
      knownState: "known";
      value: boolean;
      authority: string;
    }>
  | Readonly<{
      knownState: "unknown";
      value: null;
      authority: string;
    }>;

type StellarSkyTargetParameters = {
  color?: string;
  colorBpRp?: number | null;
  mag?: number | null;
  parallaxMas?: number | null;
  teffK?: number | null;
  teffLowerK?: number | null;
  teffUpperK?: number | null;
  logg?: number | null;
  radiusSolar?: number | null;
  metallicityDex?: number | null;
  luminositySolar?: number | null;
  dataTier?: "parameter-rich" | "photometric-derived" | "catalog-basic" | null;
  variability: SkyTargetVariabilityState;
  spectralType?: string | null;
};

export type StellarHeroSkyTargetFocusDescriptor =
  SkyTargetFocusDescriptorBase
  & StellarSkyTargetParameters
  & Readonly<{
    targetType: "stellar-hero";
    kind: "catalog";
    heroId: StellarHeroIdV592;
  }>;

export type GaiaStellarSkyTargetFocusDescriptor =
  SkyTargetFocusDescriptorBase
  & StellarSkyTargetParameters
  & Readonly<{
    targetType: "gaia-stellar";
    kind: "gaia";
  }>;

export type CatalogStellarSkyTargetFocusDescriptor =
  SkyTargetFocusDescriptorBase
  & StellarSkyTargetParameters
  & Readonly<{
    targetType: "catalog-stellar";
    kind: "catalog";
    catalogObjectKind: "nearby-star" | "bright-star";
  }>;

export type NonStellarCatalogSkyTargetFocusDescriptor =
  SkyTargetFocusDescriptorBase
  & Readonly<{
    targetType: "non-stellar-catalog";
    kind: "catalog";
    catalogObjectKind: Exclude<CelestialObjectKind, "nearby-star" | "bright-star">;
    color?: string;
    mag?: number | null;
    parallaxMas?: number | null;
  }>;

export type StellarSkyTargetFocusDescriptor =
  | StellarHeroSkyTargetFocusDescriptor
  | GaiaStellarSkyTargetFocusDescriptor
  | CatalogStellarSkyTargetFocusDescriptor;

export type SkyTargetFocusDescriptor =
  | StellarSkyTargetFocusDescriptor
  | NonStellarCatalogSkyTargetFocusDescriptor;

export function isStellarSkyTargetFocusDescriptor(
  descriptor: SkyTargetFocusDescriptor,
): descriptor is StellarSkyTargetFocusDescriptor {
  return descriptor.targetType !== "non-stellar-catalog";
}

export function normalizeSkyTargetDirection(
  direction: readonly [number, number, number],
): [number, number, number] | null {
  const [x, y, z] = direction;
  const len = Math.hypot(x, y, z);
  if (!Number.isFinite(len) || len < 1e-10) return null;
  return [x / len, y / len, z / len];
}

export function skyTargetPosition(
  direction: readonly [number, number, number],
  distance = SKY_TARGET_DISTANCE_SCENE,
): [number, number, number] | null {
  const normalized = normalizeSkyTargetDirection(direction);
  if (!normalized) return null;
  return [
    normalized[0] * distance,
    normalized[1] * distance,
    normalized[2] * distance,
  ];
}

export function clampSkyTargetZoomDistance(distance: number): number {
  if (!Number.isFinite(distance)) return SKY_TARGET_CAMERA_DISTANCE_SCENE;
  return Math.max(
    SKY_TARGET_ZOOM_MIN_DISTANCE_SCENE,
    Math.min(SKY_TARGET_ZOOM_MAX_DISTANCE_SCENE, distance),
  );
}
