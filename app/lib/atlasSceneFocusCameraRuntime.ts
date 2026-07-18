import type { MutableRefObject } from "react";
import * as THREE from "three";
import type { SolarSystemBodyDef } from "../data/planetsJ2000";
import { applyFloatingOffsetScene, type FloatingOriginState } from "./floatingOrigin";
import {
  resolvedCameraFocusDurationMs,
  type CameraFocusMode,
} from "./cameraFocusCommand";
import type { AtlasSafeViewportRect } from "./atlasCameraFrameSolverV4";
import {
  solveAtlasCameraFrameV5,
  type AtlasProjectedSubjectMetricsV5,
} from "./atlasCameraFrameSolverV5";
import { atlasRuntimeStore } from "./atlasRuntimeStore";
import {
  mapOrbitAtlasPositionAu,
  orbitAtlasBodyDisplayRadius,
  type OrbitAtlasScaleMode,
  type SolarPresentationMode,
} from "./orbitAtlasPresentation";
import { SCIENTIFIC_VISUAL_FIDELITY_V152_BUDGETS } from "./scientificVisualFidelityV152";

export const ORIGIN_CAMERA_OFFSET = new THREE.Vector3(-310, 108, 560);

export function runtimeFocusDurationMs(
  angularDistanceRad: number,
  distanceRatio: number,
  viewport: "desktop" | "mobile" | "unknown",
): number {
  const reducedMotion =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  return resolvedCameraFocusDurationMs(
    angularDistanceRad,
    distanceRatio,
    viewport,
    reducedMotion,
  );
}

export function idealFocusCameraDistance(
  def: SolarSystemBodyDef,
  mode: CameraFocusMode,
  presentationMode: SolarPresentationMode,
  atlasScaleMode: OrbitAtlasScaleMode,
): number {
  const radius =
    presentationMode === "orbit-atlas" && atlasScaleMode === "compressed"
      ? orbitAtlasBodyDisplayRadius(def.id, def.radiusScene, mode !== "orbit", def.showRings)
      : def.radiusScene;
  if (mode === "inspect") {
    if (def.variant === "sun") return Math.max(2.05, radius * 1.55);
    if (def.showRings) return Math.max(radius * 2.45, 4.15);
    return presentationMode === "orbit-atlas" && atlasScaleMode === "compressed"
      ? Math.max(radius * 2.2, 2.25)
      : Math.max(radius * 3.25, 0.22);
  }
  if (mode === "lock") {
    if (def.variant === "sun") return Math.max(2.45, radius * 1.82);
    if (def.showRings) return Math.max(radius * 2.65, 4.45);
    return presentationMode === "orbit-atlas" && atlasScaleMode === "compressed"
      ? Math.max(radius * 2.8, 2.55)
      : Math.max(radius * 3.15, 0.24);
  }
  return Math.max(14, radius * 24);
}

export function focusSubjectRadius(
  def: SolarSystemBodyDef,
  mode: CameraFocusMode,
  presentationMode: SolarPresentationMode,
  atlasScaleMode: OrbitAtlasScaleMode,
): number {
  const radius =
    presentationMode === "orbit-atlas" && atlasScaleMode === "compressed"
      ? orbitAtlasBodyDisplayRadius(def.id, def.radiusScene, mode !== "orbit", def.showRings)
      : def.radiusScene;
  return def.showRings
    ? radius * SCIENTIFIC_VISUAL_FIDELITY_V152_BUDGETS.saturn.frameRadiusScale
    : radius * (def.variant === "sun" ? 1.04 : 1.08);
}

export function runtimeSafeViewportRect(width: number, height: number): AtlasSafeViewportRect {
  return atlasRuntimeStore.getSnapshot().safeViewportRect ?? {
    left: 0,
    top: 0,
    right: width,
    bottom: Math.max(1, height - 78),
    viewportWidth: width,
    viewportHeight: height,
  };
}

