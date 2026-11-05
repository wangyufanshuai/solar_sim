import { describe, expect, it, vi } from "vitest";
import { BufferGeometry, Float32BufferAttribute, Group, MeshBasicMaterial, NormalBlending } from "three";
import { acquireCanonicalProducerResourcesV635, createCanonicalProducerHandleV635, estimateCanonicalGeometryBytesV635 } from "./mainlineACanonicalProducerV635";
import { createCanonicalRuntimeRegistryV635 } from "./mainlineACanonicalRuntimeV635";
import { createMainlineAScaleMaterialTrackerV638 } from "./mainlineAScaleMaterialLifecycleV638";
import {
  createMainlineAConstellationDrawTrackerV638,
  createMainlineAConstellationPresentationV638,
  layoutMainlineAConstellationLabelsV638,
  mainlineAConstellationChartLabelV638,
  mainlineAConstellationChartRadiusV638,
  mainlineAConstellationDrawEligibleV638,
  mainlineAConstellationStarPriorityV638,
  publishMainlineAConstellationDrawStateV638,
  updateMainlineAConstellationPresentationV638,
} from "./mainlineAConstellationPresentationV638";

const positions = new Float32Array([0, 0, -20, 4, 0, -20, -2, 2, -20, 2, 2, -20]);
const stars = [{ raDeg: 12, decDeg: 10 }, { raDeg: 15, decDeg: 15 }, { raDeg: 22, decDeg: 20 }];
const viewport = { width: 1280, height: 720, pixelRatio: 1, mobile: false, visible: true };

describe("selected constellation screen-space resources", () => {
  it("constructs independent thick segments and round anchor points without inventing bridge edges", () => {
    const result = createMainlineAConstellationPresentationV638(positions, stars);
    expect(result.line.isLineSegments2).toBe(true);
    expect(result.lineGeometry.getAttribute("instanceStart").count).toBe(2);
    expect(result.lineGeometry.getAttribute("instanceEnd").count).toBe(2);
    expect(result.nodeGeometry.getAttribute("position").count).toBe(3);
    expect(result.lineMaterial.worldUnits).toBe(false);
    expect(result.lineMaterial.blending).toBe(NormalBlending);
    expect(result.line.visible).toBe(false);
    expect(result.nodes.visible).toBe(false);
    expect(estimateCanonicalGeometryBytesV635(result.lineGeometry)).toBeGreaterThan(positions.byteLength);
  });

  it.each([1, 1.5, 2, 3])("keeps line width in CSS pixels and scales point device pixels at DPR %s", (pixelRatio) => {
    const result = createMainlineAConstellationPresentationV638(positions, stars);
    updateMainlineAConstellationPresentationV638(result, { ...viewport, pixelRatio });
    expect(result.lineMaterial.linewidth).toBe(1.65);
    expect(result.lineMaterial.resolution.toArray()).toEqual([1280, 720]);
    expect(result.nodeMaterial.uniforms.pixelRatio.value).toBe(pixelRatio);
    expect(result.nodeMaterial.uniforms.diameterCssPx.value).toBe(5.5);
    expect(result.lineMaterial.worldUnits).toBe(false);
    updateMainlineAConstellationPresentationV638(result, { ...viewport, width: 390, height: 844, pixelRatio, mobile: true });
    expect(result.lineMaterial.linewidth).toBe(1.8);
    expect(result.lineMaterial.resolution.toArray()).toEqual([390, 844]);
    expect(result.nodeMaterial.uniforms.diameterCssPx.value).toBe(6);
  });

  it("updates both visible primitive types and fails closed on an invalid viewport", () => {
    const result = createMainlineAConstellationPresentationV638(positions, stars);
    updateMainlineAConstellationPresentationV638(result, viewport);
    expect(result.line.visible && result.nodes.visible).toBe(true);
    for (const patch of [{ visible: false }, { width: 0 }, { height: Infinity }, { pixelRatio: NaN }]) {
      updateMainlineAConstellationPresentationV638(result, { ...viewport, ...patch });
      expect(result.line.visible || result.nodes.visible).toBe(false);
      expect(result.lineMaterial.opacity).toBe(0.7);
      expect(result.nodeMaterial.uniforms.uOpacity.value).toBe(0.96);
      expect(result.lineMaterial.resolution.toArray().every(Number.isFinite)).toBe(true);
    }
  });

  it.each([false, true])("preserves parent-before-child frame alpha, including resize and re-enable; mobile=%s", (mobile) => {
    const result = createMainlineAConstellationPresentationV638(positions, stars, mobile);
    const base = mobile ? 0.78 : 0.7;
    const root = new Group();
    root.add(result.line, result.nodes);
    const tracker = createMainlineAScaleMaterialTrackerV638(root);
    for (const alpha of [0, 0.5, 0.2, 1, 0, 1]) {
      // Matches AtlasScaleLayerGroup(priority -20), then ConstellationLines(0).
      tracker.update(alpha);
      updateMainlineAConstellationPresentationV638(result, { ...viewport, mobile, width: 900, pixelRatio: 2 });
      expect(result.lineMaterial.opacity).toBeCloseTo(base * alpha);
      expect(result.nodeMaterial.uniforms.uOpacity.value).toBeCloseTo(0.96 * alpha);
      expect(result.lineMaterial.resolution.toArray()).toEqual([900, 720]);
      expect(result.nodeMaterial.uniforms.pixelRatio.value).toBe(2);
      updateMainlineAConstellationPresentationV638(result, { ...viewport, mobile, visible: false });
      expect(result.line.visible || result.nodes.visible).toBe(false);
      expect(result.lineMaterial.opacity).toBeCloseTo(base * alpha);
      updateMainlineAConstellationPresentationV638(result, { ...viewport, mobile });
      expect(result.nodeMaterial.uniforms.uOpacity.value).toBeCloseTo(0.96 * alpha);
    }
    tracker.update(0.25);
    tracker.dispose();
    expect(result.lineMaterial.opacity).toBeCloseTo(base);
    expect(result.nodeMaterial.uniforms.uOpacity.value).toBeCloseTo(0.96);
    expect(result.lineMaterial.depthWrite || result.nodeMaterial.depthWrite).toBe(false);
  });

  it("releases every private material and geometry once while preserving replacement resources", () => {
    const first = createMainlineAConstellationPresentationV638(positions, stars);
    const next = createMainlineAConstellationPresentationV638(positions, stars);
    const keys = ["lineGeometry", "lineMaterial", "nodeGeometry", "nodeMaterial"] as const;
    const disposed = keys.map((key) => vi.spyOn(first[key], "dispose"));
    const untouched = keys.map((key) => vi.spyOn(next[key], "dispose"));
    const released = vi.fn();
    const report = vi.fn();
    const release = acquireCanonicalProducerResourcesV635("constellation-static-test", keys.map((key) => ({ resource: first[key], label: key })), {
      acquire: () => released, report,
    });
    release();
    release();
    for (const spy of disposed) expect(spy).toHaveBeenCalledTimes(1);
    for (const spy of untouched) expect(spy).not.toHaveBeenCalled();
    expect(released).toHaveBeenCalledTimes(4);
    expect(report).not.toHaveBeenCalled();
  });
});

