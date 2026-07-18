import { describe, expect, it } from "vitest";
import { createKerrGeodesicTrackSet, KERR_ORBIT_PRESETS } from "./kerrGeodesicVisualization";
import {
  KERR_RELATIVITY_STUDIO_VERSION,
  createKerrRelativityStudioSummary,
} from "./kerrRelativityStudio";

describe("Kerr Relativity Studio v35", () => {
  it("creates deterministic finite metrics for every preset", () => {
    for (const preset of KERR_ORBIT_PRESETS) {
      const trackSet = createKerrGeodesicTrackSet({
        spinA: preset.spinA,
        impactParameterM: preset.impactParameterM,
        presetId: preset.id,
      });
      const summary = createKerrRelativityStudioSummary({
        spinA: preset.spinA,
        impactParameterM: preset.impactParameterM,
        presetId: preset.id,
        renderMode: "both",
        trackSet,
      });

      expect(summary.version).toBe(KERR_RELATIVITY_STUDIO_VERSION);
      expect(summary.presetId).toBe(preset.id);
      expect(summary.boundary).toBe("test-particle-null-geodesic-lab");
      expect(summary.trackCount).toBeGreaterThanOrEqual(7);
      expect(summary.sections.map((section) => section.id)).toEqual([
        "overview",
        "probe",
        "isco",
        "error",
        "boundary",
      ]);
      for (const value of [
        summary.weakFieldDeflectionRad,
        summary.weakFieldDeflectionArcsec,
        summary.progradeIscoRadiusM,
        summary.retrogradeIscoRadiusM,
        summary.iscoSplitM,
        summary.maxHamiltonianDrift,
        summary.radialRangeMinM,
        summary.radialRangeMaxM,
      ]) {
        expect(Number.isFinite(value)).toBe(true);
      }
    }
  });

  it("spin changes prograde and retrograde ISCO split", () => {
    const lowSpin = createKerrRelativityStudioSummary({ spinA: 0.1 });
    const highSpin = createKerrRelativityStudioSummary({ spinA: 0.95 });

    expect(highSpin.progradeIscoRadiusM).toBeLessThan(lowSpin.progradeIscoRadiusM);
    expect(highSpin.retrogradeIscoRadiusM).toBeGreaterThan(lowSpin.retrogradeIscoRadiusM);
    expect(highSpin.iscoSplitM).toBeGreaterThan(lowSpin.iscoSplitM);
  });

  it("impact parameter changes 4M/b and probe classification context", () => {
    const lowB = createKerrRelativityStudioSummary({
      impactParameterM: 3.8,
      presetId: "capture-cone",
      mode: "probe",
    });
    const highB = createKerrRelativityStudioSummary({
      impactParameterM: 15,
      presetId: "wide-deflection",
      mode: "probe",
    });

    expect(lowB.mode).toBe("probe");
    expect(lowB.weakFieldDeflectionRad).toBeGreaterThan(highB.weakFieldDeflectionRad);
    expect(lowB.probeStatus).toBe("capture");
    expect(["scatter", "escape"]).toContain(highB.probeStatus);
    expect(lowB.radialRangeMaxM).not.toBe(highB.radialRangeMaxM);
  });

  it("falls back safely for invalid or empty args", () => {
    const empty = createKerrRelativityStudioSummary();
    const invalid = createKerrRelativityStudioSummary({
      spinA: Number.NaN,
      impactParameterM: Number.NaN,
      presetId: "missing" as never,
      renderMode: "bad" as never,
      mode: "bad" as never,
    });

    expect(empty.mode).toBe("overview");
    expect(empty.presetId).toBe("photon-ring-demo");
    expect(invalid.mode).toBe("overview");
    expect(invalid.presetId).toBe("photon-ring-demo");
    expect(Number.isFinite(invalid.maxHamiltonianDrift)).toBe(true);
  });
});
