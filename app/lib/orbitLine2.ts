import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { noopRaycast } from "./celestialTextures";
import {
  orbitLineStyleParams,
  type OrbitVisualStylePreset,
} from "./visualStylePresets";

export type OrbitLine2Bundle = {
  line: Line2;
  geometry: LineGeometry;
  material: LineMaterial;
};

export type OrbitLine2ReusableBuffers = {
  positions?: Float32Array;
  colors?: Float32Array;
};

function expoHeadFade01(t: number): number {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  const k = 5.8;
  const den = Math.exp(k) - 1;
  if (den <= 1e-6) return x;
  return (Math.exp(k * x) - 1) / den;
}

export function createOrbitLine2Bundle(options: {
  color: THREE.Color;
  renderOrder?: number;
  maxVertices?: number;
  stylePreset?: OrbitVisualStylePreset;
}): OrbitLine2Bundle {
  const maxV = Math.max(8, options.maxVertices ?? 1200);
  const style = orbitLineStyleParams(options.stylePreset ?? "classicCinematic");
  const geometry = new LineGeometry();
  geometry.setPositions(new Float32Array(maxV * 3));
  geometry.setColors(new Float32Array(maxV * 3));
  const material = new LineMaterial({
    color: options.color,
    linewidth: style.linewidth,
    transparent: true,
    opacity: style.materialOpacity,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    toneMapped: false,
  });
  const line = new Line2(geometry, material);
  line.frustumCulled = false;
  line.renderOrder = options.renderOrder ?? -40;
  // Decorative orbits must not steal raycasts — otherwise Canvas `onPointerMissed`
  // fires and clears selection even when the user clicked “through” a trail toward a body.
  line.raycast = noopRaycast;
  return { line, geometry, material };
}

export function setOrbitLine2Resolution(
  material: LineMaterial,
  width: number,
  height: number,
): void {
  material.resolution.set(Math.max(1, width), Math.max(1, height));
}

export function setOrbitLine2Positions(
  geometry: LineGeometry,
  points: THREE.Vector3[],
  n: number,
  mode: "open" | "closed",
  reusable?: OrbitLine2ReusableBuffers,
): number {
  if (n < 2) {
    geometry.setDrawRange(0, 0);
    return 0;
  }
  const count = mode === "closed" ? n + 1 : n;
  const required = count * 3;
  let pos = reusable?.positions;
  if (!pos || pos.length < required) {
    pos = new Float32Array(required);
    if (reusable) reusable.positions = pos;
  }
  for (let i = 0; i < n; i++) {
    const p = points[i]!;
    const o = i * 3;
    pos[o] = p.x;
    pos[o + 1] = p.y;
    pos[o + 2] = p.z;
  }
  if (mode === "closed") {
    const p = points[0]!;
    const o = n * 3;
    pos[o] = p.x;
    pos[o + 1] = p.y;
    pos[o + 2] = p.z;
  }
  geometry.setPositions(pos.subarray(0, required));
  geometry.setDrawRange(0, count);
  return count;
}

export function setOrbitLine2GradientColors(
  geometry: LineGeometry,
  baseColor: THREE.Color,
  count: number,
  mode: "open" | "closed",
  stylePreset: OrbitVisualStylePreset = "classicCinematic",
  reusable?: OrbitLine2ReusableBuffers,
): void {
  if (count < 2) return;
  const style = orbitLineStyleParams(stylePreset);
  const required = count * 3;
  let colors = reusable?.colors;
  if (!colors || colors.length < required) {
    colors = new Float32Array(required);
    if (reusable) reusable.colors = colors;
  }
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    const k = mode === "open"
      ? THREE.MathUtils.lerp(
          style.openFadeStart,
          style.openFadeEnd,
          expoHeadFade01(Math.pow(t, style.openFadePower)),
        )
      : THREE.MathUtils.lerp(
          style.closedFadeMin,
          style.closedFadeMax,
          0.5 + 0.5 * Math.sin(t * Math.PI * 2),
        );
    const boosted = k * style.brightnessGain;
    const o = i * 3;
    colors[o] = baseColor.r * boosted;
    colors[o + 1] = baseColor.g * boosted;
    colors[o + 2] = baseColor.b * boosted;
  }
  geometry.setColors(colors.subarray(0, required));
}
