import { describe, expect, it } from "vitest";
import { MAINLINE_A_CONSTELLATION_FIGURES_V607, buildMainlineAConstellationFiguresV607 } from "./mainlineAConstellationFiguresV607";
import { ALL_BRIGHT_STARS } from "./brightStarCatalog";
import { MAINLINE_A_CONSTELLATION_ANCHOR_SUPPLEMENT_V638 } from "./mainlineAConstellationAnchorSupplementV638";
import { CONSTELLATION_LINES } from "./constellationCatalog";
import { selectMainlineAConstellationFigureV638, mainlineAConstellationFrameStateV638 } from "../lib/mainlineAConstellationSelectionV638";
import { MAINLINE_A1_IAU_BOUNDARIES } from "./mainlineAConstellationBoundaryDataV607";
import { MAINLINE_A_CURRENT_IAU_BOUNDARIES } from "./mainlineAConstellationCurrentBoundaryDataV607";
import { fitSkyChartV607, projectSkyCoordinateV607 } from "../lib/skyChartProjectionV607";

describe("Mainline A constellation charts", () => {
  it("puts Rigel west and south of Betelgeuse and closes the Big Dipper bowl", () => {
    const { stars } = MAINLINE_A_CONSTELLATION_FIGURES_V607.Ori;
    const rigel = stars.find((star) => star.id === "rigel")!;
    const betelgeuse = stars.find((star) => star.id === "betelgeuse")!;
    expect(rigel.raDeg).toBeCloseTo(78.63, 2);
    expect(rigel.raDeg).toBeLessThan(betelgeuse.raDeg);
    expect(rigel.decDeg).toBeLessThan(betelgeuse.decDeg);
    const bowl = MAINLINE_A_CONSTELLATION_FIGURES_V607.UMa.segments;
    expect(bowl).toContainEqual(["megrez", "dubhe"]);
    expect(MAINLINE_A_CONSTELLATION_FIGURES_V607.UMa.stars).toHaveLength(7);
  });

  it("resolves every drawn segment to a unique named catalog anchor", () => {
    for (const figure of Object.values(MAINLINE_A_CONSTELLATION_FIGURES_V607)) {
      const ids = new Set(figure.stars.map((star) => star.id));
      expect(ids.size).toBe(figure.stars.length);
      for (const pair of figure.segments) expect(pair.every((id) => ids.has(id))).toBe(true);
      expect(figure.stars.every((star) => star.nameCn && (star.magV === null || Number.isFinite(star.magV)))).toBe(true);
    }
  });

  it("keeps east left and north up across the RA seam and at high declination", () => {
    const center = { raDeg: 359, decDeg: 60 };
    expect(projectSkyCoordinateV607(center, center)).toEqual({ x: -0, y: -0 });
    expect(projectSkyCoordinateV607({ raDeg: 1, decDeg: 60 }, center).x).toBeLessThan(0);
    expect(projectSkyCoordinateV607({ raDeg: 359, decDeg: 65 }, center).y).toBeLessThan(0);
    expect(() => projectSkyCoordinateV607({ raDeg: 180, decDeg: 0 }, { raDeg: 0, decDeg: 0 })).toThrow();
  });

  it("fits all four complete boundaries into the chart without clipping or RA discontinuity", () => {
    for (const [code, figure] of Object.entries(MAINLINE_A_CONSTELLATION_FIGURES_V607)) {
      const points = [...figure.stars, ...(MAINLINE_A_CURRENT_IAU_BOUNDARIES[code] ?? MAINLINE_A1_IAU_BOUNDARIES[code] ?? [])];
      const chart = fitSkyChartV607(points);
      for (const point of points) {
        const projected = chart.project(point);
        expect(projected.x).toBeGreaterThanOrEqual(29.999);
        expect(projected.x).toBeLessThanOrEqual(330.001);
        expect(projected.y).toBeGreaterThanOrEqual(29.999);
        expect(projected.y).toBeLessThanOrEqual(230.001);
      }
    }
  });
});

