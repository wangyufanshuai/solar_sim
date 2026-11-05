import { describe, expect, it } from "vitest";
import {
  CURRENT_SCIENTIFIC_PROMOTION_DECISION_V7,
  createScientificPromotionDecisionV7,
} from "./scientificPromotionDecisionV7";

describe("v187 canonical scientific promotion decision", () => {
  it("retains the legacy kernel when current V9 evidence is incomplete and does not improve the aggregate", () => {
    const decision = CURRENT_SCIENTIFIC_PROMOTION_DECISION_V7;
    expect(decision.absoluteErrorGatePassed).toBe(true);
    expect(decision.comparativeAggregateImprovementDemonstrated).toBe(false);
    expect(decision.independentPerBodyComparisonComplete).toBe(true);
    expect(decision.effectIsolationComplete).toBe(false);
    expect(decision.perBodyNoRegression).toBe(false);
    expect(decision.supportingGatesPassed).toBe(false);
    expect(decision.blockers).toContain(
      "candidate-does-not-improve-legacy-aggregate-rms",
    );
    expect(decision.blockers).toContain(
      "2pn-lense-thirring-effect-isolation-pending",
    );
    expect(decision.status).toBe("shadow-retained");
    expect(decision.defaultKernel).toBe("legacy-eih-1pn");
    expect(decision.promotionApplied).toBe(false);
  });

  it("requires aggregate, per-body, effect-isolation and supporting evidence", () => {
    const decision = createScientificPromotionDecisionV7({
      legacyPositionRmsKm: 60,
      legacyVelocityRmsMS: 0.2,
      candidatePositionRmsKm: 50,
      candidateVelocityRmsMS: 0.1,
      independentPerBodyComparisonComplete: true,
      perBodyNoRegression: true,
      effectIsolationComplete: true,
      supportingGatesPassed: true,
    });
    expect(decision.promotionQualified).toBe(true);
    expect(decision.status).toBe("promotion-qualified-not-applied");
    expect(decision.promotionApplied).toBe(false);
    expect(decision.defaultKernel).toBe("legacy-eih-1pn");
  });

  it("cannot represent a live promotion in the v187 research boundary", () => {
    const decision = createScientificPromotionDecisionV7({
      legacyPositionRmsKm: 60,
      legacyVelocityRmsMS: 0.2,
      candidatePositionRmsKm: 50,
      candidateVelocityRmsMS: 0.1,
      independentPerBodyComparisonComplete: true,
      perBodyNoRegression: true,
      effectIsolationComplete: false,
      supportingGatesPassed: true,
    });
    expect(decision.status).toBe("shadow-retained");
    expect(decision.blockers).toContain(
      "2pn-lense-thirring-effect-isolation-pending",
    );
  });
});
