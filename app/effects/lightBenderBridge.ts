import * as THREE from "three";
import type { PerspectiveCamera } from "three";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import { AU_METERS } from "../lib/physicalConstants";
import { AU_TO_SCENE } from "../data/planetsJ2000";

export const LIGHT_BENDER_MAX_BODIES = 12;

/** Scene meters per Three unit (positions match `posAu * AU_TO_SCENE`). */
export const METERS_PER_SCENE_UNIT = AU_METERS / AU_TO_SCENE;

export type LensingQuality = "high" | "medium" | "low";

export type LightBenderBridgeState = {
  enabled: boolean;
  lensingStrength: number;
  stepCount: number;
  uvDeflectScale: number;
  skyDepthStart: number;
  skyDepthEnd: number;
  /** Max bodies sent to shader after culling (from quality tier). */
  maxLensingBodies: number;
  quality: LensingQuality;
  tangentialRingBoost: number;
  arcTapEnabled: number;
  arcTapStrength: number;
  arcTapThreshold: number;
  bodyCount: number;
  /** SI kg */
  bodyMass: Float32Array;
  /** Scene units, same frame as Three camera */
  bodyPos: THREE.Vector3[];
  inverseProjectionMatrix: THREE.Matrix4;
  cameraWorldMatrix: THREE.Matrix4;
  projectionMatrix: THREE.Matrix4;
  viewMatrix: THREE.Matrix4;
  cameraPosition: THREE.Vector3;
  /** World-space distance along ray for screen reprojection (scene units). */
  correlationRayDistance: number;
  /** Sun screen UV (0–1), for tangential ring boost; (.5,.5) if invalid. */
  sunUv: THREE.Vector2;
  /** 1 when sun projection is usable for ring boost. */
  sunRingValid: number;
};

function makeBodyPosArray(): THREE.Vector3[] {
  const a: THREE.Vector3[] = [];
  for (let i = 0; i < LIGHT_BENDER_MAX_BODIES; i++) {
    a.push(new THREE.Vector3());
  }
  return a;
}

export const lightBenderBridgeState: LightBenderBridgeState = {
  enabled: false,
  lensingStrength: 1,
  stepCount: 10,
  uvDeflectScale: 5,
  skyDepthStart: 0.985,
  skyDepthEnd: 0.9995,
  maxLensingBodies: 12,
  quality: "high",
  tangentialRingBoost: 1.15,
  arcTapEnabled: 1,
  arcTapStrength: 0.85,
  arcTapThreshold: 0.002,
  bodyCount: 0,
  bodyMass: new Float32Array(LIGHT_BENDER_MAX_BODIES),
  bodyPos: makeBodyPosArray(),
  inverseProjectionMatrix: new THREE.Matrix4(),
  cameraWorldMatrix: new THREE.Matrix4(),
  projectionMatrix: new THREE.Matrix4(),
  viewMatrix: new THREE.Matrix4(),
  cameraPosition: new THREE.Vector3(),
  correlationRayDistance: 9500,
  sunUv: new THREE.Vector2(0.5, 0.5),
  sunRingValid: 0,
};

const _toBody = new THREE.Vector3();
const _sunProj = new THREE.Vector3();
const _forward = new THREE.Vector3();

type ScoredBody = { index: number; score: number };

function parseQuality(raw: string | undefined): LensingQuality {
  const q = raw?.trim().toLowerCase();
  if (q === "low" || q === "medium" || q === "high") return q;
  return "high";
}

/**
 * Fill bridge from physics (SI positions) and camera; call from `useFrame`.
 * Culls to `maxLensingBodies`: Sun (index 0) always first, then highest GM/distance² among forward hemisphere.
 */
