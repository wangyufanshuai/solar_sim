"use client";

/**
 * Top-level bridge component connecting launch telemetry to the 3D scene.
 *
 * Placed inside UniverseScene.tsx's R3F context. Manages:
 *   - WebSocket connection to the launch server
 *   - Spacecraft mesh position/rotation updates
 *   - Trajectory line rendering
 *   - Engine plume visual
 *   - Earth atmosphere glow activation
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useLaunchWebSocket from "../lib/useLaunchWebSocket";
import { AU_METERS } from "../lib/physicalConstants";
import LaunchTrajectoryLine from "./LaunchTrajectoryLine";

/** AU → scene unit scale from the existing rendering pipeline. */
const AU_TO_SCENE = 52;

export default function LaunchSceneBridge() {
  const { launchState } = useLaunchWebSocket();

  const spacecraftRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3());

  // Update spacecraft position each frame
  useFrame(() => {
    if (!launchState.currentSample || !spacecraftRef.current) return;

    const s = launchState.currentSample;
    // Convert SI (meters) to scene units
    targetPos.current.set(
      (s.x / AU_METERS) * AU_TO_SCENE,
      (s.y / AU_METERS) * AU_TO_SCENE,
      (s.z / AU_METERS) * AU_TO_SCENE
    );

    spacecraftRef.current.position.lerp(targetPos.current, 0.15);
  });

  return (
    <>
      {/* Trajectory line */}
      <LaunchTrajectoryLine state={launchState} />

      {/* Spacecraft group */}
      <group ref={spacecraftRef}>
        {/* Simple spacecraft marker when no GLTF model is loaded */}
        <mesh renderOrder={5}>
          <coneGeometry args={[0.3, 1.0, 8]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.9}
            toneMapped={false}
          />
        </mesh>
        {/* Engine plume indicator */}
        {launchState.currentSample &&
        launchState.phase !== "coast" &&
        launchState.phase !== "deepSpace" &&
        launchState.phase !== "landed" ? (
          <mesh position={[0, -0.7, 0]} renderOrder={4}>
            <coneGeometry args={[0.15, 0.5, 6]} />
            <meshBasicMaterial
              color="#ff8844"
              transparent
              opacity={0.6}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
        ) : null}
      </group>
    </>
  );
}

/**
 * Non-R3F component that provides launch actions to UI components.
 * Must be rendered outside the R3F Canvas.
 */
export function useLaunchActions() {
  const {
    launchState,
    startLaunch,
    pauseLaunch,
    resumeLaunch,
    setTimeScale,
    seekTo,
  } = useLaunchWebSocket();

  return {
    launchState,
    startLaunch,
    pauseLaunch,
    resumeLaunch,
    setTimeScale,
    seekTo,
  };
}
