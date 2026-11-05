/** v229 fail-closed contract for an actually integrated 72x66 variational STM. */

export const RELATIVITY_RESEARCH_V12_VERSION =
  "v229-relativity-integrated-variational-stm-v12" as const;

export type RelativityVariationalSTMReportV12 = {
  version: typeof RELATIVITY_RESEARCH_V12_VERSION;
  mode: "legacy-eih-1pn" | "full-eih-1pn-j2" | "full-eih-1pn-2pn-lt";
  bodyCount: 12;
  fullStateDimension: 72;
  independentParameterDimension: 66;
  integratedStateAndPhiDimension: 4824;
  parameterBasis: "barycentric-com-and-momentum-constrained-66d";
  calibrationWindowDays: readonly [0, 30];
  propagation: {
    primary: "scipy-dop853";
    independentCheck: "rebound-ias15";
    stateAndPhiIntegratedTogether: true;
    finiteDifferenceSensitivityKeptSeparate: true;
    ias15Available: boolean;
  };
  jacobians: {
    newtonAndJ2: "analytic";
    velocityDependentPn: "complex-step";
    directionalValidationMaxRelativeError: number;
    directionalValidationPassed: boolean;
  };
  conditioning: {
    unregularizedConditionNumber: number;
    effectiveRank: number;
    rankTolerance: number;
    singularValues: readonly number[];
    regularizationLambda: number;
    regularizedConditionNumber: number;
    covarianceDiagonal: readonly number[];
  };
  nonlinearBatchFit: {
    method: "deterministic-variational-gauss-newton";
    requestedIterations: number;
    completedIterations: number;
    iterations: ReadonlyArray<{
      iteration: number;
      weightedResidualRmsBeforeStep: number;
      coefficientNorm: number;
      maxPositionStepM: number;
      maxVelocityStepMS: number;
      effectiveRank: number;
      unregularizedConditionNumber: number;
      regularizedConditionNumber: number;
      functionEvaluations: number;
    }>;
    finalCalibrationFunctionEvaluations: number;
  };
  calibrationResiduals: ReadonlyArray<{ offsetDays: number; weightedRms: number }>;
  leaveOneDayOut: ReadonlyArray<{ offsetDays: number; weightedRms: number }>;
  leaveOneDayOutMethod: "regularized-linearized-grouped-press";
  comparisons: {
    raw: ReadonlyArray<RelativitySTMCheckpointV12>;
    finiteDifferenceFit: ReadonlyArray<RelativitySTMCheckpointV12>;
    variationalSTMFit: ReadonlyArray<RelativitySTMCheckpointV12>;
    ias15VariationalFit: ReadonlyArray<RelativitySTMCheckpointV12>;
  };
  provenanceReady: boolean;
  deterministicRerunPassed: boolean;
  rankDeficient: boolean;
  tenYearRegressionDetected: boolean;
  tenYearRegressionDetails: ReadonlyArray<{
    solver: "scipy-dop853";
    positionRegression: boolean;
    velocityRegression: boolean;
    positionDeltaKm: number;
    velocityDeltaMS: number;
  }>;
  rawPropagationReplaced: false;
  promotionDecision: "shadow-retained" | "promotion-qualified-not-applied";
  boundary: "offline-integrated-variational-stm-no-runtime-promotion";
};

export type RelativitySTMCheckpointV12 = {
  offsetDays: 365 | 3652.5;
  positionRmsKm: number;
  velocityRmsMS: number | null;
  solver: "scipy-dop853" | "rebound-ias15";
};

export function validateRelativityVariationalSTMReportV12(
  report: RelativityVariationalSTMReportV12,
) {
  const dimensionsValid = report.bodyCount * 6 === report.fullStateDimension &&
    report.independentParameterDimension === report.fullStateDimension - 6 &&
    report.integratedStateAndPhiDimension === report.fullStateDimension * (report.independentParameterDimension + 1);
  const integrationSemanticsValid = report.propagation.stateAndPhiIntegratedTogether &&
    report.propagation.finiteDifferenceSensitivityKeptSeparate &&
    report.propagation.ias15Available &&
    report.jacobians.newtonAndJ2 === "analytic" &&
    report.jacobians.velocityDependentPn === "complex-step";
  const conditioningValid = Number.isFinite(report.conditioning.unregularizedConditionNumber) &&
    report.conditioning.effectiveRank === report.independentParameterDimension &&
    report.conditioning.singularValues.length === report.independentParameterDimension &&
    report.conditioning.covarianceDiagonal.length === report.independentParameterDimension &&
    !report.rankDeficient;
  const fitSemanticsValid =
    report.nonlinearBatchFit.method === "deterministic-variational-gauss-newton" &&
    report.nonlinearBatchFit.requestedIterations >= 2 &&
    report.nonlinearBatchFit.completedIterations ===
      report.nonlinearBatchFit.requestedIterations &&
    report.nonlinearBatchFit.iterations.length ===
      report.nonlinearBatchFit.completedIterations &&
    report.calibrationResiduals.length === 30 &&
    report.leaveOneDayOut.length === 30 &&
    report.leaveOneDayOutMethod === "regularized-linearized-grouped-press";
  const checkpointsComplete = Object.values(report.comparisons).every((rows) =>
    rows.length === 2 && rows[0]?.offsetDays === 365 && rows[1]?.offsetDays === 3652.5 &&
    rows.every((row) => Number.isFinite(row.positionRmsKm) &&
      row.velocityRmsMS !== null && Number.isFinite(row.velocityRmsMS)),
  );
  const qualified = dimensionsValid && integrationSemanticsValid && conditioningValid &&
    fitSemanticsValid &&
    checkpointsComplete && report.provenanceReady && report.deterministicRerunPassed &&
    report.jacobians.directionalValidationPassed && !report.tenYearRegressionDetected;
  const decisionConsistent = report.promotionDecision === (
    qualified ? "promotion-qualified-not-applied" : "shadow-retained"
  );
  return {
    dimensionsValid,
    integrationSemanticsValid,
    conditioningValid,
    fitSemanticsValid,
    checkpointsComplete,
    decisionConsistent,
    passed: qualified && decisionConsistent,
  };
}