describe("V638 constellation member identity and presentation source", () => {
  it("draws the Cygnus cross from its five actual members, not the Summer Triangle", () => {
    const figure = MAINLINE_A_CONSTELLATION_FIGURES_V607.Cyg;
    expect(figure.requiredAnchorIds).toEqual(["deneb", "sadr", "albireo", "delta_cyg", "epsilon_cyg"]);
    expect(figure.segments).toEqual([["deneb", "sadr"], ["sadr", "albireo"], ["delta_cyg", "sadr"], ["sadr", "epsilon_cyg"]]);
    expect(figure.stars.map((star) => star.id)).not.toContain("vega");
    expect(figure.stars.map((star) => star.id)).not.toContain("denebokab");
    const sadr = figure.stars.find((star) => star.id === "sadr")!;
    expect(sadr.raDeg).toBeCloseTo(305.55, 2);
    expect(sadr.decDeg).toBe(40.26);
  });

  it("keeps the Gemini twins and their body branches in Gemini", () => {
    const figure = MAINLINE_A_CONSTELLATION_FIGURES_V607.Gem;
    expect(new Set(figure.stars.map((star) => star.id))).toEqual(new Set(["castor", "pollux", "mebsuta", "propus", "wasat", "alhena"]));
    expect(figure.segments).toContainEqual(["castor", "mebsuta"]);
    expect(figure.segments).toContainEqual(["pollux", "wasat"]);
    expect(figure.segments).not.toContainEqual(["propus", "pollux"]);
    const alhena = figure.stars.find((star) => star.id === "alhena")!;
    expect(alhena.raDeg).toBeCloseTo(99.435, 3);
    expect(alhena.decDeg).toBe(16.4);
    expect(figure.requiredAnchorIds).not.toContain("procyon");
  });

  it("keeps the Southern Cross as exactly two independent strokes", () => {
    const figure = MAINLINE_A_CONSTELLATION_FIGURES_V607.Cru;
    expect(figure.segments).toEqual([["gacrux", "acrux"], ["imai", "mimosa"]]);
    const selected = selectMainlineAConstellationFigureV638("constellation:Cru", CONSTELLATION_LINES, 9500);
    expect(selected.segmentCount).toBe(2);
    expect(figure.requiredAnchorIds).not.toContain("canopus");
    expect(figure.stars.find((star) => star.id === "gacrux")!.raDeg).toBeCloseTo(187.785, 3);
  });

  it("uses identical member coordinates and edges in the scene, camera input and chart", () => {
    expect(Object.keys(MAINLINE_A_CONSTELLATION_FIGURES_V607)).toHaveLength(12);
    for (const [code, figure] of Object.entries(MAINLINE_A_CONSTELLATION_FIGURES_V607)) {
      const scene = CONSTELLATION_LINES.find((entry) => entry.iauCode === code)!;
      expect(scene.coordinateSegments, code).toBe(figure.coordinateSegments);
      expect(scene.sourceComplete, code).toBe(figure.sourceComplete);
      const selected = selectMainlineAConstellationFigureV638(`constellation:${code}`, CONSTELLATION_LINES, 9500);
      expect(selected.segmentCount, code).toBe(figure.segments.length);
      expect(figure.sourceComplete, code).toBe(true);
      expect(figure.scientificPayloadWriteback, code).toBe(false);
      expect(figure.stars.every((star) => star.constellationCode === code && star.sourceRef.length > 0)).toBe(true);
    }
  });

  it("preserves an unresolved middle anchor as a gap, never a new connecting edge", () => {
    const figure = buildMainlineAConstellationFiguresV607(ALL_BRIGHT_STARS.filter((star) => star.id !== "sadr"), MAINLINE_A_CONSTELLATION_ANCHOR_SUPPLEMENT_V638).Cyg;
    expect(figure.missingAnchorIds).toEqual(["sadr"]);
    expect(figure.sourceComplete).toBe(false);
    expect(figure.segments).toHaveLength(0);
    expect(figure.stars.some((star) => ["vega", "denebokab"].includes(star.id))).toBe(false);
  });

  it("retains a partial cross without connecting Gacrux to Mimosa when Imai is absent", () => {
    const figure = buildMainlineAConstellationFiguresV607(ALL_BRIGHT_STARS, MAINLINE_A_CONSTELLATION_ANCHOR_SUPPLEMENT_V638.filter((star) => star.id !== "imai")).Cru;
    expect(figure.segments).toEqual([["gacrux", "acrux"]]);
    expect(figure.missingAnchorIds).toEqual(["imai"]);
    const selection = selectMainlineAConstellationFigureV638("constellation:Cru", [{ iauCode: "Cru", ...figure }], 9500);
    expect(selection.status).toBe("selected");
    expect(selection.sourceComplete).toBe(false);
    expect(mainlineAConstellationFrameStateV638({ selection, enabled: true, ancestorsVisible: true, opacity: 1, drawObserved: true,
      projection: { status: "visible", visibleSegments: 1, totalSegments: 1, clippedSegments: 0, fullyFramed: true, bounds: null } })).toBe("failed");
  });

  it("rejects conflicting duplicate catalog identities but deduplicates identical references", () => {
    const sadr = ALL_BRIGHT_STARS.find((star) => star.id === "sadr")!;
    const conflicting = buildMainlineAConstellationFiguresV607([...ALL_BRIGHT_STARS, { ...sadr, raHours: sadr.raHours + 1 }], MAINLINE_A_CONSTELLATION_ANCHOR_SUPPLEMENT_V638).Cyg;
    expect(conflicting.sourceIssues).toContain("anchor:ambiguous:sadr");
    expect(conflicting.stars.some((star) => star.id === "sadr")).toBe(false);
    const identical = buildMainlineAConstellationFiguresV607([...ALL_BRIGHT_STARS, { ...sadr }], MAINLINE_A_CONSTELLATION_ANCHOR_SUPPLEMENT_V638).Cyg;
    expect(identical.stars.filter((star) => star.id === "sadr")).toHaveLength(1);
  });

  it.each([
    { constellationCode: "Lyr" }, { artifactSha256: "not-a-digest" }, { sourceUrl: "http://example.invalid" },
    { raDeg: NaN }, { decDeg: 91 }, { magV: Infinity }, { artifactPath: "" },
  ])("fails closed on invalid supplemental provenance or coordinates %j", (patch) => {
    const source = MAINLINE_A_CONSTELLATION_ANCHOR_SUPPLEMENT_V638.map((star) => star.id === "delta_cyg" ? { ...star, ...patch } : star);
    const figure = buildMainlineAConstellationFiguresV607(ALL_BRIGHT_STARS, source).Cyg;
    expect(figure.sourceComplete).toBe(false);
    expect(figure.sourceIssues).toContain("anchor:source-invalid:delta_cyg");
    expect(figure.stars.some((star) => star.id === "delta_cyg")).toBe(false);
  });

  it("keeps explicit component A naming instead of promoting the epsilon1 system", () => {
    const star = MAINLINE_A_CONSTELLATION_FIGURES_V607.Lyr.stars.find((entry) => entry.id === "epsilon1_lyr")!;
    const source = MAINLINE_A_CONSTELLATION_ANCHOR_SUPPLEMENT_V638.find((entry) => entry.id === "epsilon1_lyr")!;
    expect(star.name).toBe(source.name);
    expect(star.nameCn).toBe(source.nameCn);
    expect(`${star.name} ${star.nameCn}`).toMatch(/7051/);
    expect(star.rawArtifactSha256).toBe(source.artifactSha256);
  });
});