describe("actual selected-draw frame pairing", () => {
  it("requires both primitives in the same frame and refuses stale resources", () => {
    const tracker = createMainlineAConstellationDrawTrackerV638();
    const first = tracker.beginFrame();
    expect(tracker.observe("line", first, true)).toBe(false);
    expect(tracker.observe("nodes", first, false)).toBe(false);
    const second = tracker.beginFrame();
    expect(tracker.observe("nodes", first, true)).toBe(false);
    expect(tracker.observe("nodes", second, true)).toBe(false);
    expect(tracker.observe("line", second, true)).toBe(true);
    tracker.beginFrame();
    expect(tracker.observe("line", tracker.frame, true)).toBe(false);
  });
  it("withdraws a prior callback pair when the actual material or geometry is rejected", () => {
    const tracker = createMainlineAConstellationDrawTrackerV638();
    const frame = tracker.beginFrame();
    tracker.observe("line", frame, true);
    expect(tracker.observe("nodes", frame, true)).toBe(true);
    expect(tracker.observe("line", frame, false)).toBe(false);
    expect(tracker.observe("nodes", frame, true)).toBe(false);
  });
});

describe("actual callback geometry, material and nonempty draw ranges", () => {
  const prepared = () => {
    const result = createMainlineAConstellationPresentationV638(positions, stars);
    updateMainlineAConstellationPresentationV638(result, viewport);
    return result;
  };
  const eligible = (result: ReturnType<typeof prepared>, part: "line" | "nodes") => {
    const object = part === "line" ? result.line : result.nodes;
    return mainlineAConstellationDrawEligibleV638(result, part, object, object.geometry, object.material);
  };
  it("accepts both actual nonempty resources and rejects a renderer override material", () => {
    const result = prepared();
    expect(eligible(result, "line")).toBe(true);
    expect(eligible(result, "nodes")).toBe(true);
    const override = new MeshBasicMaterial();
    expect(mainlineAConstellationDrawEligibleV638(result, "line", result.line, result.lineGeometry, override)).toBe(false);
    expect(mainlineAConstellationDrawEligibleV638(result, "nodes", result.nodes, result.nodeGeometry, override)).toBe(false);
    expect(mainlineAConstellationDrawEligibleV638(result, "line", result.line, new BufferGeometry(), result.lineMaterial)).toBe(false);
    override.dispose();
  });
  it.each([0, NaN])("rejects a line callback with instanceCount=%s", (count) => {
    const result = prepared();
    result.lineGeometry.instanceCount = count;
    expect(eligible(result, "line")).toBe(false);
  });
  it.each(["line", "nodes"] as const)("rejects %s empty, clipped-out or invalid draw ranges", (part) => {
    const result = prepared();
    const geometry = part === "line" ? result.lineGeometry : result.nodeGeometry;
    for (const [start, count] of [[0, 0], [99999, 1], [-1, 3], [NaN, 4]]) {
      geometry.setDrawRange(start, count);
      expect(eligible(result, part)).toBe(false);
    }
    geometry.setDrawRange(0, Infinity);
    const object = part === "line" ? result.line : result.nodes;
    expect(mainlineAConstellationDrawEligibleV638(result, part, object, geometry, object.material, { start: 0, count: 0 })).toBe(false);
  });
  it("rejects incomplete line triangles and empty instance or point attributes", () => {
    const result = prepared();
    result.lineGeometry.setDrawRange(0, 2);
    expect(eligible(result, "line")).toBe(false);
    result.lineGeometry.setDrawRange(0, Infinity);
    result.lineGeometry.deleteAttribute("instanceStart");
    expect(eligible(result, "line")).toBe(false);
    result.nodeGeometry.setAttribute("position", new Float32BufferAttribute([], 3));
    expect(eligible(result, "nodes")).toBe(false);
  });
  it.each([0, NaN])("rejects invisible line and point shader alpha=%s", (alpha) => {
    const result = prepared();
    result.lineMaterial.opacity = alpha;
    result.nodeMaterial.uniforms.uOpacity.value = alpha;
    expect(eligible(result, "line")).toBe(false);
    expect(eligible(result, "nodes")).toBe(false);
  });
  it.each(["line", "nodes"] as const)("withdraws eligibility when %s material is excluded from the render list", (part) => {
    const result = prepared();
    const material = part === "line" ? result.lineMaterial : result.nodeMaterial;
    expect(eligible(result, part)).toBe(true);
    material.visible = false;
    expect(eligible(result, part)).toBe(false);
    material.visible = true;
    expect(eligible(result, part)).toBe(true);
  });
});

