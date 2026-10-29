export const KERR_REFERENCE_V5_VERSION =
  "v221-kerr-analytic-reference-contract-v5" as const;

export type KerrObserverFrameV5 = {
  kind: "exact-ZAMO-shared-v5";
  spinA: number;
  radiusM: number;
  thetaRad: number;
  screenBasis: "radial-polar-azimuthal";
};

export type KerrHamiltonianDerivativeReportV5 = {
  version: typeof KERR_REFERENCE_V5_VERSION;
  implementation: "closed-form-analytic-spatial-inverse-metric-derivative";
  finiteDifferenceUsedForEvolution: false;
  derivativeReferenceMaxRelativeError: number;
  maxNullConstraint: number;
  maxLongDoubleNullConstraint: number;
  canonicalRayCount: 25;
  deterministicRerun: boolean;
  internalTargetPassed: boolean;
  releaseGatePassed: boolean;
};

export type KerrPolarizationTransportReportV5 = {
  version: typeof KERR_REFERENCE_V5_VERSION;
  rayCount: number;
  spins: readonly [0, 0.5, 0.9, 0.998];
  inclinationsDeg: readonly [0, 30, 60, 80];
  maxRedshiftRelativeError: number | null;
  maxEvpaErrorDeg: number | null;
  intensityInvariantPassed: boolean;
  redshiftGatePassed: boolean;
  polarizationGatePassed: boolean;
  modelBoundary: "analytic-novikov-thorne-teaching-disc-not-grmhd";
};

export type KerrDenseCrossValidationReportV5 = {
  version: typeof KERR_REFERENCE_V5_VERSION;
  canonicalRayCount: 25;
  lowDiscrepancyRayCount: 2048;
  criticalBracketRayCount: 1024;
  executedLowDiscrepancyRayCount: number;
  executedCriticalBracketRayCount: number;
  screenManifestSha256: string;
  classificationAgreement: number | null;
  criticalCurveMaxErrorPx: number | null;
  classificationGatePassed: boolean;
  criticalCurveGatePassed: boolean;
  promotionDecision: "shadow-retained";
};

export function validateKerrDenseCrossValidationReportV5(
  report: KerrDenseCrossValidationReportV5,
) {
  const coverageComplete = report.executedLowDiscrepancyRayCount === report.lowDiscrepancyRayCount &&
    report.executedCriticalBracketRayCount === report.criticalBracketRayCount;
  const classificationGatePassed = coverageComplete && report.classificationAgreement !== null &&
    report.classificationAgreement >= 0.999;
  const criticalCurveGatePassed = coverageComplete && report.criticalCurveMaxErrorPx !== null &&
    report.criticalCurveMaxErrorPx < 0.5;
  return {
    coverageComplete,
    classificationGatePassed,
    criticalCurveGatePassed,
    passed: classificationGatePassed && criticalCurveGatePassed,
  };
}

export function validateKerrHamiltonianDerivativeReportV5(
  report: KerrHamiltonianDerivativeReportV5,
) {
  const derivativePassed = report.finiteDifferenceUsedForEvolution === false &&
    Number.isFinite(report.derivativeReferenceMaxRelativeError) &&
    report.derivativeReferenceMaxRelativeError < 1e-8;
  const internalTargetPassed = report.maxNullConstraint < 1e-11;
  const releaseGatePassed = report.maxNullConstraint < 1e-10;
  return {
    derivativePassed,
    internalTargetPassed,
    releaseGatePassed,
    passed: derivativePassed && releaseGatePassed && report.deterministicRerun,
  };
}
