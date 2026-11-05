import { describe, expect, it } from "vitest";
import { MAINLINE_A1_IAU_BOUNDARIES } from "../data/mainlineAConstellationBoundaryDataV607";
import { MAINLINE_A_CURRENT_IAU_BOUNDARIES } from "../data/mainlineAConstellationCurrentBoundaryDataV607";
import { MAINLINE_A_CONSTELLATION_FIGURES_V607 } from "../data/mainlineAConstellationFiguresV607";
import {
  mainlineAConstellationAppearanceM4, mainlineAConstellationBoundaryDashScaleM4,
  resolveMainlineAConstellationAppearanceM4,
} from "./mainlineAConstellationAppearanceM4";

const codes = ["Ori", "UMa", "Cas", "Sco", "Cyg", "Gem", "Leo", "Cru", "Lyr", "Aql", "Tau", "Sgr"];

describe("M4 constellation appearance over existing source data", () => {
  it.each(codes)("resolves only %s's original boundary ring and leaves all anchors and segments intact", (code) => {
    const before = JSON.stringify(MAINLINE_A_CONSTELLATION_FIGURES_V607);
    const source = MAINLINE_A_CURRENT_IAU_BOUNDARIES[code] ?? MAINLINE_A1_IAU_BOUNDARIES[code];
    const beforeBoundary = JSON.stringify(source);
    const byCode = resolveMainlineAConstellationAppearanceM4(code)!;
    const byCatalog = resolveMainlineAConstellationAppearanceM4(`constellation:${code}`, true)!;
    expect(byCode.boundary).toBe(source);
    expect(byCatalog.boundary).toBe(source);
    expect(byCode.catalogId).toBe(`constellation:${code}`);
    expect(byCode.presentationOnly).toBe(true);
    expect(byCode.scientificPayloadWriteback).toBe(false);
    expect(new Set(byCode.boundary.map((vertex) => vertex.iauCode))).toEqual(new Set([code.toUpperCase()]));
    expect(byCode.boundary.length).toBeGreaterThan(2);
    expect(JSON.stringify(source)).toBe(beforeBoundary);
    expect(JSON.stringify(MAINLINE_A_CONSTELLATION_FIGURES_V607)).toBe(before);
  });

  it.each(["", "ori", "ORI", "constellation:ori", "constellation:Ori:more", "Ori ", "nearby-star:Ori", "nebula:m42", "constructor", "__proto__", "And"])(
    "does not manufacture an admitted boundary for %j", (id) => {
      expect(resolveMainlineAConstellationAppearanceM4(id)).toBeNull();
    },
  );

  it("distinguishes a quiet dashed boundary from the stronger solid figure at both viewport sizes", () => {
    for (const mobile of [false, true]) {
      const style = mainlineAConstellationAppearanceM4(mobile);
      expect(style.boundaryOpacity).toBeLessThan(style.lineOpacity);
      expect(style.boundaryWidthCssPx).toBeLessThan(style.lineWidthCssPx);
      expect(style.boundaryDashCssPx).toBeGreaterThan(0);
      expect(style.boundaryGapCssPx).toBeGreaterThan(0);
      expect(style.boundaryColor).not.toBe(style.lineColor);
      expect(Object.isFrozen(style)).toBe(true);
    }
  });

  it("keeps dash conversion proportional to CSS pixels rather than render DPR", () => {
    const atOne = mainlineAConstellationBoundaryDashScaleM4(720, 2, 1000);
    expect(atOne).toBeCloseTo(0.72);
    expect(mainlineAConstellationBoundaryDashScaleM4(1440, 2, 1000)).toBeCloseTo(atOne * 2);
    expect(mainlineAConstellationBoundaryDashScaleM4(720, 2, 2000)).toBeCloseTo(atOne / 2);
    for (const bad of [0, -1, NaN, Infinity]) {
      expect(mainlineAConstellationBoundaryDashScaleM4(bad, 2, 1000)).toBe(0);
      expect(mainlineAConstellationBoundaryDashScaleM4(720, bad, 1000)).toBe(0);
      expect(mainlineAConstellationBoundaryDashScaleM4(720, 2, bad)).toBe(0);
    }
  });
});
