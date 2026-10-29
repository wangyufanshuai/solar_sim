export type AtlasShadowCapabilityPointerV416 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v416";
  status: "stokes-ensemble-coverage-fixture-qualified-measured-detector-unavailable-v13-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v415DetectorLikelihood: "qualified-deterministic-fixture-only";
    v416EffectiveMuellerResponse: "qualified-four-rays-spectrum-weighted-four-by-four";
    v416NoiselessStokesRecovery: "qualified";
    v416StreamingEnsemble: "qualified-four-thousand-ninety-six-trials-per-ray";
    v416CountingPullCoverage: "qualified-separate-high-count-small-poisson-read-noise";
    v416CalibrationPullCoverage: "qualified-separate-multivariate-gaussian";
    v416CovarianceCombination: "prohibited-counting-and-calibration-remain-independent";
    v416ObservedCounts: "unavailable";
    v416MeasuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing";
    v416IndependentPythonOracle: "qualified";
    v416Workbench: "summary-only-full-artifact-download";
    v416BrowserQualification: "not-run";
    v416VisualMatrix: "not-run";
    v416Soak: "not-run";
    v416RtxWebGpu: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
export function parseAtlasShadowCapabilityPointerV416(value: unknown): AtlasShadowCapabilityPointerV416 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<AtlasShadowCapabilityPointerV416>)
      : null;
  const capabilities = source?.capabilities;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v416" ||
    source.status !==
      "stokes-ensemble-coverage-fixture-qualified-measured-detector-unavailable-v13-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    capabilities?.v415DetectorLikelihood !== "qualified-deterministic-fixture-only" ||
    capabilities.v416EffectiveMuellerResponse !== "qualified-four-rays-spectrum-weighted-four-by-four" ||
    capabilities.v416NoiselessStokesRecovery !== "qualified" ||
    capabilities.v416StreamingEnsemble !== "qualified-four-thousand-ninety-six-trials-per-ray" ||
    capabilities.v416CountingPullCoverage !== "qualified-separate-high-count-small-poisson-read-noise" ||
    capabilities.v416CalibrationPullCoverage !== "qualified-separate-multivariate-gaussian" ||
    capabilities.v416CovarianceCombination !== "prohibited-counting-and-calibration-remain-independent" ||
    capabilities.v416ObservedCounts !== "unavailable" ||
    capabilities.v416MeasuredDetectorAuthority !== "unavailable-v368-authority-artifacts-missing" ||
    capabilities.v416IndependentPythonOracle !== "qualified" ||
    capabilities.v416Workbench !== "summary-only-full-artifact-download" ||
    capabilities.v416BrowserQualification !== "not-run" ||
    capabilities.v416VisualMatrix !== "not-run" ||
    capabilities.v416Soak !== "not-run" ||
    capabilities.v416RtxWebGpu !== "not-run" ||
    capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    capabilities.denseAggregate !== "unavailable" ||
    !SHA.test(source.evidence?.fileSha256 ?? "") ||
    !SHA.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v416-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV416;
}
