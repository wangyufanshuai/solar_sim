"use client";

import { Canvas } from "@react-three/fiber";
import { memo, type ReactNode } from "react";
import * as THREE from "three";
import type { CelestialModeV589, CelestialDeviceTierV589 } from "../lib/celestialArtV589";

/**
 * Candidate-only scene-override host.
 *
 * This is the exact camera/renderer contract used by UniverseCanvas observation
 * scenes, isolated so an additive visual route does not statically import the
 * frozen formal simulation tree. It still creates exactly one runtime Canvas.
 */
function UniverseCanvasOverrideHostV589({
  children,
  mode,
  deviceTier,
  onCanvasReady,
}: Readonly<{
  children: ReactNode;
  mode: CelestialModeV589;
  deviceTier: CelestialDeviceTierV589;
  onCanvasReady?: () => void;
}>) {
  return (
    <Canvas
      className="h-full w-full"
      style={{ display: "block" }}
      dpr={deviceTier === "mobile" ? 1 : [1, 1.5]}
      camera={{ fov: 42, near: 0.01, far: 1e9, position: [0, 0, 12] }}
      gl={{
        antialias: false,
        alpha: false,
        stencil: false,
        depth: true,
        logarithmicDepthBuffer: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(new THREE.Color(0x000000), 1);
        gl.toneMapping = mode === "science" ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = mode === "science" ? 1 : 1.08;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.shadowMap.enabled = false;
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.near = 0.01;
          camera.far = 1e9;
          camera.updateProjectionMatrix();
        }
        onCanvasReady?.();
      }}
      data-atlas-universe-canvas-contract="v587-observation-scene-override"
      data-atlas-v589-runtime-canvas="single"
    >
      {children}
    </Canvas>
  );
}

export default memo(UniverseCanvasOverrideHostV589);

