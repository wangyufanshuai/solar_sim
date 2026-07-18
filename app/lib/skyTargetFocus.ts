export const SKY_TARGET_DISTANCE_SCENE = 9500;
export const SKY_TARGET_CAMERA_DISTANCE_SCENE = 820;
export const SKY_TARGET_CAMERA_HEIGHT_SCENE = 110;
export const SKY_TARGET_ZOOM_MIN_DISTANCE_SCENE = 80;
export const SKY_TARGET_ZOOM_MAX_DISTANCE_SCENE = 6800;

export type SkyTargetFocusDescriptor = {
  id: string;
  label: string;
  kind: "catalog" | "gaia";
  source: string;
  direction: readonly [number, number, number];
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
  variable?: boolean;
  spectralType?: string | null;
};

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
