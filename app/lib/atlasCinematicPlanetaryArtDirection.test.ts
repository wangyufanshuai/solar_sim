import { describe, expect, it } from "vitest";
import {
  ATLAS_CINEMATIC_PLANETARY_ART_DIRECTION_VERSION,
  createAtlasCinematicPlanetaryArtDirectionSummary,
} from "./atlasCinematicPlanetaryArtDirection";

describe("createAtlasCinematicPlanetaryArtDirectionSummary", () => {
  it("is deterministic", () => {
    expect(createAtlasCinematicPlanetaryArtDirectionSummary()).toEqual(
      createAtlasCinematicPlanetaryArtDirectionSummary(),
    );
  });

  it("reports the v55 reference target and local asset policy", () => {
    const summary = createAtlasCinematicPlanetaryArtDirectionSummary();
    expect(summary).toEqual(
      expect.objectContaining({
        version: ATLAS_CINEMATIC_PLANETARY_ART_DIRECTION_VERSION,
        referenceMode: "universe-sandbox-inspired-local-comparison",
        qualityTarget: "aaa-inspired-scientific-space-simulation",
        assetPolicy: "dev-refresh-prepared-local-runtime",
        runtimeAssetSource: "prepared-local-v55-art-direction-assets-only",
        globalColorGradeProfile: "filmic-cool-space-warm-planet-protection",
        defaultBackgroundArtGradeProfile: "sparse-negative-space-milky-way-depth",
        closeupBackgroundArtGradeProfile: "closeup-subject-star-noise-matte",
      }),
    );
  });

  it("covers gas giant, Saturn ring, Earth night/cloud, solar and background profiles", () => {
    const summary = createAtlasCinematicPlanetaryArtDirectionSummary();
    expect(summary.supportedGasGiantArtProfiles).toEqual(
      expect.arrayContaining(["gas-giant-band-depth-cinematic", "saturn-muted-bands-ring-aware"]),
    );
    expect(summary.supportedSaturnRingArtProfiles).toContain("saturn-cassini-backlit-ring-art");
    expect(summary.supportedEarthCloudNightProfiles).toContain("earth-clean-cloud-night-shadow-art");
    expect(summary.supportedSolarSurfaceProfiles).toContain("solar-granulation-controlled-corona-art");
    expect(summary.gasBandCue).toBe("nonemissive-banded-microcontrast");
    expect(summary.saturnRingCue).toBe("cassini-gap-backlit-layering");
    expect(summary.earthNightCue).toBe("dark-side-only-city-light-mask");
    expect(summary.solarSurfaceCue).toBe("granulation-controlled-corona");
  });

  it("preserves prior boundaries and avoids certification claims", () => {
    const summary = createAtlasCinematicPlanetaryArtDirectionSummary();
    expect(summary.aaBoundaryPreserved).toBe("v41-aa-boundary-preserved");
    expect(summary.referenceGradeBoundaryPreserved).toBe("v48-reference-grade-space-art-preserved");
    expect(summary.colorBoundaryPreserved).toBe("v53-planetary-color-grading-preserved");
    expect(summary.numericalIntegrityBoundaryPreserved).toBe("v54-numerical-integrity-gate-preserved");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.runtimeCertificationStatus).toBe("not-claimed-in-app");
    expect(summary.artisticCertificationStatus).toBe("not-claimed");
    expect(summary.scientificCertificationStatus).toBe("not-claimed");
    expect(summary.wcagCertificationStatus).toBe("not-claimed");
    expect(summary.ciCertificationStatus).toBe("not-claimed");
    expect(summary.onlineValidationStatus).toBe("not-claimed");
    expect(summary.onlineAssetCompletenessStatus).toBe("not-claimed");
    expect(summary.universeSandboxCloneStatus).toBe("not-claimed");
    expect(JSON.stringify(summary)).not.toContain("trustScore");
    expect(JSON.stringify(summary)).not.toContain("certified");
    expect(JSON.stringify(summary)).not.toContain("physics mutation");
  });
});