export function updateLightBenderBridge(
  physics: SolarSystemPhysicsRef | null,
  camera: PerspectiveCamera
): void {
  const st = lightBenderBridgeState;
  st.inverseProjectionMatrix.copy(camera.projectionMatrixInverse);
  st.cameraWorldMatrix.copy(camera.matrixWorld);
  st.projectionMatrix.copy(camera.projectionMatrix);
  st.viewMatrix.copy(camera.matrixWorldInverse);
  camera.getWorldPosition(st.cameraPosition);
  st.correlationRayDistance = Math.min(
    (camera.far ?? 10000) * 0.95,
    9.5e6,
  );

  if (!st.enabled || !physics || physics.n < 1) {
    st.bodyCount = 0;
    st.sunUv.set(0.5, 0.5);
    st.sunRingValid = 0;
    return;
  }

  const maxB = Math.min(
    LIGHT_BENDER_MAX_BODIES,
    Math.max(1, st.maxLensingBodies),
  );
  const s = AU_TO_SCENE;
  camera.getWorldDirection(_forward);

  const scored: ScoredBody[] = [];
  const nPhys = Math.min(physics.n, 512);
  for (let i = 1; i < nPhys; i++) {
    _toBody.set(
      physics.posAu[3 * i]! * s,
      physics.posAu[3 * i + 1]! * s,
      physics.posAu[3 * i + 2]! * s,
    );
    _toBody.sub(st.cameraPosition);
    const dist = Math.max(_toBody.length(), 80);
    const cosFwd = _toBody.dot(_forward) / dist;
    if (cosFwd < -0.1) continue;
    const mass = physics.mass[i]!;
    if (!(mass > 0)) continue;
    const score = mass / (dist * dist);
    scored.push({ index: i, score });
  }
  scored.sort((a, b) => b.score - a.score);

  const chosen: number[] = [0];
  for (const { index } of scored) {
    if (chosen.length >= maxB) break;
    chosen.push(index);
  }

  st.bodyCount = chosen.length;
  for (let k = 0; k < chosen.length; k++) {
    const i = chosen[k]!;
    st.bodyMass[k] = physics.mass[i]!;
    st.bodyPos[k]!.set(
      physics.posAu[3 * i]! * s,
      physics.posAu[3 * i + 1]! * s,
      physics.posAu[3 * i + 2]! * s,
    );
  }
  for (let k = chosen.length; k < LIGHT_BENDER_MAX_BODIES; k++) {
    st.bodyMass[k] = 0;
    st.bodyPos[k]!.set(0, 0, 0);
  }

  _sunProj.copy(st.bodyPos[0]!);
  _sunProj.project(camera);
  const sx = _sunProj.x * 0.5 + 0.5;
  const sy = _sunProj.y * 0.5 + 0.5;
  st.sunUv.set(
    THREE.MathUtils.clamp(sx, -0.5, 1.5),
    THREE.MathUtils.clamp(sy, -0.5, 1.5),
  );
  const vis =
    Math.abs(_sunProj.x) < 1.15 &&
    Math.abs(_sunProj.y) < 1.15 &&
    _sunProj.z > -1 &&
    _sunProj.z < 1;
  st.sunRingValid = vis ? 1 : 0;
}

export type LensingEnvConfig = {
  enabled: boolean;
  lensingStrength: number;
  stepCount: number;
  uvDeflectScale: number;
  quality: LensingQuality;
  maxLensingBodies: number;
  tangentialRingBoost: number;
  arcTapEnabled: number;
  arcTapStrength: number;
  arcTapThreshold: number;
};

export function readLensingEnv(): LensingEnvConfig {
  if (typeof process === "undefined") {
    return {
      enabled: false,
      lensingStrength: 1,
      stepCount: 10,
      uvDeflectScale: 5,
      quality: "high",
      maxLensingBodies: 12,
      tangentialRingBoost: 1.15,
      arcTapEnabled: 1,
      arcTapStrength: 0.85,
      arcTapThreshold: 0.002,
    };
  }
  const enabled = process.env.NEXT_PUBLIC_LENSING_ENABLED === "1";
  const lensingStrength = Number.parseFloat(
    process.env.NEXT_PUBLIC_LENSING_STRENGTH ?? "1",
  );
  const stepRequested = Math.min(
    16,
    Math.max(
      4,
      Math.round(Number.parseFloat(process.env.NEXT_PUBLIC_LENSING_STEPS ?? "10")),
    ),
  );
  const uvDeflectScale = Number.parseFloat(
    process.env.NEXT_PUBLIC_LENSING_UV_SCALE ?? "5",
  );
  const quality = parseQuality(process.env.NEXT_PUBLIC_LENSING_QUALITY);

  let maxLensingBodies = 12;
  let tangentialRingBoost = 1.15;
  let arcTapEnabled = 1;
  let arcTapStrength = 0.85;
  let arcTapThreshold = 0.002;
  let stepCount = Number.isFinite(stepRequested) ? stepRequested : 10;

  if (quality === "medium") {
    maxLensingBodies = 8;
    tangentialRingBoost = 0.95;
    arcTapStrength = 0.65;
    arcTapThreshold = 0.0025;
    stepCount = Math.min(stepCount, 8);
  } else if (quality === "low") {
    maxLensingBodies = 4;
    tangentialRingBoost = 0.55;
    arcTapEnabled = 0;
    arcTapStrength = 0.35;
    arcTapThreshold = 0.004;
    stepCount = Math.min(stepCount, 5);
  }

  return {
    enabled,
    lensingStrength: Number.isFinite(lensingStrength) ? lensingStrength : 1,
    stepCount,
    uvDeflectScale: Number.isFinite(uvDeflectScale) ? uvDeflectScale : 5,
    quality,
    maxLensingBodies,
    tangentialRingBoost,
    arcTapEnabled,
    arcTapStrength,
    arcTapThreshold,
  };
}

export function applyLensingEnvToBridge(cfg: LensingEnvConfig): void {
  const st = lightBenderBridgeState;
  st.enabled = cfg.enabled;
  st.lensingStrength = cfg.lensingStrength;
  st.stepCount = cfg.stepCount;
  st.uvDeflectScale = cfg.uvDeflectScale;
  st.maxLensingBodies = cfg.maxLensingBodies;
  st.quality = cfg.quality;
  st.tangentialRingBoost = cfg.tangentialRingBoost;
  st.arcTapEnabled = cfg.arcTapEnabled;
  st.arcTapStrength = cfg.arcTapStrength;
  st.arcTapThreshold = cfg.arcTapThreshold;
}
