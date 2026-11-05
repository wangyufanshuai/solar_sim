import { describe, expect, it } from "vitest";
import {
  ATLAS_CINEMATIC_CLOSEUP_DIRECTOR_VERSION,
  createAtlasCinematicCloseupDirectorSummary,
} from "./atlasCinematicCloseupDirector";

describe("createAtlasCinematicCloseupDirectorSummary", () => {
  it("returns deterministic v50 cinematic close-up director metadata", () => {
    expect(createAtlasCinematicCloseupDirectorSummary()).toEqual(
      createAtlasCinematicCloseupDirectorSummary(),
    );

    const summary = createAtlasCinematicCloseupDirectorSummary();
    expect(summary.version).toBe(ATLAS_CINEMATIC_CLOSEUP_DIRECTOR_VERSION);
    expect(summary.compositionTarget).toBe("aaa-inspired-closeup-subject-composition");
    expect(summary.qualityBudget).toBe("stable-high-fidelity");
    expect(summary.assetPolicy).toBe("local-runtime-assets");
    expect(summary.runtimeAssetSource).toBe("prepared-local-planet-and-sky-textures-only");
  });

  it("covers Earth, Sun, gas giant, Saturn ring and lunar/Mars close-up profiles", () => {
    const summary = createAtlasCinematicCloseupDirectorSummary();

    expect(summary.supportedCompositionProfiles).toEqual([
      "overview-no-closeup-director",
      "earth-limb-portrait",
      "solar-surface-portrait",
      "gas-giant-band-portrait",
      "saturn-ring-showcase",
      "lunar-mars-relief-portrait",
    ]);
    expect(summary.supportedPanelAvoidanceProfiles).toContain("right-workbench-safe-subject-left");
    expect(summary.supportedPanelAvoidanceProfiles).toContain("centered-mobile-safe-subject");
    expect(summary.supportedRingShowcaseProfiles).toEqual([
      "no-ring-showcase",
      "saturn-wide-tilted-ring-showcase",
    ]);
    expect(summary.saturnCompositionProfile).toBe("saturn-ring-showcase");
    expect(summary.saturnRingShowcaseProfile).toBe("saturn-wide-tilted-ring-showcase");
  });

  it("preserves v41-v49 boundaries and makes no certification or physics claims", () => {
    const summary = createAtlasCinematicCloseupDirectorSummary();
    const serialized = JSON.stringify(summary).toLowerCase();

    expect(summary.aaBoundaryPreserved).toBe("v41-aa-boundary-preserved");
    expect(summary.planetaryMaterialBoundaryPreserved).toBe(
      "v49-planetary-material-composition-preserved",
    );
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.runtimeCertificationStatus).toBe("not-claimed-in-app");
    expect(summary.artisticCertificationStatus).toBe("not-claimed");
    expect(summary.wcagCertificationStatus).toBe("not-claimed");
    expect(summary.scientificCertificationStatus).toBe("not-claimed");
    expect(summary.onlineValidationStatus).toBe("not-claimed");
    expect(summary.universeSandboxCloneStatus).toBe("not-claimed");
    expect(serialized).not.toContain("trustscore");
    expect(serialized).not.toContain("physics mutation applied");
    expect(serialized).not.toContain("online validation passed");
    expect(serialized).not.toContain("aaa certification achieved");
    expect(serialized).not.toContain("aaa certified");
    expect(serialized).not.toContain("wcag certification achieved");
    expect(serialized).not.toContain("scientific certification achieved");
  });
});
