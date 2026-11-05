export const KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312 = "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e" as const;
export const KERR_CORRECTED_AUTHORITY_FILE_SHA256_V312 = "eb664b3b9dbd062f3848206471b2cfb82596df742f7aae6fd46751b2aed3db91" as const;
export const KERR_CORRECTED_AUTHORITY_NEGATIVE_SHA256_V312 = "e35cf4f6abe9328e1bd11e4e9d30490bca82b6e1cf86b0cc8172310654226f17" as const;

export type KerrCorrectedAuthorityV312 = Readonly<{
  version: "v312-kerr-corrected-tolerance-short-gate-v1";
  attemptId: "v312-corrected-tolerance-attempt-2";
  status: "corrected-authority-qualified";
  geometryRedshiftQualified: true;
  toleranceConvergenceQualified: true;
  correctedAuthorityQualified: true;
  fullKerrAuthorityQualified: false;
  polarizationStatus: "requires-v312-locked-polarization-requalification";
  executionCount: 128;
  criticalBracketCount: 40;
  failureReasons: readonly [];
  tolerancePolicy: Readonly<{
    declaredReleaseTolerance: 1e-10;
    declaredInternalTolerance: 1e-12;
    releaseSolverControlInput: 1e-7;
    internalSolverControlInput: 1e-9;
    releaseSolverTolerance: 1e-11;
    internalSolverTolerance: 1e-13;
    adapter: "explicit-v312-declared-to-dop853-control-adapter";
    carterConstraintProjectionIntervalMino: 0.005;
    thresholdRelaxation: "not-applied";
  }>;
  toleranceConvergence: Readonly<{
    expectedStrictSolverLadderPairCount: 64;
    strictSolverLadderPairCount: 64;
    solverLadderQualified: true;
    convergenceObservableCount: 256;
    expectedConvergenceObservableCount: 256;
    distinctConvergenceObservableCount: number;
    geometryDistinctPairCount: number;
    stepCountDistinctPairCount: number;
    residualDistinctPairCount: number;
    eventParameterDistinctPairCount: number;
    numericallyNondegenerate: true;
  }>;
  thresholds: Readonly<{
    classificationAgreement: number;
    maxMassShellResidualRaw: number;
    maxCarterResidualNormalized: number;
    maxCriticalBracketWidthPx: number;
    maxRedshiftDifference: number;
    abDeterministic: boolean;
  }>;
  classCounts: Readonly<Record<string, Readonly<Record<string, number>>>>;
  resource: Readonly<{ peakRssGiB: number; maximumPeakRssGiB: 2; qualified: true }>;
  priorNegativeEvidence: Readonly<{ evidenceSha256: string; status: "corrected-authority-failed"; preserved: true }>;
  science: Readonly<{ defaultKernel: "legacy-eih-1pn"; workerPhysicsMutation: "not-applied"; legacyKerrMutation: "not-applied" }>;
  release: Readonly<{ formalProductPointer: "v263"; formalProductPointerAdvanced: false; denseShardExecuted: false; correctedDenseCampaignCreated: false }>;
  evidenceSha256: string;
}>;

