import type { ScientificPromotionDecisionV6 } from "./scientificPromotionDecisionV6";
import { ATLAS_CURRENT_EVIDENCE_INPUT_V233 } from "./atlasCurrentEvidenceManifestV233.generated";

export const SCIENTIFIC_PROMOTION_DECISION_V7_VERSION =
  "v187-scientific-promotion-decision-v7" as const;

export type ScientificPromotionStatusV7 =
  | "shadow-retained"
  | "promotion-qualified-not-applied"
  | "promoted";

export type ScientificPromotionDecisionV7 = {
  version: typeof SCIENTIFIC_PROMOTION_DECISION_V7_VERSION;
  status: Exclude<ScientificPromotionStatusV7, "promoted">;
  absoluteErrorGatePassed: boolean;
  comparativeAggregateImprovementDemonstrated: boolean;
  independentPerBodyComparisonComplete: boolean;
  perBodyNoRegression: boolean;
  effectIsolationComplete: boolean;
  supportingGatesPassed: boolean;
  legacy: { positionRmsKm: number; velocityRmsMS: number };
  candidate: { positionRmsKm: number; velocityRmsMS: number };
  deltaVsLegacy: { positionKm: number; velocityMS: number };
  promotionQualified: boolean;
  promotionApplied: false;
  defaultKernel: "legacy-eih-1pn";
  shadowKernel: "eih-1pn-2pn-lt";
  blockers: readonly string[];
  boundary: "decision-only-no-live-or-worker-physics-mutation";
};

export type ScientificPromotionDecisionV7Input = {
  legacyPositionRmsKm: number;
  legacyVelocityRmsMS: number;
  candidatePositionRmsKm: number;
  candidateVelocityRmsMS: number;
  independentPerBodyComparisonComplete?: boolean;
  perBodyNoRegression?: boolean;
  effectIsolationComplete?: boolean;
  supportingGatesPassed?: boolean;
  comparativeAggregateImprovementDemonstrated?: boolean;
};

export function createScientificPromotionDecisionV7(
  input: ScientificPromotionDecisionV7Input,
): ScientificPromotionDecisionV7 {
  const absoluteErrorGatePassed =
    input.candidatePositionRmsKm < 10_000 &&
    input.candidateVelocityRmsMS < 1;
  const comparativeAggregateImprovementDemonstrated =
    input.comparativeAggregateImprovementDemonstrated ??
    (input.candidatePositionRmsKm <= input.legacyPositionRmsKm &&
      input.candidateVelocityRmsMS <= input.legacyVelocityRmsMS);
  const independentPerBodyComparisonComplete =
    input.independentPerBodyComparisonComplete === true;
  const effectIsolationComplete = input.effectIsolationComplete === true;
  const perBodyNoRegression = input.perBodyNoRegression === true;
  const supportingGatesPassed = input.supportingGatesPassed === true;
  const blockers = [
    ...(absoluteErrorGatePassed ? [] : ["candidate-absolute-error-gate-not-passed"]),
    ...(comparativeAggregateImprovementDemonstrated
      ? []
      : ["candidate-does-not-improve-legacy-aggregate-rms"]),
    ...(independentPerBodyComparisonComplete
      ? []
      : ["independent-per-body-dop853-comparison-pending"]),
    ...(perBodyNoRegression ? [] : ["candidate-per-body-regression-detected-or-pending"]),
    ...(effectIsolationComplete
      ? []
      : ["2pn-lense-thirring-effect-isolation-pending"]),
    ...(supportingGatesPassed ? [] : ["supporting-release-gates-pending"]),
  ];
  const promotionQualified = blockers.length === 0;

  return {
    version: SCIENTIFIC_PROMOTION_DECISION_V7_VERSION,
    status: promotionQualified
      ? "promotion-qualified-not-applied"
      : "shadow-retained",
    absoluteErrorGatePassed,
    comparativeAggregateImprovementDemonstrated,
    independentPerBodyComparisonComplete,
    perBodyNoRegression,
    effectIsolationComplete,
    supportingGatesPassed,
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
    promotionQualified,
    promotionApplied: false,
    defaultKernel: "legacy-eih-1pn",
    shadowKernel: "eih-1pn-2pn-lt",
    blockers,
    boundary: "decision-only-no-live-or-worker-physics-mutation",
  };
}

export function adaptScientificPromotionDecisionV6(
  decision: ScientificPromotionDecisionV6,
  supportingGatesPassed = false,
): ScientificPromotionDecisionV7 {
  return createScientificPromotionDecisionV7({
    legacyPositionRmsKm: decision.legacy.positionRmsKm,
    legacyVelocityRmsMS: decision.legacy.velocityRmsMS,
    candidatePositionRmsKm: decision.candidate.positionRmsKm,
    candidateVelocityRmsMS: decision.candidate.velocityRmsMS,
    independentPerBodyComparisonComplete:
      decision.independentPerBodyComparisonComplete,
    perBodyNoRegression: false,
    effectIsolationComplete: false,
    supportingGatesPassed,
  });
}

export const CURRENT_SCIENTIFIC_PROMOTION_DECISION_V7 =
  createScientificPromotionDecisionV7(
    ATLAS_CURRENT_EVIDENCE_INPUT_V233.promotionInput,
  );
