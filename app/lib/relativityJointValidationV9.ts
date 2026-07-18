import type { RelativityRegressionAttributionV9 } from "./relativityResearchV9";

export const RELATIVITY_JOINT_VALIDATION_V9_VERSION =
  "v204-relativity-joint-validation-v9" as const;

export type RelativityJointMetricOutcomeV9 =
  | "cross-solver-regression-confirmed"
  | "cross-solver-improvement-confirmed"
  | "solver-disagreement"
  | "inconclusive"
  | "no-resolved-change";

export type RelativityJointMetricV9 = {
  metric: "position" | "velocity";
  unit: "km" | "m/s";
  dop853Delta: number;
  ias15Delta: number;
  dop853Uncertainty: number;
  ias15Uncertainty: number;
  referenceUncertainty: number;
  jointUncertainty: number;
  jointFormulaCheck: number;
  solverAgreement: boolean;
  outcome: RelativityJointMetricOutcomeV9;
};

export type RelativityJointBodyV9 = {
  bodyId: string;
  metrics: readonly RelativityJointMetricV9[];
  noRegression: boolean;
  classification:
    | Extract<RelativityRegressionAttributionV9, "cross-solver-regression-confirmed" | "solver-implementation">
    | "solver-disagreement"
    | "inconclusive"
    | "no-confirmed-regression";
};

export type RelativityJointValidationReportV9 = {
  version: typeof RELATIVITY_JOINT_VALIDATION_V9_VERSION;
  status: "shadow-retained";
  coordinateFrame: "ICRF-J2000-barycentric";
  timeScale: "TDB";
  deterministicReruns: {
    dop853: { primaryHash: string; rerunHash: string; passed: boolean };
    ias15: { primaryHash: string; rerunHash: string; passed: boolean };
  };
  rawPropagation: {
    checkpoints: ReadonlyArray<{
      label: string;
      offsetDays: number;
      bodies: readonly RelativityJointBodyV9[];
    }>;
    aggregates: Record<"dop853" | "ias15", {
      legacyPositionRmsKm: number;
      candidatePositionRmsKm: number;
      legacyVelocityRmsMS: number;
      candidateVelocityRmsMS: number;
    }>;
  };
  fittedBlindPropagation: {
    status: "complete";
    calibrationWindowDays: [number, number];
    holdoutDays: [number, number];
    deterministicReruns: { count: number; hashes: readonly string[]; passed: boolean };
    mercuryTenYear: {
      bodyId: "mercury";
      dop853PositionDeltaKm: number;
      ias15PositionDeltaKm: number;
      positionJointUncertaintyKm: number;
      outcome: "cross-solver-regression-confirmed" | "cross-solver-improvement-confirmed" |
        "unresolved-within-joint-uncertainty" | "solver-disagreement";
    };
    aggregateImprovement: boolean;
    physicalCauseEstablished: false;
    rawResultsMayNotBeReplaced: true;
  };
  mercuryTenYear: {
    dop853PositionDeltaMeters: number;
    ias15PositionDeltaMeters: number;
    positionJointUncertaintyMeters: number;
    positionOutcome: RelativityJointMetricOutcomeV9;
    physicalCauseEstablished: false;
  };
  promotionEvaluation: {
    promotionQualified: false;
    decision: "shadow-retained";
    confirmedRegressionCount: number;
    aggregateImprovement: boolean;
    fittedBlindComplete: boolean;
  };
  defaultKernel: "legacy-eih-1pn";
  liveStateMutated: false;
  workerStateMutated: false;
};

export function validateRelativityJointReportV9(report: RelativityJointValidationReportV9) {
  const formulaPassed = report.rawPropagation.checkpoints.every((checkpoint) =>
    checkpoint.bodies.every((body) => body.metrics.every((metric) =>
      Number.isFinite(metric.jointUncertainty) &&
      Math.abs(metric.jointUncertainty - (
        metric.dop853Uncertainty + metric.ias15Uncertainty + metric.referenceUncertainty
      )) <= Number.EPSILON * Math.max(1, Math.abs(metric.jointUncertainty)) * 4,
    )),
  );
  const boundaryPassed =
    report.defaultKernel === "legacy-eih-1pn" &&
    report.promotionEvaluation.decision === "shadow-retained" &&
    report.promotionEvaluation.promotionQualified === false &&
    report.liveStateMutated === false &&
    report.workerStateMutated === false;
  return {
    formulaPassed,
    deterministicRerunsPassed:
      report.deterministicReruns.dop853.passed && report.deterministicReruns.ias15.passed &&
      report.fittedBlindPropagation.deterministicReruns.passed,
    mercuryRegressionConfirmed:
      report.mercuryTenYear.positionOutcome === "cross-solver-regression-confirmed" &&
      report.mercuryTenYear.dop853PositionDeltaMeters > report.mercuryTenYear.positionJointUncertaintyMeters &&
      report.mercuryTenYear.ias15PositionDeltaMeters > report.mercuryTenYear.positionJointUncertaintyMeters,
    boundaryPassed,
    fittedBlindPassed:
      report.fittedBlindPropagation.status === "complete" &&
      report.fittedBlindPropagation.deterministicReruns.count === 2 &&
      report.fittedBlindPropagation.deterministicReruns.passed &&
      report.fittedBlindPropagation.rawResultsMayNotBeReplaced,
    passed: formulaPassed && boundaryPassed &&
      report.deterministicReruns.dop853.passed && report.deterministicReruns.ias15.passed &&
      report.fittedBlindPropagation.deterministicReruns.passed,
  };
}
