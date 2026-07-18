import { describe, expect, it } from "vitest";
import {
  ATLAS_SPARSE_DEEP_SPACE_DIRECTOR_VERSION,
  createAtlasSparseDeepSpaceDirectorSummary,
} from "./atlasSparseDeepSpaceDirector";

describe("Atlas Sparse Deep-Space Director v57", () => {
  it("returns deterministic local sparse deep-space metadata", () => {
    const first = createAtlasSparseDeepSpaceDirectorSummary();
    const second = createAtlasSparseDeepSpaceDirectorSummary();

    expect(first).toEqual(second);
    expect(first).toEqual(
      expect.objectContaining({
        version: ATLAS_SPARSE_DEEP_SPACE_DIRECTOR_VERSION,
        status: "informational",
        referenceMode: "universe-sandbox-inspired-sparse-deep-space",
        sourcePolicy: "nasa-svs-16k-prepared-local-runtime",
        skyManifest: "orbit-atlas-v57",
        runtimeAssetSource: "prepared-local-v57-sky-assets-only",
        starfieldProfile: "sparse-primary-stars-ultrafaint-distant-field",
        milkyWayProfile: "deep-cold-gray-blue-dark-lanes",
        nebulaProfile: "barely-visible-local-haze",
        negativeSpaceProfile: "overview-wide-negative-space",
      }),
    );
    expect(first.sourceInputs).toEqual([
      "nasa-svs-deep-star-maps-2020-16k",
      "nasa-svs-elsewhere-starfield-2020-16k",
      "local-v56-v48-v9-fallbacks",
    ]);
  });

  it("preserves previous visual and physics boundaries without certification claims", () => {
    const summary = createAtlasSparseDeepSpaceDirectorSummary();
    const serialized = JSON.stringify(summary).toLowerCase();

    expect(summary.aaBoundaryPreserved).toBe("v41-aa-boundary-preserved");
    expect(summary.cinematicBackdropBoundaryPreserved).toBe("v56-cinematic-deep-space-backdrop-preserved");
    expect(summary.planetaryArtBoundaryPreserved).toBe("v55-cinematic-planetary-art-direction-preserved");
    expect(summary.numericalIntegrityBoundaryPreserved).toBe("v54-numerical-integrity-gate-preserved");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.universeSandboxCloneStatus).toBe("not-claimed");
    expect(summary.onlineValidationStatus).toBe("not-claimed");
    expect(summary.onlineAssetCompletenessStatus).toBe("not-claimed");
    expect(summary.trustedBoundary).toContain("Universe Sandbox clone");
    expect("trustScore" in summary).toBe(false);
    expect(serialized).not.toContain("physics mutation applied");
    expect(serialized).not.toContain("runtime pass");
    expect(serialized).not.toContain("certified");
  });
});
