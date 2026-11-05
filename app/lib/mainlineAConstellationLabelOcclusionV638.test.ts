import { describe, expect, it } from "vitest";
import {
  constellationSegmentOverlapsRectV638,
  layoutMainlineAConstellationOcclusionV638,
  type ConstellationDomMeasurementV638,
  type ConstellationLabelCandidateV638,
  type ConstellationProjectedNodeV638,
} from "./mainlineAConstellationLabelOcclusionV638";

const bounds = { x: 0, y: 0, width: 800, height: 500 };
const measured = (blockers: ConstellationDomMeasurementV638["blockers"] = []): ConstellationDomMeasurementV638 => ({
  canvas: { x: 0, y: 0, width: 800, height: 500 },
  viewport: { x: 0, y: 0, width: 800, height: 500 },
  blockers,
});
const candidate = (id: string, x: number, y: number, width = 48, height = 22): ConstellationLabelCandidateV638 => ({
  id, x, y, width, height,
});
const node = (id: string, x: number, y: number, radius = 7): ConstellationProjectedNodeV638 => ({ id, x, y, radius });

describe("V638 measured constellation label and figure occlusion", () => {
  it("keeps an unobserved layout explicitly unobserved and does not claim a label is ready", () => {
    const result = layoutMainlineAConstellationOcclusionV638({
      requiredIds: ["title", "sadr"],
      candidates: [candidate("title", 400, 250), candidate("sadr", 420, 260)],
      measurement: null,
      bounds,
      nodes: [node("sadr", 420, 260)],
      segments: [],
    });
    expect(result.status).toBe("unobserved");
    expect(result.labelStatus).toBe("unobserved");
    expect(result.figureStatus).toBe("unobserved");
    expect(result.placements).toEqual([]);
    expect(result.pending.map((entry) => entry.id)).toEqual(["title", "sadr"]);
  });

  it("places all labels in an open canvas and reports a measured-visible figure", () => {
    const result = layoutMainlineAConstellationOcclusionV638({
      requiredIds: ["title", "sadr", "gienah"],
      candidates: [candidate("title", 400, 250), candidate("sadr", 200, 200), candidate("gienah", 600, 300)],
      measurement: measured(),
      bounds,
      nodes: [node("sadr", 200, 200), node("gienah", 600, 300)],
      segments: [{ ax: 250, ay: 200, bx: 550, by: 300 }],
    });
    expect(result.status).toBe("ready");
    expect(result.labelStatus).toBe("ready");
    expect(result.figureStatus).toBe("measured-visible");
    expect(result.pending).toEqual([]);
    expect(result.placements.map((entry) => entry.id).sort()).toEqual(["gienah", "sadr", "title"]);
  });

  it("keeps an occluded node pending even when its label can be moved to a free area", () => {
    const result = layoutMainlineAConstellationOcclusionV638({
      requiredIds: ["title", "gacrux"],
      candidates: [candidate("title", 300, 250), candidate("gacrux", 130, 82)],
      measurement: measured([{ id: "navigation", kind: "navigation", rect: { x: 0, y: 0, width: 800, height: 105 } }]),
      bounds,
      nodes: [node("gacrux", 130, 82)],
      segments: [{ ax: 130, ay: 82, bx: 130, by: 300 }],
    });
    expect(result.occludedNodeIds).toEqual(["gacrux"]);
    expect(result.figureStatus).toBe("pending");
    expect(result.status).toBe("pending");
    expect(result.placements.some((entry) => entry.id === "gacrux")).toBe(true);
  });

  it("detects a line crossing a blocker even if both endpoints are outside", () => {
    const rect = { x: 300, y: 180, width: 200, height: 100 };
    expect(constellationSegmentOverlapsRectV638({ ax: 100, ay: 230, bx: 700, by: 230 }, rect)).toBe(true);
    expect(constellationSegmentOverlapsRectV638({ ax: 100, ay: 100, bx: 700, by: 100 }, rect)).toBe(false);
    expect(constellationSegmentOverlapsRectV638({ ax: 350, ay: 220, bx: 350, by: 220 }, rect)).toBe(true);
    expect(constellationSegmentOverlapsRectV638({ ax: NaN, ay: 0, bx: 1, by: 1 }, rect)).toBe(false);
  });

  it("marks a title pending when every candidate placement would cross the measured HUD or a guide segment", () => {
    const result = layoutMainlineAConstellationOcclusionV638({
      requiredIds: ["title"],
      candidates: [candidate("title", 400, 250, 240, 100)],
      measurement: measured([{ id: "hud", kind: "topline", rect: { x: 0, y: 0, width: 800, height: 500 } }]),
      bounds,
      nodes: [],
      segments: [],
    });
    expect(result.status).toBe("pending");
    expect(result.labelStatus).toBe("pending");
    expect(result.pending).toEqual([{ id: "title", reason: "no-space" }]);
    expect(result.figureStatus).toBe("measured-visible");
  });

  it("does not abbreviate a long identity; it reports no-space when the measured canvas is narrower", () => {
    const result = layoutMainlineAConstellationOcclusionV638({
      requiredIds: ["title", "epsilon1_lyr"],
      candidates: [candidate("title", 40, 40, 310, 22), candidate("epsilon1_lyr", 400, 40, 340, 28)],
      measurement: measured(),
      bounds: { x: 0, y: 0, width: 320, height: 120 },
      nodes: [node("epsilon1_lyr", 160, 80)],
      segments: [],
    });
    expect(result.pending).toContainEqual({ id: "epsilon1_lyr", reason: "no-space" });
    expect(result.placements.find((entry) => entry.id === "epsilon1_lyr")).toBeUndefined();
  });

  it("reports missing anchors as unprojected and keeps other measured labels usable", () => {
    const result = layoutMainlineAConstellationOcclusionV638({
      requiredIds: ["title", "missing", "present"],
      candidates: [candidate("title", 300, 300), candidate("present", 500, 300)],
      measurement: measured(),
      bounds,
      nodes: [node("present", 500, 300)],
      segments: [],
    });
    expect(result.unprojectedNodeIds).toEqual(["missing"]);
    expect(result.figureStatus).toBe("pending");
    expect(result.placements.some((entry) => entry.id === "present")).toBe(true);
  });

  it("reports clipped anchors independently from label placement", () => {
    const result = layoutMainlineAConstellationOcclusionV638({
      requiredIds: ["title", "edge"],
      candidates: [candidate("title", 300, 250), candidate("edge", 5, 5)],
      measurement: measured(),
      bounds,
      nodes: [node("edge", 2, 2, 7)],
      segments: [],
    });
    expect(result.clippedNodeIds).toEqual(["edge"]);
    expect(result.figureStatus).toBe("pending");
    expect(result.status).toBe("pending");
  });

  it("uses measured visual viewport intersection rather than assuming the canvas is fully visible", () => {
    const result = layoutMainlineAConstellationOcclusionV638({
      requiredIds: ["title", "offscreen"],
      candidates: [candidate("title", 500, 400), candidate("offscreen", 500, 400)],
      measurement: { ...measured(), viewport: { x: 0, y: 0, width: 360, height: 240 } },
      bounds,
      nodes: [node("offscreen", 500, 400)],
      segments: [],
    });
    expect(result.clippedNodeIds).toEqual(["offscreen"]);
    expect(result.figureStatus).toBe("pending");
    expect(result.status).toBe("pending");
  });
});
