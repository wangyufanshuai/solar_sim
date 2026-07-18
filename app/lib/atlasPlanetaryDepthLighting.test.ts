import { describe, expect, it } from "vitest";
import {
  ATLAS_PLANETARY_DEPTH_LIGHTING_VERSION,
  createAtlasPlanetaryDepthLightingSummary,
} from "./atlasPlanetaryDepthLighting";

describe("createAtlasPlanetaryDepthLightingSummary", () => {
  it("returns deterministic v52 planetary depth-lighting metadata", () => {
    expect(createAtlasPlanetaryDepthLightingSummary()).toEqual(
      createAtlasPlanetaryDepthLightingSummary(),
    );

    const summary = createAtlasPlanetaryDepthLightingSummary();
    expect(summary.version).toBe(ATLAS_PLANETARY_DEPTH_LIGHTING_VERSION);
    expect(summary.lightingTarget).toBe("closeup-atmospheric-terminator-ring-depth");
    expect(summary.qualityBudget).toBe("stable-high-fidelity");
    expect(summary.assetPolicy).toBe("local-runtime-assets");
  });

  it("covers close-up atmosphere, gas-band and Saturn ring-shadow profiles", () => {
    const summary = createAtlasPlanetaryDepthLightingSummary();

    expect(summary.supportedDepthLightingProfiles).toEqual([
      "overview-no-depth-lighting",
      "earth-atmospheric-terminator-depth",
      "solar-granulation-limb-depth",
      "gas-giant-banded-phase-depth",
      "saturn-ring-shadow-depth",
      "airless-relief-terminator-depth",
    ]);
    expect(summary.earthDepthLightingProfile).toBe("earth-atmospheric-terminator-depth");
    expect(summary.gasGiantDepthLightingProfile).toBe("gas-giant-banded-phase-depth");
    expect(summary.saturnDepthLightingProfile).toBe("saturn-ring-shadow-depth");
    expect(summary.ringShadowCue).toBe("saturn-equatorial-ring-shadow-matte");
    expect(summary.keyLightBoundaryPreserved).toBe("v51-cinematic-key-light-director-preserved");
  });

  it("makes no certification, online validation, or physics mutation claim", () => {
    const summary = createAtlasPlanetaryDepthLightingSummary();
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
