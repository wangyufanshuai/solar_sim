import { describe, expect, it } from "vitest";
import { createAtlasScientificPromotionV2Summary } from "./atlasScientificPromotionV2";

describe("v130 scientific promotion gate", () => {
  it("retains legacy EIH 1PN when new evidence is absent", () => {
    const summary = createAtlasScientificPromotionV2Summary({
      catalogDocumentCount: 224_361,
      exoplanetSystemCount: 4_735,
      ktx2AssetCount: 35,
    });
    expect(summary.promotionDecision).toBe("blocked-shadow-retained");
    expect(summary.defaultRelativityKernel).toBe("legacy-eih-1pn");
    expect(summary.shadowKernel).toBe("relativity-force-model-v2");
    expect(summary.blockers).toContain(
      "ten-year-position-rms-promotion-gate-not-passed",
    );
  });

  it("promotes only when every catalog, science, performance and regression gate passes", () => {
    const summary = createAtlasScientificPromotionV2Summary({
      catalogDocumentCount: 224_361,
      exoplanetSystemCount: 4_735,
      ktx2AssetCount: 35,
      tenYearPositionRmsKm: 9_999,
      tenYearVelocityRmsMS: 0.99,
      kerrInvariantGatePassed: true,
      performanceGatePassed: true,
      regressionGatePassed: true,
    });
    expect(summary.promotionReady).toBe(true);
    expect(summary.defaultRelativityKernel).toBe("relativity-force-model-v2");
    expect(summary.blockers).toEqual([]);
  });
});
