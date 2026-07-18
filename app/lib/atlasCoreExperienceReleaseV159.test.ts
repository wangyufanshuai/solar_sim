import { describe, expect, it } from "vitest";
import { createAtlasCoreExperienceReleaseV159Summary } from "./atlasCoreExperienceReleaseV159";
import { CURRENT_SCIENTIFIC_PROMOTION_DECISION_V6 } from "./scientificPromotionDecisionV6";

describe("v154-v159 core experience release", () => {
  it("publishes the implemented focus, catalog, material, launch and science contracts", () => {
    const summary = createAtlasCoreExperienceReleaseV159Summary();
    expect(summary.version).toBe("v154-v159-core-experience-release");
    expect(summary.focusVersion).toContain("v154");
    expect(summary.catalogDeliveryVersion).toContain("v156");
    expect(summary.materialVersion).toContain("v157");
    expect(summary.launchVersion).toContain("v158");
    expect(summary.scientificDecisionVersion).toContain("v159");
    expect(summary.defaultScientificKernel).toBe("legacy-eih-1pn");
  });

  it("never promotes the current candidate based on the absolute gate alone", () => {
    expect(CURRENT_SCIENTIFIC_PROMOTION_DECISION_V6.absoluteErrorGatePassed).toBe(true);
    expect(CURRENT_SCIENTIFIC_PROMOTION_DECISION_V6.promotionEligible).toBe(false);
    expect(CURRENT_SCIENTIFIC_PROMOTION_DECISION_V6.promotionApplied).toBe(false);
  });
});
