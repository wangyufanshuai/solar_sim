"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { BloomSceneProvider } from "../context/BloomSceneContext";
import { LabelOcclusionProvider } from "../context/LabelOcclusionContext";
import { RelativisticOpticsProvider } from "../context/RelativisticOpticsContext";
import type { PhysicsPrecisionTier } from "../lib/physicsPrecision";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import type { BodyLiveMetrics } from "../lib/bodyLiveMetrics";
import type { SimulationDiagnostics } from "../lib/simulationDiagnosticsTypes";
import type { TelemetrySeriesState } from "../lib/telemetryTypes";
import type { SimulationViewSettings } from "../lib/simulationViewSettings";
import type { PhysicsHistoryStack } from "../lib/physicsHistoryStack";
import type { KerrBlackHoleUiState } from "./KerrBlackHolePanel";
import type { LaunchConfig } from "../lib/launchTelemetryTypes";
import type { LocalTelemetry } from "../lib/localLaunchPhysics";
import type { MissionPlan } from "../lib/missionDesignerTypes";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import { cameraIntentReducer, type CameraIntentAction, type CameraIntentState } from "../lib/cameraIntentState";
import { applyFloatingOffsetScene, updateFloatingOrigin } from "../lib/floatingOrigin";
import { lodConfigForTier } from "../lib/galacticLod";
import { AU_TO_SCENE, EARTH_BODY_INDEX, MOON_BODY_INDEX, SOLAR_SYSTEM_BODIES, type SolarSystemBodyDef } from "../data/planetsJ2000";
import { CAMERA_FOCUS_BODY_EVENT, CAMERA_FOCUS_DIRECTION_EVENT, CAMERA_FOCUS_EARTH_MOON_EVENT, CAMERA_FOCUS_ORIGIN_EVENT, CAMERA_ZOOM_EVENT, type CameraFocusBodyDetail, type CameraFocusDirectionDetail, type CameraZoomDetail } from "../lib/camera-bridge";
import { TRUE_VOID_CINEMATIC_AMBIENT_INTENSITY, TRUE_VOID_CINEMATIC_HEMISPHERE_INTENSITY } from "../lib/trueVoid";
import SolarSystemIntegrator from "./SolarSystemIntegrator";
import SolarSystemBodies from "./SolarSystemBodies";
import ScienceBackdrop from "./ScienceBackdrop";
import ReferenceOrbitDecor from "./ReferenceOrbitDecor";
import PostProcessingGate from "./PostProcessingGate";
import RelativisticOpticsBridge from "./RelativisticOpticsBridge";
import KerrBlackHole from "./KerrBlackHole";
import LagrangePointsViz from "./LagrangePointsViz";
import LaunchSceneView, { type LaunchSceneViewProps } from "./LaunchSceneView";
import GalacticScaleField from "./GalacticScaleField";
import GalacticLandmarks from "./GalacticLandmarks";
import MajorStarBeacons from "./MajorStarBeacons";
import ConstellationLines from "./ConstellationLines";
import GaiaStarField from "./GaiaStarField";
import NebulaMarkers from "./NebulaMarkers";
import DeepSkyImageSprites from "./DeepSkyImageSprites";
import NebulaMilkyWay from "./NebulaMilkyWay";
import StarClusterMarkers from "./StarClusterMarkers";
import PulsarField from "./PulsarField";
import MissionTrajectoryPreview from "./MissionTrajectoryPreview";

type FocusMode = "orbit" | "inspect" | "lock";
type ActiveFocus =
  | { kind: "body"; index: number; mode: FocusMode; start: number; until: number }
  | { kind: "earthMoon"; start: number; until: number }
  | { kind: "origin"; start: number; until: number };
export type CameraBodyFocusRequest = { bodyIndex: number; mode: FocusMode; nonce: number };

function idealFocusCameraDistance(def: SolarSystemBodyDef, mode: FocusMode): number {
  const r = def.radiusScene;
  if (mode === "inspect") {
    if (def.variant === "sun") return Math.max(2.2, r * 1.72);
    if (def.showRings) return Math.max(r * 2.55 * 1.38, 3.2);
    return Math.max(r * 5.2, 0.42);
  }
  if (mode === "lock") {
    if (def.variant === "sun") return Math.max(2.8, r * 2.05);
    if (def.showRings) return Math.max(r * 2.55 * 1.62, 3.8);
    return Math.max(r * 4.0, 0.32);
  }
  return Math.max(14, r * 24);
}

