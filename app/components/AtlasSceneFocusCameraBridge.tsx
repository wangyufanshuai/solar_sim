"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import { lodConfigForTier } from "../lib/galacticLod";
import { EARTH_BODY_INDEX, MOON_BODY_INDEX, SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { CAMERA_FOCUS_BODY_EVENT, CAMERA_FOCUS_DIRECTION_EVENT, CAMERA_FOCUS_EARTH_MOON_EVENT, CAMERA_FOCUS_ORIGIN_EVENT, CAMERA_ZOOM_EVENT, type CameraFocusBodyDetail, type CameraFocusDirectionDetail, type CameraZoomDetail } from "../lib/camera-bridge";
import { smootherstep01, type CameraFocusMode } from "../lib/cameraFocusCommand";
import { atlasRuntimeStore } from "../lib/atlasRuntimeStore";
import {
  atlasCameraPresentationCanWriteV273,
  getAtlasCameraPresentationLeaseV273,
  releaseAtlasCameraPresentationLeaseV273,
  requestAtlasCameraPresentationLeaseV273,
  type AtlasCameraPresentationLeaseV273,
} from "../lib/atlasCameraPresentationLeaseV273";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import { SKY_TARGET_CAMERA_HEIGHT_SCENE, SKY_TARGET_DISTANCE_SCENE, SKY_TARGET_ZOOM_MAX_DISTANCE_SCENE, SKY_TARGET_ZOOM_MIN_DISTANCE_SCENE, clampSkyTargetZoomDistance } from "../lib/skyTargetFocus";
import { ORBIT_ATLAS_CAMERA_POSITION, ORBIT_ATLAS_CAMERA_TARGET, type OrbitAtlasScaleMode, type SolarPresentationMode } from "../lib/orbitAtlasPresentation";
import {
  ORIGIN_CAMERA_OFFSET,
  applyCameraFrameProjection,
  applyTargetAnchorDelta,
  clearCameraFrameProjection,
  idealFocusCameraDistance,
  minFocusDistance,
  presentationPosition,
  runtimeFocusDurationMs,
  solveBodyCameraFrame,
  solveSkyCameraFrame,
} from "../lib/atlasSceneFocusCameraRuntime";
import { useAtlasCameraRuntimeMarkerWriter } from "./AtlasCameraRuntimeMarker";

type FocusMode = CameraFocusMode;
type ActiveFocus =
  | { kind: "body"; index: number; mode: FocusMode; start: number; until: number }
  | { kind: "earthMoon"; start: number; until: number }
  | { kind: "origin"; start: number; until: number }
  | {
      kind: "direction";
      direction: THREE.Vector3;
      start: number;
      until: number;
    };
export type CameraBodyFocusRequest = { bodyIndex: number; mode: FocusMode; nonce: number };

export function CameraFocusBodyBridge({ physicsRef, floatingOriginRef, earthMoonView, cameraBodyFocusRequest, cameraOriginResetNonce = 0, controlsRef, presentationMode, atlasScaleMode }: { physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>; floatingOriginRef: MutableRefObject<FloatingOriginState>; earthMoonView: boolean; cameraBodyFocusRequest?: CameraBodyFocusRequest | null; cameraOriginResetNonce?: number; controlsRef: MutableRefObject<OrbitControlsImpl | null>; presentationMode: SolarPresentationMode; atlasScaleMode: OrbitAtlasScaleMode }) {
  const camera = useThree((s) => s.camera as THREE.PerspectiveCamera);
  const viewportSize = useThree((s) => s.size);
  const viewportWidth = viewportSize.width;
  const viewportHeight = viewportSize.height;
  const focusViewport = viewportWidth > 0
    ? viewportWidth <= 767
      ? "mobile"
      : "desktop"
    : "unknown";
  const focusRef = useRef<ActiveFocus | null>(null);
  const lockBodyIndexRef = useRef<number | null>(null);
  const prevDampingRef = useRef(true);
  const userControllingRef = useRef(false);
  const tmpTarget = useRef(new THREE.Vector3());
  const tmpEarth = useRef(new THREE.Vector3());
  const tmpMoon = useRef(new THREE.Vector3());
  const tmpDir = useRef(new THREE.Vector3());
  const tmpCam = useRef(new THREE.Vector3());
  const tmpOffset = useRef(new THREE.Vector3());
  const tmpAnchorDelta = useRef(new THREE.Vector3());
  const lockTargetSmooth = useRef(new THREE.Vector3());
  const lockInitializedRef = useRef(false);
  const lockDesiredDistanceRef = useRef<number | null>(null);
  const lockViewDirRef = useRef(new THREE.Vector3(0.28, 0.38, 0.88).normalize());
  const skyLockDirectionRef = useRef<THREE.Vector3 | null>(null);
  const skyDesiredDistanceRef = useRef<number | null>(null);
  const skyViewDirRef = useRef(new THREE.Vector3(0.28, 0.38, 0.88).normalize());
  const lastRequestNonceRef = useRef<number | null>(null);
  const focusStartCamera = useRef(new THREE.Vector3());
  const focusStartTarget = useRef(new THREE.Vector3());
  const focusViewDirRef = useRef(new THREE.Vector3(0.28, 0.38, 0.88).normalize());
  const frameProjectionKeyRef = useRef("");
  const focusLeaseRef = useRef<AtlasCameraPresentationLeaseV273 | null>(null);
  const focusLeaseResourceReleaseRef = useRef<(() => void) | null>(null);
  const focusLeaseRequestIdRef = useRef(0);
  const writeCameraMarker = useAtlasCameraRuntimeMarkerWriter();

  useEffect(() => () => {
    clearCameraFrameProjection(camera, frameProjectionKeyRef);
    const lease = focusLeaseRef.current;
    if (lease) releaseAtlasCameraPresentationLeaseV273(lease);
    focusLeaseRef.current = null;
    focusLeaseResourceReleaseRef.current?.();
    focusLeaseResourceReleaseRef.current = null;
  }, [camera]);

  useEffect(() => {
    writeCameraMarker({
      rigPolicy: "target-anchor-user-orbit-distance-state",
      force: true,
    });
  }, [writeCameraMarker]);
  useEffect(() => {
    const controls = controlsRef.current;
    const captureFocusStart = () => {
      focusStartCamera.current.copy(camera.position);
      if (!controls) return;
      focusStartTarget.current.copy(controls.target);
      focusViewDirRef.current.subVectors(camera.position, controls.target);
      if (focusViewDirRef.current.lengthSq() < 1e-10 || !Number.isFinite(focusViewDirRef.current.x)) {
        focusViewDirRef.current.set(0.28, 0.38, 0.88);
      }
      focusViewDirRef.current.normalize();
    };
    const clearLock = (animateOrigin = false) => {
      focusRef.current = null;
      lockBodyIndexRef.current = null;
      lockInitializedRef.current = false;
      lockDesiredDistanceRef.current = null;
      skyLockDirectionRef.current = null;
      skyDesiredDistanceRef.current = null;
      clearCameraFrameProjection(camera, frameProjectionKeyRef);
      atlasRuntimeStore.setFocusTransition(animateOrigin ? "transition" : "idle");
      if (controls) controls.enableDamping = prevDampingRef.current;
      if (!animateOrigin) return;
      const now = performance.now();
      const targetDistance = presentationMode === "orbit-atlas"
        ? ORBIT_ATLAS_CAMERA_POSITION.distanceTo(ORBIT_ATLAS_CAMERA_TARGET)
        : ORIGIN_CAMERA_OFFSET.length();
      const currentDistance = controls ? camera.position.distanceTo(controls.target) : targetDistance;
      focusRef.current = {
        kind: "origin", start: now,
        until: now + runtimeFocusDurationMs(0, currentDistance / Math.max(targetDistance, 1e-4), focusViewport),
      };
      captureFocusStart();
    };
    const focusBodyTarget = (bodyIndex: number): THREE.Vector3 | null => {
      const physics = physicsRef.current;
      if (!physics || bodyIndex < 0 || bodyIndex >= physics.n) return null;
      return presentationPosition(
        physics.posAu[3 * bodyIndex]!, physics.posAu[3 * bodyIndex + 1]!,
        physics.posAu[3 * bodyIndex + 2]!, presentationMode, atlasScaleMode,
        floatingOriginRef.current, new THREE.Vector3(),
      );
    };
    const onControlStart = () => { userControllingRef.current = true; focusRef.current = null; };
    const onControlEnd = () => { userControllingRef.current = false; };
    const onBody = (event: Event) => {
      if (!atlasCameraPresentationCanWriteV273("focus-lock")) return;
      const detail = (event as CustomEvent<CameraFocusBodyDetail>).detail;
      if (detail?.bodyIndex == null || detail.bodyIndex < 0) return;
      const mode: FocusMode = detail.mode === "inspect" ? "inspect" : detail.mode === "lock" ? "lock" : "orbit";
      const target = focusBodyTarget(detail.bodyIndex);
      const body = SOLAR_SYSTEM_BODIES[detail.bodyIndex];
      if (!target || !body) return;
      clearLock();
      captureFocusStart();
      atlasRuntimeStore.beginFocusCommand(body.id);
      const frame = solveBodyCameraFrame(
        body, mode, presentationMode, atlasScaleMode, camera, viewportWidth, viewportHeight,
      );
      const idealDistance = Math.max(
        idealFocusCameraDistance(body, mode, presentationMode, atlasScaleMode), frame.distance,
      );
      applyCameraFrameProjection(camera, frame, viewportWidth, viewportHeight, frameProjectionKeyRef);
      atlasRuntimeStore.setFocusTransition("transition");
      const currentDistance = controls ? camera.position.distanceTo(controls.target) : idealDistance;
      const now = performance.now();
      focusRef.current = {
        kind: "body", index: detail.bodyIndex, mode, start: now,
        until: now + runtimeFocusDurationMs(0, currentDistance / Math.max(idealDistance, 1e-4), focusViewport),
      };
    };
    const onEarthMoon = () => {
      if (!atlasCameraPresentationCanWriteV273("focus-lock")) return;
      clearLock(); captureFocusStart();
      const now = performance.now();
      focusRef.current = { kind: "earthMoon", start: now, until: now + runtimeFocusDurationMs(Math.PI / 2, 4, focusViewport) };
      atlasRuntimeStore.setFocusTransition("transition");
    };
    const onDirection = (event: Event) => {
      if (!atlasCameraPresentationCanWriteV273("focus-lock")) return;
      const detail = (event as CustomEvent<CameraFocusDirectionDetail>).detail;
      if (!detail?.direction) return;
      const direction = new THREE.Vector3(...detail.direction);
      if (direction.lengthSq() < 1e-12) return;
      clearLock(); captureFocusStart(); direction.normalize();
      const now = performance.now();
      focusRef.current = { kind: "direction", direction, start: now, until: now + runtimeFocusDurationMs(Math.PI, 1, focusViewport) };
      atlasRuntimeStore.setFocusTransition("transition");
    };
    const onOrigin = () => clearLock(true);
    const onZoomLocked = (event: Event) => {
      if (!controls) return;
      const delta = (event as CustomEvent<CameraZoomDetail>).detail?.delta ?? 0;
      if (skyLockDirectionRef.current) {
        event.preventDefault();
        const current = skyDesiredDistanceRef.current ?? camera.position.distanceTo(controls.target);
        skyDesiredDistanceRef.current = clampSkyTargetZoomDistance(current * (delta > 0 ? 0.78 : 1.24));
        return;
      }
      const focus = focusRef.current;
      const bodyIndex = lockBodyIndexRef.current ?? (focus?.kind === "body" ? focus.index : null);
      if (bodyIndex === null) return;
      const target = focusBodyTarget(bodyIndex);
      const body = SOLAR_SYSTEM_BODIES[bodyIndex];
      if (!target || !body) return;
      event.preventDefault();
      focusRef.current = null;
      lockBodyIndexRef.current = bodyIndex;
      lockTargetSmooth.current.copy(target);
      lockInitializedRef.current = true;
      tmpOffset.current.subVectors(camera.position, target);
      const minDistance = minFocusDistance(body);
      const maxDistance = Math.max(
        idealFocusCameraDistance(body, "lock", presentationMode, atlasScaleMode) * 18,
        minDistance * 2,
      );
      const distance = tmpOffset.current.length();
      if (distance < 1e-10 || !Number.isFinite(distance)) tmpOffset.current.copy(lockViewDirRef.current);
      else tmpOffset.current.normalize();
      lockViewDirRef.current.copy(tmpOffset.current);
      lockDesiredDistanceRef.current = THREE.MathUtils.clamp(
        (lockDesiredDistanceRef.current ?? Math.max(distance, minDistance)) * (delta > 0 ? 0.78 : 1.24),
        minDistance, maxDistance,
      );
    };
    window.addEventListener(CAMERA_FOCUS_BODY_EVENT, onBody);
    window.addEventListener(CAMERA_FOCUS_EARTH_MOON_EVENT, onEarthMoon);
    window.addEventListener(CAMERA_FOCUS_DIRECTION_EVENT, onDirection);
    window.addEventListener(CAMERA_FOCUS_ORIGIN_EVENT, onOrigin);
    window.addEventListener(CAMERA_ZOOM_EVENT, onZoomLocked, { capture: true });
    controls?.addEventListener("start", onControlStart);
    controls?.addEventListener("end", onControlEnd);
    return () => {
      window.removeEventListener(CAMERA_FOCUS_BODY_EVENT, onBody);
      window.removeEventListener(CAMERA_FOCUS_EARTH_MOON_EVENT, onEarthMoon);
      window.removeEventListener(CAMERA_FOCUS_DIRECTION_EVENT, onDirection);
      window.removeEventListener(CAMERA_FOCUS_ORIGIN_EVENT, onOrigin);
      window.removeEventListener(CAMERA_ZOOM_EVENT, onZoomLocked, { capture: true });
      controls?.removeEventListener("start", onControlStart);
      controls?.removeEventListener("end", onControlEnd);
    };
  }, [
    atlasScaleMode, camera, controlsRef, floatingOriginRef, focusViewport,
    physicsRef, presentationMode, viewportHeight, viewportWidth,
  ]);

useEffect(() => {
    if (cameraOriginResetNonce <= 0) return;
    window.dispatchEvent(new CustomEvent(CAMERA_FOCUS_ORIGIN_EVENT));
    writeCameraMarker({ originResetNonce: cameraOriginResetNonce, force: true });
  }, [cameraOriginResetNonce, writeCameraMarker]);

  useFrame((_, dt) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const request = cameraBodyFocusRequest;
    const pendingRequest = Boolean(request && request.nonce !== lastRequestNonceRef.current);
    const focusActive = pendingRequest || focusRef.current !== null || lockBodyIndexRef.current !== null || skyLockDirectionRef.current !== null;
    const currentLease = getAtlasCameraPresentationLeaseV273();
    if (focusActive) {
      if (currentLease && currentLease.owner !== "focus-lock") return;
      if (!focusLeaseRef.current || currentLease?.token !== focusLeaseRef.current.token) {
        if (focusLeaseRef.current) releaseAtlasCameraPresentationLeaseV273(focusLeaseRef.current);
        focusLeaseRef.current = null;
        focusLeaseResourceReleaseRef.current?.();
        focusLeaseResourceReleaseRef.current = null;
        const lease = requestAtlasCameraPresentationLeaseV273("focus-lock", ++focusLeaseRequestIdRef.current);
        if (!lease.active) return;
        focusLeaseRef.current = lease;
        focusLeaseResourceReleaseRef.current = acquireAtlasResource(
          "camera-lock",
          atlasRuntimeStore.getSnapshot().sceneMode,
          `focus-lock-v273-${lease.requestId}`,
          { owner: "camera-presentation" },
        );
      }
    } else if (focusLeaseRef.current) {
      releaseAtlasCameraPresentationLeaseV273(focusLeaseRef.current);
      focusLeaseRef.current = null;
      focusLeaseResourceReleaseRef.current?.();
      focusLeaseResourceReleaseRef.current = null;
    }
    if (!atlasCameraPresentationCanWriteV273("focus-lock")) return;
    const p = physicsRef.current;
    if (!p) return;
    if (request && request.nonce !== lastRequestNonceRef.current) {
      lastRequestNonceRef.current = request.nonce;
      focusRef.current = null;
      lockBodyIndexRef.current = null;
      lockInitializedRef.current = false;
      lockDesiredDistanceRef.current = null;
      controls.enableDamping = prevDampingRef.current;
      const started = performance.now();
      const def = SOLAR_SYSTEM_BODIES[request.bodyIndex];
      const frame = def
        ? solveBodyCameraFrame(def, request.mode, presentationMode, atlasScaleMode, camera, viewportWidth, viewportHeight)
        : null;
      const idealDistance = def
        ? Math.max(
            idealFocusCameraDistance(def, request.mode, presentationMode, atlasScaleMode),
            frame?.distance ?? 0,
          )
        : camera.position.distanceTo(controls.target);
      if (frame) applyCameraFrameProjection(camera, frame, viewportWidth, viewportHeight, frameProjectionKeyRef);
      atlasRuntimeStore.beginFocusCommand(def?.id ?? `body-${request.bodyIndex}`, started);
      atlasRuntimeStore.setFocusTransition("transition");
      const currentDistance = camera.position.distanceTo(controls.target);
      focusRef.current = {
        kind: "body",
        index: request.bodyIndex,
        mode: request.mode,
        start: started,
        until:
          started +
          runtimeFocusDurationMs(0, currentDistance / Math.max(idealDistance, 1e-4), focusViewport),
      };
      focusStartCamera.current.copy(camera.position);
      focusStartTarget.current.copy(controls.target);
      focusViewDirRef.current.subVectors(camera.position, controls.target);
      if (
        focusViewDirRef.current.lengthSq() < 1e-10 ||
        !Number.isFinite(focusViewDirRef.current.x)
      ) {
        focusViewDirRef.current.set(0.28, 0.38, 0.88);
      }
      focusViewDirRef.current.normalize();
    }
    const origin = floatingOriginRef.current;
    const now = performance.now();
    const f = focusRef.current;
    if (f?.kind === "origin") {
      presentationPosition(0, 0, 0, presentationMode, atlasScaleMode, origin, tmpTarget.current);
      const u = THREE.MathUtils.clamp((now - f.start) / Math.max(1, f.until - f.start), 0, 1);
      const ease = smootherstep01(u);
      tmpCam.current.copy(tmpTarget.current).add(
        presentationMode === "orbit-atlas" ? ORBIT_ATLAS_CAMERA_POSITION : ORIGIN_CAMERA_OFFSET,
      );
      controls.target.lerpVectors(focusStartTarget.current, tmpTarget.current, ease);
      camera.position.lerpVectors(focusStartCamera.current, tmpCam.current, ease);
      controls.minDistance = earthMoonView ? 0.32 : 0.05;
      controls.maxDistance = lodConfigForTier(floatingOriginRef.current.lodTier).maxDistance;
      controls.update();
      writeCameraMarker({ distance: camera.position.distanceTo(controls.target) });
      if (now >= f.until) { focusRef.current = null; atlasRuntimeStore.setFocusTransition("idle"); }
      return;
    }
    if (f?.kind === "earthMoon") {
      if (EARTH_BODY_INDEX >= p.n || MOON_BODY_INDEX >= p.n) { focusRef.current = null; return; }
      presentationPosition(p.posAu[3 * EARTH_BODY_INDEX]!, p.posAu[3 * EARTH_BODY_INDEX + 1]!, p.posAu[3 * EARTH_BODY_INDEX + 2]!, presentationMode, atlasScaleMode, origin, tmpEarth.current);
      presentationPosition(p.posAu[3 * MOON_BODY_INDEX]!, p.posAu[3 * MOON_BODY_INDEX + 1]!, p.posAu[3 * MOON_BODY_INDEX + 2]!, presentationMode, atlasScaleMode, origin, tmpMoon.current);
      tmpTarget.current.lerpVectors(tmpEarth.current, tmpMoon.current, 0.5);
      const idealDist = THREE.MathUtils.clamp(tmpEarth.current.distanceTo(tmpMoon.current) * 16, 4.2, 48);
      tmpDir.current.subVectors(camera.position, controls.target).normalize();
      if (!Number.isFinite(tmpDir.current.x)) tmpDir.current.set(0.22, 0.42, 0.88).normalize();
      tmpCam.current.copy(controls.target).addScaledVector(tmpDir.current, idealDist);
      const a = 1 - Math.pow(0.001, dt);
      controls.target.lerp(tmpTarget.current, Math.min(1, a * 1.4));
      camera.position.lerp(tmpCam.current, Math.min(1, a * 1.2));
      controls.minDistance = earthMoonView ? 0.32 : 2; controls.update();
      if (now >= f.until) focusRef.current = null;
      return;
    }
    if (f?.kind === "direction") {
      const frame = solveSkyCameraFrame(camera, viewportWidth, viewportHeight);
      applyCameraFrameProjection(camera, frame, viewportWidth, viewportHeight, frameProjectionKeyRef);
      const u = THREE.MathUtils.clamp(
        (now - f.start) / Math.max(1, f.until - f.start),
        0,
        1,
      );
      const ease = smootherstep01(u);
      tmpTarget.current.copy(f.direction).multiplyScalar(SKY_TARGET_DISTANCE_SCENE);
      tmpCam.current
        .copy(tmpTarget.current)
        .addScaledVector(f.direction, -frame.distance)
        .addScaledVector(
          THREE.Object3D.DEFAULT_UP,
          Math.min(SKY_TARGET_CAMERA_HEIGHT_SCENE, frame.distance * 0.14),
        );
      controls.target.lerpVectors(
        focusStartTarget.current,
        tmpTarget.current,
        ease,
      );
      camera.position.lerpVectors(
        focusStartCamera.current,
        tmpCam.current,
        ease,
      );
      controls.minDistance = SKY_TARGET_ZOOM_MIN_DISTANCE_SCENE;
      controls.maxDistance = SKY_TARGET_ZOOM_MAX_DISTANCE_SCENE;
      controls.update();
      if (now >= f.until) {
        skyLockDirectionRef.current = f.direction.clone().normalize();
        tmpOffset.current.subVectors(camera.position, controls.target);
        const len = tmpOffset.current.length();
        if (len > 1e-8 && Number.isFinite(len)) {
          skyViewDirRef.current.copy(tmpOffset.current).normalize();
          skyDesiredDistanceRef.current = clampSkyTargetZoomDistance(Math.max(len, frame.distance));
        } else {
          skyDesiredDistanceRef.current = frame.distance;
        }
        atlasRuntimeStore.setFocusTransition("locked");
        focusRef.current = null;
      }
      return;
    }
    if (f?.kind === "body") {
      if (userControllingRef.current && f.mode === "orbit") {
        focusRef.current = null;
        return;
      }
      if (f.index >= p.n) { focusRef.current = null; lockBodyIndexRef.current = null; return; }
      presentationPosition(p.posAu[3 * f.index]!, p.posAu[3 * f.index + 1]!, p.posAu[3 * f.index + 2]!, presentationMode, atlasScaleMode, origin, tmpTarget.current);
      const def = SOLAR_SYSTEM_BODIES[f.index]!;
      const frame = solveBodyCameraFrame(def, f.mode, presentationMode, atlasScaleMode, camera, viewportWidth, viewportHeight);
      applyCameraFrameProjection(camera, frame, viewportWidth, viewportHeight, frameProjectionKeyRef);
      const mobileGasGiantDistanceScale =
        focusViewport === "mobile" &&
        f.mode !== "orbit" &&
        (def.id === "jupiter" || def.id === "saturn" || def.id === "uranus" || def.id === "neptune")
          ? def.showRings
            ? 1.45
            : 1.85
          : 1;
      const idealDist = Math.max(
        idealFocusCameraDistance(def, f.mode, presentationMode, atlasScaleMode) * mobileGasGiantDistanceScale,
        frame.distance,
      );
      const u = THREE.MathUtils.clamp((now - f.start) / Math.max(1, f.until - f.start), 0, 1);
      const ease = smootherstep01(u);
      tmpDir.current.copy(focusViewDirRef.current);
      const pitchBias = f.mode === "lock" || f.mode === "inspect" ? 0.18 : 0;
      tmpDir.current.y = THREE.MathUtils.clamp(tmpDir.current.y + pitchBias, -0.72, 0.82);
      tmpDir.current.normalize();
      tmpCam.current.copy(tmpTarget.current).addScaledVector(tmpDir.current, idealDist);
      controls.target.lerpVectors(focusStartTarget.current, tmpTarget.current, ease);
      camera.position.lerpVectors(focusStartCamera.current, tmpCam.current, ease);
      controls.minDistance = earthMoonView ? 0.32 : minFocusDistance(def); controls.update();
      if (now >= f.until) { if (f.mode === "inspect" || f.mode === "lock") { lockBodyIndexRef.current = f.index; lockTargetSmooth.current.copy(tmpTarget.current); lockInitializedRef.current = true; tmpOffset.current.subVectors(camera.position, controls.target); const len = tmpOffset.current.length(); if (len > 1e-8 && Number.isFinite(len)) { lockViewDirRef.current.copy(tmpOffset.current).normalize(); lockDesiredDistanceRef.current = len; } atlasRuntimeStore.setFocusTransition("locked"); } else { atlasRuntimeStore.setFocusTransition("idle"); } focusRef.current = null; }
      return;
    }
    const li = lockBodyIndexRef.current;
    if (li !== null) {
      if (li < 0 || li >= p.n) { lockBodyIndexRef.current = null; lockInitializedRef.current = false; controls.enableDamping = prevDampingRef.current; return; }
      if (controls.enableDamping) { prevDampingRef.current = true; controls.enableDamping = false; }
      presentationPosition(p.posAu[3 * li]!, p.posAu[3 * li + 1]!, p.posAu[3 * li + 2]!, presentationMode, atlasScaleMode, origin, tmpTarget.current);
      if (!lockInitializedRef.current) {
        lockTargetSmooth.current.copy(tmpTarget.current);
        lockInitializedRef.current = true;
      } else {
        // Keep moving compressed-orbit subjects inside their solved safe
        // frame.  The previous ~250 ms positional lag was visually obvious
        // on mobile even though the camera transition itself had completed.
        lockTargetSmooth.current.lerp(tmpTarget.current, 1 - Math.exp(-32 * dt));
      }
      tmpOffset.current.copy(camera.position).sub(controls.target);
      const currentDist = tmpOffset.current.length();
      if (currentDist > 1e-8 && Number.isFinite(currentDist)) {
        lockViewDirRef.current.copy(tmpOffset.current).normalize();
      }
      const def = SOLAR_SYSTEM_BODIES[li];
      const frame = def ? solveBodyCameraFrame(def, "lock", presentationMode, atlasScaleMode, camera, viewportWidth, viewportHeight) : null;
      if (frame) applyCameraFrameProjection(camera, frame, viewportWidth, viewportHeight, frameProjectionKeyRef);
      const minDist = def ? minFocusDistance(def) : 0.05;
      const maxDist = def ? Math.max(idealFocusCameraDistance(def, "lock", presentationMode, atlasScaleMode) * 14, minDist * 2) : 50000;
      applyTargetAnchorDelta(
        camera.position,
        controls.target,
        lockTargetSmooth.current,
        tmpAnchorDelta.current,
      );
      tmpOffset.current.copy(camera.position).sub(controls.target);
      const anchoredDist = tmpOffset.current.length();
      if (anchoredDist > 1e-8 && Number.isFinite(anchoredDist)) {
        lockViewDirRef.current.copy(tmpOffset.current).normalize();
      }
      if (userControllingRef.current && anchoredDist > 1e-8 && Number.isFinite(anchoredDist)) {
        lockDesiredDistanceRef.current = THREE.MathUtils.clamp(anchoredDist, minDist, maxDist);
        controls.update();
        writeCameraMarker({ distance: anchoredDist });
        return;
      }
      const targetDist = THREE.MathUtils.clamp(Math.max(lockDesiredDistanceRef.current ?? anchoredDist, frame?.distance ?? minDist), minDist, maxDist);
      lockDesiredDistanceRef.current = targetDist;
      const nextDist = THREE.MathUtils.lerp(Math.max(anchoredDist, minDist), targetDist, 1 - Math.pow(0.0008, dt));
      camera.position.copy(controls.target).addScaledVector(lockViewDirRef.current, nextDist);
      if (def) { controls.minDistance = minFocusDistance(def); controls.maxDistance = Math.max(controls.maxDistance, idealFocusCameraDistance(def, "lock", presentationMode, atlasScaleMode) * 14); }
      controls.update(); return;
    }
    const skyDirection = skyLockDirectionRef.current;
    if (skyDirection) {
      const frame = solveSkyCameraFrame(camera, viewportWidth, viewportHeight);
      applyCameraFrameProjection(camera, frame, viewportWidth, viewportHeight, frameProjectionKeyRef);
      if (controls.enableDamping) { prevDampingRef.current = true; controls.enableDamping = false; }
      tmpTarget.current.copy(skyDirection).multiplyScalar(SKY_TARGET_DISTANCE_SCENE);
      tmpOffset.current.copy(camera.position).sub(controls.target);
      const currentDist = tmpOffset.current.length();
      if (currentDist > 1e-8 && Number.isFinite(currentDist)) {
        skyViewDirRef.current.copy(tmpOffset.current).normalize();
      }
      applyTargetAnchorDelta(
        camera.position,
        controls.target,
        tmpTarget.current,
        tmpAnchorDelta.current,
      );
      tmpOffset.current.copy(camera.position).sub(controls.target);
      const anchoredDist = tmpOffset.current.length();
      if (anchoredDist > 1e-8 && Number.isFinite(anchoredDist)) {
        skyViewDirRef.current.copy(tmpOffset.current).normalize();
      }
      if (userControllingRef.current && anchoredDist > 1e-8 && Number.isFinite(anchoredDist)) {
        skyDesiredDistanceRef.current = clampSkyTargetZoomDistance(anchoredDist);
        controls.update();
        writeCameraMarker({ distance: anchoredDist });
        return;
      }
      const targetDist = clampSkyTargetZoomDistance(
        Math.max(skyDesiredDistanceRef.current ?? anchoredDist, frame.distance),
      );
      skyDesiredDistanceRef.current = targetDist;
      const nextDist = THREE.MathUtils.lerp(
        Math.max(anchoredDist, SKY_TARGET_ZOOM_MIN_DISTANCE_SCENE),
        targetDist,
        1 - Math.pow(0.0008, dt),
      );
      camera.position.copy(controls.target).addScaledVector(skyViewDirRef.current, nextDist);
      controls.minDistance = SKY_TARGET_ZOOM_MIN_DISTANCE_SCENE;
      controls.maxDistance = SKY_TARGET_ZOOM_MAX_DISTANCE_SCENE;
      controls.update();
      writeCameraMarker({ distance: nextDist });
      return;
    }
    clearCameraFrameProjection(camera, frameProjectionKeyRef);
    controls.minDistance = earthMoonView ? 0.32 : 0.05;
  }, 2);
  return null;
}
