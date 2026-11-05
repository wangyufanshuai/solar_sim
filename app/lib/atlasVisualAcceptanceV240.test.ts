import { describe, expect, it } from "vitest";
import {
  ATLAS_VISUAL_ACCEPTANCE_V240,
  ATLAS_VISUAL_RISK_FRAMES_V240,
  atlasVisualRiskFramesForViewportV240,
} from "./atlasVisualAcceptanceV240";

describe("v240 visual acceptance", () => {
  it("locks the 36 journey frames plus four targeted risk frames", () => {
    expect(ATLAS_VISUAL_ACCEPTANCE_V240.totalFrameCount).toBe(40);
    expect(ATLAS_VISUAL_RISK_FRAMES_V240).toHaveLength(4);
    expect(atlasVisualRiskFramesForViewportV240("desktop-1440x900")).toHaveLength(2);
    expect(atlasVisualRiskFramesForViewportV240("mobile-390x844")).toHaveLength(2);
  });

  it("keeps baseline promotion explicit and the scientific boundary frozen", () => {
    expect(ATLAS_VISUAL_ACCEPTANCE_V240.automaticBaselineReplacement).toBe(false);
    expect(ATLAS_VISUAL_ACCEPTANCE_V240.baselineUpdateEnvironmentVariable).toBe(
      "ATLAS_UPDATE_VISUAL_BASELINES",
    );
    expect(ATLAS_VISUAL_ACCEPTANCE_V240.boundary).toContain("do not add root attributes");
    expect(ATLAS_VISUAL_ACCEPTANCE_V240.boundary).toContain("V9");
  });
});

