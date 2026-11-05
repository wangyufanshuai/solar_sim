import { describe, expect, it } from "vitest";
import {
  ATLAS_VISUAL_QUALITY_BUDGET_V220,
  coverageInAtlasSafeSceneV217,
  createAtlasSafeSceneRectV217,
} from "./atlasVisualQualityV217";

describe("atlas visual quality v217", () => {
  it("measures subject coverage against the unoccluded short edge", () => {
    const rect = createAtlasSafeSceneRectV217({
      viewportWidth: 390,
      viewportHeight: 844,
      top: 48,
      bottom: 456,
    });
    expect(rect).toEqual({ left: 0, top: 48, right: 390, bottom: 456, width: 390, height: 408 });
    expect(coverageInAtlasSafeSceneV217(195, rect)).toBeCloseTo(0.5, 8);
  });

  it("keeps the 600 KiB recommendation separate from the 610 KiB hard gate", () => {
    expect(ATLAS_VISUAL_QUALITY_BUDGET_V220.recommendedCanvasReadyJsBytes).toBe(600 * 1024);
    expect(ATLAS_VISUAL_QUALITY_BUDGET_V220.hardCanvasReadyJsBytes).toBe(610 * 1024);
    expect(ATLAS_VISUAL_QUALITY_BUDGET_V220.stablePerceptualSimilarity).toBe(0.97);
  });
});

