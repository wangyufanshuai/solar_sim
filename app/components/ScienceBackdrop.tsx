"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useRelativisticOpticsStateRef } from "../context/RelativisticOpticsContext";
import GalaxyEnvironmentSphere from "./GalaxyEnvironmentSphere";
import BrightStarCatalog from "./BrightStarCatalog";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import type { MutableRefObject } from "react";
import type { SolarPresentationMode } from "../lib/orbitAtlasPresentation";

export default function ScienceBackdrop({
  brightStarTier2 = false,
  presentationMode = "sandbox",
  onSkyReady,
}: {
  floatingOriginRef?: MutableRefObject<FloatingOriginState>;
  brightStarTier2?: boolean;
  presentationMode?: SolarPresentationMode;
  onSkyReady?: (ready: boolean) => void;
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
      <GalaxyEnvironmentSphere visible presentationMode={presentationMode} onTextureState={onSkyReady} />
      <BrightStarCatalog opacity={presentationMode === "orbit-atlas" ? 0.006 : 0.022} tier2Loaded={presentationMode === "orbit-atlas" ? false : brightStarTier2} />
    </group>
  );
}
