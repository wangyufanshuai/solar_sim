/** v223 fail-closed contracts for variational STM and reference disagreement. */

export const RELATIVITY_RESEARCH_V11_VERSION =
  "v223-relativity-variational-stm-contract-v11" as const;

export type RelativitySensitivityMethodV11 =
  | "finite-difference-batch-sensitivity"
  | "integrated-variational-stm";

export type RelativityConditioningV11 = {
  unregularizedConditionNumber: number | null;
  effectiveRank: number | null;
  parameterCount: number;
  rankTolerance: number | null;
  regularizedConditionNumber: number;
  regularizationLambda: number;
};

export type RelativityVariationalSTMReportV11 = {
  version: typeof RELATIVITY_RESEARCH_V11_VERSION;
  mode: "legacy-eih-1pn" | "full-eih-1pn-2pn-lt";
  calibrationWindowDays: readonly [0, 30];
  finiteDifferenceSensitivity: {
    method: "finite-difference-batch-sensitivity";
    conditioning: RelativityConditioningV11;
    available: true;
  };
  variationalSTM: {
    method: "integrated-variational-stm";
    conditioning: RelativityConditioningV11 | null;
    available: boolean;
    stateAndPhiIntegratedTogether: boolean;
  };
  raw: { positionRmsKm: number; velocityRmsMS: number | null };
  finiteDifferenceFit: { positionRmsKm: number; velocityRmsMS: number | null };
  variationalFit: { positionRmsKm: number; velocityRmsMS: number | null } | null;
  blindHoldoutDays: readonly [365, 3652.5];
  rawPropagationReplaced: false;
  promotionDecision: "shadow-retained";
  boundary: "offline-research-only-no-runtime-promotion";
};

export type RelativityReferenceDisagreementCheckpointV11 = {
  offsetDays: number;
  bodyCount: number;
  positionRmsKm: number;
  positionMaxKm: number;
  velocityRmsMS: number;
  velocityMaxMS: number;
};

export type RelativityReferenceDisagreementReportV11 = {
  version: typeof RELATIVITY_RESEARCH_V11_VERSION;
  sources: readonly ["de440-naif", "horizons-frozen"];
  frame: "ICRF-J2000-barycentric";
  timeScale: "TDB";
  checkpoints: readonly RelativityReferenceDisagreementCheckpointV11[];
  referenceAgreementQuantifiedBeforeModelResiduals: boolean;
  provenanceReady: boolean;
  promotionDecision: "shadow-retained";
  boundary: "offline-reference-disagreement-no-runtime-promotion";
};

export function validateRelativityVariationalSTMReportV11(
  report: RelativityVariationalSTMReportV11,
) {
  const semanticsSeparated =
    report.finiteDifferenceSensitivity.method === "finite-difference-batch-sensitivity" &&
    report.variationalSTM.method === "integrated-variational-stm";
  const conditioningComplete =
    report.finiteDifferenceSensitivity.conditioning.unregularizedConditionNumber !== null &&
    report.finiteDifferenceSensitivity.conditioning.effectiveRank !== null;
  const variationalComplete =
    report.variationalSTM.available &&
    report.variationalSTM.stateAndPhiIntegratedTogether &&
    report.variationalSTM.conditioning !== null &&
    report.variationalFit !== null;
  return {
    semanticsSeparated,
    conditioningComplete,
    variationalComplete,
    passed: semanticsSeparated && conditioningComplete && variationalComplete,
  };
}

export function validateRelativityReferenceDisagreementV11(
  report: RelativityReferenceDisagreementReportV11,
) {
  const checkpointsValid = report.checkpoints.length > 0 && report.checkpoints.every(
    (checkpoint) => checkpoint.bodyCount > 0 &&
      Number.isFinite(checkpoint.positionRmsKm) &&
      Number.isFinite(checkpoint.positionMaxKm) &&
      Number.isFinite(checkpoint.velocityRmsMS) &&
      Number.isFinite(checkpoint.velocityMaxMS),
  );
  const passed = report.provenanceReady &&
    report.referenceAgreementQuantifiedBeforeModelResiduals && checkpointsValid;
  return { checkpointsValid, passed };
}
