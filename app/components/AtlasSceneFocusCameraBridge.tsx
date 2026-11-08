"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import { lodConfigForTier } from "../lib/galacticLod";
import { EARTH_BODY_INDEX, MOON_BODY_INDEX, SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { CAMERA_FOCUS_BODY_EVENT, CAMERA_FOCUS_DIRECTION_EVENT, CAMERA_FOCUS_EARTH_MOON_EVENT, CAMERA_FOCUS_ORIGIN_EVENT, CAMERA_ZOOM_EVENT, type CameraFocusBodyDetail, type CameraFocusDirectionDetail, type CameraZoomDetail } from "../lib/camera-bridge";
import { smootherstep01, type CameraFocusMode } from "../lib/cameraFocusCommand";
import { interpolateSkyCameraPose, skyTransitionTurnRad } from "../lib/skyCameraTransition";
import { atlasRuntimeStore } from "../lib/atlasRuntimeStore";
import {
  atlasCameraPresentationCanWriteV273,
  getAtlasCameraPresentationLeaseV273,
  releaseAtlasCameraPresentationLeaseV273,
  requestAtlasCameraPresentationLeaseV273,
  type AtlasCameraPresentationLeaseV273,
} from "../lib/atlasCameraPresentationLeaseV273";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import { resolveAtlasUnderlyingCanvasModeV595 } from "../lib/atlasProductSceneFamilyContractV595";
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
  runtimeSafeViewportRect,
  solveBodyCameraFrame,
  solveSkyCameraFrame,
} from "../lib/atlasSceneFocusCameraRuntime";
import {
  clampMainlineAConstellationDistanceV638,
  mainlineAConstellationMaxDistanceV638,
  resolveMainlineAConstellationCameraTargetV638,
  resolveMainlineAConstellationSafeViewportV638,
  solveMainlineAConstellationCameraFrameV638,
  type MainlineAConstellationCameraTargetV638,
} from "../lib/mainlineAConstellationCameraV638";
import {
  observeMainlineAConstellationDomV638,
  type ConstellationDomMeasurementV638,
} from "../lib/mainlineAConstellationLabelOcclusionV638";
import type { AtlasSafeViewportRect } from "../lib/atlasCameraFrameSolverV4";
import { useAtlasCameraRuntimeMarkerWriter } from "./AtlasCameraRuntimeMarker";
import { registerMainlineAObservationCameraBridgeM4 } from "../lib/mainlineAObservationCameraBookmarkM4";
import { registerMainlineAJourneyMeasurementM4, resolveMainlineAJourneyViewportM4 } from "../lib/mainlineAJourneyViewportM4";

type FocusMode = CameraFocusMode;
type ActiveFocus =
  | { kind: "body"; index: number; mode: FocusMode; start: number; until: number }
  | { kind: "earthMoon"; start: number; until: number }
  | { kind: "origin"; start: number; until: number }
  | {
      kind: "direction";
      direction: THREE.Vector3;
      constellation: MainlineAConstellationCameraTargetV638 | null;
      start: number;
      until: number;
    };
export type CameraBodyFocusRequest = { bodyIndex: number; mode: FocusMode; nonce: number };