export function solveBodyCameraFrame(
  def: SolarSystemBodyDef,
  mode: CameraFocusMode,
  presentationMode: SolarPresentationMode,
  atlasScaleMode: OrbitAtlasScaleMode,
  camera: THREE.PerspectiveCamera,
  viewportWidth: number,
  viewportHeight: number,
): AtlasProjectedSubjectMetricsV5 {
  const framingSubjectRadius = focusSubjectRadius(def, mode, presentationMode, atlasScaleMode);
  const subjectRadiusScene = def.showRings
    ? framingSubjectRadius / SCIENTIFIC_VISUAL_FIDELITY_V152_BUDGETS.saturn.frameRadiusScale
    : framingSubjectRadius;
  const safeRect = runtimeSafeViewportRect(viewportWidth, viewportHeight);
  const screenMinorPx = Math.min(viewportWidth, viewportHeight);
  const safeMinorPx = Math.min(
    Math.max(1, safeRect.right - safeRect.left),
    Math.max(1, safeRect.bottom - safeRect.top),
  );
  const baseCoverage = def.showRings
    ? 0.42
    : 0.49;
  return solveAtlasCameraFrameV5({
    subjectRadiusScene,
    // Saturn is composed against the body disc.  Its tilted ring silhouette
    // is measured independently by the V217 diagnostics surface.
    ringOuterRadiusScene: null,
    verticalFovDeg: camera.fov,
    viewportWidth,
    viewportHeight,
    safeRect,
    desiredCoverage: Math.min(0.68, baseCoverage * (screenMinorPx / safeMinorPx)),
  });
}

export function solveSkyCameraFrame(
  camera: THREE.PerspectiveCamera,
  viewportWidth: number,
  viewportHeight: number,
): AtlasProjectedSubjectMetricsV5 {
  return solveAtlasCameraFrameV5({
    subjectRadiusScene: 184,
    verticalFovDeg: camera.fov,
    viewportWidth,
    viewportHeight,
    safeRect: runtimeSafeViewportRect(viewportWidth, viewportHeight),
    desiredCoverage: 0.44,
  });
}

export function applyCameraFrameProjection(
  camera: THREE.PerspectiveCamera,
  frame: AtlasProjectedSubjectMetricsV5,
  viewportWidth: number,
  viewportHeight: number,
  previousKey: MutableRefObject<string>,
): void {
  const width = Math.max(1, Math.round(viewportWidth));
  const height = Math.max(1, Math.round(viewportHeight));
  // A positive sub-frustum origin moves the rendered subject left.  The frame
  // solver expresses the desired subject position in NDC, so invert X here.
  const offsetX = -frame.targetNdcX * width * 0.5;
  const offsetY = frame.targetNdcY * height * 0.5;
  const key = `${width}|${height}|${offsetX.toFixed(2)}|${offsetY.toFixed(2)}`;
  if (previousKey.current === key) return;
  camera.setViewOffset(width, height, offsetX, offsetY, width, height);
  camera.updateProjectionMatrix();
  previousKey.current = key;
}

export function clearCameraFrameProjection(
  camera: THREE.PerspectiveCamera,
  previousKey: MutableRefObject<string>,
): void {
  if (!previousKey.current && !camera.view) return;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  previousKey.current = "";
}

export function minFocusDistance(def?: SolarSystemBodyDef): number {
  if (!def) return 0.05;
  if (def.variant === "sun") return Math.max(0.28, def.radiusScene * 1.08);
  if (def.showRings) return Math.max(0.035, def.radiusScene * 2.95);
  return Math.max(0.14, def.radiusScene * 2.35);
}

export function presentationPosition(
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

export function applyTargetAnchorDelta(
  cameraPosition: THREE.Vector3,
  currentTarget: THREE.Vector3,
  nextTarget: THREE.Vector3,
  scratchDelta: THREE.Vector3,
): void {
  scratchDelta.copy(nextTarget).sub(currentTarget);
  cameraPosition.add(scratchDelta);
  currentTarget.copy(nextTarget);
}
