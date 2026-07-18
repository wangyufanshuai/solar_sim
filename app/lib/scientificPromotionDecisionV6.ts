export const SCIENTIFIC_PROMOTION_DECISION_V6_VERSION =
  "v159-scientific-promotion-decision-v6" as const;

export type ScientificPromotionDecisionV6 = {
  version: typeof SCIENTIFIC_PROMOTION_DECISION_V6_VERSION;
  absoluteErrorGatePassed: boolean;
  comparativeImprovementDemonstrated: boolean;
  independentPerBodyComparisonComplete: boolean;
  legacy: { positionRmsKm: number; velocityRmsMS: number };
  candidate: { positionRmsKm: number; velocityRmsMS: number };
  deltaVsLegacy: { positionKm: number; velocityMS: number };
  effectEvidence: {
    mercuryPrecession: "analytic-1pn-anchor-42.98-arcsec-per-century";
    solar2Pn: "shadow-formula-present-incremental-effect-not-yet-isolated-per-body";
    lenseThirring: "shadow-formula-present-incremental-effect-not-yet-isolated-per-body";
  };
  promotionEligible: false;
  promotionApplied: false;
  decision: "shadow-retained-no-demonstrated-improvement";
  defaultKernel: "legacy-eih-1pn";
  shadowKernel: "eih-1pn-2pn-lt";
  blockers: readonly string[];
  boundary: "decision-only-no-live-or-worker-physics-mutation";
};

export function createScientificPromotionDecisionV6(input: {
  legacyPositionRmsKm: number;
  legacyVelocityRmsMS: number;
  candidatePositionRmsKm: number;
  candidateVelocityRmsMS: number;
  independentPerBodyComparisonComplete?: boolean;
}): ScientificPromotionDecisionV6 {
  const absoluteErrorGatePassed = input.candidatePositionRmsKm < 10_000
    && input.candidateVelocityRmsMS < 1;
  const comparativeImprovementDemonstrated = input.candidatePositionRmsKm <= input.legacyPositionRmsKm
    && input.candidateVelocityRmsMS <= input.legacyVelocityRmsMS;
  const independentPerBodyComparisonComplete = input.independentPerBodyComparisonComplete === true;
  const blockers = [
    ...(comparativeImprovementDemonstrated ? [] : ["candidate-does-not-improve-legacy-aggregate-rms"]),
    ...(independentPerBodyComparisonComplete ? [] : ["independent-per-body-dop853-comparison-pending"]),
  ];
  return {
    version: SCIENTIFIC_PROMOTION_DECISION_V6_VERSION,
    absoluteErrorGatePassed,
    comparativeImprovementDemonstrated,
    independentPerBodyComparisonComplete,
    legacy: {
      positionRmsKm: input.legacyPositionRmsKm,
      velocityRmsMS: input.legacyVelocityRmsMS,
    },
    candidate: {
      positionRmsKm: input.candidatePositionRmsKm,
      velocityRmsMS: input.candidateVelocityRmsMS,
    },
    deltaVsLegacy: {
      positionKm: input.candidatePositionRmsKm - input.legacyPositionRmsKm,
      velocityMS: input.candidateVelocityRmsMS - input.legacyVelocityRmsMS,
    },
    effectEvidence: {
      mercuryPrecession: "analytic-1pn-anchor-42.98-arcsec-per-century",
      solar2Pn: "shadow-formula-present-incremental-effect-not-yet-isolated-per-body",
      lenseThirring: "shadow-formula-present-incremental-effect-not-yet-isolated-per-body",
    },
    promotionEligible: false,
    promotionApplied: false,
    decision: "shadow-retained-no-demonstrated-improvement",
    defaultKernel: "legacy-eih-1pn",
    shadowKernel: "eih-1pn-2pn-lt",
    blockers,
    boundary: "decision-only-no-live-or-worker-physics-mutation",
  };
}

export const CURRENT_SCIENTIFIC_PROMOTION_DECISION_V6 = createScientificPromotionDecisionV6({
  legacyPositionRmsKm: 56.6505914450374,
  legacyVelocityRmsMS: 0.16033513464362867,
  candidatePositionRmsKm: 56.65267986520084,
  candidateVelocityRmsMS: 0.1603358592443529,
  independentPerBodyComparisonComplete: false,
});
