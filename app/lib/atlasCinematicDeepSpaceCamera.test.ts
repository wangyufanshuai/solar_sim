import { describe, expect, it } from "vitest";
import {
  ATLAS_CINEMATIC_DEEP_SPACE_CAMERA_VERSION,
  createAtlasCinematicDeepSpaceCameraSummary,
} from "./atlasCinematicDeepSpaceCamera";

describe("createAtlasCinematicDeepSpaceCameraSummary", () => {
  it("returns deterministic v46 camera composition metadata", () => {
    const first = createAtlasCinematicDeepSpaceCameraSummary();
    const second = createAtlasCinematicDeepSpaceCameraSummary();

    expect(first).toEqual(second);
    expect(first.version).toBe(ATLAS_CINEMATIC_DEEP_SPACE_CAMERA_VERSION);
    expect(first.visualTarget).toBe("cinematic-deep-space-camera-composition");
    expect(first.defaultCameraProfile).toBe("overview-atlas");
    expect(first.closeupCameraProfile).toBe("selected-body-cinematic");
    expect(first.showcaseCameraProfile).toBe("showcase-deep-space");
    expect(first.qualityBudget).toBe("stable-high-fidelity");
  });

  it("declares supported composition profiles without runtime result claims", () => {
    const summary = createAtlasCinematicDeepSpaceCameraSummary();

    expect(summary.supportedCameraProfiles).toEqual([
      "overview-atlas",
      "selected-body-cinematic",
      "showcase-deep-space",
    ]);
    expect(summary.supportedSkyCompositionProfiles).toContain("subject-separated-deep-space");
    expect(summary.supportedBackgroundNoiseProfiles).toContain("closeup-low-noise");
    expect(summary.supportedTargetSeparationProfiles).toContain("selected-body-limb-and-negative-space");
    expect(summary.runtimeCertificationStatus).toBe("not-claimed-in-app");
    expect(JSON.stringify(summary)).not.toMatch(/pass|passed|ci-certified/i);
  });

  it("preserves v41-v45 boundaries and makes no certification or mutation claims", () => {
    const summary = createAtlasCinematicDeepSpaceCameraSummary();
    const serialized = JSON.stringify(summary).toLowerCase();

    expect(summary.aaBoundaryPreserved).toBe("v41-aa-boundary-preserved");
    expect(summary.cinematicBoundaryPreserved).toBe("v42-cinematic-boundary-preserved");
    expect(summary.planetaryBoundaryPreserved).toBe("v43-planetary-visual-fidelity-preserved");
    expect(summary.lightingBoundaryPreserved).toBe("v44-cinematic-lighting-preserved");
    expect(summary.chineseBoundaryPreserved).toBe("v45-chinese-deep-space-fidelity-preserved");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.artisticCertificationStatus).toBe("not-claimed");
    expect(summary.wcagCertificationStatus).toBe("not-claimed");
    expect(summary.scientificCertificationStatus).toBe("not-claimed");
    expect(summary.onlineValidationStatus).toBe("not-claimed");
    expect(serialized).not.toContain("trustscore");
    expect(serialized).not.toContain("online-source");
    expect(serialized).not.toContain("physics mutation applied");
  });
});