export function CameraFocusBodyBridge({ physicsRef, floatingOriginRef, earthMoonView, cameraBodyFocusRequest, cameraOriginResetNonce = 0, controlsRef, presentationMode, atlasScaleMode }: { physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>; floatingOriginRef: MutableRefObject<FloatingOriginState>; earthMoonView: boolean; cameraBodyFocusRequest?: CameraBodyFocusRequest | null; cameraOriginResetNonce?: number; controlsRef: MutableRefObject<OrbitControlsImpl | null>; presentationMode: SolarPresentationMode; atlasScaleMode: OrbitAtlasScaleMode }) {
  const camera = useThree((s) => s.camera as THREE.PerspectiveCamera);
  const canvas = useThree((s) => s.gl.domElement);
  const viewportSize = useThree((s) => s.size);
  const viewportWidth = viewportSize.width;
  const viewportHeight = viewportSize.height;
  const constellationDomRef = useRef<ConstellationDomMeasurementV638 | null>(null);
  const constellationViewportCache = useRef<{
    measurement: ConstellationDomMeasurementV638 | null;
    key: string;
    safe: AtlasSafeViewportRect | null;
  } | null>(null);
  useEffect(() => {
    const journeyMeasurement = registerMainlineAJourneyMeasurementM4();
    const disconnect = observeMainlineAConstellationDomV638(canvas, (measurement) => {
      constellationDomRef.current = measurement;
      journeyMeasurement.publish(measurement);
    });
    const release = acquireAtlasResource("subscription", "atlas", "constellation-visible-viewport-v638", { owner: "camera-presentation" });
    return () => { disconnect(); journeyMeasurement.release(); release(); constellationDomRef.current = null; constellationViewportCache.current = null; };
  }, [canvas]);
  const constellationSafeViewport = useCallback(() => {
    const safe = runtimeSafeViewportRect(viewportWidth, viewportHeight);
    const measurement = constellationDomRef.current;
    const key = `${viewportWidth}|${viewportHeight}|${safe.left}|${safe.top}|${safe.right}|${safe.bottom}`;
    const previous = constellationViewportCache.current;
    if (previous?.key === key && previous.measurement === measurement) return previous.safe;
    const resolved = resolveMainlineAConstellationSafeViewportV638(viewportWidth, viewportHeight, safe, measurement);
    constellationViewportCache.current = { measurement, key, safe: resolved };
    return resolved;
  }, [viewportHeight, viewportWidth]);
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
  const skyConstellationRef = useRef<MainlineAConstellationCameraTargetV638 | null>(null);
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
  const focusMarkerRef = useRef("");
  const actualDirectionRef = useRef(new THREE.Vector3());
  const writeCameraMarker = useAtlasCameraRuntimeMarkerWriter();
  const writeActualCameraState = useCallback((force = false) => {
    const controls = controlsRef.current;
    if (!controls) return;
    // Sample the camera's effective world-space forward vector after
    // OrbitControls.update(). This remains independent from focus command
    // direction and therefore represents the rendered camera pose.
    camera.getWorldDirection(actualDirectionRef.current);
    writeCameraMarker({
      distance: camera.position.distanceTo(controls.target),
      actualPosition: camera.position,
      actualTarget: controls.target,
      actualDirection: actualDirectionRef.current,
      actualUp: camera.up,
      actualQuaternion: camera.quaternion,
      actualFov: camera.fov,
      actualZoom: camera.zoom,
      force,
    });
  }, [camera, controlsRef, writeCameraMarker]);
  const writeFocusMarker = useCallback((state: string, progress: number, eased: number, kind?: string) => {
    const root = typeof document !== "undefined"
      ? document.querySelector<HTMLElement>("[data-atlas-app-shell]")
      : null;
    if (!root) return;
    const signature = `${state}|${kind ?? ""}|${progress.toFixed(3)}|${eased.toFixed(3)}`;
    if (focusMarkerRef.current === signature) return;
    focusMarkerRef.current = signature;
    root.dataset.atlasCameraFocusState = state;
    root.dataset.atlasCameraFocusKind = kind ?? "none";
    root.dataset.atlasCameraFocusProgress = progress.toFixed(3);
    root.dataset.atlasCameraFocusEase = eased.toFixed(3);
  }, []);

  // This bridge owns the bookmark capability for its entire mounted lifetime.
  // Viewport changes update its context without invalidating a saved viewpoint.
  const bookmarkContextRef = useRef({
    viewportWidth, viewportHeight, constellationSafeViewport, presentationMode,
    earthMoonView, cameraBodyFocusRequest,
  });
  useEffect(() => {
    bookmarkContextRef.current = {
      viewportWidth, viewportHeight, constellationSafeViewport, presentationMode,
      earthMoonView, cameraBodyFocusRequest,
    };
  }, [viewportWidth, viewportHeight, constellationSafeViewport, presentationMode, earthMoonView, cameraBodyFocusRequest]);
  useEffect(() => registerMainlineAObservationCameraBridgeM4({
    capture: () => {
      const state = atlasRuntimeStore.getSnapshot();
      const context = bookmarkContextRef.current;
      const controls = controlsRef.current;
      const command = state.focusCommand;
      const lease = getAtlasCameraPresentationLeaseV273();
      if (!controls || (state.sceneMode !== "atlas" && state.sceneMode !== "inspect") ||
          state.experienceMode === "research" || state.researchOverlay !== "none" || state.observerPresentation.enabled ||
          context.presentationMode !== "orbit-atlas" || context.earthMoonView ||
          state.scaleJourney.lifecycle !== "idle" || userControllingRef.current ||
          focusRef.current || lockBodyIndexRef.current !== null || !skyLockDirectionRef.current ||
          (context.cameraBodyFocusRequest && context.cameraBodyFocusRequest.nonce !== lastRequestNonceRef.current) ||
          lease?.owner !== "focus-lock" || lease.token !== focusLeaseRef.current?.token ||
          state.focusTransition !== "locked" || command?.phase !== "locked" ||
          command.requestId !== state.focusRequestId || command.target.kind !== "catalog-object" ||
          command.target.objectId !== command.target.catalogId || command.target.catalogId !== state.selectedObjectId) return null;
      const direction = new THREE.Vector3().fromArray(command.target.direction).normalize();
      if (direction.distanceToSquared(skyLockDirectionRef.current) > 1e-12) return null;
      const constellation = skyConstellationRef.current;
      if (constellation && constellation.catalogId !== command.target.catalogId) return null;
      const target = constellation
        ? new THREE.Vector3().fromArray(constellation.center)
        : direction.multiplyScalar(SKY_TARGET_DISTANCE_SCENE);
      if (target.distanceToSquared(controls.target) > 1e-8) return null;
      const distance = camera.position.distanceTo(controls.target);
      if (![...camera.position.toArray(), ...controls.target.toArray(), ...camera.up.toArray(), camera.fov, camera.zoom, distance].every(Number.isFinite) ||
          distance < 1e-8 || camera.up.lengthSq() < 1e-8 || camera.fov <= 0 || camera.fov >= 180 || camera.zoom <= 0) return null;
      return {
        catalogId: command.target.catalogId,
        sceneMode: state.sceneMode,
        sceneRevision: state.sceneRevision,
        scaleBand: state.scaleBand,
        scaleRequestId: state.scaleJourney.requestId,
        focusRequestId: state.focusRequestId,
        pose: { position: camera.position.toArray(), target: controls.target.toArray(), up: camera.up.toArray(), fov: camera.fov, zoom: camera.zoom },
      };
    },
    restore: (bookmark, expectedFocusRequestId) => {
      const state = atlasRuntimeStore.getSnapshot();
      const context = bookmarkContextRef.current;
      const controls = controlsRef.current;
      const command = state.focusCommand;
      const lease = getAtlasCameraPresentationLeaseV273();
      if (!controls || state.sceneMode !== bookmark.sceneMode || state.sceneRevision !== bookmark.sceneRevision ||
          state.scaleBand !== bookmark.scaleBand || state.scaleJourney.requestId !== bookmark.scaleRequestId ||
          state.scaleJourney.lifecycle !== "idle" || state.experienceMode === "research" ||
          state.researchOverlay !== "none" || state.observerPresentation.enabled ||
          context.presentationMode !== "orbit-atlas" || context.earthMoonView || userControllingRef.current ||
          (context.cameraBodyFocusRequest && context.cameraBodyFocusRequest.nonce !== lastRequestNonceRef.current) ||
          focusRef.current || lockBodyIndexRef.current !== null || !skyLockDirectionRef.current ||
          lease?.owner !== "focus-lock" || lease.token !== focusLeaseRef.current?.token ||
          state.focusTransition !== "locked" || command?.phase !== "locked" ||
          state.focusRequestId !== expectedFocusRequestId || command.requestId !== expectedFocusRequestId ||
          command.target.kind !== "catalog-object" || command.target.catalogId !== bookmark.catalogId ||
          command.target.objectId !== bookmark.catalogId || state.selectedObjectId !== bookmark.catalogId) return false;
      const direction = new THREE.Vector3().fromArray(command.target.direction).normalize();
      if (direction.distanceToSquared(skyLockDirectionRef.current) > 1e-12) return false;
      const constellation = resolveMainlineAConstellationCameraTargetV638(bookmark.catalogId);
      const target = constellation ? new THREE.Vector3().fromArray(constellation.center) : direction.clone().multiplyScalar(SKY_TARGET_DISTANCE_SCENE);
      if (target.distanceToSquared(new THREE.Vector3().fromArray(bookmark.pose.target)) > 1e-8) return false;
      const safeRect = constellation ? context.constellationSafeViewport()
        : resolveMainlineAJourneyViewportM4(context.viewportWidth, context.viewportHeight, runtimeSafeViewportRect(context.viewportWidth, context.viewportHeight));
      if (!safeRect) return false;
      // Solve with today's canvas and occlusion, not the bookmark's old sub-frustum.
      const projectionCamera = camera.clone();
      projectionCamera.fov = bookmark.pose.fov;
      projectionCamera.zoom = bookmark.pose.zoom;
      const frame = constellation
        ? solveMainlineAConstellationCameraFrameV638(constellation, projectionCamera, context.viewportWidth, context.viewportHeight, safeRect!)
        : solveSkyCameraFrame(projectionCamera, context.viewportWidth, context.viewportHeight, safeRect);
      const offset = new THREE.Vector3().fromArray(bookmark.pose.position).sub(target);
      const savedDistance = offset.length();
      const distance = constellation
        ? clampMainlineAConstellationDistanceV638(savedDistance, frame)
        : clampSkyTargetZoomDistance(Math.max(savedDistance, frame.distance));
      // Flush residual OrbitControls deltas before applying the saved camera pose.
      controls.enableDamping = false;
      controls.update();
      camera.up.fromArray(bookmark.pose.up);
      camera.fov = bookmark.pose.fov;
      camera.zoom = bookmark.pose.zoom;
      skyLockDirectionRef.current = direction;
      skyConstellationRef.current = constellation;
      skyViewDirRef.current.copy(offset).normalize();
      skyDesiredDistanceRef.current = distance;
      controls.target.copy(target);
      camera.position.copy(target).addScaledVector(skyViewDirRef.current, distance);
      controls.minDistance = constellation ? frame.distance : SKY_TARGET_ZOOM_MIN_DISTANCE_SCENE;
      controls.maxDistance = constellation ? mainlineAConstellationMaxDistanceV638(frame) : SKY_TARGET_ZOOM_MAX_DISTANCE_SCENE;
      frameProjectionKeyRef.current = "";
      applyCameraFrameProjection(camera, frame, context.viewportWidth, context.viewportHeight, frameProjectionKeyRef);
      controls.update();
      writeActualCameraState(true);
      writeCameraMarker({
        bookmarkRestoredRequestId: expectedFocusRequestId,
        bookmarkDistanceBoundAdjusted: Math.abs(savedDistance - distance) > 1e-6,
        bookmarkSavedDistance: savedDistance,
        bookmarkRestoredDistance: distance,
        force: true,
      });
      return true;
    },
  }), [camera, controlsRef, writeActualCameraState, writeCameraMarker]);

  useEffect(() => () => {
    clearCameraFrameProjection(camera, frameProjectionKeyRef);
    const lease = focusLeaseRef.current;
    if (lease) releaseAtlasCameraPresentationLeaseV273(lease);
    focusLeaseRef.current = null;
    focusLeaseResourceReleaseRef.current?.();
    focusLeaseResourceReleaseRef.current = null;
    focusMarkerRef.current = "";
    const root = typeof document !== "undefined"
      ? document.querySelector<HTMLElement>("[data-atlas-app-shell]")
      : null;
    if (root) {
      delete root.dataset.atlasCameraFocusState;
      delete root.dataset.atlasCameraFocusKind;
      delete root.dataset.atlasCameraFocusProgress;
      delete root.dataset.atlasCameraFocusEase;
    }
  }, [camera]);

  useEffect(() => {
    writeCameraMarker({
      rigPolicy: "target-anchor-user-orbit-distance-state",
      force: true,
    });
    writeActualCameraState(true);
  }, [writeActualCameraState, writeCameraMarker]);
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
      skyConstellationRef.current = null;
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
      // Duration from the actual turn (previously always the half-turn value).
      const turn = controls ? skyTransitionTurnRad(camera.position, controls.target, direction) : Math.PI;
      focusRef.current = {
        kind: "direction", direction,
        constellation: resolveMainlineAConstellationCameraTargetV638(detail.constellationCatalogId),
        start: now, until: now + runtimeFocusDurationMs(turn, 1, focusViewport),
      };
      atlasRuntimeStore.setFocusTransition("transition");
    };
    const onOrigin = () => clearLock(true);
    const onZoomLocked = (event: Event) => {
      if (!controls) return;
      const delta = (event as CustomEvent<CameraZoomDetail>).detail?.delta ?? 0;
      if (skyLockDirectionRef.current) {
        event.preventDefault();
        const current = skyDesiredDistanceRef.current ?? camera.position.distanceTo(controls.target);
        const constellation = skyConstellationRef.current;
        const visibleRect = constellation ? constellationSafeViewport() : null;
        if (constellation && !visibleRect) return;
        const factor = delta > 0 ? 0.78 : 1.24;
        if (constellation) {
          const frame = solveMainlineAConstellationCameraFrameV638(
            constellation, camera, viewportWidth, viewportHeight, visibleRect!,
          );
          // Explicit zoom starts inside the current layout's allowed range,
          // even when it has kept a closer or farther user distance in reserve.
          // Use the requested distance rather than an intermediate lerp pose
          // so consecutive zoom commands accumulate consistently.
          skyDesiredDistanceRef.current = clampMainlineAConstellationDistanceV638(
            clampMainlineAConstellationDistanceV638(current, frame) * factor, frame,
          );
        } else {
          skyDesiredDistanceRef.current = clampSkyTargetZoomDistance(current * factor);
        }
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
    physicsRef, presentationMode, viewportHeight, viewportWidth, constellationSafeViewport,
  ]);

  useEffect(() => {
    if (cameraOriginResetNonce <= 0) return;
    window.dispatchEvent(new CustomEvent(CAMERA_FOCUS_ORIGIN_EVENT));
    writeCameraMarker({ originResetNonce: cameraOriginResetNonce, force: true });
    writeActualCameraState(true);
  }, [cameraOriginResetNonce, writeActualCameraState, writeCameraMarker]);

  useFrame((_, dt) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const request = cameraBodyFocusRequest;
    const pendingRequest = Boolean(request && request.nonce !== lastRequestNonceRef.current);
    const focusActive = pendingRequest || focusRef.current !== null || lockBodyIndexRef.current !== null || skyLockDirectionRef.current !== null;
    // In the idle path OrbitControls has advanced the pose by this priority;
    // focus paths below sample again immediately after their own update.
    if (!focusActive) writeActualCameraState();
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
          resolveAtlasUnderlyingCanvasModeV595(atlasRuntimeStore.getSnapshot().sceneMode),
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
    if (!p) {
      // No simulation state is available, so there is no focus branch below
      // to sample the pose after an update. Keep ordinary orbit telemetry live.
      writeActualCameraState();
      return;
    }
    if (request && request.nonce !== lastRequestNonceRef.current) {
      lastRequestNonceRef.current = request.nonce;
      focusRef.current = null;
      lockBodyIndexRef.current = null;
      skyLockDirectionRef.current = null;
      skyConstellationRef.current = null;
      skyDesiredDistanceRef.current = null;
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
    if (f) {
      const progress = THREE.MathUtils.clamp((now - f.start) / Math.max(1, f.until - f.start), 0, 1);
      writeFocusMarker("transition", progress, smootherstep01(progress), f.kind);
    } else if (lockBodyIndexRef.current !== null || skyLockDirectionRef.current !== null) {
      writeFocusMarker("locked", 1, 1, lockBodyIndexRef.current !== null ? "body" : "direction");
    } else {
      writeFocusMarker("idle", 0, 0, "none");
    }
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
      writeActualCameraState();
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
      writeActualCameraState();
      if (now >= f.until) focusRef.current = null;
      return;
    }
    if (f?.kind === "direction") {
      const visibleRect = f.constellation ? constellationSafeViewport()
        : resolveMainlineAJourneyViewportM4(viewportWidth, viewportHeight, runtimeSafeViewportRect(viewportWidth, viewportHeight));
      if (!visibleRect) return;
      const frame = f.constellation
        ? solveMainlineAConstellationCameraFrameV638(f.constellation, camera, viewportWidth, viewportHeight, visibleRect!)
        : solveSkyCameraFrame(camera, viewportWidth, viewportHeight, visibleRect);
      applyCameraFrameProjection(camera, frame, viewportWidth, viewportHeight, frameProjectionKeyRef);
      const u = THREE.MathUtils.clamp(
        (now - f.start) / Math.max(1, f.until - f.start),
        0,
        1,
      );
      const ease = smootherstep01(u);
      if (f.constellation) tmpTarget.current.fromArray(f.constellation.center);
      else tmpTarget.current.copy(f.direction).multiplyScalar(SKY_TARGET_DISTANCE_SCENE);
      tmpCam.current
        .copy(tmpTarget.current)
        .addScaledVector(f.direction, -frame.distance);
      if (!f.constellation) tmpCam.current.addScaledVector(
          THREE.Object3D.DEFAULT_UP,
          Math.min(SKY_TARGET_CAMERA_HEIGHT_SCENE, frame.distance * 0.14),
        );
      interpolateSkyCameraPose(focusStartTarget.current, focusStartCamera.current,
        tmpTarget.current, tmpCam.current, ease, controls.target, camera.position);
      controls.minDistance = SKY_TARGET_ZOOM_MIN_DISTANCE_SCENE;
      controls.maxDistance = f.constellation ? mainlineAConstellationMaxDistanceV638(frame) : SKY_TARGET_ZOOM_MAX_DISTANCE_SCENE;
      controls.update();
      writeActualCameraState();
      if (now >= f.until) {
        skyLockDirectionRef.current = f.direction.clone().normalize();
        skyConstellationRef.current = f.constellation;
        tmpOffset.current.subVectors(camera.position, controls.target);
        const len = tmpOffset.current.length();
        if (len > 1e-8 && Number.isFinite(len)) {
          skyViewDirRef.current.copy(tmpOffset.current).normalize();
          skyDesiredDistanceRef.current = f.constellation
            ? clampMainlineAConstellationDistanceV638(Math.max(len, frame.distance), frame)
            : clampSkyTargetZoomDistance(Math.max(len, frame.distance));
        } else {
          skyDesiredDistanceRef.current = frame.distance;
        }
        focusRef.current = null;
        // Locked subscribers may immediately restore a session bookmark.
        atlasRuntimeStore.setFocusTransition("locked");
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
      writeActualCameraState();
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
        writeActualCameraState();
        return;
      }
      const targetDist = THREE.MathUtils.clamp(Math.max(lockDesiredDistanceRef.current ?? anchoredDist, frame?.distance ?? minDist), minDist, maxDist);
      lockDesiredDistanceRef.current = targetDist;
      const nextDist = THREE.MathUtils.lerp(Math.max(anchoredDist, minDist), targetDist, 1 - Math.pow(0.0008, dt));
      camera.position.copy(controls.target).addScaledVector(lockViewDirRef.current, nextDist);
      if (def) { controls.minDistance = minFocusDistance(def); controls.maxDistance = Math.max(controls.maxDistance, idealFocusCameraDistance(def, "lock", presentationMode, atlasScaleMode) * 14); }
      controls.update();
      writeActualCameraState();
      return;
    }
    const skyDirection = skyLockDirectionRef.current;
    if (skyDirection) {
      const constellation = skyConstellationRef.current;
      const visibleRect = constellation ? constellationSafeViewport()
        : resolveMainlineAJourneyViewportM4(viewportWidth, viewportHeight, runtimeSafeViewportRect(viewportWidth, viewportHeight));
      if (!visibleRect) return;
      const frame = constellation
        ? solveMainlineAConstellationCameraFrameV638(constellation, camera, viewportWidth, viewportHeight, visibleRect!)
        : solveSkyCameraFrame(camera, viewportWidth, viewportHeight, visibleRect);
      const clampDistance = (distance: number) => constellation
        ? clampMainlineAConstellationDistanceV638(distance, frame)
        : clampSkyTargetZoomDistance(distance);
      applyCameraFrameProjection(camera, frame, viewportWidth, viewportHeight, frameProjectionKeyRef);
      if (controls.enableDamping) { prevDampingRef.current = true; controls.enableDamping = false; }
      if (constellation) tmpTarget.current.fromArray(constellation.center);
      else tmpTarget.current.copy(skyDirection).multiplyScalar(SKY_TARGET_DISTANCE_SCENE);
      controls.minDistance = constellation ? frame.distance : SKY_TARGET_ZOOM_MIN_DISTANCE_SCENE;
      controls.maxDistance = constellation ? mainlineAConstellationMaxDistanceV638(frame) : SKY_TARGET_ZOOM_MAX_DISTANCE_SCENE;
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
        skyDesiredDistanceRef.current = clampDistance(anchoredDist);
        controls.update();
        writeActualCameraState();
        return;
      }
      const targetDist = clampDistance(
        Math.max(skyDesiredDistanceRef.current ?? anchoredDist, frame.distance),
      );
      // A constellation may temporarily move back to fit a smaller layout.
      // Keep the user's distance intent so reopening the sky restores its scale.
      if (!constellation) skyDesiredDistanceRef.current = targetDist;
      const nextDist = THREE.MathUtils.lerp(
        Math.max(anchoredDist, SKY_TARGET_ZOOM_MIN_DISTANCE_SCENE),
        targetDist,
        1 - Math.pow(0.0008, dt),
      );
      camera.position.copy(controls.target).addScaledVector(skyViewDirRef.current, nextDist);
      controls.update();
      writeActualCameraState();
      return;
    }
    clearCameraFrameProjection(camera, frameProjectionKeyRef);
    controls.minDistance = earthMoonView ? 0.32 : 0.05;
    // Ordinary user orbit path: sample after all bridge-owned updates. The
    // shared writer throttles this to one DOM write per 120 ms.
    writeActualCameraState();
  }, 2);
  return null;
}
