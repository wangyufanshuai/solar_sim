"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect } from "react";
import {
  createLocalLaunchState,
  stepLocalLaunch,
  convertToHeliocentric,
  getLocalTelemetry,
  localMToScene,
} from "../lib/localLaunchPhysics";
import {
  SPACECRAFT_BODY_INDEX,
  EARTH_BODY_INDEX,
  MOON_BODY_INDEX,
} from "../data/planetsJ2000";
import { LAUNCH_CAMERA_FOLLOW_EVENT } from "../lib/launchCameraControl";
import { getLaunchSequenceDirectorPhase } from "../lib/launchSequenceDirector";
import {
  LAUNCH_COMPOSITION_V2_VERSION,
  solveLaunchFrameV2,
} from "../lib/launchCompositionV2";
import { PARTICLE_COUNT, TRAJECTORY_POINTS, useLaunchSceneResources } from "./useLaunchSceneResources";
import LaunchScenePresentation from "./LaunchScenePresentation";
import { createAtlasVisualTokenSignatureV300, useAtlasVisualRuntimeConsumerV300 } from "../lib/atlasVisualRuntimeConsumptionV300";

const EARTH_RADIUS_M = 6_378_137;
const PHYSICS_SUB_STEPS = 8;
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

import type { LaunchSceneViewProps } from "./LaunchSceneViewProps";
export type { LaunchSceneViewProps } from "./LaunchSceneViewProps";

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
  const launchResources = useLaunchSceneResources({ launchConfigRef, runtimeQualityTier });
  const {
    camTargetLookAt, camTargetPos, camTargetUp, camera,
    cameraFillRef, directorPhaseRef, emitParticle, exhaustCoreMat,
    exhaustCoreRef, exhaustHaloMat, exhaustHaloRef, guidanceLine,
    guidanceLineGeom, guidanceLineMat, guidanceLinePositions, initializedRef,
    lastRuntimeMarkerWriteRef, launchPadRef, localStateRef, manualCameraRef,
    missionTargetRef,
    particleAges, particleAlphas, particleFrameRef, particleGeom,
    particleLifetimes, particleMat, particlePositions, particleVelocities,
    runtimeMarkerRootRef, runtimeQuality, visualRendererProfile,
    scratchBounds, scratchBoundsCenter, scratchBoundsCorner, scratchBoundsSize,
    scratchLookDir, scratchOffset, scratchOrigin, scratchProjected,
    scratchQuat, scratchScPos, scratchSide, scratchTargetDir,
    scratchUp, scratchUpOffset, scratchVelDir, scratchWorldAxis,
    setCameraModeTick, setDirectorPhase, shockRingMat,
    shockRingRef, slsAssetState, spacecraftRef, sunDir,
    trajectoryCountRef, trajectoryGeom, trajectoryIndexRef,
    trajectoryMat, trajectoryPositions, usesSlsAsset,
  } = launchResources;
  useAtlasVisualRuntimeConsumerV300({
    profile: visualRendererProfile.id,
    group: "launch",
    consumer: "LaunchSceneView",
    tokenSignature: createAtlasVisualTokenSignatureV300(visualRendererProfile.runtimeTokens.launch),
  });

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
  }, [active, physicsRef, launchConfigRef, sunDir, camera, camTargetPos, camTargetLookAt, camTargetUp, runtimeQualityTier, initializedRef, launchPadRef, localStateRef, trajectoryCountRef, trajectoryIndexRef]);

  useEffect(() => {
    if (!active) {
      initializedRef.current = false;
      localStateRef.current = null;
      if (telemetryRef) telemetryRef.current = null;
    }
  }, [active, telemetryRef, initializedRef, localStateRef]);

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
  }, [active, controlsRef, manualCameraRef, setCameraModeTick]);

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
      const altitudePlumeScale = visualRendererProfile.interfaceDensity !== "legacy"
        ? THREE.MathUtils.lerp(1.12, 0.72, THREE.MathUtils.clamp(state.altitudeM / 90_000, 0, 1))
        : 1;
      const plumeScale = (runtimeQuality.plumeBudget === "full-plume" ? 1 : 0.58) * altitudePlumeScale;
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
      exhaustCoreMat.opacity = flame * (visualRendererProfile.runtimeTokens.launch.coreOpacity + Math.sin(stateClock.clock.elapsedTime * 24) * 0.025);
      exhaustHaloMat.opacity = flame * visualRendererProfile.runtimeTokens.launch.haloOpacity;
      shockRingMat.opacity = flame * visualRendererProfile.runtimeTokens.launch.shockOpacity;
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
    <LaunchScenePresentation
      resources={launchResources}
      launchConfigRef={launchConfigRef}
    />
  );
}

function surfaceNormal(lat: number, lon: number): [number, number, number] {
  return [
    Math.cos(lat) * Math.cos(lon),
    Math.cos(lat) * Math.sin(lon),
    Math.sin(lat),
  ];
}
