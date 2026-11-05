import { describe, expect, it } from "vitest";
import {
  ATLAS_CINEMATIC_KEY_LIGHT_DIRECTOR_VERSION,
  createAtlasCinematicKeyLightDirectorSummary,
} from "./atlasCinematicKeyLightDirector";

describe("createAtlasCinematicKeyLightDirectorSummary", () => {
  it("returns deterministic v51 cinematic key-light metadata", () => {
    expect(createAtlasCinematicKeyLightDirectorSummary()).toEqual(
      createAtlasCinematicKeyLightDirectorSummary(),
    );

    const summary = createAtlasCinematicKeyLightDirectorSummary();
    expect(summary.version).toBe(ATLAS_CINEMATIC_KEY_LIGHT_DIRECTOR_VERSION);
    expect(summary.lightingTarget).toBe("selected-body-readable-key-light-phase");
    expect(summary.qualityBudget).toBe("stable-high-fidelity");
    expect(summary.assetPolicy).toBe("local-runtime-assets");
  });

  it("covers gas giant and Saturn readable close-up key-light profiles", () => {
    const summary = createAtlasCinematicKeyLightDirectorSummary();

    expect(summary.supportedKeyLightProfiles).toEqual([
      "overview-natural-phase",
      "earth-cloud-night-key-balance",
      "solar-surface-edge-key",
      "gas-giant-readable-key-fill",
      "saturn-ring-key-fill",
      "lunar-mars-relief-key",
    ]);
    expect(summary.gasGiantKeyLightProfile).toBe("gas-giant-readable-key-fill");
    expect(summary.saturnKeyLightProfile).toBe("saturn-ring-key-fill");
    expect(summary.closeupDirectorBoundaryPreserved).toBe("v50-cinematic-closeup-director-preserved");
  });

  it("makes no certification, online validation, or physics mutation claim", () => {
    const summary = createAtlasCinematicKeyLightDirectorSummary();
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
