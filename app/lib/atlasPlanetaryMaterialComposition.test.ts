import { describe, expect, it } from "vitest";
import {
  ATLAS_PLANETARY_MATERIAL_COMPOSITION_VERSION,
  createAtlasPlanetaryMaterialCompositionSummary,
} from "./atlasPlanetaryMaterialComposition";

describe("createAtlasPlanetaryMaterialCompositionSummary", () => {
  it("returns deterministic v49 planetary material metadata", () => {
    const first = createAtlasPlanetaryMaterialCompositionSummary();
    const second = createAtlasPlanetaryMaterialCompositionSummary();

    expect(first).toEqual(second);
    expect(first.version).toBe(ATLAS_PLANETARY_MATERIAL_COMPOSITION_VERSION);
    expect(first.materialTarget).toBe("closeup-body-material-depth");
    expect(first.assetPolicy).toBe("dev-refresh-prepared-local-runtime");
    expect(first.runtimeAssetSource).toBe("prepared-local-planet-textures-only");
    expect(first.supportedMaterialProfiles).toEqual(
      expect.arrayContaining([
        "earth-cloud-night-depth",
        "gas-giant-band-depth",
        "saturn-ring-material-depth",
        "solar-granulation-depth",
        "lunar-mars-relief-depth",
      ]),
    );
    expect(first.saturnRingProfile).toBe("saturn-cassini-layered-ring");
  });

  it("preserves v41-v48 boundaries", () => {
    const summary = createAtlasPlanetaryMaterialCompositionSummary();

    expect(summary.aaBoundaryPreserved).toBe("v41-aa-boundary-preserved");
    expect(summary.cinematicBoundaryPreserved).toBe("v42-cinematic-boundary-preserved");
    expect(summary.planetaryBoundaryPreserved).toBe("v43-planetary-visual-fidelity-preserved");
    expect(summary.lightingBoundaryPreserved).toBe("v44-cinematic-lighting-preserved");
    expect(summary.chineseBoundaryPreserved).toBe("v45-chinese-deep-space-fidelity-preserved");
    expect(summary.deepSpaceCameraBoundaryPreserved).toBe("v46-cinematic-deep-space-camera-preserved");
    expect(summary.universeSandboxReferenceBoundaryPreserved).toBe(
      "v47-universe-sandbox-reference-backdrop-preserved",
    );
    expect(summary.referenceGradeBoundaryPreserved).toBe("v48-reference-grade-space-art-preserved");
    expect(summary.trustedBoundary).toContain("v48 reference-grade space art");
  });

  it("does not claim certification, online validation, runtime command status, or physics mutation", () => {
    const summary = createAtlasPlanetaryMaterialCompositionSummary();
    const serialized = JSON.stringify(summary).toLowerCase();

    expect(summary.runtimeCertificationStatus).toBe("not-claimed-in-app");
    expect(summary.artisticCertificationStatus).toBe("not-claimed");
    expect(summary.scientificCertificationStatus).toBe("not-claimed");
    expect(summary.wcagCertificationStatus).toBe("not-claimed");
    expect(summary.assetCompletenessCertificationStatus).toBe("not-claimed");
    expect(summary.onlineValidationStatus).toBe("not-claimed");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(serialized).not.toContain("trustscore");
    expect(serialized).not.toMatch(/online-source|online source|runtime passed|ci-certified|aaa-certified|wcag-certified|science-certified|asset-certified|physics mutation applied/i);
  });
});
