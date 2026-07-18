import { describe, expect, it } from "vitest";
import {
  createScientificPromotionDecisionFromRelativityReportV7,
  type RelativityPromotionReportV7,
} from "./relativityPromotionEvidenceV7";

function report(overrides: Partial<RelativityPromotionReportV7["promotionEvaluation"]> = {}): RelativityPromotionReportV7 {
  const bodies = [{
    bodyId: "mercury",
    legacyPositionResidualKm: 2,
    candidatePositionResidualKm: 1,
    positionDeltaKm: -1,
    positionUncertaintyKm: 0.01,
    legacyVelocityResidualMS: 0.2,
    candidateVelocityResidualMS: 0.1,
    velocityDeltaMS: -0.1,
    velocityUncertaintyMS: 0.001,
    noRegression: true,
  }];
  const effectCheckpoints = [30, 365, 3652.5].map((offsetDays) => ({
    label: String(offsetDays),
    offsetDays,
    bodies: [{
      bodyId: "mercury",
      positionEffectKm: 0.1,
      velocityEffectMS: 0.001,
      positionUncertaintyKm: 0.001,
      velocityUncertaintyMS: 0.00001,
      positionSnr: 100,
      velocitySnr: 100,
      resolved: true,
    }],
  }));
  return {
    version: "v188-scipy-dop853-per-body-effect-isolation-v7",
    generatedAt: "2026-07-14T00:00:00Z",
    fixture: "fixture.json",
    fixtureSha256: "a".repeat(64),
    coordinateFrame: "DE440-sun-centered-J2000-ecliptic",
    timeScale: "TDB",
    promotionEvaluation: {
      absoluteErrorGatePassed: true,
      aggregateImprovementBeyondUncertainty: true,
      perBodyNoRegression: true,
      effectIsolationComplete: true,
      promotionQualified: true,
      legacyTenYear: { positionRmsKm: 2, velocityRmsMS: 0.2 },
      candidateTenYear: { positionRmsKm: 1, velocityRmsMS: 0.1 },
      ...overrides,
    },
    perBodyComparison: [30, 365, 3652.5].map((offsetDays) => ({ label: String(offsetDays), offsetDays, bodies })),
    effectIsolation: [
      { effectId: "solar-2pn", mode: "legacy-plus-2pn-only", checkpoints: effectCheckpoints },
      { effectId: "lense-thirring", mode: "legacy-plus-lense-thirring-only", checkpoints: effectCheckpoints },
    ],
    liveStateMutated: false,
    workerStateMutated: false,
    defaultKernel: "legacy-eih-1pn",
    shadowKernel: "eih-1pn-2pn-lt",
  };
}

describe("v188 relativity promotion evidence", () => {
  it("qualifies complete evidence without applying it", () => {
    const decision = createScientificPromotionDecisionFromRelativityReportV7(report(), true);
    expect(decision.status).toBe("promotion-qualified-not-applied");
    expect(decision.promotionApplied).toBe(false);
  });

  it("retains shadow when effect isolation is unresolved", () => {
    const decision = createScientificPromotionDecisionFromRelativityReportV7(report({ effectIsolationComplete: false }), true);
    expect(decision.status).toBe("shadow-retained");
    expect(decision.blockers).toContain("2pn-lense-thirring-effect-isolation-pending");
  });
});
