"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { TRUE_VOID_TONE_MAPPING_EXPOSURE } from "../lib/trueVoid";
import { resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import UniverseScene, {
  normalizeAtlasCanvasSimulationProps,
  stabilizeAtlasCanvasSimulationGroups,
  type AtlasCanvasSimulationGroups,
  type UniverseCanvasSimulationProps,
} from "./UniverseScene";
import {
  ORBIT_ATLAS_CAMERA_FOV,
  ORBIT_ATLAS_CAMERA_POSITION,
} from "../lib/orbitAtlasPresentation";
import { createAtlasVisualDirectorV4 } from "../lib/atlasVisualDirectorV4";
import { setAtlasRenderExposureV274 } from "../lib/atlasRenderExposureV274";

export type { AtlasCanvasSimulationGroups, UniverseCanvasSimulationProps };

function UniverseCanvas({
  simulation,
}: {
  simulation: UniverseCanvasSimulationProps;
}) {
  const pointerDownRef = useRef<{ x: number; y: number; t: number } | null>(
    null
  );
  const draggedRef = useRef(false);
  const wheelUntilRef = useRef(0);
  const simulationGroupsRef = useRef<AtlasCanvasSimulationGroups | null>(null);
  const simulationGroups = useMemo(
    () => {
      const next = stabilizeAtlasCanvasSimulationGroups(
        simulationGroupsRef.current,
        normalizeAtlasCanvasSimulationProps(simulation),
      );
      simulationGroupsRef.current = next;
      return next;
    },
    [simulation],
  );

  return (
    <Canvas
      className="h-full w-full"
      style={{ display: "block" }}
      dpr={simulation.visualEnhance ? [1, 1.5] : 1}
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
        fov: simulation.presentationMode === "orbit-atlas" ? ORBIT_ATLAS_CAMERA_FOV : 60,
        near: 0.01,
        far: 1e9,
        position:
          simulation.presentationMode === "orbit-atlas"
            ? ORBIT_ATLAS_CAMERA_POSITION.toArray()
            : [0, 460, 300],
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
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = TRUE_VOID_TONE_MAPPING_EXPOSURE;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.shadowMap.enabled = false;
        if (camera && "isPerspectiveCamera" in camera && camera.isPerspectiveCamera) {
          camera.near = 0.01;
          camera.far = 1e9;
          camera.updateProjectionMatrix();
        }
        simulation.onCanvasReady?.();
      }}
    >
      <RenderExposureDirector sceneMode={simulation.sceneMode} qualityTier={simulation.runtimeQualityTier ?? "balanced"} />
      <UniverseScene simulationGroups={simulationGroups} />
    </Canvas>
  );
}

function RenderExposureDirector({ sceneMode, qualityTier }: { sceneMode: UniverseCanvasSimulationProps["sceneMode"]; qualityTier: NonNullable<UniverseCanvasSimulationProps["runtimeQualityTier"]> }) {
  const gl = useThree((state) => state.gl);
  const visualProfile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  useEffect(() => {
    const profile = createAtlasVisualDirectorV4(sceneMode, qualityTier);
    const visual = resolveAtlasVisualProfileV299(visualProfile);
    const exposure = TRUE_VOID_TONE_MAPPING_EXPOSURE * profile.exposure * visual.exposureMultiplier[sceneMode] * visual.groups.sky.backgroundExposure;
    setAtlasRenderExposureV274(exposure);
    gl.toneMappingExposure = exposure;
  }, [gl, qualityTier, sceneMode, visualProfile]);
  return null;
}

export function shallowEqualSimulationProps(
  previous: UniverseCanvasSimulationProps,
  next: UniverseCanvasSimulationProps,
): boolean {
  if (previous === next) return true;
  const keys = Object.keys(previous) as (keyof UniverseCanvasSimulationProps)[];
  if (keys.length !== Object.keys(next).length) return false;
  return keys.every((key) => Object.is(previous[key], next[key]));
}

export default memo(
  UniverseCanvas,
  (previous, next) => shallowEqualSimulationProps(previous.simulation, next.simulation),
);
