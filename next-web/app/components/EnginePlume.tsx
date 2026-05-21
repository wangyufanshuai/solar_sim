"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";

type EnginePlumeProps = {
  bodyIndex: number;
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  radiusScene: number;
};

const _color = new THREE.Color();

export default function EnginePlume({
  bodyIndex,
  physicsRef,
  radiusScene,
}: EnginePlumeProps) {
  const plumeRef = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffb55c",
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useFrame(() => {
    const p = physicsRef.current;
    const mesh = plumeRef.current;
    if (!p || !mesh) return;
    const k = 3 * bodyIndex;
    const anyP = p as unknown as Record<string, unknown>;
    const tv = anyP.thrustVecN as Float64Array | undefined;
    const tx = tv ? tv[k] ?? 0 : 0;
    const ty = tv ? tv[k + 1] ?? 0 : 0;
    const tz = tv ? tv[k + 2] ?? 0 : 0;
    const thrust = Math.hypot(tx, ty, tz);
    const maxThrust =
      "spacecraftSpecificImpulseS" in anyP && "spacecraftDryMassKg" in anyP
        ? 7_600_000
        : 7_600_000;
    const u = THREE.MathUtils.clamp(thrust / Math.max(1, maxThrust), 0, 1);
    mesh.visible = u > 1e-3;
    if (!mesh.visible) return;
    mesh.scale.setScalar(0.6 + 1.8 * u);
    mesh.position.set(0, -radiusScene * (1.25 + 0.7 * u), 0);
    _color.setRGB(1, 0.46 + 0.34 * (1 - u), 0.18 + 0.42 * u);
    mat.color.copy(_color);
    mat.opacity = 0.16 + 0.65 * u;
  });

  return (
    <mesh ref={plumeRef} material={mat} renderOrder={4} visible={false}>
      <coneGeometry args={[radiusScene * 0.38, radiusScene * 1.8, 18, 1, true]} />
    </mesh>
  );
}

