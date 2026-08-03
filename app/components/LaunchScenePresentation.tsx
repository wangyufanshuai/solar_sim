import { Html } from "@react-three/drei/web/Html";
import * as THREE from "three";
import { Suspense } from "react";
import { EARTH_SCENE_RADIUS } from "../lib/localLaunchPhysics";
import EarthAtmosphereGlow from "./EarthAtmosphereGlow";
import GalaxyEnvironmentSphere from "./GalaxyEnvironmentSphere";
import BrightStarCatalog from "./BrightStarCatalog";
import LaunchSpacecraftAsset from "./LaunchSpacecraftAsset";
import LaunchPadEnvironmentV3 from "./LaunchPadEnvironmentV3";
import type { LaunchSceneResources } from "./useLaunchSceneResources";
import type { LaunchSceneViewProps } from "./LaunchSceneViewProps";

const V109_LAUNCH_VISUAL_COMPAT_PROFILE = "heavy-lift-rocket";

type LaunchScenePresentationProps = {
  resources: LaunchSceneResources;
  launchConfigRef: LaunchSceneViewProps["launchConfigRef"];
};

export default function LaunchScenePresentation({
  resources,
  launchConfigRef,
}: LaunchScenePresentationProps) {
  const {
    cameraFillRef, destinationLabel, directorPhase, earthClouds,
    earthDay, exhaustCoreMat, exhaustCoreRef, exhaustHaloMat,
    exhaustHaloRef, guidanceLine, isLeoSatellite, launchPadRef,
    launchVisualProfile, missionTargetRef, particleGeom, particleMat,
    particlesRef, runtimeQuality, setSlsAssetState, shockRingMat,
    shockRingRef, slsAssetState, spacecraftRef, sunDir,
    trajectoryLine, usesSlsAsset,
  } = resources;

  return (
    <>
      <GalaxyEnvironmentSphere visible />
      <BrightStarCatalog opacity={runtimeQuality.starOpacity} />

      <directionalLight
        position={[sunDir.x * 100, sunDir.y * 100, sunDir.z * 100]}

        intensity={1.65}
        color="#fff4e6"
      />
      <hemisphereLight intensity={0.22} color="#dcecff" groundColor="#172334" />
      <ambientLight intensity={0.08} color="#607da5" />
      <pointLight ref={cameraFillRef} intensity={1.8} distance={3.2} decay={1.6} color="#dce9ff" />

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[EARTH_SCENE_RADIUS, runtimeQuality.earthSegments, runtimeQuality.earthSegments]} />
        <meshStandardMaterial

          map={earthDay ?? undefined}
          color="#9dc3ff"
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>
      {earthClouds ? (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[EARTH_SCENE_RADIUS * 1.008, runtimeQuality.earthSegments, runtimeQuality.earthSegments]} />
          <meshStandardMaterial
            map={earthClouds}
            color="#ffffff"
            transparent
            opacity={0.34}
            depthWrite={false}
          />
        </mesh>
      ) : null}

      <EarthAtmosphereGlow
        radius={EARTH_SCENE_RADIUS}
        sunDirection={sunDir}
        atmosphereColor="#66a3ff"
        atmospherePower={3.2}
        atmosphereIntensity={0.46}
      />

      <LaunchPadEnvironmentV3
        ref={launchPadRef}
        towerHeight={launchVisualProfile.serviceTowerHeight}
        accentColor={launchVisualProfile.accentColor}
        qualityTier={runtimeQuality.tier}
      />

      <points ref={particlesRef} geometry={particleGeom} material={particleMat} renderOrder={5} />

      <primitive object={guidanceLine} />
      <primitive object={trajectoryLine} />

      <group ref={missionTargetRef} visible={false} renderOrder={6}>
        <Html center distanceFactor={8} position={[0, 0.34, 0]} style={{ pointerEvents: "none" }}>
          <div className="rounded border border-white/15 bg-black/45 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-200 shadow-[0_0_16px_rgba(120,180,255,0.18)] backdrop-blur">
            {destinationLabel} target
          </div>
        </Html>
        <mesh>
          <torusGeometry args={[0.24, 0.004, 8, 96]} />
          <meshBasicMaterial
            color={(launchConfigRef?.current?.destination ?? "Moon") === "Mars" ? "#ff9d73" : "#8fc7ff"}
            transparent
            opacity={0.58}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.24, 0.003, 8, 96]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshBasicMaterial
            color={(launchConfigRef?.current?.destination ?? "Moon") === "Mars" ? "#ff6d4d" : "#dceeff"}
            transparent
            opacity={0.78}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      <group
        ref={spacecraftRef}
        scale={[
          launchVisualProfile.vehicleScale,
          launchVisualProfile.vehicleScale,
          launchVisualProfile.vehicleScale,
        ]}
        name={`${launchVisualProfile.id}:${V109_LAUNCH_VISUAL_COMPAT_PROFILE}`}
      >
        {usesSlsAsset ? (
          <Suspense fallback={null}>
            <LaunchSpacecraftAsset asset="sls-block-1" onLoadState={setSlsAssetState} />
          </Suspense>
        ) : null}
        <group visible={!usesSlsAsset || slsAssetState !== "ready"}>
        <mesh position={[0, 0.017, 0]}>
          <cylinderGeometry args={[0.009, 0.011, 0.074, 28]} />
          <meshStandardMaterial color={launchVisualProfile.primaryColor} metalness={0.58} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.061, 0]}>
          <coneGeometry args={[0.0105, 0.026, 28]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.18} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.026, 0.0108]}>
          <boxGeometry args={[0.014, 0.004, 0.0012]} />
          <meshStandardMaterial color="#1f2937" metalness={0.24} roughness={0.42} />
        </mesh>
        <mesh position={[0, -0.018, 0]}>
          <cylinderGeometry args={[0.0105, 0.012, 0.018, 28]} />
          <meshStandardMaterial color="#64748b" metalness={0.66} roughness={0.32} />
        </mesh>
        {isLeoSatellite && directorPhase === "payload-deploy" ? (
          <>
            <mesh position={[0, 0.078, 0]}>
              <boxGeometry args={[0.022, 0.010, 0.018]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.62} roughness={0.28} />
            </mesh>
            <mesh position={[-0.030, 0.078, 0]} rotation={[0, 0, 0.08]}>
              <boxGeometry args={[0.042, 0.004, 0.001]} />
              <meshStandardMaterial color="#1e3a8a" metalness={0.32} roughness={0.36} emissive="#0f172a" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[0.030, 0.078, 0]} rotation={[0, 0, -0.08]}>
              <boxGeometry args={[0.042, 0.004, 0.001]} />
              <meshStandardMaterial color="#1e3a8a" metalness={0.32} roughness={0.36} emissive="#0f172a" emissiveIntensity={0.2} />
            </mesh>
          </>
        ) : (
          <>
            <mesh position={[-0.017, 0.0, 0]}>

              <cylinderGeometry args={[0.0046, 0.0058, 0.066, 16]} />
              <meshStandardMaterial color="#dce3ed" metalness={0.54} roughness={0.34} />
            </mesh>
            <mesh position={[0.017, 0.0, 0]}>
              <cylinderGeometry args={[0.0046, 0.0058, 0.066, 16]} />
              <meshStandardMaterial color="#dce3ed" metalness={0.54} roughness={0.34} />
            </mesh>
            <mesh position={[-0.017, 0.037, 0]}>
              <coneGeometry args={[0.005, 0.016, 16]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.2} roughness={0.38} />
            </mesh>
            <mesh position={[0.017, 0.037, 0]}>
              <coneGeometry args={[0.005, 0.016, 16]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.2} roughness={0.38} />
            </mesh>
          </>
        )}
        <mesh position={[-0.010, -0.041, 0]}>
          <coneGeometry args={[0.0045, 0.014, 16]} />
          <meshStandardMaterial color="#3f4754" metalness={0.7} roughness={0.28} />
        </mesh>
        <mesh position={[0.010, -0.041, 0]}>
          <coneGeometry args={[0.0045, 0.014, 16]} />
          <meshStandardMaterial color="#3f4754" metalness={0.7} roughness={0.28} />
        </mesh>
        </group>
        <mesh position={[0, -0.02, 0]} name="engineBellGlow" renderOrder={6}>
          <coneGeometry args={[0.009, 0.034, 18]} />
          <meshBasicMaterial
            color="#ff9258"
            transparent
            opacity={0.42}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh ref={exhaustCoreRef} position={[0, -0.052, 0]} material={exhaustCoreMat} renderOrder={7} visible={false}>
          <coneGeometry args={[0.007, 0.05, 18, 1, true]} />
        </mesh>
        <mesh ref={exhaustHaloRef} position={[0, -0.074, 0]} material={exhaustHaloMat} renderOrder={6} visible={false}>
          <coneGeometry args={[0.014, 0.076, 24, 1, true]} />
        </mesh>
        <mesh ref={shockRingRef} position={[0, -0.09, 0]} rotation={[Math.PI / 2, 0, 0]} material={shockRingMat} renderOrder={6} visible={false}>
          <torusGeometry args={[0.016, 0.0012, 8, 40]} />
        </mesh>
      </group>
    </>

  );
}