function minFocusDistance(def?: SolarSystemBodyDef): number {
  if (!def) return 0.05;
  if (def.variant === "sun") return Math.max(0.28, def.radiusScene * 1.08);
  if (def.showRings) return Math.max(0.035, def.radiusScene * 2.95);
  return Math.max(0.14, def.radiusScene * 2.35);
}

function focusAnimationMs(mode: FocusMode): number {
  if (mode === "inspect") return 2600;
  if (mode === "lock") return 2200;
  return 1500;
}

const ORIGIN_CAMERA_OFFSET = new THREE.Vector3(-310, 108, 560);

function dispatchCameraIntent(
  cameraIntentRef: MutableRefObject<CameraIntentState> | undefined,
  action: CameraIntentAction,
) {
  if (!cameraIntentRef) return;
  cameraIntentRef.current = cameraIntentReducer(cameraIntentRef.current, action);
}

function FloatingOriginBridge({ floatingOriginRef }: { floatingOriginRef: MutableRefObject<FloatingOriginState> }) {
  const camera = useThree((s) => s.camera);
  useFrame(() => { floatingOriginRef.current = updateFloatingOrigin(camera.position, floatingOriginRef.current); }, -3);
  return null;
}

function LodOrbitControlsBridge({ floatingOriginRef, controlsRef }: { floatingOriginRef: MutableRefObject<FloatingOriginState>; controlsRef: MutableRefObject<OrbitControlsImpl | null> }) {
  const lastTierRef = useRef<string | null>(null);
  useFrame(() => {
    const controls = controlsRef.current;
    const tier = floatingOriginRef.current.lodTier;
    if (!controls || lastTierRef.current === tier) return;
    lastTierRef.current = tier;
    controls.maxDistance = lodConfigForTier(tier).maxDistance;
  });
  return null;
}

function BrightStarTierBridge({ floatingOriginRef, children }: { floatingOriginRef: MutableRefObject<FloatingOriginState>; children: (tier2: boolean) => ReactNode }) {
  const [tier2, setTier2] = useState(true);
  useFrame(() => { if (!tier2 && floatingOriginRef.current.lodTier !== "solar") setTier2(true); });
  return <>{children(tier2)}</>;
}

function GalacticOverlayGate({ floatingOriginRef, children }: { floatingOriginRef: MutableRefObject<FloatingOriginState>; children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  useFrame(() => { if (!enabled) setEnabled(true); });
  return enabled ? <>{children}</> : null;
}

function CameraZoomBridge({ controlsRef }: { controlsRef: MutableRefObject<OrbitControlsImpl | null> }) {
  const camera = useThree((s) => s.camera);
  const zoomDeltaRef = useRef(0);
  const dirRef = useRef(new THREE.Vector3());
  useEffect(() => {
    const onZoom = (e: Event) => {
      if (e.defaultPrevented) return;
      zoomDeltaRef.current += (e as CustomEvent<CameraZoomDetail>).detail?.delta ?? 0;
    };
    window.addEventListener(CAMERA_ZOOM_EVENT, onZoom, { capture: false });
    return () => window.removeEventListener(CAMERA_ZOOM_EVENT, onZoom, { capture: false });
  }, []);
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls || zoomDeltaRef.current === 0) return;
    const delta = zoomDeltaRef.current;
    zoomDeltaRef.current = 0;
    const dir = dirRef.current.subVectors(camera.position, controls.target);
    dir.multiplyScalar(delta > 0 ? 0.78 : 1.28);
    camera.position.copy(controls.target).add(dir);
    controls.update();
  }, 2);
  return null;
}