describe("DOM readiness follows the actual canonical producer acceptance", () => {
  const setup = () => {
    const registry = createCanonicalRuntimeRegistryV635(() => "2026-09-28T04:00:00.000Z");
    const target = { kind: "constellation", id: "Cyg", route: "mainline-a-constellation-lines", assetHash: null } as const;
    const create = () => createCanonicalProducerHandleV635(target, { read: registry.read, publish: registry.publish });
    const surface = { dataset: { mainlineAConstellationSelectedCode: "Cyg", mainlineAConstellationSelectedState: "awaiting-draw" } };
    const publish = (producer: ReturnType<typeof create>) => publishMainlineAConstellationDrawStateV638({
      producer, surface, state: "ready", code: "Cyg", visibleSegments: 4,
    });
    return { registry, create, surface, publish };
  };
  it("requires activation and refuses to revive a released lease", () => {
    const { registry, create, surface, publish } = setup();
    const producer = create();
    expect(publish(producer)).toBe("unobserved");
    expect(surface.dataset.mainlineAConstellationSelectedState).toBe("unobserved");
    expect(registry.read().selection).toBeNull();
    const release = producer.activate();
    expect(publish(producer)).toBe("ready");
    expect(registry.read().selection?.loading).toBe("ready");
    release();
    expect(publish(producer)).toBe("unobserved");
    expect(surface.dataset.mainlineAConstellationSelectedState).toBe("unobserved");
    expect(registry.read().selection).toBeNull();
  });
  it("rejects an older equal-target lease without mutating the newer registry generation", () => {
    const { registry, create, surface, publish } = setup();
    const old = create(); old.activate(); publish(old);
    const current = create(); current.activate();
    const before = registry.read();
    expect(publish(old)).toBe("unobserved");
    expect(surface.dataset.mainlineAConstellationSelectedState).toBe("unobserved");
    expect(registry.read()).toEqual(before);
    expect(publish(current)).toBe("ready");
  });
  it("withdraws stale DOM readiness after a cleanup failure rejects the draw", () => {
    const { registry, create, surface, publish } = setup();
    const producer = create(); producer.activate(); publish(producer);
    registry.reportCleanupFailure("selected-node-dispose-failed");
    const before = registry.read();
    expect(publish(producer)).toBe("unobserved");
    expect(surface.dataset.mainlineAConstellationSelectedState).toBe("unobserved");
    expect(registry.read()).toEqual(before);
    expect(registry.read().cleanupErrors).toEqual(["selected-node-dispose-failed"]);
  });
  it("does not overwrite the marker belonging to a different displayed target", () => {
    const { create, surface, publish } = setup();
    surface.dataset.mainlineAConstellationSelectedCode = "Ori";
    surface.dataset.mainlineAConstellationSelectedState = "ready";
    expect(publish(create())).toBe("unobserved");
    expect(surface.dataset).toEqual({ mainlineAConstellationSelectedCode: "Ori", mainlineAConstellationSelectedState: "ready" });
  });
});

