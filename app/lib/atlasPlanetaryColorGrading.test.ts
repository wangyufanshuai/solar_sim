import { describe, expect, it } from "vitest";
import {
  ATLAS_PLANETARY_COLOR_GRADING_VERSION,
  createAtlasPlanetaryColorGradingSummary,
} from "./atlasPlanetaryColorGrading";

describe("createAtlasPlanetaryColorGradingSummary", () => {
  it("returns deterministic v53 planetary color-grading metadata", () => {
    expect(createAtlasPlanetaryColorGradingSummary()).toEqual(
      createAtlasPlanetaryColorGradingSummary(),
    );

    const summary = createAtlasPlanetaryColorGradingSummary();
    expect(summary.version).toBe(ATLAS_PLANETARY_COLOR_GRADING_VERSION);
    expect(summary.colorTarget).toBe("closeup-planet-color-layer-depth");
    expect(summary.qualityBudget).toBe("stable-high-fidelity");
    expect(summary.assetPolicy).toBe("local-runtime-assets");
  });

  it("covers Earth, gas giant, Saturn, Sun and airless color profiles", () => {
    const summary = createAtlasPlanetaryColorGradingSummary();

    expect(summary.supportedColorGradeProfiles).toEqual([
      "overview-neutral-color",
      "earth-ocean-cloud-color-depth",
      "solar-photosphere-color-depth",
      "gas-giant-layer-color-grade",
      "saturn-ring-occlusion-color-grade",
      "airless-regolith-color-depth",
    ]);
    expect(summary.earthColorGradeProfile).toBe("earth-ocean-cloud-color-depth");
    expect(summary.gasGiantColorGradeProfile).toBe("gas-giant-layer-color-grade");
    expect(summary.saturnColorGradeProfile).toBe("saturn-ring-occlusion-color-grade");
    expect(summary.saturnOcclusionCue).toBe("saturn-ring-body-occlusion-tone");
    expect(summary.depthLightingBoundaryPreserved).toBe("v52-planetary-depth-lighting-preserved");
  });

  it("makes no certification, online validation, or physics mutation claim", () => {
    const summary = createAtlasPlanetaryColorGradingSummary();
    const serialized = JSON.stringify(summary).toLowerCase();

    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.runtimeCertificationStatus).toBe("not-claimed-in-app");
    expect(summary.artisticCertificationStatus).toBe("not-claimed");
    expect(summary.scientificCertificationStatus).toBe("not-claimed");
    expect(summary.wcagCertificationStatus).toBe("not-claimed");
    expect(summary.onlineValidationStatus).toBe("not-claimed");
    expect(summary.universeSandboxCloneStatus).toBe("not-claimed");
    expect(serialized).not.toContain("trustscore");
    expect(serialized).not.toContain("physics mutation applied");
    expect(serialized).not.toContain("online validation passed");
    expect(serialized).not.toContain("aaa certification achieved");
    expect(serialized).not.toContain("wcag certification achieved");
    expect(serialized).not.toContain("scientific certification achieved");
  });
});