function CameraFocusBodyBridge({ physicsRef, floatingOriginRef, earthMoonView, cameraBodyFocusRequest, controlsRef, cameraIntentRef }: { physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>; floatingOriginRef: MutableRefObject<FloatingOriginState>; earthMoonView: boolean; cameraBodyFocusRequest?: CameraBodyFocusRequest | null; controlsRef: MutableRefObject<OrbitControlsImpl | null>; cameraIntentRef?: MutableRefObject<CameraIntentState> }) {
  const camera = useThree((s) => s.camera);
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
  const lockTargetSmooth = useRef(new THREE.Vector3());
  const lockInitializedRef = useRef(false);
  const lockDesiredDistanceRef = useRef<number | null>(null);
  const lockViewDirRef = useRef(new THREE.Vector3(0.28, 0.38, 0.88).normalize());
  const lastRequestNonceRef = useRef<number | null>(null);
  const recentEventFocusRef = useRef<{
    bodyIndex: number;
    mode: FocusMode;
    t: number;
  } | null>(null);
  const focusStartCamera = useRef(new THREE.Vector3());
  const focusStartTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    const controls = controlsRef.current;
    const clearLock = (animateOrigin = false) => {
      focusRef.current = null;
      lockBodyIndexRef.current = null;
      lockInitializedRef.current = false;
      lockDesiredDistanceRef.current = null;
      dispatchCameraIntent(cameraIntentRef, {
        type: "reset",
        targetLabel: animateOrigin ? "origin" : undefined,
        reason: animateOrigin ? "origin focus requested" : "camera focus cleared",
      });
      if (controls) controls.enableDamping = prevDampingRef.current;
      if (animateOrigin) {
        const now = performance.now();
        focusRef.current = { kind: "origin", start: now, until: now + 1700 };
        focusStartCamera.current.copy(camera.position);
        if (controls) focusStartTarget.current.copy(controls.target);
      }
    };
    const onControlStart = () => {
      userControllingRef.current = true;
      const focus = focusRef.current;
      if (focus?.kind === "earthMoon" || focus?.kind === "origin" || (focus?.kind === "body" && focus.mode === "orbit")) {
        focusRef.current = null;
      }
    };
    const onControlEnd = () => {
      userControllingRef.current = false;
    };
    const onBody = (e: Event) => {
      const d = (e as CustomEvent<CameraFocusBodyDetail>).detail;
      if (d?.bodyIndex == null || d.bodyIndex < 0) return;
      const raw = d.mode ?? "orbit";
      const mode: FocusMode = raw === "inspect" ? "inspect" : raw === "lock" ? "lock" : "orbit";
      clearLock();
      const now = performance.now();
      recentEventFocusRef.current = { bodyIndex: d.bodyIndex, mode, t: now };
      dispatchCameraIntent(cameraIntentRef, {
        type: mode === "lock" ? "lockBody" : "focusBody",
        bodyIndex: d.bodyIndex,
        targetLabel: SOLAR_SYSTEM_BODIES[d.bodyIndex]?.name,
        progress: 0,
        now,
        reason: mode === "lock" ? "body lock event" : "body focus event",
      });
      focusRef.current = { kind: "body", index: d.bodyIndex, mode, start: now, until: now + focusAnimationMs(mode) };
      focusStartCamera.current.copy(camera.position);
      if (controls) focusStartTarget.current.copy(controls.target);
    };
    const onEarthMoon = () => { clearLock(); const now = performance.now(); dispatchCameraIntent(cameraIntentRef, { type: "focusEarthMoon", now }); focusRef.current = { kind: "earthMoon", start: now, until: now + 2800 }; };
    const onDirection = () => { clearLock(); };
    const focusBodyTarget = (bodyIndex: number): THREE.Vector3 | null => {
      const p = physicsRef.current;
      if (!p || bodyIndex < 0 || bodyIndex >= p.n) return null;
      const origin = floatingOriginRef.current;
      const [x, y, z] = applyFloatingOffsetScene(
        p.posAu[3 * bodyIndex]!,
        p.posAu[3 * bodyIndex + 1]!,
        p.posAu[3 * bodyIndex + 2]!,
        origin
      );
      return new THREE.Vector3(x, y, z);
    };
    const onZoomLocked = (e: Event) => {
      if (!controls) return;
      const delta = (e as CustomEvent<CameraZoomDetail>).detail?.delta ?? 0;
      const focus = focusRef.current;
      const bodyIndex = lockBodyIndexRef.current ?? (focus?.kind === "body" ? focus.index : null);
      if (bodyIndex === null) return;
      const target = focusBodyTarget(bodyIndex);
      if (!target) return;
      e.preventDefault();
      focusRef.current = null;
      lockBodyIndexRef.current = bodyIndex;
      lockTargetSmooth.current.copy(target);
      lockInitializedRef.current = true;
      dispatchCameraIntent(cameraIntentRef, {
        type: "updateLock",
        bodyIndex,
        targetLabel: SOLAR_SYSTEM_BODIES[bodyIndex]?.name,
        distance: lockDesiredDistanceRef.current ?? undefined,
        reason: "locked wheel zoom changed desired distance",
      });
      const def = SOLAR_SYSTEM_BODIES[bodyIndex];
      if (def) {
        controls.minDistance = minFocusDistance(def);
        controls.maxDistance = Math.max(controls.maxDistance, idealFocusCameraDistance(def, "lock") * 18);
      }
      tmpOffset.current.subVectors(camera.position, target);
      const minDist = def ? minFocusDistance(def) : 0.01;
      const maxDist = def ? Math.max(idealFocusCameraDistance(def, "lock") * 18, minDist * 2) : 50000;
      const offsetLen = tmpOffset.current.length();
      if (offsetLen < 1e-10 || !Number.isFinite(offsetLen)) {
        tmpOffset.current.copy(lockViewDirRef.current);
      } else {
        tmpOffset.current.normalize();
      }
      lockViewDirRef.current.copy(tmpOffset.current);
      const baseDist = lockDesiredDistanceRef.current ?? Math.max(offsetLen, minDist);
      const nextDist = THREE.MathUtils.clamp(
        baseDist * (delta > 0 ? 0.78 : 1.24),
        minDist,
        maxDist
      );
      lockDesiredDistanceRef.current = nextDist;
      controls.target.copy(target);
      controls.update();
    };
    window.addEventListener(CAMERA_FOCUS_BODY_EVENT, onBody);
    window.addEventListener(CAMERA_FOCUS_EARTH_MOON_EVENT, onEarthMoon);
    window.addEventListener(CAMERA_FOCUS_DIRECTION_EVENT, onDirection);
    const onOrigin = () => clearLock(true);
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
  }, [camera, cameraIntentRef, controlsRef, floatingOriginRef, physicsRef]);

  useFrame((_, dt) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const p = physicsRef.current;
    if (!p) return;
    const request = cameraBodyFocusRequest;
    if (request && request.nonce !== lastRequestNonceRef.current) {
      lastRequestNonceRef.current = request.nonce;
      const recent = recentEventFocusRef.current;
      if (
        recent &&
        recent.bodyIndex === request.bodyIndex &&
        recent.mode === request.mode &&
        performance.now() - recent.t < 500
      ) {
        recentEventFocusRef.current = null;
      } else {
        focusRef.current = null;
        lockBodyIndexRef.current = null;
        lockInitializedRef.current = false;
        lockDesiredDistanceRef.current = null;
        controls.enableDamping = prevDampingRef.current;
        const started = performance.now();
        focusRef.current = {
          kind: "body",
          index: request.bodyIndex,
          mode: request.mode,
          start: started,
          until: started + focusAnimationMs(request.mode),
        };
        dispatchCameraIntent(cameraIntentRef, {
          type: request.mode === "lock" ? "lockBody" : "focusBody",
          bodyIndex: request.bodyIndex,
          targetLabel: SOLAR_SYSTEM_BODIES[request.bodyIndex]?.name,
          progress: 0,
          now: started,
          reason: "body focus request state changed",
        });
        focusStartCamera.current.copy(camera.position);
        focusStartTarget.current.copy(controls.target);
      }
    }
    const origin = floatingOriginRef.current;
    const now = performance.now();
    const f = focusRef.current;
    if (f?.kind === "origin") {
      const [sx, sy, sz] = applyFloatingOffsetScene(0, 0, 0, origin);
      tmpTarget.current.set(sx, sy, sz);
      const u = THREE.MathUtils.clamp((now - f.start) / Math.max(1, f.until - f.start), 0, 1);
      const ease = 1 - Math.pow(1 - u, 3);
      tmpCam.current.copy(tmpTarget.current).add(ORIGIN_CAMERA_OFFSET);
      controls.target.lerpVectors(focusStartTarget.current, tmpTarget.current, ease);
      camera.position.lerpVectors(focusStartCamera.current, tmpCam.current, ease);
      controls.minDistance = earthMoonView ? 0.32 : 0.05;
      controls.maxDistance = lodConfigForTier(floatingOriginRef.current.lodTier).maxDistance;
      controls.update();
      if (now >= f.until) focusRef.current = null;
      return;
    }
    if (f?.kind === "earthMoon") {
      if (EARTH_BODY_INDEX >= p.n || MOON_BODY_INDEX >= p.n) { focusRef.current = null; return; }
      const [ex, ey, ez] = applyFloatingOffsetScene(p.posAu[3 * EARTH_BODY_INDEX]!, p.posAu[3 * EARTH_BODY_INDEX + 1]!, p.posAu[3 * EARTH_BODY_INDEX + 2]!, origin);
      const [mx, my, mz] = applyFloatingOffsetScene(p.posAu[3 * MOON_BODY_INDEX]!, p.posAu[3 * MOON_BODY_INDEX + 1]!, p.posAu[3 * MOON_BODY_INDEX + 2]!, origin);
      tmpEarth.current.set(ex, ey, ez); tmpMoon.current.set(mx, my, mz); tmpTarget.current.lerpVectors(tmpEarth.current, tmpMoon.current, 0.5);
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
    if (f?.kind === "body") {
      if (userControllingRef.current && f.mode === "orbit") {
        focusRef.current = null;
        return;
      }
      if (f.index >= p.n) { focusRef.current = null; lockBodyIndexRef.current = null; return; }
      const [x, y, z] = applyFloatingOffsetScene(p.posAu[3 * f.index]!, p.posAu[3 * f.index + 1]!, p.posAu[3 * f.index + 2]!, origin);
      tmpTarget.current.set(x, y, z);
      const def = SOLAR_SYSTEM_BODIES[f.index]!;
      const idealDist = idealFocusCameraDistance(def, f.mode);
      const u = THREE.MathUtils.clamp((now - f.start) / Math.max(1, f.until - f.start), 0, 1);
      const ease = 1 - Math.pow(1 - u, 3);
      tmpDir.current.subVectors(camera.position, controls.target).normalize();
      if (!Number.isFinite(tmpDir.current.x)) tmpDir.current.set(0.28, 0.38, 0.88).normalize();
      const pitchBias = f.mode === "lock" || f.mode === "inspect" ? 0.18 : 0;
      tmpDir.current.y = THREE.MathUtils.clamp(tmpDir.current.y + pitchBias, -0.72, 0.82);
      tmpDir.current.normalize();
      tmpCam.current.copy(tmpTarget.current).addScaledVector(tmpDir.current, idealDist);
      controls.target.lerpVectors(focusStartTarget.current, tmpTarget.current, ease);
      camera.position.lerpVectors(focusStartCamera.current, tmpCam.current, ease);
      controls.minDistance = earthMoonView ? 0.32 : minFocusDistance(def); controls.update();
      if (now >= f.until) { if (f.mode === "inspect" || f.mode === "lock") { lockBodyIndexRef.current = f.index; lockTargetSmooth.current.copy(tmpTarget.current); lockInitializedRef.current = true; tmpOffset.current.subVectors(camera.position, controls.target); const len = tmpOffset.current.length(); if (len > 1e-8 && Number.isFinite(len)) { lockViewDirRef.current.copy(tmpOffset.current).normalize(); lockDesiredDistanceRef.current = len; } } focusRef.current = null; }
      return;
    }
    const li = lockBodyIndexRef.current;
    if (li !== null) {
      if (li < 0 || li >= p.n) { lockBodyIndexRef.current = null; lockInitializedRef.current = false; controls.enableDamping = prevDampingRef.current; return; }
      if (controls.enableDamping) { prevDampingRef.current = true; controls.enableDamping = false; }
      const [x, y, z] = applyFloatingOffsetScene(p.posAu[3 * li]!, p.posAu[3 * li + 1]!, p.posAu[3 * li + 2]!, origin);
      tmpTarget.current.set(x, y, z);
      if (!lockInitializedRef.current) { lockTargetSmooth.current.copy(tmpTarget.current); lockInitializedRef.current = true; } else lockTargetSmooth.current.lerp(tmpTarget.current, 1 - Math.pow(0.02, dt));
      tmpOffset.current.copy(camera.position).sub(controls.target);
      const currentDist = tmpOffset.current.length();
      if (currentDist > 1e-8 && Number.isFinite(currentDist)) {
        lockViewDirRef.current.copy(tmpOffset.current).normalize();
      }
      const def = SOLAR_SYSTEM_BODIES[li];
      const minDist = def ? minFocusDistance(def) : 0.05;
      const targetDist = THREE.MathUtils.clamp(lockDesiredDistanceRef.current ?? Math.max(currentDist, minDist), minDist, def ? Math.max(idealFocusCameraDistance(def, "lock") * 14, minDist * 2) : 50000);
      lockDesiredDistanceRef.current = targetDist;
      dispatchCameraIntent(cameraIntentRef, {
        type: "updateLock",
        bodyIndex: li,
        targetLabel: def?.name,
        distance: targetDist,
        now,
      });
      if (userControllingRef.current) {
        const liveDist = THREE.MathUtils.clamp(Math.max(currentDist, minDist), minDist, def ? Math.max(idealFocusCameraDistance(def, "lock") * 14, minDist * 2) : 50000);
        lockDesiredDistanceRef.current = liveDist;
        controls.target.copy(lockTargetSmooth.current);
        camera.position.copy(controls.target).addScaledVector(lockViewDirRef.current, liveDist);
        controls.update();
        return;
      }
      const nextDist = THREE.MathUtils.lerp(Math.max(currentDist, minDist), targetDist, 1 - Math.pow(0.0008, dt));
      controls.target.copy(lockTargetSmooth.current);
      camera.position.copy(controls.target).addScaledVector(lockViewDirRef.current, nextDist);
      if (def) { controls.minDistance = minFocusDistance(def); controls.maxDistance = Math.max(controls.maxDistance, idealFocusCameraDistance(def, "lock") * 14); }
      controls.update(); return;
    }
    controls.minDistance = earthMoonView ? 0.32 : 0.05;
  }, 2);
  return null;
}

