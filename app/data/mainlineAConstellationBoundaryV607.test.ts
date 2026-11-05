import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { ATLAS_SCALE_CAMERA_DISTANCE_V268 } from "../lib/atlasScaleJourneyV268";
import { createFloatingOrigin, updateFloatingOrigin } from "../lib/floatingOrigin";
import {
  groupIauBoundaryTxtV607,
  parseIauBoundaryTxtV607,
  resolveMainlineAConstellationLayerV607,
  shouldShowMainlineAAsterismsV607,
  shouldShowMainlineAConstellationBoundariesV607,
} from "./mainlineAConstellationBoundaryV607";

describe("mainline A IAU boundary ingest", () => {
  it("converts sexagesimal RA to J2000 degrees and filters malformed rows", () => {
    const rows = parseIauBoundaryTxtV607([
      "05 35 17.3000| -05.4500000|Ori",
      "05 40 00.0000| -05.0000000|Ori",
      "bad|row|Ori",
      "05 40 00.0000| -05.0000000|ORION",
    ].join("\n"), "Ori");
    expect(rows).toHaveLength(2);
    expect(rows[0].raDeg).toBeCloseTo(83.8220833, 6);
    expect(rows[0].decDeg).toBe(-5.45);
  });

  it("groups mixed constellation records for downstream polygon assembly", () => {
    const grouped = groupIauBoundaryTxtV607("00 00 00.0000|0|Cas\n01 00 00.0000|1|Ori");
    expect(grouped.Cas).toEqual([[0, 0]]);
    expect(grouped.Ori?.[0][0]).toBe(15);
  });

  it("keeps boundary visibility deterministic across presentation tiers", () => {
    const base = { enabled: true, qualityTier: "balanced" as const, lodTier: "mid" as const, cinematicCameraProfile: "overview-atlas", boundarySegmentCount: 4 };
    expect(shouldShowMainlineAConstellationBoundariesV607(base)).toBe(true);
    expect(shouldShowMainlineAConstellationBoundariesV607({ ...base, qualityTier: "mobile" })).toBe(false);
    expect(shouldShowMainlineAConstellationBoundariesV607({ ...base, lodTier: "solar" })).toBe(false);
    expect(shouldShowMainlineAConstellationBoundariesV607({ ...base, cinematicCameraProfile: "selected-body-cinematic" })).toBe(false);
    expect(shouldShowMainlineAConstellationBoundariesV607({ ...base, boundarySegmentCount: 0 })).toBe(false);
  });

  it("keeps asterism visibility deterministic across quality, LOD, and camera gates", () => {
    const base = {
      enabled: true,
      asterismEnabled: true,
      qualityTier: "balanced" as const,
      lodTier: "mid" as const,
      cinematicCameraProfile: "overview-atlas",
      asterismSegmentCount: 12,
    };
    expect(shouldShowMainlineAAsterismsV607(base)).toBe(true);
    expect(shouldShowMainlineAAsterismsV607({ ...base, enabled: false })).toBe(false);
    expect(shouldShowMainlineAAsterismsV607({ ...base, asterismEnabled: false })).toBe(false);
    expect(shouldShowMainlineAAsterismsV607({ ...base, qualityTier: "mobile" })).toBe(false);
    expect(shouldShowMainlineAAsterismsV607({ ...base, lodTier: "solar" })).toBe(false);
    expect(shouldShowMainlineAAsterismsV607({ ...base, cinematicCameraProfile: "selected-body-cinematic" })).toBe(false);
    expect(shouldShowMainlineAAsterismsV607({ ...base, asterismSegmentCount: 0 })).toBe(false);
  });

  it("exposes auditable boundary and asterism opacity for desktop/mobile smoke", () => {
    const base = {
      enabled: true,
      orbitAtlas: false,
      asterismEnabled: true,
      qualityTier: "balanced" as const,
      lodTier: "mid" as const,
      cinematicCameraProfile: "overview-atlas",
      boundarySegmentCount: 4,
      asterismSegmentCount: 12,
    };
    const balanced = resolveMainlineAConstellationLayerV607(base);
    expect(balanced.showBoundaries).toBe(true);
    expect(balanced.showAsterisms).toBe(true);
    expect(balanced.boundaryOpacity).toBeCloseTo(0.02142, 5);
    expect(balanced.asterismOpacity).toBeCloseTo(0.02448, 5);

    const mobile = resolveMainlineAConstellationLayerV607({ ...base, qualityTier: "mobile" });
    expect(mobile.showBoundaries).toBe(false);
    expect(mobile.showAsterisms).toBe(false);
    expect(mobile.boundaryOpacity).toBe(0);
    expect(mobile.asterismOpacity).toBe(0);

    const dense = resolveMainlineAConstellationLayerV607({ ...base, qualityTier: "dense", lodTier: "far" });
    expect(dense.showBoundaries).toBe(true);
    expect(dense.showAsterisms).toBe(true);
    expect(dense.boundaryOpacity).toBeGreaterThan(balanced.boundaryOpacity);
    expect(dense.asterismOpacity).toBeGreaterThan(balanced.asterismOpacity);
  });

  it.each(["stellar", "galactic"] as const)("shows desktop %s boundaries at the real atlas dolly distance without changing physical LOD", (presentationScaleBand) => {
    const origin = updateFloatingOrigin(
      new Vector3(0, 0, ATLAS_SCALE_CAMERA_DISTANCE_V268[presentationScaleBand]),
      createFloatingOrigin(),
    );
    expect(origin.lodTier).toBe("solar");
    const base = {
      enabled: true,
      orbitAtlas: true,
      asterismEnabled: true,
      qualityTier: "balanced" as const,
      lodTier: origin.lodTier,
      presentationScaleBand,
      cinematicCameraProfile: "overview-atlas",
      boundarySegmentCount: 4,
      asterismSegmentCount: 12,
    };
    for (const qualityTier of ["balanced", "dense"] as const) {
      const layer = resolveMainlineAConstellationLayerV607({ ...base, qualityTier });
      expect(layer.showBoundaries).toBe(true);
      expect(layer.showAsterisms).toBe(true);
      expect(layer.boundaryOpacity).toBeGreaterThan(0);
      expect(layer.asterismOpacity).toBeGreaterThan(0);
      expect(layer.presentationLodTier).toBe(presentationScaleBand === "stellar" ? "mid" : "far");
    }
    const mobile = resolveMainlineAConstellationLayerV607({ ...base, qualityTier: "mobile" });
    expect(mobile.showBoundaries).toBe(false);
    expect(mobile.showAsterisms).toBe(false);
    expect(origin.lodTier).toBe("solar");
    expect(origin.offsetAu).toEqual([0, 0, 0]);
  });

  it("keeps solar overview boundaries hidden and all constellation ink off in a selected-body closeup", () => {
    const base = {
      enabled: true,
      orbitAtlas: true,
      asterismEnabled: true,
      qualityTier: "dense" as const,
      lodTier: "solar" as const,
      presentationScaleBand: "solar" as const,
      cinematicCameraProfile: "overview-atlas",
      boundarySegmentCount: 4,
      asterismSegmentCount: 12,
    };
    const solar = resolveMainlineAConstellationLayerV607(base);
    expect(solar.showBoundaries).toBe(false);
    expect(solar.showAsterisms).toBe(false);
    for (const presentationScaleBand of ["solar", "stellar", "galactic"] as const) {
      for (const overrides of [{ enabled: false }, { cinematicCameraProfile: "selected-body-cinematic" }]) {
        const layer = resolveMainlineAConstellationLayerV607({ ...base, presentationScaleBand, ...overrides });
        expect(layer.showBoundaries).toBe(false);
        expect(layer.showAsterisms).toBe(false);
        expect(layer.lineOpacity).toBe(0);
        expect(layer.nodeOpacity).toBe(0);
        expect(layer.boundaryOpacity).toBe(0);
        expect(layer.asterismOpacity).toBe(0);
      }
    }
  });
});
