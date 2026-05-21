"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { TRUE_VOID_TONE_MAPPING_EXPOSURE } from "../lib/trueVoid";
import UniverseScene, {
  type UniverseCanvasSimulationProps,
} from "./UniverseScene";

export type { UniverseCanvasSimulationProps };

export default function UniverseCanvas({
  simulation,
}: {
  simulation: UniverseCanvasSimulationProps;
}) {
  return (
    <Canvas
      className="h-full w-full"
      style={{ display: "block" }}
      dpr={1}
      onPointerMissed={() => simulation.onCanvasPointerMissed?.()}
      camera={{
        fov: 39,
        near: 0.01,
        far: 1e9,
        position: [-310, 108, 560],
      }}
      gl={{
        antialias: false,
        alpha: false,
        stencil: false,
        depth: true,
        logarithmicDepthBuffer: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl, camera }) => {
        const black = new THREE.Color(0x000000);
        gl.setClearColor(black, 1);
        gl.setPixelRatio(1);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = TRUE_VOID_TONE_MAPPING_EXPOSURE;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.shadowMap.enabled = false;
        if (camera && "isPerspectiveCamera" in camera && camera.isPerspectiveCamera) {
          camera.near = 0.01;
          camera.far = 1e9;
          camera.updateProjectionMatrix();
        }
      }}
    >
      <UniverseScene simulation={simulation} />
    </Canvas>
  );
}