function CameraFocusDirectionBridge({ controlsRef, cameraIntentRef }: { controlsRef: MutableRefObject<OrbitControlsImpl | null>; cameraIntentRef?: MutableRefObject<CameraIntentState> }) {
  const camera = useThree((s) => s.camera);
  const targetRef = useRef<THREE.Vector3 | null>(null);
  const camRef = useRef(new THREE.Vector3());
  useEffect(() => {
    const onDir = (e: Event) => { const d = (e as CustomEvent<CameraFocusDirectionDetail>).detail; if (!d?.direction) return; const dir = new THREE.Vector3(...d.direction).normalize(); targetRef.current = dir.clone().multiplyScalar(7000); camRef.current.copy(dir).multiplyScalar(-800).add(new THREE.Vector3(0, 300, 0)); dispatchCameraIntent(cameraIntentRef, { type: "focusSkyDirection", progress: 0 }); };
    const clear = () => { targetRef.current = null; };
    window.addEventListener(CAMERA_FOCUS_DIRECTION_EVENT, onDir);
    window.addEventListener(CAMERA_FOCUS_BODY_EVENT, clear);
    window.addEventListener(CAMERA_FOCUS_ORIGIN_EVENT, clear);
    window.addEventListener(CAMERA_FOCUS_EARTH_MOON_EVENT, clear);
    return () => {
      window.removeEventListener(CAMERA_FOCUS_DIRECTION_EVENT, onDir);
      window.removeEventListener(CAMERA_FOCUS_BODY_EVENT, clear);
      window.removeEventListener(CAMERA_FOCUS_ORIGIN_EVENT, clear);
      window.removeEventListener(CAMERA_FOCUS_EARTH_MOON_EVENT, clear);
    };
  }, [cameraIntentRef]);
  useFrame(() => { const controls = controlsRef.current; if (!controls || !targetRef.current) return; controls.target.lerp(targetRef.current, 0.1); camera.position.lerp(camRef.current, 0.085); controls.update(); const remain = camera.position.distanceTo(camRef.current); dispatchCameraIntent(cameraIntentRef, { type: "focusSkyDirection", progress: THREE.MathUtils.clamp(1 - remain / 1200, 0, 1), distance: remain, reason: "sky focus animation progressing" }); if (remain < 3) { targetRef.current = null; dispatchCameraIntent(cameraIntentRef, { type: "reset", targetLabel: "sky direction", reason: "sky focus animation completed" }); } }, 2);
  return null;
}

