import * as THREE from "three";
import { AU_TO_SCENE } from "../data/planetsJ2000";

// ── LOD tiers ────────────────────────────────────────────────────────
export type GalacticLodTier = "solar" | "mid" | "far";

/** Camera distance from solar-system origin in AU that triggers LOD transitions. */
export const LOD_MID_ENTER_AU = 200;
export const LOD_MID_EXIT_AU = 150;
export const LOD_FAR_ENTER_AU = 50000;
export const LOD_FAR_EXIT_AU = 40000;

// ── Floating-origin state ────────────────────────────────────────────
export type FloatingOriginState = {
  /** Offset in AU – subtracted from body positions before conversion to scene units. */
  offsetAu: [number, number, number];
  /** Current LOD tier driven by camera distance from the solar-system barycenter. */
  lodTier: GalacticLodTier;
  /** Pre-computed scene-space offset (offsetAu × AU_TO_SCENE). */
  offsetScene: THREE.Vector3;
};

/** Create a zero-origin state (solar tier). */
export function createFloatingOrigin(): FloatingOriginState {
  return {
    offsetAu: [0, 0, 0],
    lodTier: "solar",
    offsetScene: new THREE.Vector3(0, 0, 0),
  };
}

/**
 * Recompute the floating origin from the camera's current scene position.
 *
 * The camera is always near (0,0,0) in scene space.  Its "real" AU position
 * is `cameraScene / AU_TO_SCENE + currentOrigin.offsetAu`.  The LOD tier is
 * derived from the absolute distance with hysteresis to prevent toggling.
 *
 * **For solar tier** the offset stays at (0,0,0) – all body positions are
 * unchanged from the current behaviour.
 *
 * **For mid / far tiers** the offset snaps the scene origin so that the
 * camera's absolute position maps to near (0,0,0) in scene space.
 */
export function updateFloatingOrigin(
  cameraPositionScene: THREE.Vector3,
  current: FloatingOriginState
): FloatingOriginState {
  const u = AU_TO_SCENE;
  const cx = cameraPositionScene.x / u + current.offsetAu[0];
  const cy = cameraPositionScene.y / u + current.offsetAu[1];
  const cz = cameraPositionScene.z / u + current.offsetAu[2];
  const distAu = Math.sqrt(cx * cx + cy * cy + cz * cz);

  // LOD tier with hysteresis
  let tier = current.lodTier;
  if (tier === "solar") {
    if (distAu >= LOD_MID_ENTER_AU) tier = "mid";
  } else if (tier === "mid") {
    if (distAu >= LOD_FAR_ENTER_AU) tier = "far";
    else if (distAu < LOD_MID_EXIT_AU) tier = "solar";
  } else {
    // far
    if (distAu < LOD_FAR_EXIT_AU) tier = "mid";
  }

  // Floating origin offset: in solar tier keep zero; in mid/far snap to camera.
  const oAu: [number, number, number] =
    tier === "solar"
      ? [0, 0, 0]
      : [cx, cy, cz];

  return {
    offsetAu: oAu,
    lodTier: tier,
    offsetScene: new THREE.Vector3(oAu[0] * u, oAu[1] * u, oAu[2] * u),
  };
}

/**
 * Convert a body position (AU) to scene coordinates, subtracting the floating
 * origin offset so the camera always sits near the scene origin.
 */
export function applyFloatingOffsetScene(
  bodyAuX: number,
  bodyAuY: number,
  bodyAuZ: number,
  origin: FloatingOriginState
): [number, number, number] {
  const u = AU_TO_SCENE;
  return [
    (bodyAuX - origin.offsetAu[0]) * u,
    (bodyAuY - origin.offsetAu[1]) * u,
    (bodyAuZ - origin.offsetAu[2]) * u,
  ];
}
