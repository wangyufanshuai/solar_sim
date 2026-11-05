import { DAY_SECONDS, AU_METERS, C_LIGHT } from "./physicalConstants";
import type { HorizonsRefBody } from "../data/horizonsReference";

const SUN_BODY_INDEX = 0;

/** Heliocentric distance |r_i − r_☉| in AU (posAu sun-centered). */
export function heliocentricDistanceAu(
  posAu: Float64Array,
  bodyIndex: number,
  sunIndex: number = SUN_BODY_INDEX
): number {
  const sx = posAu[3 * sunIndex]!;
  const sy = posAu[3 * sunIndex + 1]!;
  const sz = posAu[3 * sunIndex + 2]!;
  const dx = posAu[3 * bodyIndex]! - sx;
  const dy = posAu[3 * bodyIndex + 1]! - sy;
  const dz = posAu[3 * bodyIndex + 2]! - sz;
  return Math.hypot(dx, dy, dz);
}

/**
 * Line-of-sight Doppler factor z ≈ v_r / c (small-z), v_r = v · û with û from camera toward body.
 * Camera position in scene units; body posAu; velM in m/s; axes aligned with posAu.
 */
export function lineOfSightDopplerZ(
  posAu: Float64Array,
  velM: Float64Array,
  bodyIndex: number,
  camSceneX: number,
  camSceneY: number,
  camSceneZ: number,
  auToScene: number
): number {
  const invS = 1 / auToScene;
  const bx = posAu[3 * bodyIndex]!;
  const by = posAu[3 * bodyIndex + 1]!;
  const bz = posAu[3 * bodyIndex + 2]!;
  const cx = camSceneX * invS;
  const cy = camSceneY * invS;
  const cz = camSceneZ * invS;
  let ux = bx - cx;
  let uy = by - cy;
  let uz = bz - cz;
  const len = Math.hypot(ux, uy, uz);
  if (len < 1e-18) return 0;
  ux /= len;
  uy /= len;
  uz /= len;
  const vx = velM[3 * bodyIndex]!;
  const vy = velM[3 * bodyIndex + 1]!;
  const vz = velM[3 * bodyIndex + 2]!;
  const vr = vx * ux + vy * uy + vz * uz;
  return vr / C_LIGHT;
}

export type HorizonsSimDelta = {
  drAu: number;
  dvKmS: number;
};

/** |r_sim − r_ref| (AU) and |v_sim − v_ref| (km/s); ref in AU and AU/day. */
export function horizonsStateDelta(
  posAu: Float64Array,
  velM: Float64Array,
  bodyIndex: number,
  ref: HorizonsRefBody
): HorizonsSimDelta {
  const dx = posAu[3 * bodyIndex]! - ref.x_au;
  const dy = posAu[3 * bodyIndex + 1]! - ref.y_au;
  const dz = posAu[3 * bodyIndex + 2]! - ref.z_au;
  const drAu = Math.hypot(dx, dy, dz);
  const vxSimAuD = (velM[3 * bodyIndex]! * DAY_SECONDS) / AU_METERS;
  const vySimAuD = (velM[3 * bodyIndex + 1]! * DAY_SECONDS) / AU_METERS;
  const vzSimAuD = (velM[3 * bodyIndex + 2]! * DAY_SECONDS) / AU_METERS;
  const dvx = vxSimAuD - ref.vx_au_d;
  const dvy = vySimAuD - ref.vy_au_d;
  const dvz = vzSimAuD - ref.vz_au_d;
  const dvAuD = Math.hypot(dvx, dvy, dvz);
  const dvKmS = dvAuD * (AU_METERS / DAY_SECONDS) / 1000;
  return { drAu, dvKmS };
}