function SelectionMetricsBridge({ selectedBodyIndex, physicsRef, floatingOriginRef, bodyMetricsRef }: { selectedBodyIndex: number | null; physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>; floatingOriginRef: MutableRefObject<FloatingOriginState>; bodyMetricsRef: MutableRefObject<BodyLiveMetrics | null> }) {
  const camera = useThree((s) => s.camera);
  const bodyPos = useRef(new THREE.Vector3());
  const sunPos = useRef(new THREE.Vector3());
  useFrame(() => {
    const p = physicsRef.current;
    if (!p || selectedBodyIndex == null || selectedBodyIndex < 0 || selectedBodyIndex >= p.n) { bodyMetricsRef.current = null; return; }
    const i = selectedBodyIndex;
    const origin = floatingOriginRef.current;
    const [bx, by, bz] = applyFloatingOffsetScene(p.posAu[3 * i]!, p.posAu[3 * i + 1]!, p.posAu[3 * i + 2]!, origin);
    const [sx, sy, sz] = applyFloatingOffsetScene(p.posAu[0]!, p.posAu[1]!, p.posAu[2]!, origin);
    bodyPos.current.set(bx, by, bz); sunPos.current.set(sx, sy, sz);
    const vx = p.velM[3 * i] ?? 0; const vy = p.velM[3 * i + 1] ?? 0; const vz = p.velM[3 * i + 2] ?? 0;
    bodyMetricsRef.current = { speedKms: Math.hypot(vx, vy, vz) / 1000, distSunAu: bodyPos.current.distanceTo(sunPos.current) / AU_TO_SCENE, distCameraAu: camera.position.distanceTo(bodyPos.current) / AU_TO_SCENE };
  });
  return null;
}

