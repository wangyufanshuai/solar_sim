import * as THREE from "three";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import type { MainlineAChartStarV607 } from "../data/mainlineAConstellationFiguresV607";
import type { mainlineAConstellationFrameStateV638 } from "./mainlineAConstellationSelectionV638";

export const MAINLINE_A_CONSTELLATION_STROKE_V638 = Object.freeze({
  desktop: { lineWidthCssPx: 1.65, anchorDiameterCssPx: 5.5, lineOpacity: 0.7 },
  mobile: { lineWidthCssPx: 1.8, anchorDiameterCssPx: 6, lineOpacity: 0.78 },
});

export function mainlineAConstellationAnchorPositionV638(
  raDeg: number, decDeg: number, radius = 9500,
): [number, number, number] {
  const ra = raDeg * Math.PI / 180;
  const dec = decDeg * Math.PI / 180;
  return [Math.cos(dec) * Math.cos(ra) * radius, Math.sin(dec) * radius, Math.cos(dec) * Math.sin(ra) * radius];
}

/** Private resources: no atlas texture or background star material is mutated. */
export function createMainlineAConstellationPresentationV638(
  positions: Float32Array,
  stars: readonly Pick<MainlineAChartStarV607, "raDeg" | "decDeg">[],
  mobile = false,
) {
  const style = MAINLINE_A_CONSTELLATION_STROKE_V638[mobile ? "mobile" : "desktop"];
  const lineGeometry = new LineSegmentsGeometry();
  if (positions.length) lineGeometry.setPositions(positions);
  else lineGeometry.instanceCount = 0;
  const lineMaterial = new LineMaterial({
    color: "#b9dff6", transparent: true, opacity: style.lineOpacity, depthTest: false, depthWrite: false,
    toneMapped: false, blending: THREE.NormalBlending, worldUnits: false,
  });
  const line = new LineSegments2(lineGeometry, lineMaterial);
  line.frustumCulled = false;
  line.visible = false;
  line.renderOrder = -477;

  const nodeGeometry = new THREE.BufferGeometry();
  const anchors = stars.flatMap((star) => mainlineAConstellationAnchorPositionV638(star.raDeg, star.decDeg));
  nodeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(anchors, 3));
  const nodeMaterial = new THREE.ShaderMaterial({
    transparent: true, opacity: 0.96, depthTest: false, depthWrite: false, toneMapped: false,
    blending: THREE.NormalBlending,
    uniforms: {
      diameterCssPx: { value: style.anchorDiameterCssPx }, pixelRatio: { value: 1 }, uOpacity: { value: 0.96 },
      color: { value: new THREE.Color("#ecf7ff") },
    },
    vertexShader: `
      uniform float diameterCssPx;
      uniform float pixelRatio;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = diameterCssPx * pixelRatio;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float uOpacity;
      void main() {
        float radius = length(gl_PointCoord - vec2(0.5));
        float alpha = (1.0 - smoothstep(0.34, 0.5, radius)) * uOpacity;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
  const nodes = new THREE.Points(nodeGeometry, nodeMaterial);
  nodes.frustumCulled = false;
  nodes.visible = false;
  nodes.renderOrder = -476;
  return { line, nodes, lineGeometry, lineMaterial, nodeGeometry, nodeMaterial,
    drawTracker: createMainlineAConstellationDrawTrackerV638() };
}

export type MainlineAConstellationPresentationV638 = ReturnType<typeof createMainlineAConstellationPresentationV638>;

/** LineMaterial resolution is in CSS pixels; only point size uses render DPR. */
export function updateMainlineAConstellationPresentationV638(
  presentation: MainlineAConstellationPresentationV638,
  options: Readonly<{ width: number; height: number; pixelRatio: number; mobile: boolean; visible: boolean }>,
) {
  const style = MAINLINE_A_CONSTELLATION_STROKE_V638[options.mobile ? "mobile" : "desktop"];
  const validViewport = [options.width, options.height, options.pixelRatio].every((value) => Number.isFinite(value) && value > 0);
  const visible = options.visible && validViewport;
  presentation.line.visible = visible;
  presentation.nodes.visible = visible && presentation.nodeGeometry.getAttribute("position").count > 0;
  presentation.lineMaterial.resolution.set(validViewport ? options.width : 1, validViewport ? options.height : 1);
  presentation.lineMaterial.linewidth = style.lineWidthCssPx;
  // The parent scale tracker runs first at priority -20. Alpha is initialized
  // once above; overwriting it here would erase the fade applied this frame.
  presentation.nodeMaterial.uniforms.diameterCssPx.value = style.anchorDiameterCssPx;
  presentation.nodeMaterial.uniforms.pixelRatio.value = validViewport ? options.pixelRatio : 1;
  return style;
}

type DrawGroupV638 = Readonly<{ start: number; count: number }> | null;

function effectiveDrawCountV638(geometry: THREE.BufferGeometry, group: DrawGroupV638): number {
  const vertices = geometry.getAttribute("position")?.count ?? 0;
  const available = geometry.index?.count ?? vertices;
  if (!Number.isFinite(vertices) || vertices < 1 || !Number.isFinite(available) || available < 1) return 0;
  const ranges = [geometry.drawRange, ...(group ? [group] : [])];
  if (ranges.some(({ start, count }) => !Number.isSafeInteger(start) || start < 0
    || !(count === Infinity || Number.isSafeInteger(count) && count >= 0))) return 0;
  const first = Math.max(0, ...ranges.map(({ start }) => start));
  const end = Math.min(available, ...ranges.map(({ start, count }) => start + count));
  return Math.max(0, end - first);
}

/** A callback alone does not establish a nonempty submission with our material. */
export function mainlineAConstellationDrawEligibleV638(
  presentation: MainlineAConstellationPresentationV638,
  part: "line" | "nodes",
  object: THREE.Object3D,
  drawnGeometry: THREE.BufferGeometry,
  drawnMaterial: THREE.Material,
  group: DrawGroupV638 = null,
): boolean {
  const expected = part === "line" ? presentation.line : presentation.nodes;
  const geometry = part === "line" ? presentation.lineGeometry : presentation.nodeGeometry;
  const material = part === "line" ? presentation.lineMaterial : presentation.nodeMaterial;
  if (object !== expected || !expected.visible || !material.visible || expected.geometry !== geometry || expected.material !== material
    || drawnGeometry !== geometry || drawnMaterial !== material) return false;
  if (part === "nodes") {
    const alpha = presentation.nodeMaterial.uniforms.uOpacity.value;
    return Number.isFinite(alpha) && alpha > 0 && effectiveDrawCountV638(drawnGeometry, group) > 0;
  }
  const starts = geometry.getAttribute("instanceStart")?.count ?? 0;
  const ends = geometry.getAttribute("instanceEnd")?.count ?? 0;
  const instances = Math.min(presentation.lineGeometry.instanceCount, starts, ends);
  return Number.isFinite(presentation.lineMaterial.opacity) && presentation.lineMaterial.opacity > 0
    && Number.isFinite(instances) && instances >= 1 && effectiveDrawCountV638(drawnGeometry, group) >= 3;
}

type ObservedFrameStateV638 = ReturnType<typeof mainlineAConstellationFrameStateV638>;
type DrawProducerV638 = {
  rendered: () => boolean;
  failed: (error: string) => boolean;
  unobserved: () => boolean;
};

/** DOM evidence may report ready only after the live producer accepts the draw. */
export function publishMainlineAConstellationDrawStateV638(options: {
  producer: DrawProducerV638;
  state: ObservedFrameStateV638;
  surface: Pick<HTMLElement, "dataset"> | null;
  code: string | null;
  visibleSegments: number;
  error?: string;
}): ObservedFrameStateV638 {
  const { producer, surface, code, visibleSegments } = options;
  let state = options.state;
  if (state === "ready") {
    if (producer.rendered() !== true) state = "unobserved";
  } else if (state === "failed") {
    producer.failed(options.error || "selected-figure-not-drawable");
  } else {
    producer.unobserved();
  }
  if (surface && code && surface.dataset.mainlineAConstellationSelectedCode === code) {
    surface.dataset.mainlineAConstellationSelectedState = state;
    surface.dataset.mainlineAConstellationSelectedVisibleSegments = String(visibleSegments);
  }
  return state;
}

export function createMainlineAConstellationDrawTrackerV638() {
  let frame = 0;
  let lineFrame = -1;
  let nodeFrame = -1;
  return {
    beginFrame() { frame += 1; return frame; },
    observe(part: "line" | "nodes", observedFrame: number, sameResource: boolean) {
      if (observedFrame !== frame) return false;
      if (!sameResource) {
        if (part === "line") lineFrame = -1;
        else nodeFrame = -1;
        return false;
      }
      if (part === "line") lineFrame = frame;
      else nodeFrame = frame;
      return lineFrame === frame && nodeFrame === frame;
    },
    get frame() { return frame; },
  };
}

export type MainlineAConstellationLabelCandidateV638 = Readonly<{
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}>;
export type MainlineAConstellationLabelBoxV638 = Readonly<{
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}>;

/** Stable screen-space label placement, bounded to the camera's safe rectangle. */
export function layoutMainlineAConstellationLabelsV638(
  candidates: readonly MainlineAConstellationLabelCandidateV638[],
  bounds: Readonly<{ left: number; right: number; top: number; bottom: number }>,
): readonly MainlineAConstellationLabelBoxV638[] {
  const placed: MainlineAConstellationLabelBoxV638[] = [];
  if (!Object.values(bounds).every(Number.isFinite) || bounds.left >= bounds.right || bounds.top >= bounds.bottom) return placed;
  const gap = 5;
  for (const candidate of candidates) {
    const { id, x, y, width, height } = candidate;
    if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) continue;
    const offsets = [
      [10, -height - 7], [-width - 10, -height - 7], [10, 7], [-width - 10, 7],
      [-width / 2, -height - 15], [-width / 2, 15], [16, -height / 2], [-width - 16, -height / 2],
    ];
    for (const [offsetX, offsetY] of offsets) {
      const left = x + offsetX;
      const top = y + offsetY;
      if (left < bounds.left || left + width > bounds.right || top < bounds.top || top + height > bounds.bottom) continue;
      if (placed.some((box) => left < box.left + box.width + gap && left + width + gap > box.left
        && top < box.top + box.height + gap && top + height + gap > box.top)) continue;
      placed.push({ id, left, top, width, height, offsetX, offsetY });
      break;
    }
  }
  return placed;
}

export function mainlineAConstellationStarPriorityV638(star: Pick<MainlineAChartStarV607, "magV">): number {
  return star.magV === null || !Number.isFinite(star.magV) ? Infinity : star.magV;
}

export function mainlineAConstellationChartRadiusV638(magV: number | null): number {
  return magV === null || !Number.isFinite(magV) ? 2 : Math.max(1.4, Math.min(4.5, 3.5 - 0.5 * magV));
}

export function mainlineAConstellationChartLabelV638(text: string, x: number, y: number) {
  const lines: string[] = [];
  const widths: number[] = [];
  let line = "";
  let width = 0;
  for (const character of Array.from(text)) {
    const advance = character.codePointAt(0)! < 128 ? 6.7 : 11;
    if (width + advance > 145 && line) {
      lines.push(line);
      widths.push(width);
      line = "";
      width = 0;
    }
    line += character;
    width += advance;
  }
  if (line) { lines.push(line); widths.push(width); }
  const labelWidth = Math.max(1, ...widths);
  return { lines, left: Math.max(14, Math.min(346 - labelWidth, x + 12)),
    top: Math.max(18, Math.min(236 - Math.max(0, lines.length - 1) * 14, y - 10)), width: labelWidth };
}
