import { Children, createElement, isValidElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { MAINLINE_A_CONSTELLATION_FIGURES_V607 } from "../data/mainlineAConstellationFiguresV607";
import { atlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { createFloatingOrigin } from "../lib/floatingOrigin";
import { mainlineAConstellationAppearanceM4, resolveMainlineAConstellationAppearanceM4 } from "../lib/mainlineAConstellationAppearanceM4";
import { fitSkyChartV607 } from "../lib/skyChartProjectionV607";
import ConstellationLines from "./ConstellationLines";
import MainlineAConstellationChartV607 from "./MainlineAConstellationChartV607";

const harness = vi.hoisted(() => ({
  width: 1280, height: 720, showBoundary: false, stateIndex: 0,
  frames: [] as Array<(state: unknown) => void>,
}));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useMemo: (factory: () => unknown) => factory(),
  useRef: (initial: unknown) => ({ current: initial }),
  useId: () => "m4-test-id",
  useState: (initial: unknown) => {
    const value = typeof initial === "function" ? initial() : initial;
    return [harness.stateIndex++ === 0 && typeof value === "boolean" ? harness.showBoundary : value, vi.fn()];
  },
  useEffect: vi.fn(),
}));
vi.mock("@react-three/fiber", () => ({
  useFrame: (frame: (state: unknown) => void) => { harness.frames.push(frame); },
  useThree: (selector: (state: { size: { width: number; height: number } }) => unknown) =>
    selector({ size: { width: harness.width, height: harness.height } }),
}));
vi.mock("../lib/deepSkyCatalogRuntimeV255", () => ({ getAsterismsV255Sync: () => [], loadAsterismsV255: async () => [] }));
vi.mock("../lib/mainlineACanonicalProducerV635", () => ({
  useCanonicalDisposableV635: vi.fn(),
  useCanonicalProducerV635: () => ({ rendered: () => true, failed: () => true, unobserved: () => true }),
}));

type NodeProps = {
  object?: THREE.Object3D;
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material;
  ref?: { current: THREE.Object3D | null };
  visible?: boolean;
  onUpdate?: (object: THREE.LineSegments) => void;
};
const created: THREE.Object3D[] = [];
const codes = ["Ori", "UMa", "Cas", "Sco", "Cyg", "Gem", "Leo", "Cru", "Lyr", "Aql", "Tau", "Sgr"];
let priorBand = atlasRuntimeStore.getSnapshot().scaleBand;
beforeEach(() => {
  priorBand = atlasRuntimeStore.getSnapshot().scaleBand;
  atlasRuntimeStore.setScaleBand("stellar");
  harness.width = 1280; harness.height = 720; harness.showBoundary = false; harness.stateIndex = 0;
  harness.frames.length = 0;
});
afterEach(() => {
  for (const object of created.splice(0) as Array<THREE.LineSegments | THREE.Points>) {
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
  }
  atlasRuntimeStore.setScaleBand(priorBand);
});

/** Real Three geometry/material + production frame callback; no GPU draw claim. */
function mountScene(id: string, options: Partial<Parameters<typeof ConstellationLines>[0]> = {}) {
  const output = ConstellationLines({ floatingOriginRef: { current: createFloatingOrigin() },
    selectedCatalogId: id, asterismEnabled: false, ...options });
  const nodes = Children.toArray(output.props.children).filter(isValidElement) as ReactElement<NodeProps>[];
  const objects = nodes.map((node) => {
    const object = node.props.object ?? (node.type === "points"
      ? new THREE.Points(node.props.geometry, node.props.material)
      : new THREE.LineSegments(node.props.geometry, node.props.material));
    if (node.props.ref) node.props.ref.current = object;
    if (node.props.visible !== undefined) object.visible = node.props.visible;
    node.props.onUpdate?.(object as THREE.LineSegments);
    created.push(object);
    return object;
  });
  const frame = harness.frames.at(-1)!;
  const camera = new THREE.PerspectiveCamera(52, harness.width / harness.height, 0.01, 50000);
  camera.position.set(1000, 500, 1500); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  const advance = () => frame({ camera, clock: { elapsedTime: 0 }, gl: { getPixelRatio: () => 2 } });
  advance();
  return { objects, advance, boundary: objects[3] as THREE.LineSegments<THREE.BufferGeometry, THREE.LineDashedMaterial> };
}

