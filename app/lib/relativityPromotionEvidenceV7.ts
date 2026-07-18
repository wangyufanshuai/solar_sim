import {
  createScientificPromotionDecisionV7,
  type ScientificPromotionDecisionV7,
} from "./scientificPromotionDecisionV7";

export const RELATIVITY_PROMOTION_EVIDENCE_V7_VERSION =
  "v188-relativity-promotion-evidence-v7" as const;

export type RelativityComparisonModeV7 =
  | "newton"
  | "legacy-eih-1pn"
  | "legacy-plus-2pn-only"
  | "legacy-plus-lense-thirring-only"
  | "eih-1pn-2pn-lt";

export type RelativityPerBodyCheckpointV7 = {
  bodyId: string;
  legacyPositionResidualKm: number;
  candidatePositionResidualKm: number;
  positionDeltaKm: number;
  positionUncertaintyKm: number;
  legacyVelocityResidualMS: number;
  candidateVelocityResidualMS: number;
  velocityDeltaMS: number;
  velocityUncertaintyMS: number;
  noRegression: boolean;
};

export type RelativityEffectIsolationReportV1 = {
  effectId: "solar-2pn" | "lense-thirring";
  mode:
    | "legacy-plus-2pn-only"
    | "legacy-plus-lense-thirring-only";
  checkpoints: readonly {
    label: string;
    offsetDays: number;
    bodies: readonly {
      bodyId: string;
      positionEffectKm: number;
      velocityEffectMS: number;
      positionUncertaintyKm: number;
      velocityUncertaintyMS: number;
      positionSnr: number;
      velocitySnr: number;
      resolved: boolean;
    }[];
  }[];
};

export type RelativityPromotionReportV7 = {
  version: "v188-scipy-dop853-per-body-effect-isolation-v7";
  generatedAt: string;
  fixture: string;
  fixtureSha256: string;
  coordinateFrame: "DE440-sun-centered-J2000-ecliptic";
  timeScale: "TDB";
  uncertaintyPolicy?: {
    formula: "max(5*abs(coarse-fine),fixture-serialization-floor)";
    positionFloorKm: number;
    velocityFloorMS: number;
    effectSnrMinimum: 5;
  };
  promotionEvaluation: {
    absoluteErrorGatePassed: boolean;
    aggregateImprovementBeyondUncertainty: boolean;
    perBodyNoRegression: boolean;
    effectIsolationComplete: boolean;
    promotionQualified: boolean;
    legacyTenYear: { positionRmsKm: number; velocityRmsMS: number };
    candidateTenYear: { positionRmsKm: number; velocityRmsMS: number };
  };
  perBodyComparison: readonly {
    label: string;
    offsetDays: number;
    bodies: readonly RelativityPerBodyCheckpointV7[];
  }[];
  effectIsolation: readonly RelativityEffectIsolationReportV1[];
  liveStateMutated: false;
  workerStateMutated: false;
  defaultKernel: "legacy-eih-1pn";
  shadowKernel: "eih-1pn-2pn-lt";
};

export type AtlasScientificEvidenceManifestV7 = {
  version: typeof RELATIVITY_PROMOTION_EVIDENCE_V7_VERSION;
  artifact: string;
  sha256: string;
  fixtureSha256: string;
  coordinateFrame: RelativityPromotionReportV7["coordinateFrame"];
  timeScale: RelativityPromotionReportV7["timeScale"];
  checkpointCount: number;
  bodyCount: number;
  effectCount: number;
  decision: ScientificPromotionDecisionV7;
  boundary: "checksummed-offline-research-evidence-no-runtime-promotion";
};

export type AtlasScientificEvidenceSummaryV7 = {
  version: typeof RELATIVITY_PROMOTION_EVIDENCE_V7_VERSION;
  generatedAt: string;
  artifactSha256: string;
  fixtureSha256: string;
  checkpointCount: number;
  bodyCount: number;
  effectCount: number;
  promotionEvaluation: RelativityPromotionReportV7["promotionEvaluation"];
  decision: ScientificPromotionDecisionV7;
  capability: "summary-only-full-per-body-evidence-available-in-standalone-and-desktop";
  boundary: AtlasScientificEvidenceManifestV7["boundary"];
};

export function createScientificPromotionDecisionFromRelativityReportV7(
  report: RelativityPromotionReportV7,
  supportingGatesPassed: boolean,
): ScientificPromotionDecisionV7 {
  const evaluation = report.promotionEvaluation;
  const perBodyComparisonComplete =
    report.perBodyComparison.length === 3 &&
    report.perBodyComparison.every((checkpoint) => checkpoint.bodies.length > 0);
  const perBodyNoRegression =
    evaluation.perBodyNoRegression &&
    perBodyComparisonComplete &&
    report.perBodyComparison.every((checkpoint) =>
      checkpoint.bodies.every((body) => body.noRegression),
    );
  const effectIsolationComplete =
    evaluation.effectIsolationComplete &&
    report.effectIsolation.length === 2 &&
    report.effectIsolation.every((effect) =>
      effect.checkpoints.length === 3 &&
      effect.checkpoints.every((checkpoint) =>
        checkpoint.bodies.length > 0 &&
        checkpoint.bodies.every((body) => body.resolved),
      ),
    );
  return createScientificPromotionDecisionV7({
    legacyPositionRmsKm: evaluation.legacyTenYear.positionRmsKm,
    legacyVelocityRmsMS: evaluation.legacyTenYear.velocityRmsMS,
    candidatePositionRmsKm: evaluation.candidateTenYear.positionRmsKm,
    candidateVelocityRmsMS: evaluation.candidateTenYear.velocityRmsMS,
    comparativeAggregateImprovementDemonstrated:
      evaluation.aggregateImprovementBeyondUncertainty,
    independentPerBodyComparisonComplete: perBodyComparisonComplete,
    perBodyNoRegression,
    effectIsolationComplete,
    supportingGatesPassed,
  });
}
