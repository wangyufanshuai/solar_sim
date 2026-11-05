import { describe, expect, it } from "vitest";
import { CURRENT_SCIENTIFIC_PROMOTION_DECISION_V6, createScientificPromotionDecisionV6 } from "./scientificPromotionDecisionV6";

describe("v159 scientific promotion integrity", () => {
  it("separates absolute gate passage from comparative improvement", () => {
    const decision = CURRENT_SCIENTIFIC_PROMOTION_DECISION_V6;
    expect(decision.absoluteErrorGatePassed).toBe(true);
    expect(decision.comparativeImprovementDemonstrated).toBe(false);
    expect(decision.deltaVsLegacy.positionKm).toBeGreaterThan(0);
    expect(decision.promotionApplied).toBe(false);
    expect(decision.defaultKernel).toBe("legacy-eih-1pn");
  });

  it("remains fail-closed even if a candidate improves aggregate RMS without per-body evidence", () => {
    const decision = createScientificPromotionDecisionV6({
      legacyPositionRmsKm: 60,
      legacyVelocityRmsMS: 0.2,
      candidatePositionRmsKm: 50,
      candidateVelocityRmsMS: 0.1,
    });
    expect(decision.comparativeImprovementDemonstrated).toBe(true);
    expect(decision.promotionEligible).toBe(false);
    expect(decision.blockers).toContain("independent-per-body-dop853-comparison-pending");
  });
});
