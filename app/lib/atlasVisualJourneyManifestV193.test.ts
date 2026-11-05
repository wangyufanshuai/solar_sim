import { describe, expect, it } from "vitest";
import {
  ATLAS_VISUAL_JOURNEY_MANIFEST_V193,
  atlasVisualJourneyScreenshotCount,
  atlasVisualJourneyScreenshotName,
} from "./atlasVisualJourneyManifestV193";

describe("v193 visual journey matrix", () => {
  it("locks six journeys, two viewports and three keyframes", () => {
    expect(ATLAS_VISUAL_JOURNEY_MANIFEST_V193.journeys).toHaveLength(6);
    expect(Object.keys(ATLAS_VISUAL_JOURNEY_MANIFEST_V193.viewports)).toEqual([
      "desktop-1440x900",
      "mobile-390x844",
    ]);
    expect(atlasVisualJourneyScreenshotCount()).toBe(36);
    for (const journey of ATLAS_VISUAL_JOURNEY_MANIFEST_V193.journeys) {
      expect(journey.frames.map((frame) => frame.keyframe)).toEqual([
        "entry",
        "hero",
        "exit",
      ]);
    }
  });

  it("uses stable unique screenshot paths", () => {
    const names = Object.keys(ATLAS_VISUAL_JOURNEY_MANIFEST_V193.viewports).flatMap(
      (viewport) =>
        ATLAS_VISUAL_JOURNEY_MANIFEST_V193.journeys.flatMap((journey) =>
          journey.frames.map((frame) =>
            atlasVisualJourneyScreenshotName(
              viewport as keyof typeof ATLAS_VISUAL_JOURNEY_MANIFEST_V193.viewports,
              journey.id,
              frame.keyframe,
            ),
          ),
        ),
    );
    expect(new Set(names).size).toBe(36);
    expect(names).toContain("mobile-390x844/launch-hero.png");
    expect(names).toContain("desktop-1440x900/scene-lab-exit.png");
  });

  it("keeps visual baselines review-only and within the agreed gates", () => {
    const { metrics } = ATLAS_VISUAL_JOURNEY_MANIFEST_V193;
    expect(metrics.perceptualReviewWarningBelow).toBe(0.94);
    expect(metrics.planetCoverage).toEqual([0.4, 0.52]);
    expect(metrics.stellarCoverage).toEqual([0.34, 0.48]);
    expect(metrics.cameraResponseMaxMs).toBe(100);
    expect(ATLAS_VISUAL_JOURNEY_MANIFEST_V193.baselineUpdateEnvironmentVariable).toBe(
      "ATLAS_UPDATE_VISUAL_BASELINES",
    );
    expect(ATLAS_VISUAL_JOURNEY_MANIFEST_V193.boundary).toContain("does not add runtime root attributes");
  });
});
