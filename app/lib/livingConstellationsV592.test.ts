import { describe, expect, it } from "vitest";
import {
  CONSTELLATION_FOCUS_CODE_BY_TARGET_V592,
  CONSTELLATION_NAME_COVERAGE_V592,
  CONSTELLATION_RENDER_RADIUS_V592,
  constellationFocusCodeV592,
  constellationHorizontalViewOffsetPxV592,
  constellationLabelCountV592,
  constellationLabelV592,
  constellationMobileFovDegV592,
  defaultConstellationCodesV592,
  visibleConstellationCodesV592,
} from "./livingConstellationsV592";
import { CONSTELLATION_ART_COVERAGE_V592 } from "./constellationArtV592";

describe("v592 living constellation presentation contract", () => {
  it("maps the three browser focus targets onto their real IAU codes", () => {
    expect(CONSTELLATION_FOCUS_CODE_BY_TARGET_V592).toEqual({
      orion: "Ori",
      "ursa-major": "UMa",
      cassiopeia: "Cas",
    });
    expect(constellationFocusCodeV592("orion")).toBe("Ori");
    expect(constellationFocusCodeV592("ursa-major")).toBe("UMa");
    expect(constellationFocusCodeV592("cassiopeia")).toBe("Cas");
    expect(constellationFocusCodeV592("earth")).toBeNull();
  });

  it("retains the fixed desktop/mobile overview budgets and focused code", () => {
    expect(defaultConstellationCodesV592("desktop")).toHaveLength(12);
    expect(defaultConstellationCodesV592("mobile")).toHaveLength(8);
    expect(new Set(defaultConstellationCodesV592("desktop")).size).toBe(12);
    expect(new Set(defaultConstellationCodesV592("mobile")).size).toBe(8);
    expect(visibleConstellationCodesV592("desktop", "orion")).toContain("Ori");
    expect(visibleConstellationCodesV592("mobile", "ursa-major")).toContain("UMa");
    expect(visibleConstellationCodesV592("desktop", "cassiopeia")).toContain("Cas");
  });

  it("provides complete Latin/Chinese labels without claiming IAU boundaries", () => {
    expect(CONSTELLATION_NAME_COVERAGE_V592).toEqual(expect.objectContaining({
      iauCount: 88,
      latinCount: 88,
      chineseCount: 88,
      iauBoundaryAdmission: "blocked-source-not-admitted",
    }));
    expect(constellationLabelV592("Ori", "Orion")).toEqual({
      code: "Ori",
      latin: "Orion",
      chinese: "猎户座",
    });
    expect(constellationLabelV592("UMa", "Ursa Major").chinese).toBe("大熊座");
    expect(constellationLabelV592("Cas", "Cassiopeia").chinese).toBe("仙后座");
  });

  it("keeps lines on one normalized celestial sphere and labels presentation-only", () => {
    expect(CONSTELLATION_RENDER_RADIUS_V592).toBeCloseTo(231.88, 10);
    expect(constellationLabelCountV592({ visibleCodeCount: 12, focusedCode: null, closeup: false, cleanView: false })).toBe(12);
    expect(constellationLabelCountV592({ visibleCodeCount: 12, focusedCode: "Ori", closeup: true, cleanView: false })).toBe(1);
    expect(constellationLabelCountV592({ visibleCodeCount: 12, focusedCode: "Ori", closeup: true, cleanView: true })).toBe(0);
  });

  it("admits a deterministic Gaia-derived engraving primary for all 88 constellations", () => {
    expect(CONSTELLATION_ART_COVERAGE_V592).toEqual({
      admittedCount: 88,
      requiredCount: 88,
      status: "admitted-88-of-88-data-derived-observatory-engraving-primary",
      source: "gaia-anchored-asterism-tangent-plane",
      primaryModel: "deterministic-tangent-plane-celestial-engraving",
      externalIllustrationAssetCount: 0,
      proceduralFallbackAllowed: false,
      observationImageClaimed: false,
      presentationOnly: true,
      scientificPayloadWriteback: false,
    });
  });

  it("provides bounded mobile-only projection framing without moving sky coordinates", () => {
    expect(constellationMobileFovDegV592("Ori")).toBe(56);
    expect(constellationMobileFovDegV592("UMa")).toBe(72);
    expect(constellationMobileFovDegV592("Cas")).toBe(58);
    expect(constellationHorizontalViewOffsetPxV592(1.4, 390)).toBeCloseTo(273, 8);
    expect(constellationHorizontalViewOffsetPxV592(4, 390)).toBeCloseTo(304.2, 8);
    expect(() => constellationHorizontalViewOffsetPxV592(Number.NaN, 390)).toThrow("v592-constellation-view-offset-input");
  });
});
