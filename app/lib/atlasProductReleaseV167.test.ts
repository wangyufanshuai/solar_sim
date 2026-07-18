import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createAtlasProductReleaseV167Summary } from "./atlasProductReleaseV167";

describe("v167 product release evidence closure", () => {
  it("separates verified product QA from blocked scientific promotion", () => {
    const summary = createAtlasProductReleaseV167Summary();
    expect(summary.predecessorVersion).toContain("v160-v166");
    expect(summary.productReleaseStatus).toBe("verified-web-standalone-release-candidate");
    expect(summary.releaseStatus).toBe("product-rc-verified-science-shadow-retained");
    expect(summary.productBlockers).toEqual([]);
    expect(summary.scientificPromotionStatus).toBe("shadow-retained-no-demonstrated-improvement");
    expect(summary.scientificBlockers).toContain("candidate-does-not-improve-legacy-aggregate-rms");
    expect(summary.defaultScientificKernel).toBe("legacy-eih-1pn");
    expect(summary.shadowScientificKernel).toBe("eih-1pn-2pn-lt");
    expect(summary.promotionApplied).toBe(false);
  });

  it("publishes the split release truth in current documentation", () => {
    const readme = readFileSync("README.md", "utf8");
    const overview = readFileSync("docs/TECHNICAL_OVERVIEW.md", "utf8");
    for (const text of [readme, overview]) {
      expect(text).toContain("product-rc-verified-science-shadow-retained");
      expect(text).toContain("performance-v166-report.json");
      expect(text).toContain("legacy-eih-1pn");
    }
  });
});
