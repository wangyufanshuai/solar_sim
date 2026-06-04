"use client";

import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { TRUE_VOID_TONE_MAPPING_EXPOSURE } from "../lib/trueVoid";
import { RenderAssetQueueProvider } from "../context/RenderAssetQueueContext";
import UniverseScene, {
  type UniverseCanvasSimulationProps,
} from "./UniverseScene";

export type { UniverseCanvasSimulationProps };

export default function UniverseCanvas({
  simulation,
}: {
  simulation: UniverseCanvasSimulationProps;
}) {
  const pointerDownRef = useRef<{ x: number; y: number; t: number } | null>(
    null
  );
  const draggedRef = useRef(false);
  const wheelUntilRef = useRef(0);

  return (
    <Canvas
      className="h-full w-full"
      style={{ display: "block" }}
      dpr={simulation.viewSettings.highQualityRendering ? [1, 1.5] : 1}
      onPointerDown={(e) => {
        pointerDownRef.current = {
          x: e.nativeEvent.clientX,
          y: e.nativeEvent.clientY,
          t: performance.now(),
        };
        draggedRef.current = false;
      }}
      onPointerMove={(e) => {
        const down = pointerDownRef.current;
        if (!down) return;
        const dx = e.nativeEvent.clientX - down.x;
        const dy = e.nativeEvent.clientY - down.y;
        if (dx * dx + dy * dy > 36) draggedRef.current = true;
      }}
      onWheel={() => {
        wheelUntilRef.current = performance.now() + 180;
      }}
      onPointerMissed={() => {
        const now = performance.now();
        const down = pointerDownRef.current;
        if (now < wheelUntilRef.current || draggedRef.current) return;
        if (down && now - down.t > 700) return;
        simulation.onCanvasPointerMissed?.();
      }}
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
      <RenderAssetQueueProvider budget={simulation.viewSettings.renderBudget}>
        <UniverseScene simulation={simulation} />
      </RenderAssetQueueProvider>
    </Canvas>
  );
}