export type UniverseCanvasSimulationProps = {
  simDaysRef: MutableRefObject<number>; isPlaying: boolean; daysPerSecond: number; physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>; relativityEnabledRef: MutableRefObject<boolean>; precisionTierRef: MutableRefObject<PhysicsPrecisionTier>; floatingOriginRef: MutableRefObject<FloatingOriginState>; cameraIntentRef?: MutableRefObject<CameraIntentState>; onSelectBody: (bodyIndex: number) => void; onBodyCanvasPick: (bodyIndex: number) => void; selectedBodyIndex: number | null; cameraBodyFocusRequest?: CameraBodyFocusRequest | null; bodyMetricsRef: MutableRefObject<BodyLiveMetrics | null>; simulationDiagnosticsRef: MutableRefObject<SimulationDiagnostics | null>; earthMoonView: boolean; telemetrySeriesRef: MutableRefObject<TelemetrySeriesState | null>; kerrBlackHole: KerrBlackHoleUiState; visualEnhance: boolean; viewSettings: SimulationViewSettings; lagrangeSpawnNonceRef: MutableRefObject<number>; integrationSuspendedRef: MutableRefObject<boolean>; timeTravelScrubURef: MutableRefObject<number>; timeTravelScrubbingRef: MutableRefObject<boolean>; physicsHistoryRef: MutableRefObject<PhysicsHistoryStack>; missionPreviewPlan?: MissionPlan | null; onCanvasPointerMissed?: () => void; launchMode?: boolean; localLaunchActive?: boolean; localLaunchActiveRef?: MutableRefObject<boolean>; onLocalLaunchHandoff?: LaunchSceneViewProps["onHandoff"]; onLocalLaunchAbort?: () => void; localTelemetryRef?: MutableRefObject<LocalTelemetry | null>; launchConfigRef?: MutableRefObject<LaunchConfig | null>;
};

