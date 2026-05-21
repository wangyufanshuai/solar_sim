"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useCallback, useEffect, useMemo, useRef } from "react";
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

const EARTH_RADIUS_M = 6_378_137;
const PHYSICS_SUB_STEPS = 8;
const PARTICLE_COUNT = 72;
const TRAJECTORY_POINTS = 180;

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
};

export default function LaunchSceneView({
  physicsRef,
  onHandoff,
  onAbort,
  telemetryRef,
  active,
  launchConfigRef,
}: LaunchSceneViewProps) {
  const { camera } = useThree();
  const destinationLabel = launchConfigRef?.current?.destination ?? "Moon";
  const localStateRef = useRef<LocalLaunchState | null>(null);
  const initializedRef = useRef(false);

  const camTargetPos = useMemo(() => new THREE.Vector3(0, 0, 3), []);
  const camTargetLookAt = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const sunDir = useMemo(() => new THREE.Vector3(1, 0.2, 0.5).normalize(), []);

  const earthDay = useOptionalTexture("/textures/planets/8k_earth_daymap.jpg");
  const earthClouds = useOptionalTexture("/textures/planets/8k_earth_clouds.jpg");

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

  const emitParticle = useCallback(
    (origin: THREE.Vector3, thrustDir: THREE.Vector3, thrustFraction: number) => {
      const i = nextParticleIdx.current;
      nextParticleIdx.current = (nextParticleIdx.current + 1) % PARTICLE_COUNT;

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
    const initialCam = padSurface
      .clone()
      .add(up.clone().multiplyScalar(0.42))
      .add(tangent.multiplyScalar(0.34));
    camera.position.copy(initialCam);
    camera.lookAt(padSurface.clone().add(up.multiplyScalar(0.08)));
    camTargetPos.copy(initialCam);
    camTargetLookAt.copy(padSurface);
    const pad = launchPadRef.current;
    if (pad) {
      const padUp = new THREE.Vector3(nx, ny, nz).normalize();
      pad.position.copy(padSurface).addScaledVector(padUp, 0.002);
      pad.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), padUp);
    }
    trajectoryIndexRef.current = 0;
    trajectoryCountRef.current = 0;
    initializedRef.current = true;
  }, [active, physicsRef, launchConfigRef, sunDir, camera, camTargetPos, camTargetLookAt]);

  useEffect(() => {
    if (!active) {
      initializedRef.current = false;
      localStateRef.current = null;
      if (telemetryRef) telemetryRef.current = null;
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onAbort();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onAbort]);

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

    if (telemetryRef) {
      telemetryRef.current = getLocalTelemetry(state);
    }

    const scX = localMToScene(state.posX);
    const scY = localMToScene(state.posY);
    const scZ = localMToScene(state.posZ);
    const altNorm = state.altitudeM / EARTH_RADIUS_M;

    const scGroup = spacecraftRef.current;
    if (scGroup) {
      scGroup.position.set(scX, scY, scZ);
      const speed = state.speedMs;
      scGroup.rotation.z += cappedDt * 0.2;
      if (speed > 1) {
        const vn = new THREE.Vector3(state.velX, state.velY, state.velZ).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const quat = new THREE.Quaternion();
        quat.setFromUnitVectors(up, vn);
        scGroup.quaternion.slerp(quat, 0.2);
      }
    }

    const hasThrust = state.currentThrustN > 0;
    const thrustFraction = Math.min(1, state.currentThrustN / 16_000_000);
    if (hasThrust && scGroup) {
      const velDir = new THREE.Vector3(state.velX, state.velY, state.velZ).normalize();
      const scPos = new THREE.Vector3(scX, scY, scZ);
      const emitCount = Math.ceil(1 + 3 * thrustFraction);
      for (let i = 0; i < emitCount; i++) {
        emitParticle(scPos, velDir, thrustFraction);
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
      exhaustCoreMat.opacity = flame * (0.52 + Math.sin(stateClock.clock.elapsedTime * 24) * 0.08);
      exhaustHaloMat.opacity = flame * 0.3;
      shockRingMat.opacity = flame * 0.16;
      engineCore.scale.set(0.82 + flame * 0.55, 1.9 + flame * 2.8, 0.82 + flame * 0.55);
      engineHalo.scale.set(1.25 + flame * 0.95, 2.4 + flame * 3.6, 1.25 + flame * 0.95);
      shockRing.scale.setScalar(1.0 + flame * 1.8 + Math.sin(stateClock.clock.elapsedTime * 18) * 0.08);
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particleAges[i] += cappedDt;
      const life = particleAges[i]! / particleLifetimes[i]!;
      if (life >= 1.0) {
        particleAlphas[i] = 0;
      } else {
        particleAlphas[i] = 1.0 - life;
        const vel = particleVelocities[i]!;
        particlePositions[i * 3] += vel.x * cappedDt;
        particlePositions[i * 3 + 1] += vel.y * cappedDt;
        particlePositions[i * 3 + 2] += vel.z * cappedDt;
      }
    }
    particleGeom.attributes.position.needsUpdate = true;
    particleGeom.attributes.alpha.needsUpdate = true;

    const scPos = new THREE.Vector3(scX, scY, scZ);
    const shouldRecordTrajectory =
      trajectoryCountRef.current === 0 ||
      state.missionTimeS % 3 < simDt ||
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
          const transferDir = new THREE.Vector3(state.velX, state.velY, state.velZ).normalize();
          targetGroup.position.copy(scPos).add(transferDir.multiplyScalar(4.2));
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
      const padSurface = new THREE.Vector3(
        localMToScene(EARTH_RADIUS_M * nx),
        localMToScene(EARTH_RADIUS_M * ny),
        localMToScene(EARTH_RADIUS_M * nz),
      );
      const camOffset = new THREE.Vector3(nx, ny, nz).multiplyScalar(0.42);
      camTargetPos.copy(padSurface).add(camOffset).add(
        new THREE.Vector3(ny * 0.7, -nx * 0.42, 0).multiplyScalar(0.32),
      );
      camTargetLookAt.copy(scPos).lerp(new THREE.Vector3(0, 0, 0), 0.18);
    } else if (state.phase === "transLunarCoast" || state.phase === "interplanetaryCoast") {
      const midPoint = new THREE.Vector3(0, 0, 0).lerp(scPos, 0.5);
      const dist = Math.max(3.2, scPos.length() * 1.45);
      const dir = midPoint.clone().normalize();
      camTargetPos.copy(dir.multiplyScalar(dist)).add(
        new THREE.Vector3(0, dist * 0.24, 0),
      );
      camTargetLookAt.copy(midPoint);
    } else {
      const up = scPos.clone().normalize();
      const velDir = new THREE.Vector3(state.velX, state.velY, state.velZ).normalize();
      const behind = velDir.clone().negate();
      const camDist = Math.max(0.55, altNorm * 6.5 + 0.42);
      const side = new THREE.Vector3().crossVectors(up, new THREE.Vector3(0, 1, 0));
      if (side.lengthSq() < 0.001) side.crossVectors(up, new THREE.Vector3(1, 0, 0));
      side.normalize();
      const offset = behind
        .multiplyScalar(camDist * 0.5)
        .add(up.clone().multiplyScalar(camDist * 0.42))
        .add(side.multiplyScalar(camDist * 0.24));
      camTargetPos.copy(scPos).add(offset);
      camTargetLookAt.copy(scPos).add(up.multiplyScalar(0.06 + Math.min(0.18, altNorm * 0.5)));
    }

    camera.position.lerp(camTargetPos, 0.08);
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    const targetDir = camTargetLookAt.clone().sub(camera.position).normalize();
    currentLookAt.lerp(targetDir, 0.1);
    camera.lookAt(camera.position.clone().add(currentLookAt));

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
        <BrightStarCatalog opacity={0.075} />

      <directionalLight
        position={[sunDir.x * 100, sunDir.y * 100, sunDir.z * 100]}
        intensity={2.8}
        color="#fff4e6"
      />
      <ambientLight intensity={0.08} color="#335588" />

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[EARTH_SCENE_RADIUS, 96, 96]} />
        <meshStandardMaterial
          map={earthDay ?? undefined}
          color="#9dc3ff"
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>
      {earthClouds ? (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[EARTH_SCENE_RADIUS * 1.008, 96, 96]} />
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
        atmosphereIntensity={0.7}
      />

      <group ref={launchPadRef} renderOrder={3}>
        <mesh>
          <ringGeometry args={[0.038, 0.058, 72]} />
          <meshBasicMaterial
            color="#9db4c9"
            transparent
            opacity={0.48}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0, 0.002]}>
          <ringGeometry args={[0.072, 0.075, 96]} />
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={0.42}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0.045, 0, 0.018]}>
          <boxGeometry args={[0.012, 0.012, 0.034]} />
          <meshStandardMaterial color="#b8c0ca" metalness={0.55} roughness={0.38} />
        </mesh>
        <mesh position={[-0.045, 0, 0.016]}>
          <boxGeometry args={[0.01, 0.01, 0.03]} />
          <meshStandardMaterial color="#7d8998" metalness={0.52} roughness={0.42} />
        </mesh>
      </group>

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

      <group ref={spacecraftRef} scale={[1.05, 1.05, 1.05]}>
        <mesh position={[0, 0.017, 0]}>
          <cylinderGeometry args={[0.006, 0.008, 0.045, 16]} />
          <meshStandardMaterial color="#e9edf6" metalness={0.68} roughness={0.26} />
        </mesh>
        <mesh position={[0, 0.043, 0]}>
          <coneGeometry args={[0.0075, 0.018, 16]} />
          <meshStandardMaterial color="#f6f1ea" metalness={0.22} roughness={0.38} />
        </mesh>
        <mesh position={[-0.01, 0.006, 0]}>
          <cylinderGeometry args={[0.0038, 0.0048, 0.032, 12]} />
          <meshStandardMaterial color="#d7dce7" metalness={0.54} roughness={0.34} />
        </mesh>
        <mesh position={[0.01, 0.006, 0]}>
          <cylinderGeometry args={[0.0038, 0.0048, 0.032, 12]} />
          <meshStandardMaterial color="#d7dce7" metalness={0.54} roughness={0.34} />
        </mesh>
        <mesh position={[0, -0.008, 0]}>
          <cylinderGeometry args={[0.009, 0.007, 0.018, 16]} />
          <meshStandardMaterial color="#8b97aa" metalness={0.55} roughness={0.42} />
        </mesh>
        <mesh position={[0, -0.02, 0]} name="engineBellGlow" renderOrder={6}>
          <coneGeometry args={[0.01, 0.04, 12]} />
          <meshBasicMaterial
            color="#ff9258"
            transparent
            opacity={0.72}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh ref={exhaustCoreRef} position={[0, -0.052, 0]} material={exhaustCoreMat} renderOrder={7} visible={false}>
          <coneGeometry args={[0.011, 0.092, 18, 1, true]} />
        </mesh>
        <mesh ref={exhaustHaloRef} position={[0, -0.074, 0]} material={exhaustHaloMat} renderOrder={6} visible={false}>
          <coneGeometry args={[0.026, 0.14, 24, 1, true]} />
        </mesh>
        <mesh ref={shockRingRef} position={[0, -0.09, 0]} rotation={[Math.PI / 2, 0, 0]} material={shockRingMat} renderOrder={6} visible={false}>
          <torusGeometry args={[0.028, 0.002, 8, 48]} />
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
