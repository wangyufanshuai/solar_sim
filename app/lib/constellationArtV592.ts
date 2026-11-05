import * as THREE from "three";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import type { LivingConstellationRangeV592 } from "../workers/livingStarfieldV592.worker";
import { CONSTELLATION_RENDER_RADIUS_V592 } from "./livingConstellationsV592";

export const CONSTELLATION_ART_RADIUS_V592 = CONSTELLATION_RENDER_RADIUS_V592 + 0.025;
export const CONSTELLATION_ART_COVERAGE_V592 = Object.freeze({
  admittedCount: CONSTELLATION_LINES.length,
  requiredCount: 88,
  status: "admitted-88-of-88-data-derived-observatory-engraving-primary",
  source: "gaia-anchored-asterism-tangent-plane",
  primaryModel: "deterministic-tangent-plane-celestial-engraving",
  externalIllustrationAssetCount: 0,
  proceduralFallbackAllowed: false,
  observationImageClaimed: false,
  presentationOnly: true,
  scientificPayloadWriteback: false,
} as const);

export type ConstellationEngravingGeometryV592 = Readonly<{
  code: string;
  center: readonly [number, number, number];
  uniqueAnchorCount: number;
  outlinePositions: Float32Array;
  innerOutlinePositions: Float32Array;
  hatchSegmentPositions: Float32Array;
  fillTrianglePositions: Float32Array;
  signature: string;
}>;

type Point2V592 = { x: number; y: number };

function cross2V592(origin: Point2V592, first: Point2V592, second: Point2V592): number {
  return (first.x - origin.x) * (second.y - origin.y) - (first.y - origin.y) * (second.x - origin.x);
}

function convexHullV592(values: readonly Point2V592[]): Point2V592[] {
  const points = [...values].sort((left, right) => left.x - right.x || left.y - right.y);
  if (points.length <= 2) return points;
  const lower: Point2V592[] = [];
  for (const point of points) {
    while (lower.length >= 2 && cross2V592(lower.at(-2)!, lower.at(-1)!, point) <= 0) lower.pop();
    lower.push(point);
  }
  const upper: Point2V592[] = [];
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const point = points[index]!;
    while (upper.length >= 2 && cross2V592(upper.at(-2)!, upper.at(-1)!, point) <= 0) upper.pop();
    upper.push(point);
  }
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

function chaikinClosedV592(values: readonly Point2V592[], iterations = 2): Point2V592[] {
  let current = [...values];
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const next: Point2V592[] = [];
    for (let index = 0; index < current.length; index += 1) {
      const first = current[index]!;
      const second = current[(index + 1) % current.length]!;
      next.push(
        { x: first.x * 0.75 + second.x * 0.25, y: first.y * 0.75 + second.y * 0.25 },
        { x: first.x * 0.25 + second.x * 0.75, y: first.y * 0.25 + second.y * 0.75 },
      );
    }
    current = next;
  }
  return current;
}

function paddedHullV592(values: readonly Point2V592[]): Point2V592[] {
  let hull = convexHullV592(values);
  if (hull.length < 3) {
    const center = values.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
    center.x /= Math.max(1, values.length);
    center.y /= Math.max(1, values.length);
    const halfWidth = Math.max(0.045, Math.max(...values.map((point) => Math.abs(point.x - center.x)), 0));
    const halfHeight = Math.max(0.045, Math.max(...values.map((point) => Math.abs(point.y - center.y)), 0));
    hull = [
      { x: center.x - halfWidth, y: center.y - halfHeight },
      { x: center.x + halfWidth, y: center.y - halfHeight },
      { x: center.x + halfWidth, y: center.y + halfHeight },
      { x: center.x - halfWidth, y: center.y + halfHeight },
    ];
  }
  const centroid = hull.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
  centroid.x /= hull.length;
  centroid.y /= hull.length;
  const expanded = hull.map((point) => {
    const dx = point.x - centroid.x;
    const dy = point.y - centroid.y;
    const radius = Math.hypot(dx, dy) || 1;
    const padding = Math.max(0.028, radius * 0.13);
    return { x: centroid.x + dx * (1 + padding / radius), y: centroid.y + dy * (1 + padding / radius) };
  });
  return chaikinClosedV592(expanded, 2);
}

