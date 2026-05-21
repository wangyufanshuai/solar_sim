import * as THREE from "three";
import { Line2, LineGeometry, LineMaterial } from "three-stdlib";

export type HairlineOrbitLineBundle = {
  root: THREE.Group;
  coreLine: Line2;
  glowLine: Line2;
  geometry: LineGeometry;
  coreMaterial: LineMaterial;
  glowMaterial: LineMaterial;
};

export function createHairlineOrbitLineBundle(
  color: THREE.Color,
  options?: {
    linewidthPx?: number;
    glowWidthPx?: number;
    renderOrder?: number;
  }
): HairlineOrbitLineBundle {
  const root = new THREE.Group();
  const geometry = new LineGeometry();

  const coreMaterial = new LineMaterial({
    linewidth: options?.linewidthPx ?? 0.62,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    dashed: false,
    blending: THREE.NormalBlending,
  });
  coreMaterial.color.copy(color);

  const glowMaterial = new LineMaterial({
    linewidth:
      options?.glowWidthPx ??
      Math.max((options?.linewidthPx ?? 0.62) * 2.0, 1.25),
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    dashed: false,
    blending: THREE.AdditiveBlending,
  });
  glowMaterial.color.copy(color).lerp(new THREE.Color("#fff7dc"), 0.22);

  const glowLine = new Line2(geometry, glowMaterial);
  glowLine.frustumCulled = false;
  glowLine.renderOrder = options?.renderOrder ?? -41;

  const coreLine = new Line2(geometry, coreMaterial);
  coreLine.frustumCulled = false;
  coreLine.renderOrder = (options?.renderOrder ?? -40) + 1;

  root.add(glowLine);
  root.add(coreLine);
  root.renderOrder = options?.renderOrder ?? -40;

  return { root, coreLine, glowLine, geometry, coreMaterial, glowMaterial };
}

export function setHairlineOrbitBundleOpacity(
  bundle: HairlineOrbitLineBundle,
  opacity: number
): void {
  bundle.coreMaterial.opacity = opacity;
  bundle.glowMaterial.opacity = THREE.MathUtils.clamp(opacity * 0.34, 0, 0.32);
}

export function setLineGeometryFromVectors(
  bundle: HairlineOrbitLineBundle,
  points: THREE.Vector3[],
  n: number,
  closed: boolean,
  flatScratch: Float32Array
): void {
  const { geometry, coreLine, glowLine } = bundle;
  if (n < 2) {
    geometry.setPositions([0, 0, 0, 0, 0, 0]);
    coreLine.computeLineDistances();
    glowLine.computeLineDistances();
    return;
  }

  const m = closed ? n + 1 : n;
  let o = 0;
  for (let i = 0; i < n; i++) {
    const p = points[i]!;
    flatScratch[o++] = p.x;
    flatScratch[o++] = p.y;
    flatScratch[o++] = p.z;
  }
  if (closed) {
    const p = points[0]!;
    flatScratch[o++] = p.x;
    flatScratch[o++] = p.y;
    flatScratch[o++] = p.z;
  }

  geometry.setPositions(flatScratch.subarray(0, m * 3));
  coreLine.computeLineDistances();
  glowLine.computeLineDistances();
}
