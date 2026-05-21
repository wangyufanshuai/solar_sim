"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { noopRaycast } from "../lib/celestialTextures";
import {
  createTelemetryAccelWorkspace,
  pnAccelDeltaVectorMs2,
} from "../lib/accelSplit";
import { PHYSICS_ACTIVE_BODY_COUNT } from "../lib/physicsSharedBuffer";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";

const C_LIGHT = 299_792_458;
const SAMPLE_MS = 280;

type PnDeflectionHintProps = {
  bodyIndex: number;
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  relativityEnabledRef: MutableRefObject<boolean>;
  /** World radius of body mesh (scene units); scales hint length. */
  radiusScene: number;
};

/**
 * Short line in the direction of (a_EIH − a_Newton) when 1PN gravity is on.
 */
export default function PnDeflectionHint({
  bodyIndex,
  physicsRef,
  relativityEnabledRef,
  radiusScene,
}: PnDeflectionHintProps) {
  const lineRef = useRef<THREE.Line>(null);
  const lastSampleMs = useRef(0);
  const dir = useRef(new THREE.Vector3());
  const magRef = useRef(0);

  const ws = useMemo(
    () => createTelemetryAccelWorkspace(PHYSICS_ACTIVE_BODY_COUNT),
    [],
  );

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(6);
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#7ee8ff",
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  const lineObj = useMemo(() => {
    const l = new THREE.Line(geom, mat);
    l.frustumCulled = false;
    l.renderOrder = 6;
    return l;
  }, [geom, mat]);

  useEffect(
    () => () => {
      lineObj.geometry.dispose();
      (lineObj.material as THREE.Material).dispose();
    },
    [lineObj],
  );

  useFrame(() => {
    const line = lineRef.current;
    const p = physicsRef.current;
    if (!line || !p || bodyIndex <= 0 || bodyIndex >= p.n) {
      line && (line.visible = false);
      return;
    }
    line.raycast = noopRaycast;

    if (!relativityEnabledRef.current) {
      line.visible = false;
      return;
    }

    const now = performance.now();
    if (now - lastSampleMs.current >= SAMPLE_MS) {
      lastSampleMs.current = now;
      const scratch = { x: 0, y: 0, z: 0 };
      const mag = pnAccelDeltaVectorMs2(
        p,
        bodyIndex,
        true,
        ws.rk4,
        ws.newtonOut,
        scratch,
      );
      magRef.current = mag;
      if (mag < 1e-18) {
        dir.current.set(0, 0, 0);
      } else {
        dir.current.set(scratch.x, scratch.y, scratch.z).normalize();
      }
    }

    const mag = magRef.current;
    if (mag < 1e-18 || dir.current.lengthSq() < 1e-12) {
      line.visible = false;
      return;
    }

    line.visible = true;
    const len = THREE.MathUtils.clamp(
      radiusScene * (0.45 + Math.log10(1 + mag * 1e14) * 0.32),
      radiusScene * 0.28,
      radiusScene * 3.2,
    );
    const d = dir.current;
    const pos = line.geometry.attributes.position as THREE.BufferAttribute;
    pos.setXYZ(0, 0, 0, 0);
    pos.setXYZ(1, d.x * len, d.y * len, d.z * len);
    pos.needsUpdate = true;

    const tier = Math.min(1, mag / Math.max(1e-6, C_LIGHT * C_LIGHT * 1e-24));
    (line.material as THREE.LineBasicMaterial).opacity = 0.35 + 0.45 * tier;
  });

  return <primitive ref={lineRef} object={lineObj} />;
}
