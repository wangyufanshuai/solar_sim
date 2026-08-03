"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import {
  atlasCameraPresentationCanWriteV273,
  releaseAtlasCameraPresentationLeaseV273,
  requestAtlasCameraPresentationLeaseV273,
  type AtlasCameraPresentationLeaseV273,
} from "../lib/atlasCameraPresentationLeaseV273";
import { ATLAS_SCALE_CAMERA_DISTANCE_V268, setAtlasScaleTransitionProgressV268 } from "../lib/atlasScaleJourneyV268";
import { ATLAS_SCALE_ORBIT_LIMITS_V273 } from "../lib/atlasScalePresentationV273";
import { atlasRuntimeStore, useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";

type StepState = {
  requestId: number;
  stepIndex: number;
  startedAtClockMs: number;
  startDistance: number;
  baseFov: number;
};

/** Presentation-only log dolly. Local scale origins and physics stay independent. */
export default function AtlasScaleTransitionBridgeV268({ controlsRef }: { controlsRef: RefObject<OrbitControlsImpl | null> }) {
  const camera = useThree((state) => state.camera);
  const journey = useAtlasRuntimeStore((snapshot) => snapshot.scaleJourney);
  const directionRef = useRef(new THREE.Vector3());
  const targetRef = useRef(new THREE.Vector3());
  const leaseRef = useRef<AtlasCameraPresentationLeaseV273 | null>(null);
  const stepRef = useRef<StepState>({ requestId: -1, stepIndex: -1, startedAtClockMs: -1, startDistance: 1, baseFov: 50 });

  useEffect(() => {
    if (journey.lifecycle !== "transition") return;
    const controls = controlsRef.current;
    if (!controls) return;
    const lease = requestAtlasCameraPresentationLeaseV273("scale-journey", journey.requestId);
    if (!lease.active) {
      atlasRuntimeStore.cancelScaleJourney(journey.requestId);
      return;
    }
    leaseRef.current = lease;
    const releaseResource = acquireAtlasResource("camera-lock", "atlas", `scale-journey-v273-${journey.requestId}`, { owner: "camera-presentation" });
    const previous = { enabled: controls.enabled, minDistance: controls.minDistance, maxDistance: controls.maxDistance };
    targetRef.current.copy(controls.target);
    directionRef.current.copy(camera.position).sub(targetRef.current);
    const fromLimits = ATLAS_SCALE_ORBIT_LIMITS_V273[journey.from];
    const toLimits = ATLAS_SCALE_ORBIT_LIMITS_V273[journey.to];
    controls.enabled = false;
    controls.minDistance = Math.min(fromLimits.minDistance, toLimits.minDistance);
    controls.maxDistance = Math.max(fromLimits.maxDistance, toLimits.maxDistance, ATLAS_SCALE_CAMERA_DISTANCE_V268[journey.to] * 1.05);
    stepRef.current = {
      requestId: journey.requestId,
      stepIndex: journey.stepIndex,
      startedAtClockMs: -1,
      startDistance: Math.max(0.001, directionRef.current.length()),
      baseFov: camera instanceof THREE.PerspectiveCamera ? camera.fov : 50,
    };
    setAtlasScaleTransitionProgressV268(journey, 0);
    return () => {
      controls.enabled = previous.enabled;
      controls.minDistance = previous.minDistance;
      controls.maxDistance = previous.maxDistance;
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = stepRef.current.baseFov;
        camera.updateProjectionMatrix();
      }
      releaseAtlasCameraPresentationLeaseV273(lease);
      releaseResource();
      if (leaseRef.current?.token === lease.token) leaseRef.current = null;
    };
  }, [camera, controlsRef, journey]);

  useFrame(({ clock }) => {
    if (journey.lifecycle !== "transition") return;
    if (!atlasCameraPresentationCanWriteV273("scale-journey")) {
      atlasRuntimeStore.cancelScaleJourney(journey.requestId);
      return;
    }
    const step = stepRef.current;
    if (step.requestId !== journey.requestId || step.stepIndex !== journey.stepIndex || !leaseRef.current?.active) return;
    const nowMs = clock.elapsedTime * 1_000;
    if (step.startedAtClockMs < 0) step.startedAtClockMs = nowMs;
    const raw = journey.durationMs <= 0 ? 1 : (nowMs - step.startedAtClockMs) / journey.durationMs;
    const progress = THREE.MathUtils.clamp(raw, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    setAtlasScaleTransitionProgressV268(journey, eased);
    const controls = controlsRef.current;
    if (!controls) return;
    targetRef.current.copy(controls.target);
    directionRef.current.copy(camera.position).sub(targetRef.current);
    if (directionRef.current.lengthSq() < 1e-9) directionRef.current.set(0, 0, 1);
    directionRef.current.normalize();
    const targetDistance = ATLAS_SCALE_CAMERA_DISTANCE_V268[journey.to];
    const distance = Math.exp(Math.log(Math.max(0.001, step.startDistance)) * (1 - eased) + Math.log(targetDistance) * eased);
    camera.position.copy(targetRef.current).addScaledVector(directionRef.current, distance);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = step.baseFov * (1 - Math.sin(Math.PI * eased) * 0.075);
      camera.updateProjectionMatrix();
    }
    controls.update();
    if (progress >= 1) {
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = step.baseFov;
        camera.updateProjectionMatrix();
      }
      atlasRuntimeStore.completeScaleJourneyStep(journey.requestId, journey.requestedAtMs + journey.durationMs);
    }
  }, 1);
  return null;
}
