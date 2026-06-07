"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { AU_TO_SCENE, SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import {
  CINEMATIC_CAMERA_EVENT,
  CINEMATIC_CAMERA_PRESETS,
  type CinematicCameraPreset,
  type CinematicCameraPresetId,
} from "../lib/cinematicCamera";
import { cameraIntentReducer, type CameraIntentState } from "../lib/cameraIntentState";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";

type Transition = {
  preset: CinematicCameraPreset;
  startMs: number;
  fromPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  fromFov: number;
};

export default function CinematicCameraBridge({
  controlsRef,
  physicsRef,
  floatingOriginRef,
  cameraIntentRef,
}: {
  controlsRef: MutableRefObject<OrbitControlsImpl | null>;
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  cameraIntentRef?: MutableRefObject<CameraIntentState>;
}) {
  const { camera } = useThree();
  const transitionRef = useRef<Transition | null>(null);
  const bodyIndexById = useMemo(
    () => new Map(SOLAR_SYSTEM_BODIES.map((body, index) => [body.id, index])),
    [],
  );

  useEffect(() => {
    const onPreset = (event: Event) => {
      const id = (event as CustomEvent<{ id: CinematicCameraPresetId }>).detail?.id;
      const preset = CINEMATIC_CAMERA_PRESETS.find((item) => item.id === id);
      const controls = controlsRef.current;
      if (!preset || !controls) return;
      transitionRef.current = {
        preset,
        startMs: performance.now(),
        fromPosition: camera.position.clone(),
        fromTarget: controls.target.clone(),
        fromFov: (camera as THREE.PerspectiveCamera).fov,
      };
      if (cameraIntentRef) {
        cameraIntentRef.current = cameraIntentReducer(cameraIntentRef.current, {
          type: "cinematic",
          targetLabel: preset.label,
          progress: 0,
          reason: "cinematic preset requested",
        });
      }
    };
    window.addEventListener(CINEMATIC_CAMERA_EVENT, onPreset);
    return () => window.removeEventListener(CINEMATIC_CAMERA_EVENT, onPreset);
  }, [camera, cameraIntentRef, controlsRef]);

  useFrame(() => {
    const transition = transitionRef.current;
    const controls = controlsRef.current;
    if (!transition || !controls) return;
    const { preset } = transition;
    const elapsed = performance.now() - transition.startMs;
    const linear = Math.min(1, elapsed / preset.durationMs);
    const progress = linear * linear * (3 - 2 * linear);
    const target = new THREE.Vector3(...preset.targetOffset);
    if (preset.bodyId) {
      const bodyIndex = bodyIndexById.get(preset.bodyId);
      const physics = physicsRef.current;
      if (bodyIndex !== undefined && physics && bodyIndex < physics.n) {
        const offset = bodyIndex * 3;
        target.set(
          ((physics.posAu[offset] ?? 0) - floatingOriginRef.current.offsetAu[0]) * AU_TO_SCENE,
          ((physics.posAu[offset + 1] ?? 0) - floatingOriginRef.current.offsetAu[1]) * AU_TO_SCENE,
          ((physics.posAu[offset + 2] ?? 0) - floatingOriginRef.current.offsetAu[2]) * AU_TO_SCENE,
        ).add(new THREE.Vector3(...preset.targetOffset));
      }
    }
    const destination = target.clone().add(new THREE.Vector3(...preset.positionOffset));
    camera.position.lerpVectors(transition.fromPosition, destination, progress);
    controls.target.lerpVectors(transition.fromTarget, target, progress);
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.fov = THREE.MathUtils.lerp(transition.fromFov, preset.fov, progress);
    perspective.updateProjectionMatrix();
    controls.update();
    if (cameraIntentRef) {
      cameraIntentRef.current = cameraIntentReducer(cameraIntentRef.current, {
        type: "cinematic",
        targetLabel: preset.label,
        progress,
        distance: camera.position.distanceTo(target),
        reason: linear < 1 ? "cinematic transition progressing" : "cinematic preset active",
      });
    }
    if (linear >= 1) transitionRef.current = null;
  }, 2);

  return null;
}
