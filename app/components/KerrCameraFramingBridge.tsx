"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { dispatchCameraFocusOrigin } from "../lib/camera-bridge";
import { smootherstep01 } from "../lib/cameraFocusCommand";
import { atlasRuntimeStore } from "../lib/atlasRuntimeStore";

const DESKTOP_KERR_DISTANCE = 350;
const MOBILE_KERR_DISTANCE = 155;

export default function KerrCameraFramingBridge({
  controlsRef,
}: {
  controlsRef: MutableRefObject<OrbitControlsImpl | null>;
}) {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const viewportWidth = useThree((state) => state.size.width);
  const startCameraRef = useRef(new THREE.Vector3());
  const startTargetRef = useRef(new THREE.Vector3());
  const targetRef = useRef(new THREE.Vector3());
  const destinationRef = useRef(new THREE.Vector3());
  const startedAtRef = useRef(0);
  const durationMsRef = useRef(900);
  const transitioningRef = useRef(false);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const mobile = viewportWidth > 0 && viewportWidth < 700;
    startCameraRef.current.copy(camera.position);
    startTargetRef.current.copy(controls.target);
    destinationRef.current
      .set(0.22, 0.28, 0.93)
      .normalize()
      .multiplyScalar(mobile ? MOBILE_KERR_DISTANCE : DESKTOP_KERR_DISTANCE);
    startedAtRef.current = performance.now();
    durationMsRef.current = mobile ? 1200 : 1000;
    transitioningRef.current = true;
    atlasRuntimeStore.beginFocusCommand("kerr-strong-field", startedAtRef.current);
    atlasRuntimeStore.setFocusTransition("transition");
    return () => {
      transitioningRef.current = false;
      dispatchCameraFocusOrigin();
    };
  }, [camera, controlsRef, viewportWidth]);

  useFrame(() => {
    if (!transitioningRef.current) return;
    const controls = controlsRef.current;
    if (!controls) return;
    const u = THREE.MathUtils.clamp(
      (performance.now() - startedAtRef.current) / durationMsRef.current,
      0,
      1,
    );
    const eased = smootherstep01(u);
    controls.target.lerpVectors(startTargetRef.current, targetRef.current, eased);
    camera.position.lerpVectors(startCameraRef.current, destinationRef.current, eased);
    controls.minDistance = 70;
    controls.maxDistance = 1800;
    controls.update();
    if (u >= 1) {
      transitioningRef.current = false;
      atlasRuntimeStore.setFocusTransition("idle");
    }
  }, 3);

  return null;
}
