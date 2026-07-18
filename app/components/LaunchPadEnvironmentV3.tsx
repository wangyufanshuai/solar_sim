"use client";

import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import type { AtlasRuntimeQualityTier } from "../lib/simulationDiagnosticsTypes";
import { LAUNCH_CINEMATIC_V3_VERSION } from "../lib/launchCinematicV3";

const LaunchPadEnvironmentV3 = forwardRef<THREE.Group, {
  towerHeight: number;
  accentColor: string;
  qualityTier: AtlasRuntimeQualityTier;
}>(function LaunchPadEnvironmentV3({ towerHeight, accentColor, qualityTier }, ref) {
  const armHeights = useMemo(() => [0.054, 0.096, 0.138, 0.18], []);
  const mobile = qualityTier === "mobile-safe";
  return (
    <group ref={ref} renderOrder={3} name={LAUNCH_CINEMATIC_V3_VERSION}>
      <mesh position={[0, 0, -0.006]} receiveShadow>
        <cylinderGeometry args={[0.078, 0.086, 0.014, mobile ? 32 : 64]} />
        <meshStandardMaterial color="#29333b" metalness={0.38} roughness={0.72} />
      </mesh>
      <mesh position={[0, -0.018, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.035, 0.018, 0.092]} />
        <meshStandardMaterial color="#111820" metalness={0.18} roughness={0.92} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <ringGeometry args={[0.038, 0.058, mobile ? 36 : 72]} />
        <meshStandardMaterial color="#7e8b94" metalness={0.62} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0, 0.003]}>
        <ringGeometry args={[0.068, 0.071, mobile ? 48 : 96]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.3} depthWrite={false} toneMapped={false} />
      </mesh>
      <group position={[0.064, 0, 0]}>
        <mesh position={[0, 0, towerHeight * 0.5]} castShadow>
          <boxGeometry args={[0.014, 0.018, towerHeight]} />
          <meshStandardMaterial color="#6f7b84" metalness={0.54} roughness={0.48} />
        </mesh>
        {!mobile ? armHeights.map((height, index) => (
          <group key={height} position={[-0.026, 0, height]} rotation={[0, index % 2 ? -0.08 : 0.1, index % 2 ? -0.1 : 0.08]}>
            <mesh>
              <boxGeometry args={[0.054, 0.006, 0.006]} />
              <meshStandardMaterial color={index === armHeights.length - 1 ? "#aeb8bf" : "#87939b"} metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[-0.027, 0, 0]}>
              <boxGeometry args={[0.004, 0.011, 0.012]} />
              <meshStandardMaterial color="#d3d8dc" metalness={0.34} roughness={0.48} />
            </mesh>
          </group>
        )) : null}
        <mesh position={[0, 0, towerHeight + 0.006]}>
          <boxGeometry args={[0.034, 0.024, 0.012]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.16} metalness={0.28} roughness={0.46} />
        </mesh>
        <pointLight position={[-0.018, 0.02, towerHeight * 0.7]} color="#dbeafe" intensity={0.7} distance={0.22} decay={1.8} />
      </group>
      <mesh position={[-0.046, 0, 0.018]}>
        <boxGeometry args={[0.012, 0.014, 0.036]} />
        <meshStandardMaterial color="#59656d" metalness={0.48} roughness={0.54} />
      </mesh>
    </group>
  );
});

export default LaunchPadEnvironmentV3;