describe("M4 shared constellation scene and chart", () => {
  it.each(codes)("uses only %s's original closed IAU ring in the selected scene", (code) => {
    const before = JSON.stringify(MAINLINE_A_CONSTELLATION_FIGURES_V607);
    const scene = mountScene(`constellation:${code}`);
    const source = resolveMainlineAConstellationAppearanceM4(code)!;
    const positions = scene.boundary.geometry.getAttribute("position");
    const expected = source.boundary.flatMap((vertex, index) => [vertex, source.boundary[(index + 1) % source.boundary.length]])
      .flatMap(({ raDeg, decDeg }) => {
        const ra = raDeg * Math.PI / 180, dec = decDeg * Math.PI / 180;
        return [Math.cos(dec) * Math.cos(ra) * 9500, Math.sin(dec) * 9500, Math.cos(dec) * Math.sin(ra) * 9500];
      });
    expect([...positions.array]).toEqual([...new Float32Array(expected)]);
    expect(positions.count).toBe(source.boundary.length * 2);
    expect(scene.boundary.visible).toBe(true);
    expect(scene.boundary.material.isLineDashedMaterial).toBe(true);
    expect(scene.boundary.geometry.getAttribute("lineDistance").count).toBe(positions.count);
    expect(scene.boundary.material.scale).toBeGreaterThan(0);
    expect(scene.boundary.material.color.getHexString()).toBe(source.style.boundaryColor.slice(1));
    expect(JSON.stringify(MAINLINE_A_CONSTELLATION_FIGURES_V607)).toBe(before);
  });

  it.each(["", "nearby-star:betelgeuse", "constellation:And", "constellation:ori", "Ori"])(
    "has no visible or populated boundary for nonselected canonical state %j", (id) => {
      const { boundary } = mountScene(id);
      expect(boundary.visible).toBe(false);
      expect(boundary.geometry.getAttribute("position").count).toBe(0);
    },
  );

  it("keeps one selected mobile boundary while suppressing hidden, close-up and solar layers", () => {
    harness.width = 390; harness.height = 844;
    expect(mountScene("constellation:Ori", { qualityTier: "mobile" }).boundary.visible).toBe(true);
    expect(mountScene("constellation:Ori", { enabled: false }).boundary.visible).toBe(false);
    expect(mountScene("constellation:Ori", { cinematicCameraProfile: "selected-body-cinematic" }).boundary.visible).toBe(false);
    atlasRuntimeStore.setScaleBand("solar");
    expect(mountScene("constellation:Ori").boundary.visible).toBe(false);
  });

  it.each(codes)("retains every %s chart endpoint and keyboard anchor with the scene's solid line color", (code) => {
    harness.stateIndex = 0;
    const html = renderToStaticMarkup(createElement(MainlineAConstellationChartV607, { code }));
    const figure = MAINLINE_A_CONSTELLATION_FIGURES_V607[code];
    const projection = fitSkyChartV607(figure.stars);
    const points = new Map(figure.stars.map((star) => [star.id, projection.project(star)]));
    for (const [a, b] of figure.segments) {
      const start = points.get(a)!, end = points.get(b)!;
      expect(html).toContain(`x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"`);
    }
    const style = mainlineAConstellationAppearanceM4();
    expect(html).toContain(`stroke="${style.lineColor}" stroke-width="${style.lineWidthCssPx}" stroke-opacity="${style.lineOpacity}"`);
    expect((html.match(/data-mainline-a-chart-star=/g) ?? [])).toHaveLength(figure.stars.length);
    expect((html.match(/role="button"/g) ?? [])).toHaveLength(figure.stars.length);
    expect(html).not.toContain("data-mainline-a-chart-boundary-code");
    expect(html).toContain("实线是星座图示，虚线是 IAU 边界");
  });

  it.each(codes)("shows %s's dashed chart boundary on explicit toggle without other boundary rings", (code) => {
    harness.showBoundary = true; harness.stateIndex = 0;
    const html = renderToStaticMarkup(createElement(MainlineAConstellationChartV607, { code }));
    const appearance = resolveMainlineAConstellationAppearanceM4(code)!;
    const projection = fitSkyChartV607([...MAINLINE_A_CONSTELLATION_FIGURES_V607[code].stars, ...appearance.boundary]);
    const points = appearance.boundary.map((point) => {
      const { x, y } = projection.project(point); return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ");
    expect(html).toContain(`points="${points}"`);
    expect(html).toContain(`data-mainline-a-chart-boundary-code="${code}"`);
    expect((html.match(/<polygon/g) ?? [])).toHaveLength(1);
    expect(html).toContain(`stroke-dasharray="${appearance.style.boundaryDashCssPx} ${appearance.style.boundaryGapCssPx}"`);
    expect(html).toContain('vector-effect="non-scaling-stroke"');
  });
});
