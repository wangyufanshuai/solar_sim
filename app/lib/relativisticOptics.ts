import * as THREE from "three";
import { AU_METERS, C_LIGHT, DAY_SECONDS } from "./physicalConstants";

const clamp = (x: number, a: number, b: number) =>
  Math.min(b, Math.max(a, x));

/**
 * Effective speed of light in scene units per **real** second when simulation
 * advances `daysPerSecond` days per world second.
 */
export function effectiveLightSpeedScenePerRealSec(
  auToScene: number,
  daysPerSecond: number,
): number {
  const mPerScene = AU_METERS / auToScene;
  return C_LIGHT * (daysPerSecond * DAY_SECONDS) / mPerScene;
}

/**
 * Body velocity in scene units per real second from SI `velM` (m/s in sim time).
 */
export function bodyVelScenePerRealSec(
  velM: THREE.Vector3,
  auToScene: number,
  daysPerSecond: number,
  out: THREE.Vector3,
): void {
  const k = auToScene / AU_METERS;
  const scale = k * daysPerSecond * DAY_SECONDS;
  out.set(velM.x * scale, velM.y * scale, velM.z * scale);
}

/**
 * Line-of-sight β = (v_rel · n) / c_eff, n = unit(body → camera).
 * Positive ⇒ source approaches observer (blue shift).
 */
export function lineOfSightBeta(
  bodyPosScene: THREE.Vector3,
  bodyVelScenePerReal: THREE.Vector3,
  camPos: THREE.Vector3,
  camVelScenePerReal: THREE.Vector3,
  cEff: number,
  tmpRel: THREE.Vector3,
  tmpN: THREE.Vector3,
): number {
  if (cEff < 1e-30) return 0;
  tmpN.copy(camPos).sub(bodyPosScene);
  const dist = tmpN.length();
  if (dist < 1e-14) return 0;
  tmpN.multiplyScalar(1 / dist);
  tmpRel.copy(bodyVelScenePerReal).sub(camVelScenePerReal);
  const beta = tmpRel.dot(tmpN) / cEff;
  return clamp(beta, -0.995, 0.995);
}

/** Observed / emitted frequency ratio for relativistic Doppler (source rest frame). */
export function dopplerFrequencyRatio(betaLos: number): number {
  return Math.sqrt((1 + betaLos) / (1 - betaLos));
}

/**
 * Tint diffuse color: approach → blue, recession → red.
 * `strength` blends between base and shifted (0 = off).
 */
export function applyDopplerTint(
  base: THREE.Color,
  ratio: number,
  strength: number,
  out: THREE.Color,
): void {
  const t = clamp(strength, 0, 1);
  if (t < 1e-6) {
    out.copy(base);
    return;
  }
  const lr = Math.log2(clamp(ratio, 0.35, 3.2));
  const f = lr * t * 0.42;
  out.copy(base);
  out.r *= Math.exp(-f * 1.15);
  out.g *= Math.exp(-Math.abs(f) * 0.18);
  out.b *= Math.exp(f * 1.05);
  out.r = clamp(out.r, 0, 2.2);
  out.g = clamp(out.g, 0, 2.2);
  out.b = clamp(out.b, 0, 2.2);
}

/**
 * Relativistic searchlight / beaming factor on received brightness (forward lobe).
 */
export function searchlightBrightnessFactor(betaLos: number, strength: number): number {
  const t = clamp(strength, 0, 1);
  if (t < 1e-6) return 1;
  const b = clamp(betaLos, -0.99, 0.99);
  const g = 1 / Math.sqrt(Math.max(1e-10, 1 - b * b));
  const D = 1 / Math.max(1e-4, g * (1 - b));
  const Dc = clamp(D, 0.35, 10);
  const raw = Math.pow(Dc, 1.35);
  return THREE.MathUtils.lerp(1, raw, t);
}

/**
 * Extra “cinematic” strength from high time scale so visuals appear before true β is large.
 */
export function timeScaleVisualBoost(daysPerSecond: number): number {
  return clamp((daysPerSecond - 12) / 220, 0, 0.62);
}

/** Combine physical LOS β magnitude with time-scale boost for effect strength. */
export function opticsEffectStrength(
  betaLos: number,
  daysPerSecond: number,
  relativityPhysicsOn: boolean,
): number {
  const phys = clamp(Math.abs(betaLos) * (relativityPhysicsOn ? 1.25 : 0.85), 0, 0.95);
  const boost = timeScaleVisualBoost(daysPerSecond);
  return clamp(phys + boost * 0.92, 0, 1);
}
