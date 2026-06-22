"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, type MutableRefObject } from "react";
import * as THREE from "three";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import { AU_TO_SCENE } from "../data/planetsJ2000";
import { AU_METERS, G_SI } from "../lib/physicalConstants";
import {
  createOrbitLine2Bundle,
  setOrbitLine2GradientColors,
  setOrbitLine2Positions,
  setOrbitLine2Resolution,
} from "../lib/orbitLine2";
import { orbitTrailRgbForBodyIndex } from "../lib/orbitCinematicTokens";
import type { OrbitVisualStylePreset } from "../lib/visualStylePresets";

type PredictedOrbitPathProps = {
  bodyIndex: number;
  centralBodyIndex?: number;
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  segments?: number;
  stylePreset?: OrbitVisualStylePreset;
};

const _r = new THREE.Vector3();
const _v = new THREE.Vector3();
const _ac = new THREE.Vector3();

export default function PredictedOrbitPath({
  bodyIndex,
  centralBodyIndex = 0,
  physicsRef,
  segments = 220,
  stylePreset = "classicCinematic",
}: PredictedOrbitPathProps) {
  const size = useThree((s) => s.size);
  const points = useMemo(
    () => Array.from({ length: segments }, () => new THREE.Vector3()),
    [segments]
  );
  const trailTint = useMemo(() => orbitTrailRgbForBodyIndex(bodyIndex), [bodyIndex]);
  const bundle = useMemo(
    () =>
      createOrbitLine2Bundle({
        color: trailTint.clone().multiplyScalar(1.2),
        renderOrder: -35,
        maxVertices: segments,
        stylePreset,
      }),
    [trailTint, segments, stylePreset]
  );
  const reusableBuffersRef = useMemo(
    () => ({} as { positions?: Float32Array; colors?: Float32Array }),
    []
  );

  useEffect(
    () => () => {
      bundle.geometry.dispose();
      bundle.material.dispose();
    },
    [bundle]
  );

  useFrame(() => {
    const p = physicsRef.current;
    if (!p) return;
    if (bodyIndex < 0 || bodyIndex >= p.n || centralBodyIndex < 0 || centralBodyIndex >= p.n) {
      bundle.line.visible = false;
      return;
    }
    const kb = 3 * bodyIndex;
    const kc = 3 * centralBodyIndex;
    _r.set(p.posM[kb] - p.posM[kc], p.posM[kb + 1] - p.posM[kc + 1], p.posM[kb + 2] - p.posM[kc + 2]);
    _v.set(p.velM[kb] - p.velM[kc], p.velM[kb + 1] - p.velM[kc + 1], p.velM[kb + 2] - p.velM[kc + 2]);
    const mu = G_SI * Math.max(1e-9, p.mass[centralBodyIndex] ?? 0);
    const dt = 1800;
    const pos = _r.clone();
    const vel = _v.clone();
    for (let i = 0; i < segments; i++) {
      const rn = Math.max(1, pos.length());
      _ac.copy(pos).multiplyScalar(-mu / (rn * rn * rn));
      vel.addScaledVector(_ac, dt);
      pos.addScaledVector(vel, dt);
      points[i]!.set(
        (pos.x / AU_METERS) * AU_TO_SCENE,
        (pos.y / AU_METERS) * AU_TO_SCENE,
        (pos.z / AU_METERS) * AU_TO_SCENE
      );
    }
    const count = setOrbitLine2Positions(
      bundle.geometry,
      points,
      segments,
      "open",
      reusableBuffersRef
    );
    setOrbitLine2GradientColors(
      bundle.geometry,
      trailTint.clone().multiplyScalar(1.15),
      count,
      "open",
      stylePreset,
      reusableBuffersRef
    );
    setOrbitLine2Resolution(bundle.material, size.width, size.height);
    bundle.material.opacity = 0.78;
    bundle.line.visible = true;
  });

  return <primitive object={bundle.line} />;
}

