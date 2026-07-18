import { describe, expect, it } from "vitest";
import {
  ATLAS_UNIVERSE_SANDBOX_REFERENCE_BACKDROP_VERSION,
  createAtlasUniverseSandboxReferenceBackdropSummary,
} from "./atlasUniverseSandboxReferenceBackdrop";

describe("createAtlasUniverseSandboxReferenceBackdropSummary", () => {
  it("returns deterministic v47 reference backdrop metadata", () => {
    const first = createAtlasUniverseSandboxReferenceBackdropSummary();
    const second = createAtlasUniverseSandboxReferenceBackdropSummary();

    expect(first).toEqual(second);
    expect(first.version).toBe(ATLAS_UNIVERSE_SANDBOX_REFERENCE_BACKDROP_VERSION);
    expect(first.referenceMode).toBe("inspired-reference-comparison");
    expect(first.backgroundArtDirection).toBe("sparse-stars-layered-milky-way");
    expect(first.defaultDepthProfile).toBe("overview-sparse-layered-milky-way");
    expect(first.closeupDepthProfile).toBe("closeup-subject-negative-space");
    expect(first.subjectVisibilityProfile).toBe("selected-body-in-frame");
    expect(first.screenshotReview).toBe("local-only");
  });

  it("declares local runtime assets and stable comparison profiles", () => {
    const summary = createAtlasUniverseSandboxReferenceBackdropSummary();

    expect(summary.runtimeAssetSource).toBe("local-public-textures-and-local-catalogs");
    expect(summary.supportedDepthProfiles).toEqual([
      "overview-sparse-layered-milky-way",
      "closeup-subject-negative-space",
      "showcase-reference-depth",
    ]);
    expect(summary.supportedSubjectVisibilityProfiles).toEqual([
      "overview-orbit-readable",
      "selected-body-in-frame",
      "showcase-subject-separated",
    ]);
  });

  it("preserves v41-v46 boundaries and makes no clone, certification, online or mutation claims", () => {
    const summary = createAtlasUniverseSandboxReferenceBackdropSummary();
    const serialized = JSON.stringify(summary).toLowerCase();

    expect(summary.aaBoundaryPreserved).toBe("v41-aa-boundary-preserved");
    expect(summary.cinematicBoundaryPreserved).toBe("v42-cinematic-boundary-preserved");
    expect(summary.planetaryBoundaryPreserved).toBe("v43-planetary-visual-fidelity-preserved");
    expect(summary.lightingBoundaryPreserved).toBe("v44-cinematic-lighting-preserved");
    expect(summary.chineseBoundaryPreserved).toBe("v45-chinese-deep-space-fidelity-preserved");
    expect(summary.deepSpaceCameraBoundaryPreserved).toBe("v46-cinematic-deep-space-camera-preserved");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.runtimeCertificationStatus).toBe("not-claimed-in-app");
    expect(summary.artisticCertificationStatus).toBe("not-claimed");
    expect(summary.scientificCertificationStatus).toBe("not-claimed");
    expect(summary.wcagCertificationStatus).toBe("not-claimed");
    expect(summary.universeSandboxCloneStatus).toBe("not-claimed");
    expect(summary.onlineValidationStatus).toBe("not-claimed");
    expect(serialized).not.toContain("trustscore");
    expect(serialized).not.toContain("online-source");
    expect(serialized).not.toContain("physics mutation applied");
    expect(serialized).not.toMatch(/pass|passed|ci-certified/i);
  });
});
