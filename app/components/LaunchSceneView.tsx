"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { LaunchConfig } from "../lib/launchTelemetryTypes";
import {
  createLocalLaunchState,
  stepLocalLaunch,
  convertToHeliocentric,
  getLocalTelemetry,
  localMToScene,
  EARTH_SCENE_RADIUS,
  type LocalLaunchState,
  type LocalTelemetry,
} from "../lib/localLaunchPhysics";
import {
  SPACECRAFT_BODY_INDEX,
  EARTH_BODY_INDEX,
  MOON_BODY_INDEX,
} from "../data/planetsJ2000";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import EarthAtmosphereGlow from "./EarthAtmosphereGlow";
import GalaxyEnvironmentSphere from "./GalaxyEnvironmentSphere";
import BrightStarCatalog from "./BrightStarCatalog";
import { useOptionalTexture } from "../lib/useOptionalTexture";
import { LAUNCH_CAMERA_FOLLOW_EVENT } from "../lib/launchCameraControl";
import {
  LAUNCH_VISUAL_PROFILE_MANIFEST_VERSION,
  getLaunchVisualProfile,
} from "../lib/launchVisualProfiles";
import {
  getAtlasRuntimeQualityProfile,
  getLaunchSequenceDirectorPhase,
  launchDirectorPhaseLabel,
} from "../lib/launchSequenceDirector";
import type {
  AtlasLaunchSequenceDirectorPhase,
  AtlasRuntimeQualityTier,
} from "../lib/simulationDiagnosticsTypes";
import LaunchSpacecraftAsset from "./LaunchSpacecraftAsset";
import LaunchPadEnvironmentV3 from "./LaunchPadEnvironmentV3";
import type { AtlasAssetLoadState } from "../lib/atlasAssetResolver";
import {
  LAUNCH_COMPOSITION_V2_VERSION,
  solveLaunchFrameV2,
} from "../lib/launchCompositionV2";

const EARTH_RADIUS_M = 6_378_137;
const PHYSICS_SUB_STEPS = 8;
const PARTICLE_COUNT = 72;
const TRAJECTORY_POINTS = 180;
const V109_LAUNCH_VISUAL_COMPAT_PROFILE = "heavy-lift-rocket";
// v112/v114 compatibility markers now render in LaunchDirectorOverlay:
// data-launch-mission-scene, data-launch-stage-marker, data-launch-director-phase,
// data-launch-runtime-quality, data-launch-plume-budget; Max-Q; Satellite deploy.

const LAUNCH_SITES: Record<string, { lat: number; lon: number }> = {
  kennedy_lc39b: { lat: 28.6, lon: -80.6 },
  cape_canaveral: { lat: 28.5, lon: -80.6 },
  baikonur: { lat: 45.6, lon: 63.3 },
  vandenberg: { lat: 34.7, lon: -120.6 },
  xichang: { lat: 28.25, lon: 102.03 },
};

export type LaunchSceneViewProps = {
  physicsRef: React.MutableRefObject<SolarSystemPhysicsRef | null>;
  onHandoff: (heliocentric: {
    posM: [number, number, number];
    velMs: [number, number, number];
    massKg: number;
  }) => void;
  onAbort: () => void;
  telemetryRef?: React.MutableRefObject<LocalTelemetry | null>;
  active: boolean;
  launchConfigRef?: React.MutableRefObject<LaunchConfig | null>;
  controlsRef?: MutableRefObject<OrbitControlsImpl | null>;
  runtimeQualityTier?: AtlasRuntimeQualityTier;
};

