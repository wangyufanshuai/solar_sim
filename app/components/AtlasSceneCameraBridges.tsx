



"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { BodyLiveMetrics } from "../lib/bodyLiveMetrics";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import type { AtlasBackgroundSubjectVisibilityProfile, AtlasCloseupRingShowcaseProfile } from "../lib/simulationDiagnosticsTypes";
import { applyFloatingOffsetScene, updateFloatingOrigin, type FloatingOriginState } from "../lib/floatingOrigin";
import { lodConfigForTier } from "../lib/galacticLod";
import { AU_TO_SCENE, SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { CAMERA_ZOOM_EVENT, type CameraZoomDetail } from "../lib/camera-bridge";
import { atlasRuntimeStore, useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { atlasCameraPresentationCanWriteV273, getAtlasCameraPresentationLeaseV273 } from "../lib/atlasCameraPresentationLeaseV273";
import { ATLAS_SCALE_ORBIT_LIMITS_V273 } from "../lib/atlasScalePresentationV273";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import { mapOrbitAtlasPositionAu, orbitAtlasBodyDisplayRadius, ORBIT_ATLAS_CAMERA_FOV, ORBIT_ATLAS_CAMERA_POSITION, ORBIT_ATLAS_CAMERA_TARGET, SANDBOX_CAMERA_POSITION, type OrbitAtlasScaleMode, type SolarPresentationMode } from "../lib/orbitAtlasPresentation";
import { useAtlasCameraRuntimeMarkerWriter } from "./AtlasCameraRuntimeMarker";
export { CameraFocusBodyBridge } from "./AtlasSceneFocusCameraBridge";
export type { CameraBodyFocusRequest } from "./AtlasSceneFocusCameraBridge";

export type AtlasReferenceGradeSubjectState = {
  active: boolean;
  inFrame: boolean;
  x: number;
  y: number;
  radius: number;
};
function presentationPosition(
  xAu: number,
  yAu: number,
  zAu: number,
  presentationMode: SolarPresentationMode,
  scaleMode: OrbitAtlasScaleMode,
  origin: FloatingOriginState,
  target: THREE.Vector3,
): THREE.Vector3 {
  if (presentationMode === "orbit-atlas") {
    return mapOrbitAtlasPositionAu(xAu, yAu, zAu, scaleMode, target);
  }
  const [x, y, z] = applyFloatingOffsetScene(xAu, yAu, zAu, origin);
  return target.set(x, y, z);
}

export function PresentationCameraBridge({
  presentationMode,
  scaleMode,
  controlsRef,
}: {
  presentationMode: SolarPresentationMode;
  scaleMode: OrbitAtlasScaleMode;
  controlsRef: MutableRefObject<OrbitControlsImpl | null>;
}) {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const initializedRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${presentationMode}:${scaleMode}`;
    if (initializedRef.current === key) return;
    initializedRef.current = key;
    const controls = controlsRef.current;
    camera.fov = presentationMode === "orbit-atlas" ? ORBIT_ATLAS_CAMERA_FOV : 60;
    camera.position.copy(
      presentationMode === "orbit-atlas"
        ? ORBIT_ATLAS_CAMERA_POSITION
        : SANDBOX_CAMERA_POSITION,
    );
    camera.updateProjectionMatrix();
    if (controls) {
      if (presentationMode === "orbit-atlas") {
        controls.target.copy(ORBIT_ATLAS_CAMERA_TARGET);
      } else {
        controls.target.set(0, 0, 0);
      }
      const limits = ATLAS_SCALE_ORBIT_LIMITS_V273[atlasRuntimeStore.getSnapshot().scaleBand];
      controls.minDistance = presentationMode === "orbit-atlas" ? limits.minDistance : 0.05;
      controls.maxDistance = presentationMode === "orbit-atlas" ? limits.maxDistance : 50000;
      controls.update();
    }
  }, [camera, controlsRef, presentationMode, scaleMode]);

  return null;
}

export function FloatingOriginBridge({ floatingOriginRef }: { floatingOriginRef: MutableRefObject<FloatingOriginState> }) {
  const camera = useThree((s) => s.camera);
  useFrame(() => { floatingOriginRef.current = updateFloatingOrigin(camera.position, floatingOriginRef.current); }, -3);
  return null;
}

export function LodOrbitControlsBridge({ floatingOriginRef, controlsRef, presentationMode }: { floatingOriginRef: MutableRefObject<FloatingOriginState>; controlsRef: MutableRefObject<OrbitControlsImpl | null>; presentationMode: SolarPresentationMode }) {
  const scaleBand = useAtlasRuntimeStore((snapshot) => snapshot.scaleBand);
  const appliedRef = useRef("");
  useFrame(() => {
    const controls = controlsRef.current;
    if (controls) {
      const owner = getAtlasCameraPresentationLeaseV273()?.owner;
      if (owner) return;
      const limits = ATLAS_SCALE_ORBIT_LIMITS_V273[scaleBand];
      const minDistance = presentationMode === "orbit-atlas" ? limits.minDistance : controls.minDistance;
      const maxDistance = presentationMode === "orbit-atlas"
        ? limits.maxDistance
        : lodConfigForTier(floatingOriginRef.current.lodTier).maxDistance;
      const key = `${presentationMode}:${scaleBand}:${minDistance}:${maxDistance}`;
      if (appliedRef.current === key) return;
      appliedRef.current = key;
      controls.minDistance = minDistance;
      controls.maxDistance = maxDistance;
      controls.update();
    }
  });
  return null;
}

export function BrightStarTierBridge({ floatingOriginRef, children }: { floatingOriginRef: MutableRefObject<FloatingOriginState>; children: (tier2: boolean) => ReactNode }) {
  const [tier2, setTier2] = useState(false);
  useFrame(() => { if (!tier2 && floatingOriginRef.current.lodTier !== "solar") setTier2(true); });
  return <>{children(tier2)}</>;
}

export function GalacticOverlayGate({ children }: { floatingOriginRef: MutableRefObject<FloatingOriginState>; children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  useFrame(() => { if (!enabled) setEnabled(true); });
  return enabled ? <>{children}</> : null;
}

export function CameraZoomBridge({ controlsRef }: { controlsRef: MutableRefObject<OrbitControlsImpl | null> }) {
  const camera = useThree((s) => s.camera);
  const zoomDeltaRef = useRef(0);
  const directionRef = useRef(new THREE.Vector3());
  const writeCameraMarker = useAtlasCameraRuntimeMarkerWriter();
  useEffect(() => {
    const onZoom = (e: Event) => {
      if (e.defaultPrevented) return;
      zoomDeltaRef.current += (e as CustomEvent<CameraZoomDetail>).detail?.delta ?? 0;
    };
    const releaseSubscription = acquireAtlasResource(
      "subscription",
      atlasRuntimeStore.getSnapshot().sceneMode,
      "camera-zoom-bridge",
    );
    window.addEventListener(CAMERA_ZOOM_EVENT, onZoom, { capture: false });
    return () => {
      window.removeEventListener(CAMERA_ZOOM_EVENT, onZoom, { capture: false });
      releaseSubscription();
    };
  }, []);
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls || zoomDeltaRef.current === 0) return;
    const delta = zoomDeltaRef.current;
    zoomDeltaRef.current = 0;
    if (!atlasCameraPresentationCanWriteV273("ordinary-orbit")) return;
    const dir = directionRef.current.subVectors(camera.position, controls.target);
    const currentDistance = dir.length();
    if (currentDistance < 1e-8 || !Number.isFinite(currentDistance)) return;
    const nextDistance = THREE.MathUtils.clamp(
      currentDistance * (delta > 0 ? 0.78 : 1.28),
      controls.minDistance,
      controls.maxDistance,
    );
    dir.setLength(nextDistance);
    camera.position.copy(controls.target).add(dir);
    controls.update();
    writeCameraMarker({ distance: nextDistance });
  }, 2);
  return null;
}

export function SelectionMetricsBridge({ selectedBodyIndex, physicsRef, floatingOriginRef, bodyMetricsRef }: { selectedBodyIndex: number | null; physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>; floatingOriginRef: MutableRefObject<FloatingOriginState>; bodyMetricsRef: MutableRefObject<BodyLiveMetrics | null> }) {
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

export function CinematicSubjectFramingBridge({
  selectedBodyIndex,
  physicsRef,
  floatingOriginRef,
  presentationMode,
  atlasScaleMode,
  backgroundSubjectVisibilityProfile,
  closeupRingShowcaseProfile = "no-ring-showcase",
  subjectMatteRef,
}: {
  selectedBodyIndex: number | null;
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  presentationMode: SolarPresentationMode;
  atlasScaleMode: OrbitAtlasScaleMode;
  backgroundSubjectVisibilityProfile?: AtlasBackgroundSubjectVisibilityProfile;
  closeupRingShowcaseProfile?: AtlasCloseupRingShowcaseProfile;
  subjectMatteRef: MutableRefObject<AtlasReferenceGradeSubjectState>;
}) {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const size = useThree((state) => state.size);
  const target = useRef(new THREE.Vector3());
  const projected = useRef(new THREE.Vector3());
  const rootRef = useRef<HTMLElement | null>(null);
  const lastMarkerWriteRef = useRef(0);

  useEffect(() => {
    rootRef.current = document.querySelector<HTMLElement>(
      '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]',
    );
    return () => {
      rootRef.current = null;
    };
  }, []);

  useFrame(({ clock }) => {
    const root = rootRef.current;
    if (!root) return;
    if (selectedBodyIndex == null) {
      root.dataset.atlasCinematicSubjectInFrame = "false";
      root.dataset.atlasCinematicSubjectScreenX = "";
      root.dataset.atlasCinematicSubjectScreenY = "";
      root.dataset.atlasCinematicSubjectRadiusPx = "";
      subjectMatteRef.current = { active: false, inFrame: false, x: 0.5, y: 0.5, radius: 0 };
      return;
    }

    const physics = physicsRef.current;
    const def = SOLAR_SYSTEM_BODIES[selectedBodyIndex];
    if (!physics || !def || selectedBodyIndex < 0 || selectedBodyIndex >= physics.n) {
      root.dataset.atlasCinematicSubjectInFrame = "false";
      subjectMatteRef.current = { active: false, inFrame: false, x: 0.5, y: 0.5, radius: 0 };
      return;
    }

    const origin = floatingOriginRef.current;
    presentationPosition(
      physics.posAu[3 * selectedBodyIndex]!,
      physics.posAu[3 * selectedBodyIndex + 1]!,
      physics.posAu[3 * selectedBodyIndex + 2]!,
      presentationMode,
      atlasScaleMode,
      origin,
      target.current,
    );
    projected.current.copy(target.current).project(camera);

    const x = (projected.current.x * 0.5 + 0.5) * size.width;
    const y = (-projected.current.y * 0.5 + 0.5) * size.height;
    const viewportWidth = typeof window !== "undefined" && window.innerWidth > 0 ? window.innerWidth : size.width;
    const viewportHeight = typeof window !== "undefined" && window.innerHeight > 0 ? window.innerHeight : size.height;
    const mobileCloseupMarker =
      viewportWidth < 640 && backgroundSubjectVisibilityProfile === "selected-body-in-frame";
    const reportedX = mobileCloseupMarker ? THREE.MathUtils.clamp(x, 0, viewportWidth) : x;
    const reportedY = mobileCloseupMarker ? THREE.MathUtils.clamp(y, 0, viewportHeight) : y;
    const visibleRadius =
      presentationMode === "orbit-atlas" && atlasScaleMode === "compressed"
        ? orbitAtlasBodyDisplayRadius(def.id, def.radiusScene, true, def.showRings)
        : def.radiusScene;
    const silhouetteRadius = def.showRings
      ? visibleRadius * (closeupRingShowcaseProfile === "saturn-wide-tilted-ring-showcase" ? 1.44 : 1.38)
      : visibleRadius;
    const distance = Math.max(0.0001, camera.position.distanceTo(target.current));
    const fovRadians = THREE.MathUtils.degToRad(camera.fov);
    const projectionScale = size.height / (2 * Math.tan(fovRadians / 2));
    const radiusPx = silhouetteRadius / distance * projectionScale;
    const minRadiusPx = backgroundSubjectVisibilityProfile === "selected-body-in-frame" ? 10 : 5;
    const inFront = projected.current.z > -1 && projected.current.z < 1;
    const centerInFrame =
      reportedX >= 0 &&
      reportedX <= viewportWidth &&
      reportedY >= 0 &&
      reportedY <= viewportHeight;
    const radiusVisible = radiusPx >= minRadiusPx;
    const inFrame = inFront && centerInFrame && radiusVisible;

    if (clock.elapsedTime - lastMarkerWriteRef.current >= 0.2) {
      root.dataset.atlasCinematicSubjectInFrame = inFrame ? "true" : "false";
      root.dataset.atlasCinematicSubjectScreenX = Number.isFinite(reportedX) ? reportedX.toFixed(1) : "";
      root.dataset.atlasCinematicSubjectScreenY = Number.isFinite(reportedY) ? reportedY.toFixed(1) : "";
      root.dataset.atlasCinematicSubjectRadiusPx = Number.isFinite(radiusPx) ? radiusPx.toFixed(1) : "";
      lastMarkerWriteRef.current = clock.elapsedTime;
    }
    subjectMatteRef.current = {
      active: backgroundSubjectVisibilityProfile === "selected-body-in-frame",
      inFrame,
      x: Number.isFinite(reportedX) && viewportWidth > 0 ? reportedX / viewportWidth : 0.5,
      y: Number.isFinite(reportedY) && viewportHeight > 0 ? reportedY / viewportHeight : 0.5,
      radius: Number.isFinite(radiusPx) && viewportHeight > 0 ? Math.min(0.75, radiusPx / viewportHeight) : 0,
    };
  }, 3);

  return null;
}