function signatureV592(code: string, values: readonly Point2V592[]): string {
  let hash = 0x811c9dc5;
  const bytes = `${code}|${values.map((point) => `${point.x.toFixed(6)},${point.y.toFixed(6)}`).join(";")}`;
  for (let index = 0; index < bytes.length; index += 1) {
    hash ^= bytes.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function uniqueDirectionsV592(segments: Float32Array, range: LivingConstellationRangeV592): THREE.Vector3[] {
  const start = range.segmentOffset * 6;
  const values = segments.subarray(start, start + range.segmentCount * 6);
  const unique = new Map<string, THREE.Vector3>();
  for (let index = 0; index + 2 < values.length; index += 3) {
    const direction = new THREE.Vector3(values[index] ?? 0, values[index + 1] ?? 0, values[index + 2] ?? 0).normalize();
    unique.set(`${direction.x.toFixed(6)}:${direction.y.toFixed(6)}:${direction.z.toFixed(6)}`, direction);
  }
  return [...unique.values()];
}

export function buildConstellationEngravingGeometryV592(
  segments: Float32Array,
  range: LivingConstellationRangeV592,
): ConstellationEngravingGeometryV592 {
  if (range.segmentCount < 1) throw new Error(`v592-constellation-art-empty:${range.code}`);
  const directions = uniqueDirectionsV592(segments, range);
  if (directions.length < 2) throw new Error(`v592-constellation-art-anchors:${range.code}`);
  const center = new THREE.Vector3(...range.center).normalize();
  const reference = Math.abs(center.y) > 0.92 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const east = new THREE.Vector3().crossVectors(reference, center).normalize();
  const north = new THREE.Vector3().crossVectors(center, east).normalize();
  const projected = directions.map((direction) => ({
    x: THREE.MathUtils.clamp(Math.atan2(direction.dot(east), direction.dot(center)), -1.35, 1.35),
    y: THREE.MathUtils.clamp(Math.atan2(direction.dot(north), direction.dot(center)), -1.35, 1.35),
  }));
  const outline2 = paddedHullV592(projected);
  const centroid2 = outline2.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
  centroid2.x /= outline2.length;
  centroid2.y /= outline2.length;
  const inner2 = outline2.map((point) => ({
    x: centroid2.x + (point.x - centroid2.x) * 0.86,
    y: centroid2.y + (point.y - centroid2.y) * 0.86,
  }));
  const toSphere = (point: Point2V592) => center.clone()
    .addScaledVector(east, Math.tan(point.x))
    .addScaledVector(north, Math.tan(point.y))
    .normalize()
    .multiplyScalar(CONSTELLATION_ART_RADIUS_V592);
  const centerOnSphere = toSphere(centroid2);
  const outline3 = outline2.map(toSphere);
  const inner3 = inner2.map(toSphere);
  const outlinePositions = new Float32Array(outline3.flatMap((point) => point.toArray()));
  const innerOutlinePositions = new Float32Array(inner3.flatMap((point) => point.toArray()));
  const fillTriangles: number[] = [];
  const hatchSegments: number[] = [];
  for (let index = 0; index < outline3.length; index += 1) {
    const current = outline3[index]!;
    const next = outline3[(index + 1) % outline3.length]!;
    fillTriangles.push(...centerOnSphere.toArray(), ...current.toArray(), ...next.toArray());
    if (index % 2 === 0) hatchSegments.push(...inner3[index]!.toArray(), ...current.toArray());
  }
  return Object.freeze({
    code: range.code,
    center: centerOnSphere.toArray() as [number, number, number],
    uniqueAnchorCount: directions.length,
    outlinePositions,
    innerOutlinePositions,
    hatchSegmentPositions: new Float32Array(hatchSegments),
    fillTrianglePositions: new Float32Array(fillTriangles),
    signature: signatureV592(range.code, projected),
  });
}
