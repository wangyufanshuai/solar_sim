"use client";

import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LocalLaunchState } from "../lib/localLaunchPhysics";
import { useOptionalTexture } from "../lib/useOptionalTexture";
import { getLaunchVisualProfile } from "../lib/launchVisualProfiles";
import { getAtlasRuntimeQualityProfile } from "../lib/launchSequenceDirector";
import type { AtlasLaunchSequenceDirectorPhase, AtlasRuntimeQualityTier } from "../lib/simulationDiagnosticsTypes";
import type { AtlasAssetLoadState } from "../lib/atlasAssetResolver";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { resolveAtlasVisualProfileV299, sampleAtlasCinematicDetailV299 } from "../lib/atlasVisualProfileV299";
import type { LaunchSceneViewProps } from "./LaunchSceneViewProps";

export const PARTICLE_COUNT = 72;
export const TRAJECTORY_POINTS = 180;

type LaunchSceneResourcesArgs = {
  launchConfigRef: LaunchSceneViewProps["launchConfigRef"];
  runtimeQualityTier: AtlasRuntimeQualityTier;
};

export function useLaunchSceneResources({
  launchConfigRef,
  runtimeQualityTier,
}: LaunchSceneResourcesArgs) {
  const { camera } = useThree();
  const visualRendererProfile = useAtlasRuntimeStore(
    (snapshot) => resolveAtlasVisualProfileV299(snapshot.visualProfile),
  );
  const destinationLabel = launchConfigRef?.current?.destination ?? "Moon";
  const runtimeQuality = useMemo(
    () => getAtlasRuntimeQualityProfile(runtimeQualityTier),
    [runtimeQualityTier],
  );
  const localStateRef = useRef<LocalLaunchState | null>(null);
  const initializedRef = useRef(false);
  const manualCameraRef = useRef(false);
  const [, setCameraModeTick] = useState(0);
  const [directorPhase, setDirectorPhase] =
    useState<AtlasLaunchSequenceDirectorPhase>("prelaunch");
  const directorPhaseRef = useRef<AtlasLaunchSequenceDirectorPhase>("prelaunch");
  const particleFrameRef = useRef(0);

  const camTargetPos = useMemo(() => new THREE.Vector3(0, 0, 3), []);
  const camTargetLookAt = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const camTargetUp = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const sunDir = useMemo(() => new THREE.Vector3(1, 0.2, 0.5).normalize(), []);

  const earthDay = useOptionalTexture("/textures/planets/hd/earth.jpg");
  const earthClouds = useOptionalTexture("/textures/planets/hd/earth-clouds.jpg");
  const [slsAssetState, setSlsAssetState] = useState<AtlasAssetLoadState>("probing");

  const spacecraftRef = useRef<THREE.Group>(null);
  const launchPadRef = useRef<THREE.Group>(null);
  const exhaustCoreRef = useRef<THREE.Mesh>(null);
  const exhaustHaloRef = useRef<THREE.Mesh>(null);
  const shockRingRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const particlePositions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const particleAlphas = useMemo(() => new Float32Array(PARTICLE_COUNT), []);
  const particleVelocities = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, () => new THREE.Vector3()),
    [],
  );
  const particleAges = useMemo(() => new Float32Array(PARTICLE_COUNT).fill(999), []);
  const particleLifetimes = useMemo(() => new Float32Array(PARTICLE_COUNT).fill(1), []);
  const nextParticleIdx = useRef(0);
  const particleEmissionSerial = useRef(0);
  const scratchScPos = useMemo(() => new THREE.Vector3(), []);
  const scratchVelDir = useMemo(() => new THREE.Vector3(), []);
  const scratchUp = useMemo(() => new THREE.Vector3(), []);
  const scratchSide = useMemo(() => new THREE.Vector3(), []);
  const scratchOffset = useMemo(() => new THREE.Vector3(), []);
  const scratchUpOffset = useMemo(() => new THREE.Vector3(), []);
  const scratchQuat = useMemo(() => new THREE.Quaternion(), []);
  const scratchLookDir = useMemo(() => new THREE.Vector3(), []);
  const scratchTargetDir = useMemo(() => new THREE.Vector3(), []);
  const scratchWorldAxis = useMemo(() => new THREE.Vector3(), []);
  const scratchOrigin = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const scratchProjected = useMemo(() => new THREE.Vector3(), []);
  const scratchBounds = useMemo(() => new THREE.Box3(), []);
  const scratchBoundsCenter = useMemo(() => new THREE.Vector3(), []);
  const scratchBoundsSize = useMemo(() => new THREE.Vector3(), []);
  const scratchBoundsCorner = useMemo(() => new THREE.Vector3(), []);
  const runtimeMarkerRootRef = useRef<HTMLElement | null>(null);
  const lastRuntimeMarkerWriteRef = useRef(0);

  useEffect(() => {
    runtimeMarkerRootRef.current = document.querySelector<HTMLElement>("[data-atlas-app-shell]");
    return () => {
      const root = runtimeMarkerRootRef.current;
      for (const attribute of [
        "data-launch-subject-ndc-x",
        "data-launch-subject-ndc-y",
        "data-launch-subject-coverage-x",
        "data-launch-subject-coverage-y",
        "data-launch-camera-distance",
        "data-launch-camera-mode",
        "data-launch-director-phase",
        "data-launch-composition-version",
        "data-launch-composition-coverage",
        "data-launch-asset-profile",
        "data-launch-asset-load-state",
        "data-launch-camera-view-offset",
      ]) root?.removeAttribute(attribute);
      runtimeMarkerRootRef.current = null;
    };
  }, []);

  const particleGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    geom.setAttribute("alpha", new THREE.BufferAttribute(particleAlphas, 1));
    return geom;
  }, [particlePositions, particleAlphas]);

  const trajectoryPositions = useMemo(() => new Float32Array(TRAJECTORY_POINTS * 3), []);
  const trajectoryIndexRef = useRef(0);
  const trajectoryCountRef = useRef(0);
  const trajectoryGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(trajectoryPositions, 3));
    return geom;
  }, [trajectoryPositions]);
  const missionTargetRef = useRef<THREE.Group>(null);
  const cameraFillRef = useRef<THREE.PointLight>(null);
  const guidanceLinePositions = useMemo(() => new Float32Array(6), []);
  const guidanceLineGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(guidanceLinePositions, 3));
    return geom;
  }, [guidanceLinePositions]);
  const guidanceLineMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: (launchConfigRef?.current?.destination ?? "Moon") === "Mars" ? "#ff9d73" : "#90caff",
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [launchConfigRef],
  );
  const guidanceLine = useMemo(() => {
    const line = new THREE.Line(guidanceLineGeom, guidanceLineMat);
    line.renderOrder = 3;
    return line;
  }, [guidanceLineGeom, guidanceLineMat]);
  const trajectoryMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: (launchConfigRef?.current?.destination ?? "Moon") === "Mars" ? "#ff9d73" : "#a7d8ff",
        transparent: true,
        opacity: 0.46,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [launchConfigRef],
  );
  const trajectoryLine = useMemo(() => {
    const line = new THREE.Line(trajectoryGeom, trajectoryMat);
    line.renderOrder = 4;
    return line;
  }, [trajectoryGeom, trajectoryMat]);

  const particleMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        uniforms: {},
        vertexShader: `
          attribute float alpha;
          varying float vAlpha;
          void main() {
            vAlpha = alpha;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = max(3.0, 110.0 / max(1.0, -mv.z));
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          varying float vAlpha;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float soft = 1.0 - smoothstep(0.0, 0.5, dist);
            vec3 col = mix(vec3(1.0, 0.32, 0.05), vec3(1.0, 0.92, 0.65), soft);
            gl_FragColor = vec4(col, vAlpha * soft);
          }
        `,
      }),
    [],
  );
  const exhaustCoreMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffd08a",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const exhaustHaloMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ff5c19",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const shockRingMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#9ed8ff",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const activeProfile = launchConfigRef?.current?.profile ?? "";
  const launchVisualProfile = getLaunchVisualProfile(activeProfile);
  const isLeoSatellite = launchVisualProfile.payloadKind === "deployable-satellite";
  const usesSlsAsset = launchVisualProfile.id === "sls-artemis-stack";

  const emitParticle = useCallback(
    (
      origin: THREE.Vector3,
      thrustDir: THREE.Vector3,
      thrustFraction: number,
      particleBudget: number,
    ) => {
      const budget = Math.max(1, Math.min(PARTICLE_COUNT, particleBudget));
      const i = nextParticleIdx.current % budget;
      nextParticleIdx.current = (nextParticleIdx.current + 1) % budget;
      const emissionSerial = particleEmissionSerial.current;
      particleEmissionSerial.current += 1;
      let randomChannel = 0;
      const random = visualRendererProfile.v5TokensApplied || visualRendererProfile.v6TokensApplied
        ? () => sampleAtlasCinematicDetailV299(
          visualRendererProfile.runtimeTokens.launch.detailSeed,
          emissionSerial,
          randomChannel++,
        )
        : Math.random;

      const speed = 0.028 + 0.06 * thrustFraction;
      const spread = 0.012;
      const vel = particleVelocities[i]!;
      vel.copy(thrustDir).multiplyScalar(-speed);
      vel.x += (random() - 0.5) * spread;
      vel.y += (random() - 0.5) * spread;
      vel.z += (random() - 0.5) * spread;

      particlePositions[i * 3] = origin.x + (random() - 0.5) * 0.003;
      particlePositions[i * 3 + 1] = origin.y + (random() - 0.5) * 0.003;
      particlePositions[i * 3 + 2] = origin.z + (random() - 0.5) * 0.003;
      particleAges[i] = 0;
      particleLifetimes[i] = 0.35 + random() * 0.5;
    },
    [particlePositions, particleVelocities, particleAges, particleLifetimes, visualRendererProfile],
  );

  useEffect(() => {
    for (let i = runtimeQuality.particleBudget; i < PARTICLE_COUNT; i++) {
      particleAlphas[i] = 0;
      particleAges[i] = 999;
    }
    particleGeom.attributes.alpha.needsUpdate = true;
  }, [runtimeQuality.particleBudget, particleAlphas, particleAges, particleGeom]);


  return {
    camTargetLookAt, camTargetPos, camTargetUp, camera,
    cameraFillRef, destinationLabel, directorPhase, directorPhaseRef,
    earthClouds, earthDay, emitParticle, exhaustCoreMat,
    exhaustCoreRef, exhaustHaloMat, exhaustHaloRef, guidanceLine,
    guidanceLineGeom, guidanceLineMat, guidanceLinePositions, initializedRef,
    isLeoSatellite, lastRuntimeMarkerWriteRef, launchPadRef, launchVisualProfile,
    localStateRef, manualCameraRef, missionTargetRef, nextParticleIdx,
    particleAges, particleAlphas, particleFrameRef, particleGeom,
    particleLifetimes, particleMat, particlePositions, particleVelocities,
    particlesRef, runtimeMarkerRootRef, runtimeQuality, visualRendererProfile,
    scratchBounds, scratchBoundsCenter, scratchBoundsCorner, scratchBoundsSize,
    scratchLookDir, scratchOffset, scratchOrigin, scratchProjected,
    scratchQuat, scratchScPos, scratchSide, scratchTargetDir,
    scratchUp, scratchUpOffset, scratchVelDir, scratchWorldAxis,
    setCameraModeTick, setDirectorPhase, setSlsAssetState, shockRingMat,
    shockRingRef, slsAssetState, spacecraftRef, sunDir,
    trajectoryCountRef, trajectoryGeom, trajectoryIndexRef, trajectoryLine,
    trajectoryMat, trajectoryPositions, usesSlsAsset,
  };
}

export type LaunchSceneResources = ReturnType<typeof useLaunchSceneResources>;