export default function LaunchSceneView({
  physicsRef,
  onHandoff,
  onAbort,
  telemetryRef,
  active,
  launchConfigRef,
  controlsRef,
  runtimeQualityTier = "balanced",
}: LaunchSceneViewProps) {
  const { camera } = useThree();
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

      const speed = 0.028 + 0.06 * thrustFraction;
      const spread = 0.012;
      const vel = particleVelocities[i]!;
      vel.copy(thrustDir).multiplyScalar(-speed);
      vel.x += (Math.random() - 0.5) * spread;
      vel.y += (Math.random() - 0.5) * spread;
      vel.z += (Math.random() - 0.5) * spread;

      particlePositions[i * 3] = origin.x + (Math.random() - 0.5) * 0.003;
      particlePositions[i * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.003;
      particlePositions[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.003;
      particleAges[i] = 0;
      particleLifetimes[i] = 0.35 + Math.random() * 0.5;
    },
    [particlePositions, particleVelocities, particleAges, particleLifetimes],
  );

  useEffect(() => {
    for (let i = runtimeQuality.particleBudget; i < PARTICLE_COUNT; i++) {
      particleAlphas[i] = 0;
      particleAges[i] = 999;
    }
    particleGeom.attributes.alpha.needsUpdate = true;
  }, [runtimeQuality.particleBudget, particleAlphas, particleAges, particleGeom]);

  useEffect(() => {
    if (!active || initializedRef.current) return;
    const p = physicsRef.current;
    if (!p || SPACECRAFT_BODY_INDEX < 0 || EARTH_BODY_INDEX < 0) return;
    const n = "n" in p ? (p as { n: number }).n : 0;
    if (SPACECRAFT_BODY_INDEX >= n || EARTH_BODY_INDEX >= n) return;

    const ke = 3 * EARTH_BODY_INDEX;
    const km = 3 * MOON_BODY_INDEX;

    const earthPos: [number, number, number] = [
      p.posM[ke]!,
      p.posM[ke + 1]!,
      p.posM[ke + 2]!,
    ];
    const earthVel: [number, number, number] = [
      p.velM[ke]!,
      p.velM[ke + 1]!,
      p.velM[ke + 2]!,
    ];
    const moonOffset: [number, number, number] = [
      p.posM[km]! - p.posM[ke]!,
      p.posM[km + 1]! - p.posM[ke + 1]!,
      p.posM[km + 2]! - p.posM[ke + 2]!,
    ];

    const ex = p.posM[ke]!;
    const ey = p.posM[ke + 1]!;
    const ez = p.posM[ke + 2]!;
    const sunDist = Math.hypot(ex, ey, ez);
    if (sunDist > 0) {
      sunDir.set(-ex / sunDist, -ey / sunDist, -ez / sunDist);
    }

    const configSite = launchConfigRef?.current?.site ?? "kennedy_lc39b";
    const siteCoords = LAUNCH_SITES[configSite] ?? LAUNCH_SITES.kennedy_lc39b!;
    const lat = (siteCoords.lat * Math.PI) / 180;
    const lon = (siteCoords.lon * Math.PI) / 180;

    localStateRef.current = createLocalLaunchState(
      earthPos,
      earthVel,
      lat,
      lon,
      moonOffset,
      launchConfigRef?.current ?? undefined,
    );
    const [nx, ny, nz] = surfaceNormal(lat, lon);
    const padSurface = new THREE.Vector3(
      localMToScene(EARTH_RADIUS_M * nx),
      localMToScene(EARTH_RADIUS_M * ny),
      localMToScene(EARTH_RADIUS_M * nz),
    );
    const tangent = new THREE.Vector3(ny, -nx, 0).normalize();
    const up = new THREE.Vector3(nx, ny, nz).normalize();
    const initialFrame = solveLaunchFrameV2({
      phase: "prelaunch",
      qualityTier: runtimeQualityTier,
      vehicleHeightScene: 0.18,
    });
    const initialCam = padSurface
      .clone()
      .add(up.clone().multiplyScalar(initialFrame.elevationDistance))
      .add(tangent.multiplyScalar(initialFrame.sideDistance));
    if (camera instanceof THREE.PerspectiveCamera && camera.view) {
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
    }
    camera.position.copy(initialCam);
    camera.up.copy(up);
    camera.lookAt(padSurface.clone().add(up.multiplyScalar(initialFrame.lookAheadDistance)));
    camTargetPos.copy(initialCam);
    camTargetLookAt.copy(padSurface).addScaledVector(up, initialFrame.lookAheadDistance);
    camTargetUp.copy(up);
    const pad = launchPadRef.current;
    if (pad) {
      const padUp = new THREE.Vector3(nx, ny, nz).normalize();
      pad.position.copy(padSurface).addScaledVector(padUp, 0.002);
      pad.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), padUp);
    }
    trajectoryIndexRef.current = 0;
    trajectoryCountRef.current = 0;
    initializedRef.current = true;
  }, [active, physicsRef, launchConfigRef, sunDir, camera, camTargetPos, camTargetLookAt, camTargetUp, runtimeQualityTier]);

  useEffect(() => {
    if (!active) {
      initializedRef.current = false;
      localStateRef.current = null;
      if (telemetryRef) telemetryRef.current = null;
    }
  }, [active, telemetryRef]);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onAbort();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onAbort]);

  useEffect(() => {
    if (!active) return;
    const controls = controlsRef?.current;
    const setManual = () => {
      manualCameraRef.current = true;
      setCameraModeTick((tick) => tick + 1);
    };
    const restoreFollow = () => {
      manualCameraRef.current = false;
      setCameraModeTick((tick) => tick + 1);
    };
    controls?.addEventListener("start", setManual);
    window.addEventListener(LAUNCH_CAMERA_FOLLOW_EVENT, restoreFollow);
    return () => {
      controls?.removeEventListener("start", setManual);
      window.removeEventListener(LAUNCH_CAMERA_FOLLOW_EVENT, restoreFollow);
    };
  }, [active, controlsRef]);

  useEffect(() => {
    return () => {
      particleGeom.dispose();
      particleMat.dispose();
      exhaustCoreMat.dispose();
      exhaustHaloMat.dispose();
      shockRingMat.dispose();
      trajectoryGeom.dispose();
      trajectoryMat.dispose();
      guidanceLineGeom.dispose();
      guidanceLineMat.dispose();
    };
  }, [particleGeom, particleMat, exhaustCoreMat, exhaustHaloMat, shockRingMat, trajectoryGeom, trajectoryMat, guidanceLineGeom, guidanceLineMat]);

  useFrame((stateClock, dt) => {
    const state = localStateRef.current;
    if (!state || !active) return;

    const cappedDt = Math.min(dt, 0.05);
    const timeScale = launchConfigRef?.current?.timeScale ?? 10;
    const simDt = cappedDt * timeScale;
    const subDt = simDt / PHYSICS_SUB_STEPS;

    for (let i = 0; i < PHYSICS_SUB_STEPS; i++) {
      stepLocalLaunch(state, subDt);
    }

    const telemetry = getLocalTelemetry(state);
    if (telemetryRef) {
      telemetryRef.current = telemetry;
    }
    const nextDirectorPhase = getLaunchSequenceDirectorPhase(telemetry);
    const launchFrame = solveLaunchFrameV2({
      phase: nextDirectorPhase,
      qualityTier: runtimeQualityTier,
      vehicleHeightScene: 0.18,
    });
    if (directorPhaseRef.current !== nextDirectorPhase) {
      directorPhaseRef.current = nextDirectorPhase;
      setDirectorPhase(nextDirectorPhase);
    }

    const scX = localMToScene(state.posX);
    const scY = localMToScene(state.posY);
    const scZ = localMToScene(state.posZ);
    const altNorm = state.altitudeM / EARTH_RADIUS_M;

    const scGroup = spacecraftRef.current;
    if (scGroup) {
      scGroup.position.set(scX, scY, scZ);
      scGroup.rotation.z += cappedDt * 0.2;
      if (state.speedMs > 1) {
        if (state.missionTimeS < 24 || state.altitudeM < 12_000) {
          scratchVelDir.copy(scGroup.position).normalize();
        } else {
          scratchVelDir.set(state.velX, state.velY, state.velZ).normalize();
        }
        scratchUp.set(0, 1, 0);
        scratchQuat.setFromUnitVectors(scratchUp, scratchVelDir);
        scGroup.quaternion.slerp(scratchQuat, 0.2);
      }
    }

    const hasThrust = state.currentThrustN > 0;
    const thrustFraction = Math.min(1, state.currentThrustN / 16_000_000);
    if (hasThrust && scGroup) {
      if (state.missionTimeS < 24 || state.altitudeM < 12_000) {
        scratchVelDir.copy(scGroup.position).normalize();
      } else {
        scratchVelDir.set(state.velX, state.velY, state.velZ).normalize();
      }
      scratchScPos.set(scX, scY, scZ);
      const plumeScale = runtimeQuality.plumeBudget === "full-plume" ? 1 : 0.58;
      const emitCount = Math.ceil((1 + 3 * thrustFraction) * plumeScale);
      for (let i = 0; i < emitCount; i++) {
        emitParticle(
          scratchScPos,
          scratchVelDir,
          thrustFraction,
          runtimeQuality.particleBudget,
        );
      }
    }
    const engineCore = exhaustCoreRef.current;
    const engineHalo = exhaustHaloRef.current;
    const shockRing = shockRingRef.current;
    if (engineCore && engineHalo && shockRing) {
      const flame = hasThrust ? THREE.MathUtils.clamp(thrustFraction, 0.08, 1) : 0;
      engineCore.visible = flame > 0;
      engineHalo.visible = flame > 0;
      shockRing.visible = flame > 0;
      exhaustCoreMat.opacity = flame * (0.2 + Math.sin(stateClock.clock.elapsedTime * 24) * 0.025);
      exhaustHaloMat.opacity = flame * 0.055;
      shockRingMat.opacity = flame * 0.045;
      engineCore.scale.set(0.18 + flame * 0.1, 0.34 + flame * 0.2, 0.18 + flame * 0.1);
      engineHalo.scale.set(0.22 + flame * 0.12, 0.4 + flame * 0.24, 0.22 + flame * 0.12);
      shockRing.scale.setScalar(0.3 + flame * 0.18 + Math.sin(stateClock.clock.elapsedTime * 18) * 0.012);
    }

    particleFrameRef.current += 1;
    const shouldUpdateParticles =
      particleFrameRef.current % runtimeQuality.particleUpdateStride === 0;
    if (shouldUpdateParticles) {
      const particleDt = cappedDt * runtimeQuality.particleUpdateStride;
      const liveParticleCount = Math.min(PARTICLE_COUNT, runtimeQuality.particleBudget);
      for (let i = 0; i < liveParticleCount; i++) {
        particleAges[i] += particleDt;
        const life = particleAges[i]! / particleLifetimes[i]!;
        if (life >= 1.0) {
          particleAlphas[i] = 0;
        } else {
          particleAlphas[i] = 1.0 - life;
          const vel = particleVelocities[i]!;
          particlePositions[i * 3] += vel.x * particleDt;
          particlePositions[i * 3 + 1] += vel.y * particleDt;
          particlePositions[i * 3 + 2] += vel.z * particleDt;
        }
      }
      particleGeom.attributes.position.needsUpdate = true;
      particleGeom.attributes.alpha.needsUpdate = true;
    }

    const scPos = scratchScPos.set(scX, scY, scZ);
    const shouldRecordTrajectory =
      trajectoryCountRef.current === 0 ||
      state.missionTimeS % runtimeQuality.trajectorySampleSeconds < simDt ||
      state.phase === "marsInjection" ||
      state.phase === "tliBurn";
    if (shouldRecordTrajectory) {
      let idx = trajectoryIndexRef.current;
      if (trajectoryCountRef.current >= TRAJECTORY_POINTS) {
        trajectoryPositions.copyWithin(0, 3);
        idx = TRAJECTORY_POINTS - 1;
      }
      trajectoryPositions[idx * 3] = scX;
      trajectoryPositions[idx * 3 + 1] = scY;
      trajectoryPositions[idx * 3 + 2] = scZ;
      trajectoryIndexRef.current = Math.min(TRAJECTORY_POINTS, idx + 1);
      trajectoryCountRef.current = Math.min(TRAJECTORY_POINTS, trajectoryCountRef.current + 1);
      trajectoryGeom.setDrawRange(0, trajectoryCountRef.current);
      trajectoryGeom.attributes.position.needsUpdate = true;
    }

    const destination = launchConfigRef?.current?.destination ?? state.destination;
    const missionColor = destination === "Mars" ? "#ff9d73" : destination === "LEO" ? "#9fb3c8" : "#90caff";
    trajectoryMat.color.set(missionColor);
    guidanceLineMat.color.set(missionColor);
    const targetGroup = missionTargetRef.current;
    if (targetGroup) {
      const showTarget = destination !== "LEO";
      targetGroup.visible = showTarget;
      if (showTarget) {
        if (destination === "Mars") {
          scratchTargetDir.set(state.velX, state.velY, state.velZ).normalize();
          targetGroup.position.copy(scPos).add(scratchTargetDir.multiplyScalar(4.2));
          targetGroup.scale.setScalar(0.42);
        } else {
          targetGroup.position.set(
            localMToScene(state.moonOffsetM[0]),
            localMToScene(state.moonOffsetM[1]),
            localMToScene(state.moonOffsetM[2]),
          );
          targetGroup.scale.setScalar(destination === "Gateway" ? 0.24 : 0.18);
        }
        targetGroup.rotation.z += cappedDt * 0.16;
        targetGroup.rotation.y += cappedDt * 0.1;
      }
    }

    const guidanceTarget = missionTargetRef.current?.visible
      ? missionTargetRef.current.position
      : null;
    if (guidanceTarget) {
      guidanceLine.visible = true;
      guidanceLinePositions[0] = scX;
      guidanceLinePositions[1] = scY;
      guidanceLinePositions[2] = scZ;
      guidanceLinePositions[3] = guidanceTarget.x;
      guidanceLinePositions[4] = guidanceTarget.y;
      guidanceLinePositions[5] = guidanceTarget.z;
      guidanceLineGeom.attributes.position.needsUpdate = true;
    } else {
      guidanceLine.visible = false;
    }

    if (state.phase === "prelaunch") {
      const [nx, ny, nz] = surfaceNormal(state.launchLatRad, state.launchLonRad);
      const padSurface = scratchOffset.set(
        localMToScene(EARTH_RADIUS_M * nx),
        localMToScene(EARTH_RADIUS_M * ny),
        localMToScene(EARTH_RADIUS_M * nz),
      );
      const up = scratchUp.set(nx, ny, nz).normalize();
      const side = scratchSide.set(ny, -nx, 0).normalize();
      camTargetUp.copy(up);
      camTargetPos.copy(padSurface)
        .addScaledVector(up, launchFrame.elevationDistance)
        .addScaledVector(side, launchFrame.sideDistance);
      camTargetLookAt.copy(scPos).addScaledVector(up, launchFrame.lookAheadDistance);
    } else if (state.phase === "transLunarCoast" || state.phase === "interplanetaryCoast") {
      const midPoint = scratchOffset.copy(scratchOrigin.set(0, 0, 0)).lerp(scPos, 0.5);
      const dist = Math.max(3.2, scPos.length() * 1.45);
      scratchTargetDir.copy(midPoint).normalize();
      camTargetPos.copy(scratchTargetDir.multiplyScalar(dist)).add(
        scratchUp.set(0, dist * 0.24, 0),
      );
      camTargetLookAt.copy(midPoint);
      camTargetUp.set(0, 1, 0);
    } else {
      const up = scratchUp.copy(scPos).normalize();
      camTargetUp.copy(up);
      const velDir = state.missionTimeS < 24 || state.altitudeM < 12_000
        ? scratchVelDir.copy(up)
        : scratchVelDir.set(state.velX, state.velY, state.velZ).normalize();
      const behind = scratchTargetDir.copy(velDir).negate();
      const side = scratchSide.crossVectors(up, scratchWorldAxis.set(0, 1, 0));
      if (side.lengthSq() < 0.001) side.crossVectors(up, scratchWorldAxis.set(1, 0, 0));
      side.normalize();
      const offset = scratchOffset.copy(behind)
        .multiplyScalar(launchFrame.trailingDistance + altNorm * 0.42)
        .add(scratchUpOffset.copy(up).multiplyScalar(launchFrame.elevationDistance + altNorm * 0.58))
        .add(side.multiplyScalar(launchFrame.sideDistance + altNorm * 1.1));
      camTargetPos.copy(scPos).add(offset);
      camTargetLookAt.copy(scPos).addScaledVector(velDir, launchFrame.lookAheadDistance);
    }

    const controls = controlsRef?.current;
    if (manualCameraRef.current && controls) {
      controls.target.lerp(scPos, 1 - Math.pow(0.02, cappedDt));
      controls.minDistance = 0.04;
      controls.maxDistance = 18;
      controls.update();
    } else {
      const positionBlend = 1 - Math.pow(0.002, cappedDt);
      const orientationBlend = 1 - Math.pow(0.01, cappedDt);
      camera.position.lerp(camTargetPos, positionBlend);
      camera.up.lerp(camTargetUp, orientationBlend).normalize();
      camera.getWorldDirection(scratchLookDir);
      scratchTargetDir.copy(camTargetLookAt).sub(camera.position).normalize();
      scratchLookDir.lerp(scratchTargetDir, orientationBlend).normalize();
      camera.lookAt(scratchTargetDir.copy(camera.position).add(scratchLookDir));
      if (controls) {
        controls.target.copy(camTargetLookAt);
        controls.minDistance = 0.04;
        controls.maxDistance = 18;
      }
    }
    if (cameraFillRef.current) {
      cameraFillRef.current.position.copy(camera.position);
    }
    const markerRoot = runtimeMarkerRootRef.current;
    const elapsed = stateClock.clock.elapsedTime;
    if (markerRoot && elapsed - lastRuntimeMarkerWriteRef.current >= 0.2) {
      let projectedMinX = 1;
      let projectedMaxX = -1;
      let projectedMinY = 1;
      let projectedMaxY = -1;
      if (scGroup) {
        scratchBounds.setFromObject(scGroup).getCenter(scratchBoundsCenter);
        scratchBounds.getSize(scratchBoundsSize);
        for (let cornerIndex = 0; cornerIndex < 8; cornerIndex += 1) {
          scratchBoundsCorner.set(
            cornerIndex & 1 ? scratchBounds.max.x : scratchBounds.min.x,
            cornerIndex & 2 ? scratchBounds.max.y : scratchBounds.min.y,
            cornerIndex & 4 ? scratchBounds.max.z : scratchBounds.min.z,
          ).project(camera);
          projectedMinX = Math.min(projectedMinX, scratchBoundsCorner.x);
          projectedMaxX = Math.max(projectedMaxX, scratchBoundsCorner.x);
          projectedMinY = Math.min(projectedMinY, scratchBoundsCorner.y);
          projectedMaxY = Math.max(projectedMaxY, scratchBoundsCorner.y);
        }
      } else {
        scratchBoundsCenter.copy(scPos);
      }
      scratchProjected.copy(scratchBoundsCenter).project(camera);
      markerRoot.setAttribute("data-launch-subject-ndc-x", scratchProjected.x.toFixed(4));
      markerRoot.setAttribute("data-launch-subject-ndc-y", scratchProjected.y.toFixed(4));
      markerRoot.setAttribute("data-launch-subject-coverage-x", Math.max(0, projectedMaxX - projectedMinX).toFixed(4));
      markerRoot.setAttribute("data-launch-subject-coverage-y", Math.max(0, projectedMaxY - projectedMinY).toFixed(4));
      markerRoot.setAttribute("data-launch-camera-distance", camera.position.distanceTo(scratchBoundsCenter).toFixed(4));
      markerRoot.setAttribute("data-launch-camera-mode", manualCameraRef.current ? "manual-orbit" : "director-follow");
      markerRoot.setAttribute("data-launch-director-phase", nextDirectorPhase);
      markerRoot.setAttribute("data-launch-composition-version", LAUNCH_COMPOSITION_V2_VERSION);
      markerRoot.setAttribute("data-launch-composition-coverage", launchFrame.desiredSubjectCoverage.toFixed(3));
      markerRoot.setAttribute(
        "data-launch-asset-profile",
        usesSlsAsset && slsAssetState === "ready"
          ? "sls-content-pack-pbr-v3"
          : usesSlsAsset
            ? "procedural-asset-fallback"
            : "procedural-profile",
      );
      markerRoot.setAttribute("data-launch-asset-load-state", usesSlsAsset ? slsAssetState : "fallback");
      markerRoot.setAttribute(
        "data-launch-camera-view-offset",
        camera instanceof THREE.PerspectiveCamera && camera.view?.enabled ? "enabled" : "clear",
      );
      lastRuntimeMarkerWriteRef.current = elapsed;
    }

    const readyForDeepSpace =
      (state.phase === "transLunarCoast" || state.phase === "interplanetaryCoast") &&
      state.altitudeM >= state.handoffAltitudeM;
    if (readyForDeepSpace) {
      const helio = convertToHeliocentric(state);
      onHandoff({
        posM: helio.posM,
        velMs: helio.velMs,
        massKg: state.totalMassKg,
      });
      return;
    }

    const cloudMesh = spacecraftRef.current;
    if (cloudMesh) {
      cloudMesh.children.forEach((child) => {
        if (child.name === "engineBellGlow") {
          child.scale.setScalar(1 + Math.sin(stateClock.clock.elapsedTime * 18) * 0.12);
        }
      });
    }
  });

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

function surfaceNormal(lat: number, lon: number): [number, number, number] {
  return [
    Math.cos(lat) * Math.cos(lon),
    Math.cos(lat) * Math.sin(lon),
    Math.sin(lat),
  ];
}