export type KerrCorrectedAuthorityViewV312 = Readonly<{
  version: "v312-kerr-corrected-authority-view-v1";
  status: "corrected-authority-qualified";
  authoritySha256: string;
  executionCount: 128;
  criticalBracketCount: 40;
  solverLadder: Readonly<{
    qualified: true;
    pairCount: 64;
    expectedPairCount: 64;
    distinctObservableCount: number;
    observableCount: 256;
    releaseRtol: 1e-11;
    internalRtol: 1e-13;
  }>;
  residuals: Readonly<{
    maxMassShellRaw: number;
    maxCarterNormalized: number;
    maxRedshiftDifference: number;
    maxCriticalBracketWidthPx: number;
  }>;
  resource: Readonly<{ peakRssGiB: number; maximumPeakRssGiB: 2; qualified: true }>;
  priorNegative: Readonly<{ authoritySha256: string; status: "corrected-authority-failed"; preserved: true }>;
  boundary: "corrected-short-geometry-authority-polarization-requalification-required-no-dense-continuation";
}>;

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v312-${label}-invalid`);
  return value as Record<string, unknown>;
}

function classCountsQualified(value: unknown): boolean {
  const counts = record(value, "class-counts");
  const expected = { capture: 24, escape: 24, "disk-hit": 16, invalid: 0 };
  const formulations = [
    "carter-mino-dop853-constraint-stabilized-v312",
    "cartesian-kerr-schild-hamiltonian-dop853-v312",
  ];
  return formulations.every((formulation) => {
    const group = record(counts[formulation], "formulation-counts");
    return Object.entries(expected).every(([key, count]) => group[key] === count);
  });
}

export function parseKerrCorrectedAuthorityV312(value: unknown): KerrCorrectedAuthorityV312 {
  const source = record(value, "authority");
  const policy = record(source.tolerancePolicy, "tolerance-policy");
  const convergence = record(source.toleranceConvergence, "tolerance-convergence");
  const thresholds = record(source.thresholds, "thresholds");
  const resource = record(source.resource, "resource");
  const prior = record(source.priorNegativeEvidence, "prior-negative");
  const science = record(source.science, "science");
  const release = record(source.release, "release");
  if (source.version !== "v312-kerr-corrected-tolerance-short-gate-v1"
    || source.attemptId !== "v312-corrected-tolerance-attempt-2"
    || source.status !== "corrected-authority-qualified"
    || source.geometryRedshiftQualified !== true || source.toleranceConvergenceQualified !== true
    || source.correctedAuthorityQualified !== true || source.fullKerrAuthorityQualified !== false
    || source.polarizationStatus !== "requires-v312-locked-polarization-requalification"
    || source.executionCount !== 128 || source.criticalBracketCount !== 40
    || !Array.isArray(source.failureReasons) || source.failureReasons.length !== 0
    || source.evidenceSha256 !== KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312) throw new Error("v312-authority-identity-invalid");
  if (policy.declaredReleaseTolerance !== 1e-10 || policy.declaredInternalTolerance !== 1e-12
    || policy.releaseSolverControlInput !== 1e-7 || policy.internalSolverControlInput !== 1e-9
    || policy.releaseSolverTolerance !== 1e-11 || policy.internalSolverTolerance !== 1e-13
    || policy.adapter !== "explicit-v312-declared-to-dop853-control-adapter"
    || policy.carterConstraintProjectionIntervalMino !== 0.005 || policy.thresholdRelaxation !== "not-applied") throw new Error("v312-solver-policy-invalid");
  if (convergence.expectedStrictSolverLadderPairCount !== 64 || convergence.strictSolverLadderPairCount !== 64
    || convergence.solverLadderQualified !== true || convergence.convergenceObservableCount !== 256
    || convergence.expectedConvergenceObservableCount !== 256
    || !Number.isInteger(convergence.distinctConvergenceObservableCount) || Number(convergence.distinctConvergenceObservableCount) <= 0
    || convergence.numericallyNondegenerate !== true) throw new Error("v312-convergence-invalid");
  if (thresholds.classificationAgreement !== 1 || thresholds.abDeterministic !== true
    || Number(thresholds.maxMassShellResidualRaw) >= 1e-10
    || Number(thresholds.maxCarterResidualNormalized) >= 1e-10
    || Number(thresholds.maxRedshiftDifference) >= 0.005
    || Number(thresholds.maxCriticalBracketWidthPx) >= 0.5) throw new Error("v312-threshold-invalid");
  if (!classCountsQualified(source.classCounts)) throw new Error("v312-class-counts-invalid");
  if (resource.qualified !== true || Number(resource.peakRssGiB) <= 0 || Number(resource.peakRssGiB) >= 2 || resource.maximumPeakRssGiB !== 2) throw new Error("v312-resource-invalid");
  if (prior.evidenceSha256 !== KERR_CORRECTED_AUTHORITY_NEGATIVE_SHA256_V312 || prior.status !== "corrected-authority-failed" || prior.preserved !== true) throw new Error("v312-negative-evidence-invalid");
  if (science.defaultKernel !== "legacy-eih-1pn" || science.workerPhysicsMutation !== "not-applied" || science.legacyKerrMutation !== "not-applied"
    || release.formalProductPointer !== "v263" || release.formalProductPointerAdvanced !== false || release.denseShardExecuted !== false || release.correctedDenseCampaignCreated !== false) throw new Error("v312-boundary-invalid");
  return value as KerrCorrectedAuthorityV312;
}

export function createKerrCorrectedAuthorityViewV312(value: unknown): KerrCorrectedAuthorityViewV312 {
  const authority = parseKerrCorrectedAuthorityV312(value);
  return {
    version: "v312-kerr-corrected-authority-view-v1",
    status: authority.status,
    authoritySha256: authority.evidenceSha256,
    executionCount: authority.executionCount,
    criticalBracketCount: authority.criticalBracketCount,
    solverLadder: {
      qualified: true,
      pairCount: authority.toleranceConvergence.strictSolverLadderPairCount,
      expectedPairCount: authority.toleranceConvergence.expectedStrictSolverLadderPairCount,
      distinctObservableCount: authority.toleranceConvergence.distinctConvergenceObservableCount,
      observableCount: authority.toleranceConvergence.convergenceObservableCount,
      releaseRtol: authority.tolerancePolicy.releaseSolverTolerance,
      internalRtol: authority.tolerancePolicy.internalSolverTolerance,
    },
    residuals: {
      maxMassShellRaw: authority.thresholds.maxMassShellResidualRaw,
      maxCarterNormalized: authority.thresholds.maxCarterResidualNormalized,
      maxRedshiftDifference: authority.thresholds.maxRedshiftDifference,
      maxCriticalBracketWidthPx: authority.thresholds.maxCriticalBracketWidthPx,
    },
    resource: authority.resource,
    priorNegative: { authoritySha256: authority.priorNegativeEvidence.evidenceSha256, status: authority.priorNegativeEvidence.status, preserved: true },
    boundary: "corrected-short-geometry-authority-polarization-requalification-required-no-dense-continuation",
  };
}

export function parseKerrCorrectedAuthorityViewV312(value: unknown): KerrCorrectedAuthorityViewV312 {
  const source = record(value, "view");
  const ladder = record(source.solverLadder, "view-ladder");
  if (source.version !== "v312-kerr-corrected-authority-view-v1" || source.status !== "corrected-authority-qualified"
    || source.authoritySha256 !== KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312 || source.executionCount !== 128 || source.criticalBracketCount !== 40
    || ladder.qualified !== true || ladder.pairCount !== 64 || ladder.expectedPairCount !== 64 || ladder.observableCount !== 256
    || source.boundary !== "corrected-short-geometry-authority-polarization-requalification-required-no-dense-continuation") throw new Error("v312-view-invalid");
  return value as KerrCorrectedAuthorityViewV312;
}
