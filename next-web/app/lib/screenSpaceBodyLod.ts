import * as THREE from "three";

/**
 * Approximate on-screen diameter (px) of a sphere with `worldRadius` at `worldCenter`
 * for a perspective camera. Good enough for label / orbit LOD.
 */
export function screenDiscDiameterPx(
  camera: THREE.PerspectiveCamera,
  viewportHeightPx: number,
  worldCenter: THREE.Vector3,
  worldRadius: number
): number {
  if (worldRadius <= 0 || !Number.isFinite(worldRadius)) return 0;
  const dist = camera.position.distanceTo(worldCenter);
  if (dist < 1e-8) return 1e6;
  const vFovRad = THREE.MathUtils.degToRad(camera.fov);
  const halfH = viewportHeightPx * 0.5;
  const tanHalf = Math.tan(vFovRad * 0.5);
  if (tanHalf < 1e-8) return 0;
  const angularRadius = Math.atan(worldRadius / dist);
  return (angularRadius / tanHalf) * halfH * 2;
}

/** Orbit trails: visible even for tiny bodies in wide solar-system views. */
export const ORBIT_SCREEN_LOD_FADE_START_PX = 0.08;
export const ORBIT_SCREEN_LOD_FADE_END_PX = 0.8;

/** Body name labels: stay readable in wide solar-system views (USB-style). */
export const LABEL_SCREEN_LOD_FADE_START_PX = 0.08;
export const LABEL_SCREEN_LOD_FADE_END_PX = 1.5;

/** 1 when disc is large on screen; fades to 0 when below ~`fadeStartPx`. */
export function lodAlphaFromScreenDiameterPx(
  px: number,
  fadeStartPx = 2,
  fadeEndPx = 9
): number {
  if (px >= fadeEndPx) return 1;
  if (px <= fadeStartPx) return 0;
  return THREE.MathUtils.smoothstep(fadeStartPx, fadeEndPx, px);
}