describe("readable bounded member labels", () => {
  it("finds nonoverlapping placements for the close Gemini pair and keeps them in the safe rectangle", () => {
    const candidates = [
      { id: "title", x: 180, y: 115, width: 120, height: 28 },
      { id: "castor", x: 150, y: 165, width: 70, height: 22 },
      { id: "pollux", x: 160, y: 170, width: 70, height: 22 },
      { id: "alhena", x: 225, y: 260, width: 70, height: 22 },
    ];
    const boxes = layoutMainlineAConstellationLabelsV638(candidates, { left: 20, right: 370, top: 70, bottom: 620 });
    expect(boxes).toHaveLength(4);
    for (const box of boxes) {
      expect(box.left).toBeGreaterThanOrEqual(20);
      expect(box.top).toBeGreaterThanOrEqual(70);
      expect(box.left + box.width).toBeLessThanOrEqual(370);
      for (const other of boxes) {
        if (box.id === other.id) continue;
        const overlap = box.left < other.left + other.width && box.left + box.width > other.left
          && box.top < other.top + other.height && box.top + box.height > other.top;
        expect(overlap).toBe(false);
      }
    }
  });

  it("hides impossible or invalid labels rather than placing them over a clipped panel", () => {
    const bounds = { left: 20, right: 100, top: 20, bottom: 100 };
    const labels = [{ id: "wide", x: 50, y: 50, width: 300, height: 22 }, { id: "invalid", x: NaN, y: 50, width: 20, height: 22 }];
    expect(layoutMainlineAConstellationLabelsV638(labels, bounds)).toEqual([]);
    expect(layoutMainlineAConstellationLabelsV638(labels, { ...bounds, right: 10 })).toEqual([]);
  });

  it("never treats absent V magnitude as zero or as the brightest chart star", () => {
    expect(mainlineAConstellationStarPriorityV638({ magV: null })).toBe(Infinity);
    expect(mainlineAConstellationStarPriorityV638({ magV: 1.2 })).toBe(1.2);
    expect(mainlineAConstellationChartRadiusV638(null)).toBe(2);
    expect(mainlineAConstellationChartRadiusV638(NaN)).toBe(2);
    expect(mainlineAConstellationChartRadiusV638(-20)).toBe(4.5);
    expect(mainlineAConstellationChartRadiusV638(20)).toBe(1.4);
  });

  it("wraps a component-qualified SVG label inside the chart without dropping its identity", () => {
    const name = "天琴座 ε¹ / HR7051 / 目录组件A";
    for (const [x, y] of [[330, 30], [30, 230], [180, 140]]) {
      const label = mainlineAConstellationChartLabelV638(name, x, y);
      expect(label.lines.join("")).toBe(name);
      expect(label.left).toBeGreaterThanOrEqual(14);
      expect(label.left + label.width).toBeLessThanOrEqual(346);
      expect(label.top).toBeGreaterThanOrEqual(18);
      expect(label.top + (label.lines.length - 1) * 14).toBeLessThanOrEqual(236);
    }
  });
});
