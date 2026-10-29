import * as THREE from "three";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { normalizeAtlasSafeViewportRect, type AtlasSafeViewportRect } from "./atlasCameraFrameSolverV4";
import type { AtlasProjectedSubjectMetricsV5 } from "./atlasCameraFrameSolverV5";
import { selectMainlineAConstellationFigureV638 } from "./mainlineAConstellationSelectionV638";
import type { ConstellationDomMeasurementV638, ConstellationScreenRectV638 } from "./mainlineAConstellationLabelOcclusionV638";
import { SKY_TARGET_DISTANCE_SCENE, SKY_TARGET_ZOOM_MAX_DISTANCE_SCENE } from "./skyTargetFocus";

export type MainlineAConstellationCameraTargetV638 = Readonly<{
  catalogId: string;
  center: readonly [number, number, number];
  radius: number;
}>;

// Presentation layout floor, not a scientific or physical limit: reserve room
// for two 18px label lines and 14px of anchor/label separation on each side.
// A remaining edge sliver cannot support a readable constellation composition.
const MIN_MEASURED_FRAME_EDGE_CSS_PX = 64;

/** Presentation-only free rectangle; null means no usable measured composition. */
export function resolveMainlineAConstellationSafeViewportV638(
  width: number,
  height: number,
  runtimeRect: AtlasSafeViewportRect | null,
  measurement: ConstellationDomMeasurementV638 | null,
): AtlasSafeViewportRect | null {
  const safe = normalizeAtlasSafeViewportRect(runtimeRect, width, height);
  if (!measurement) return safe;
  const valid = (rect: ConstellationScreenRectV638) =>
    [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) && rect.width > 0 && rect.height > 0;
  if (!valid(measurement.canvas) || !valid(measurement.viewport)) return null;
  const sx = safe.viewportWidth / measurement.canvas.width;
  const sy = safe.viewportHeight / measurement.canvas.height;
  const local = (rect: ConstellationScreenRectV638, margin = 0) => ({
    left: (rect.x - measurement.canvas.x - margin) * sx,
    top: (rect.y - measurement.canvas.y - margin) * sy,
    right: (rect.x + rect.width - measurement.canvas.x + margin) * sx,
    bottom: (rect.y + rect.height - measurement.canvas.y + margin) * sy,
  });
  const visible = local(measurement.viewport);
  const bounds = {
    left: Math.max(safe.left, visible.left), top: Math.max(safe.top, visible.top),
    right: Math.min(safe.right, visible.right), bottom: Math.min(safe.bottom, visible.bottom),
  };
  if (bounds.right - bounds.left < 1 || bounds.bottom - bounds.top < 1) return null;
  const blockers = measurement.blockers.filter((entry) => valid(entry.rect)).map((entry) => local(entry.rect, 8))
    .filter((rect) => rect.left < bounds.right && rect.right > bounds.left && rect.top < bounds.bottom && rect.bottom > bounds.top)
    .map((rect) => ({
      left: Math.max(bounds.left, rect.left), top: Math.max(bounds.top, rect.top),
      right: Math.min(bounds.right, rect.right), bottom: Math.min(bounds.bottom, rect.bottom),
    }));
  const xs = [...new Set([bounds.left, bounds.right, ...blockers.flatMap((rect) => [rect.left, rect.right])])].sort((a, b) => a - b);
  let result: typeof bounds | null = null;
  let bestSpaceScore = 0; let bestArea = 0; let bestCenterDistance = Infinity;
  const consider = (left: number, right: number, top: number, bottom: number) => {
    const w = right - left; const h = bottom - top;
    if (w / sx < MIN_MEASURED_FRAME_EDGE_CSS_PX || h / sy < MIN_MEASURED_FRAME_EDGE_CSS_PX) return;
    // The shorter edge controls sphere size; the area also leaves room for
    // long member labels. Penalize thin strips without forcing a square crop.
    const area = w * h; const spaceScore = Math.min(w, h) * area;
    const centerDistance = (left + right - bounds.left - bounds.right) ** 2
      + (top + bottom - bounds.top - bounds.bottom) ** 2;
    if (spaceScore < bestSpaceScore || (spaceScore === bestSpaceScore && area < bestArea)
      || (spaceScore === bestSpaceScore && area === bestArea && centerDistance >= bestCenterDistance)) return;
    bestSpaceScore = spaceScore; bestArea = area; bestCenterDistance = centerDistance;
    result = { left, right, top, bottom };
  };
  for (let leftIndex = 0; leftIndex < xs.length - 1; leftIndex++) {
    for (let rightIndex = leftIndex + 1; rightIndex < xs.length; rightIndex++) {
      const left = xs[leftIndex]; const right = xs[rightIndex];
      const covered = blockers.filter((rect) => rect.left < right && rect.right > left).sort((a, b) => a.top - b.top);
      let top = bounds.top;
      for (const rect of covered) {
        consider(left, right, top, rect.top);
        top = Math.max(top, rect.bottom);
      }
      consider(left, right, top, bounds.bottom);
    }
  }
  return result ? Object.assign({}, safe, result) : null;
}

