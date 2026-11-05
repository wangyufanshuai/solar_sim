import { describe, expect, it } from "vitest";
import {
  createAtlasFinalReleaseSummary,
  createScientificPromotionEvidenceV3,
} from "./atlasReleaseProgram";

describe("v131-v140 final release program", () => {
  it("keeps the million-object catalog separate from visible Gaia budgets", () => {
    const summary = createAtlasFinalReleaseSummary();
    expect(summary.catalogTarget).toBe(1_000_000);
    expect(summary.visibleGaiaBudgets).toEqual([1_000, 1_800, 3_000]);
    expect(summary.memoryPolicy).toBe("16gb-single-heavy-process");
  });

  it("fails closed until every relativity promotion gate passes", () => {
    expect(createScientificPromotionEvidenceV3().defaultKernel).toBe("legacy-eih-1pn");
    expect(createScientificPromotionEvidenceV3({
      positionRmsKm: 9_999,
      velocityRmsMS: 0.99,
      kerrInvariantPassed: true,
      performancePassed: true,
      regressionPassed: true,
    }).defaultKernel).toBe("relativity-force-model-v2");
  });
});