export default function UniverseScene({ simulation }: { simulation: UniverseCanvasSimulationProps }) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const qualityBudget = simulation.viewSettings.renderBudget === "quality" || simulation.viewSettings.highQualityRendering;

  useEffect(() => {
    if (!simulation.cameraIntentRef) return;
    if (simulation.localLaunchActive) {
      dispatchCameraIntent(simulation.cameraIntentRef, {
        type: "launchFollow",
        targetLabel: "launch vehicle",
      });
    }
  }, [simulation.cameraIntentRef, simulation.localLaunchActive]);

  return (
    <RelativisticOpticsProvider>
      <BloomSceneProvider>
        <ambientLight intensity={TRUE_VOID_CINEMATIC_AMBIENT_INTENSITY} />
        <hemisphereLight intensity={TRUE_VOID_CINEMATIC_HEMISPHERE_INTENSITY} groundColor="#020204" color="#17223a" />
        <RelativisticOpticsBridge daysPerSecond={simulation.daysPerSecond} relativityEnabledRef={simulation.relativityEnabledRef} viewSettings={simulation.viewSettings} />
        <FloatingOriginBridge floatingOriginRef={simulation.floatingOriginRef} />
        <BrightStarTierBridge floatingOriginRef={simulation.floatingOriginRef}>{(tier2) => <ScienceBackdrop floatingOriginRef={simulation.floatingOriginRef} brightStarTier2={tier2} qualitySky={qualityBudget} />}</BrightStarTierBridge>
        {simulation.viewSettings.showGalaxyBackground ? <NebulaMilkyWay /> : null}
        <GalacticOverlayGate floatingOriginRef={simulation.floatingOriginRef}>
          {qualityBudget ? <GalacticScaleField floatingOriginRef={simulation.floatingOriginRef} /> : null}
          {qualityBudget ? <GalacticLandmarks floatingOriginRef={simulation.floatingOriginRef} /> : null}
          <MajorStarBeacons floatingOriginRef={simulation.floatingOriginRef} />
          {simulation.viewSettings.showConstellations ? <ConstellationLines floatingOriginRef={simulation.floatingOriginRef} /> : null}
          {simulation.viewSettings.showGaiaStars ? <GaiaStarField floatingOriginRef={simulation.floatingOriginRef} highQuality={qualityBudget} /> : null}
          {simulation.viewSettings.showNebulaImages ? <DeepSkyImageSprites floatingOriginRef={simulation.floatingOriginRef} highQuality={qualityBudget} /> : null}
          {simulation.viewSettings.showDeepSkyMarkers ? (
            <>
              <NebulaMarkers floatingOriginRef={simulation.floatingOriginRef} />
              <StarClusterMarkers floatingOriginRef={simulation.floatingOriginRef} />
              <PulsarField floatingOriginRef={simulation.floatingOriginRef} />
            </>
          ) : null}
        </GalacticOverlayGate>
        <SelectionMetricsBridge selectedBodyIndex={simulation.selectedBodyIndex} physicsRef={simulation.physicsRef} floatingOriginRef={simulation.floatingOriginRef} bodyMetricsRef={simulation.bodyMetricsRef} />
        <SolarSystemIntegrator physicsRef={simulation.physicsRef} simDaysRef={simulation.simDaysRef} isPlaying={simulation.isPlaying} daysPerSecond={simulation.daysPerSecond} relativityEnabledRef={simulation.relativityEnabledRef} precisionTierRef={simulation.precisionTierRef} integrationSuspendedRef={simulation.integrationSuspendedRef} localLaunchActiveRef={simulation.localLaunchActiveRef} floatingOriginRef={simulation.floatingOriginRef} />
        <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.06} maxDistance={50000} enabled={!simulation.localLaunchActive} />
        <CameraFocusBodyBridge physicsRef={simulation.physicsRef} floatingOriginRef={simulation.floatingOriginRef} earthMoonView={simulation.earthMoonView} cameraBodyFocusRequest={simulation.cameraBodyFocusRequest} controlsRef={controlsRef} cameraIntentRef={simulation.cameraIntentRef} />
        <CameraFocusDirectionBridge controlsRef={controlsRef} cameraIntentRef={simulation.cameraIntentRef} />
        {simulation.viewSettings.showMissionTrajectory ? (
          <MissionTrajectoryPreview
            plan={simulation.missionPreviewPlan ?? null}
            floatingOriginRef={simulation.floatingOriginRef}
            showLabels={qualityBudget}
          />
        ) : null}
        {simulation.viewSettings.showReferenceOrbits ? <ReferenceOrbitDecor renderBudget={simulation.viewSettings.renderBudget} /> : null}
        {simulation.viewSettings.showKerrBlackHole ? <KerrBlackHole massSolar={simulation.kerrBlackHole.massSolar} aOverM={simulation.kerrBlackHole.aOverM} frameDragTeachingScale={simulation.kerrBlackHole.frameDragTeachingScale} isPlaying={simulation.isPlaying} daysPerSecond={simulation.daysPerSecond} /> : null}
        <LagrangePointsViz physicsRef={simulation.physicsRef} earthMoonView={simulation.earthMoonView} enabled={simulation.viewSettings.showLagrangePoints} spawnNonceRef={simulation.lagrangeSpawnNonceRef} isPlaying={simulation.isPlaying} daysPerSecond={simulation.daysPerSecond} />
        <LodOrbitControlsBridge floatingOriginRef={simulation.floatingOriginRef} controlsRef={controlsRef} />
        <CameraZoomBridge controlsRef={controlsRef} />
        {simulation.localLaunchActive && simulation.onLocalLaunchHandoff ? (
          <LaunchSceneView physicsRef={simulation.physicsRef} onHandoff={simulation.onLocalLaunchHandoff} onAbort={simulation.onLocalLaunchAbort ?? (() => {})} telemetryRef={simulation.localTelemetryRef} active={!!simulation.localLaunchActive} launchConfigRef={simulation.launchConfigRef} />
        ) : (
          <>
            <LabelOcclusionProvider>
              <SolarSystemBodies physicsRef={simulation.physicsRef} floatingOriginRef={simulation.floatingOriginRef} onSelectBody={simulation.onSelectBody} onBodyCanvasPick={simulation.onBodyCanvasPick} selectedBodyIndex={simulation.selectedBodyIndex} earthMoonView={simulation.earthMoonView} viewSettings={simulation.viewSettings} simDaysRef={simulation.simDaysRef} />
            </LabelOcclusionProvider>
          </>
        )}
        <PostProcessingGate visualEnhance={simulation.visualEnhance} />
      </BloomSceneProvider>
    </RelativisticOpticsProvider>
  );
}
