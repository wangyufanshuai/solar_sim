"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useRelativisticOpticsStateRef } from "../context/RelativisticOpticsContext";
import GalaxyEnvironmentSphere from "./GalaxyEnvironmentSphere";
import BrightStarCatalog from "./BrightStarCatalog";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import type { MutableRefObject } from "react";

export default function ScienceBackdrop({
  brightStarTier2 = false,
}: {
  floatingOriginRef?: MutableRefObject<FloatingOriginState>;
  brightStarTier2?: boolean;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const opticsRef = useRelativisticOpticsStateRef();
  const camera = useThree((s) => s.camera);

  useFrame(() => {
    const root = rootRef.current;
    if (!root) return;
    const optics = opticsRef?.current;
    root.position.copy(camera.position);
    if (optics?.active) root.quaternion.copy(optics.aberrationQuat);
    else root.quaternion.identity();
  }, -999);

  return (
    <group ref={rootRef} renderOrder={-500}>
      <GalaxyEnvironmentSphere visible />
      <BrightStarCatalog opacity={0.026} tier2Loaded={brightStarTier2} />
    </group>
  );
}
