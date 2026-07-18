import { describe, expect, it } from "vitest";
import {
  ATLAS_REFERENCE_GRADE_SPACE_ART_VERSION,
  createAtlasReferenceGradeSpaceArtSummary,
} from "./atlasReferenceGradeSpaceArt";

describe("createAtlasReferenceGradeSpaceArtSummary", () => {
  it("returns deterministic v48 reference-grade space art metadata", () => {
    const first = createAtlasReferenceGradeSpaceArtSummary();
    const second = createAtlasReferenceGradeSpaceArtSummary();

    expect(first).toEqual(second);
    expect(first.version).toBe(ATLAS_REFERENCE_GRADE_SPACE_ART_VERSION);
    expect(first.artDirection).toBe("cinematic-scientific-space-simulation");
    expect(first.assetPolicy).toBe("generated-local-runtime-assets");
    expect(first.reviewMode).toBe("local-reference-screenshot-rubric");
    expect(first.defaultCompositeProfile).toBe("overview-layered-reference-grade");
    expect(first.closeupCompositeProfile).toBe("selected-body-subject-matte");
    expect(first.defaultSkyLayerProfile).toBe("v48-local-generated-layered-sky");
    expect(first.closeupStarfieldProfile).toBe("closeup-star-noise-suppressed");
    expect(first.closeupSubjectMatteProfile).toBe("selected-body-background-matte");
    expect(first.gasGiantPlanetMaterialProfile).toBe("gas-giant-ring-readability");
  });

  it("preserves v41-v47 boundaries", () => {
    const summary = createAtlasReferenceGradeSpaceArtSummary();

    expect(summary.aaBoundaryPreserved).toBe("v41-aa-boundary-preserved");
    expect(summary.cinematicBoundaryPreserved).toBe("v42-cinematic-boundary-preserved");
    expect(summary.planetaryBoundaryPreserved).toBe("v43-planetary-visual-fidelity-preserved");
    expect(summary.lightingBoundaryPreserved).toBe("v44-cinematic-lighting-preserved");
    expect(summary.chineseBoundaryPreserved).toBe("v45-chinese-deep-space-fidelity-preserved");
    expect(summary.deepSpaceCameraBoundaryPreserved).toBe("v46-cinematic-deep-space-camera-preserved");
    expect(summary.universeSandboxReferenceBoundaryPreserved).toBe(
      "v47-universe-sandbox-reference-backdrop-preserved",
    );
    expect(summary.trustedBoundary).toContain("v47 Universe Sandbox reference");
  });

  it("does not claim certification, online validation, runtime command status, clone status, or physics mutation", () => {
    const summary = createAtlasReferenceGradeSpaceArtSummary();
    const serialized = JSON.stringify(summary).toLowerCase();

    expect(summary.runtimeCertificationStatus).toBe("not-claimed-in-app");
    expect(summary.artisticCertificationStatus).toBe("not-claimed");
    expect(summary.scientificCertificationStatus).toBe("not-claimed");
    expect(summary.wcagCertificationStatus).toBe("not-claimed");
    expect(summary.universeSandboxCloneStatus).toBe("not-claimed");
    expect(summary.onlineValidationStatus).toBe("not-claimed");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(serialized).not.toContain("trustscore");
    expect(serialized).not.toMatch(/online-source|online source|runtime passed|ci-certified|aaa-certified|wcag-certified|science-certified|clone-certified|physics mutation applied/i);
  });
});
