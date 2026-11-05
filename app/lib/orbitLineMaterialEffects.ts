"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { RefObject } from "react";
import type { MeshLineMaterial } from "meshline";

const _hsl = { h: 0, s: 0, l: 0 };

/**
 * Push orbit / trail colors toward brighter neon (HSL lightness + saturation).
 */
export function boostOrbitNeonColor(
  c: THREE.Color,
  liftL = 0.3,
  satBoost = 0.11
): THREE.Color {
  c.getHSL(_hsl);
  _hsl.l = Math.min(0.96, _hsl.l + liftL);
  _hsl.s = Math.min(1, _hsl.s * 1.16 + satBoost);
  return new THREE.Color().setHSL(_hsl.h, _hsl.s, _hsl.l);
}

function asMeshLineMaterial(raw: THREE.Material | THREE.Material[]): MeshLineMaterial | null {
  const m = (Array.isArray(raw) ? raw[0] : raw) as MeshLineMaterial;
  return m?.type === "MeshLineMaterial" ? m : null;
}

export type OrbitLineDistanceFxOptions = {
  baseLineWidth: number;
  /** Multiplies `lineWidth` when camera is at `dFar` (thin). */
  thinScale?: number;
  /** Multiplies `lineWidth` when camera is at `dNear` (thick). */
  thickScale?: number;
  sceneDistanceNear?: number;
  sceneDistanceFar?: number;
  /** Below this camera–anchor distance, use additive blending + slight opacity lift. */
  glowDistance?: number;
  breathAmp?: number;
  breathHz?: number;
  breathPhase?: number;
  baseOpacity?: number;
  enabled?: boolean;
};

/**
 * Per-frame: distance from camera to `getAnchorWorld()` scales MeshLine width; optional near glow;
 * subtle opacity breathing. Updates `resolution` from the canvas size.
 */
export function useOrbitLineDistanceGlowAndBreath(
  meshRef: RefObject<THREE.Mesh | null>,
  getAnchorWorld: () => THREE.Vector3 | null,
  {
    baseLineWidth,
    thinScale = 0.42,
    thickScale = 1.48,
    /** Scene units (~52 per AU in this project). */
    sceneDistanceNear = 52,
    sceneDistanceFar = 1600,
    glowDistance = 96,
    breathAmp = 0.022,
    breathHz = 1.05,
    breathPhase = 0,
    baseOpacity = 1,
    enabled = true,
  }: OrbitLineDistanceFxOptions
) {
  const size = useThree((s) => s.size);

  useFrame((state) => {
    if (!enabled) return;
    const mesh = meshRef.current;
    if (!mesh) return;
    const mat = asMeshLineMaterial(mesh.material);
    if (!mat) return;

    mat.uniforms.resolution.value.set(size.width, size.height);

    const anchor = getAnchorWorld();
    if (!anchor) return;

    const d = state.camera.position.distanceTo(anchor);
    const tDist = THREE.MathUtils.smoothstep(
      d,
      sceneDistanceFar,
      sceneDistanceNear
    );
    mat.lineWidth =
      baseLineWidth * THREE.MathUtils.lerp(thinScale, thickScale, tDist);

    const nearGlow = d < glowDistance;
    mat.blending = nearGlow ? THREE.AdditiveBlending : THREE.NormalBlending;

    const breath =
      1 + breathAmp * Math.sin(state.clock.elapsedTime * breathHz + breathPhase);
    mat.opacity = baseOpacity * breath * (nearGlow ? 1.08 : 1);
    mat.transparent = true;
  });
}

export function getTrailHeadWorld(
  obj: THREE.Object3D,
  headLocal: THREE.Vector3,
  target: THREE.Vector3
): THREE.Vector3 {
  target.copy(headLocal);
  obj.localToWorld(target);
  return target;
}