/** Bounds come from the same catalog anchors as the selected scene geometry. */
export function resolveMainlineAConstellationCameraTargetV638(
  catalogId: string | undefined,
): MainlineAConstellationCameraTargetV638 | null {
  if (!catalogId?.startsWith("constellation:")) return null;
  const figure = selectMainlineAConstellationFigureV638(catalogId, CONSTELLATION_LINES, SKY_TARGET_DISTANCE_SCENE);
  if (figure.status !== "selected") return null;
  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];
  for (let offset = 0; offset < figure.positions.length; offset += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      minimum[axis] = Math.min(minimum[axis], figure.positions[offset + axis]);
      maximum[axis] = Math.max(maximum[axis], figure.positions[offset + axis]);
    }
  }
  const center: [number, number, number] = minimum.map((value, axis) => (value + maximum[axis]) / 2) as [number, number, number];
  let radius = 0;
  for (let offset = 0; offset < figure.positions.length; offset += 3) {
    radius = Math.max(radius, Math.hypot(...center.map((value, axis) => figure.positions[offset + axis] - value)));
  }
  return Number.isFinite(radius) && radius > 0 ? { catalogId, center, radius } : null;
}

export function mainlineAConstellationViewportV638(
  width: number,
  height: number,
  safeRect: AtlasSafeViewportRect | null,
) {
  const safe = normalizeAtlasSafeViewportRect(safeRect, width, height);
  const padding = Math.min(24, (safe.right - safe.left) * 0.08, (safe.bottom - safe.top) * 0.08);
  const inner = { left: safe.left + padding, right: safe.right - padding, top: safe.top + padding, bottom: safe.bottom - padding };
  return {
    safe, inner, padding,
    ndc: {
      left: inner.left / safe.viewportWidth * 2 - 1,
      right: inner.right / safe.viewportWidth * 2 - 1,
      top: 1 - inner.top / safe.viewportHeight * 2,
      bottom: 1 - inner.bottom / safe.viewportHeight * 2,
    },
  };
}

/** Fit an enclosing sphere, including depth, instead of a small stellar proxy. */
export function solveMainlineAConstellationCameraFrameV638(
  target: MainlineAConstellationCameraTargetV638,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  safeRect: AtlasSafeViewportRect,
): AtlasProjectedSubjectMetricsV5 {
  const { safe, inner } = mainlineAConstellationViewportV638(width, height, safeRect);
  const desiredCoverage = 0.88;
  const tangent = Math.tan(THREE.MathUtils.degToRad(camera.getEffectiveFOV()) / 2);
  const fittedTangent = Math.min(inner.right - inner.left, inner.bottom - inner.top) / safe.viewportHeight * tangent * desiredCoverage;
  const distance = Math.max(target.radius + camera.near * 2, target.radius / Math.sin(Math.atan(fittedTangent)));
  return {
    version: "v157-camera-frame-solver-v5", distance, desiredCoverage,
    framingRadiusScene: target.radius,
    projectedDiameterPx: safe.viewportHeight * target.radius / (distance * tangent),
    safeWidthPx: inner.right - inner.left, safeHeightPx: inner.bottom - inner.top,
    // Tiny mobile safe areas may be close to an edge; do not clamp their centre.
    targetNdcX: (inner.left + inner.right) / safe.viewportWidth - 1,
    targetNdcY: 1 - (inner.top + inner.bottom) / safe.viewportHeight,
    clipped: false,
  };
}

export function mainlineAConstellationMaxDistanceV638(frame: AtlasProjectedSubjectMetricsV5): number {
  return Math.max(SKY_TARGET_ZOOM_MAX_DISTANCE_SCENE, frame.distance * 4);
}

export function clampMainlineAConstellationDistanceV638(distance: number, frame: AtlasProjectedSubjectMetricsV5): number {
  return Math.max(frame.distance, Math.min(mainlineAConstellationMaxDistanceV638(frame), Number.isFinite(distance) ? distance : frame.distance));
}
