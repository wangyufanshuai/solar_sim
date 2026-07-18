import { describe, expect, it } from "vitest";
import {
  ATLAS_CINEMATIC_DEEP_SPACE_BACKDROP_VERSION,
  createAtlasCinematicDeepSpaceBackdropSummary,
} from "./atlasCinematicDeepSpaceBackdrop";

describe("createAtlasCinematicDeepSpaceBackdropSummary", () => {
  it("is deterministic", () => {
    expect(createAtlasCinematicDeepSpaceBackdropSummary()).toEqual(
      createAtlasCinematicDeepSpaceBackdropSummary(),
    );
  });

  it("reports the v56 backdrop version, source policy and manifest", () => {
    const summary = createAtlasCinematicDeepSpaceBackdropSummary();
    expect(summary).toEqual(
      expect.objectContaining({
        version: ATLAS_CINEMATIC_DEEP_SPACE_BACKDROP_VERSION,
        referenceMode: "universe-sandbox-inspired-local-comparison",
        sourcePolicy: "nasa-svs-prepared-local-runtime",
        skyManifest: "orbit-atlas-v56",
        runtimeAssetSource: "prepared-local-v56-sky-assets-only",
        starfieldProfile: "sparse-primary-stars-faint-distant-field",
        nebulaProfile: "soft-local-nebula-haze-layer",
        negativeSpaceProfile: "layered-milky-way-negative-space",
      }),
    );
    expect(summary.sourceInputs).toEqual([
      "nasa-svs-deep-star-maps-2020",
      "nasa-svs-elsewhere-starfield-2020",
      "local-v48-v9-fallbacks",
    ]);
  });

  it("preserves prior boundaries and avoids certification claims", () => {
    const summary = createAtlasCinematicDeepSpaceBackdropSummary();
    expect(summary.aaBoundaryPreserved).toBe("v41-aa-boundary-preserved");
    expect(summary.referenceGradeBoundaryPreserved).toBe("v48-reference-grade-space-art-preserved");
    expect(summary.planetaryArtBoundaryPreserved).toBe("v55-cinematic-planetary-art-direction-preserved");
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
    expect(summary.trustedBoundary).toContain("Universe Sandbox clone");
    expect(JSON.stringify(summary)).not.toContain("trustScore");
    expect(JSON.stringify(summary)).not.toContain("certified");
    expect(JSON.stringify(summary)).not.toContain("physics mutation");
  });
});
