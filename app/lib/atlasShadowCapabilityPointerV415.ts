export type AtlasShadowCapabilityPointerV415 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v415";
  status: "detector-noise-likelihood-fixture-qualified-measured-detector-unavailable-v13-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v414DetectorForwardModel: "qualified-sixteen-expectation-rows-fixture-only";
    v415DeterministicReplay: "qualified-sha-derived-fifty-three-bit-streams";
    v415SourceCountingModel: "qualified-explicit-high-count-normal-approximation-not-exact-integer-poisson";
    v415DarkBackgroundModel: "qualified-small-lambda-poisson-inverse-cdf";
    v415ReadNoiseModel: "qualified-independent-gaussian-fixture";
    v415CalibrationLikelihood: "qualified-separate-cholesky-gaussian-fixture";
    v415LikelihoodCombination: "counting-within-row-only-calibration-separate";
    v415PrecisionBoundary: "qualified-base-plus-residual-safe-integer-boundary";
    v415ObservedCounts: "unavailable";
    v415ExactSourcePoissonInteger: "unavailable-count-exceeds-safe-integer";
    v415MeasuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing";
    v415IndependentPythonOracle: "qualified";
    v415Workbench: "summary-only-full-artifact-download";
    v415BrowserQualification: "not-run";
    v415VisualMatrix: "not-run";
    v415Soak: "not-run";
    v415RtxWebGpu: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;

export function parseAtlasShadowCapabilityPointerV415(value: unknown): AtlasShadowCapabilityPointerV415 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<AtlasShadowCapabilityPointerV415>)
      : null;
  const capabilities = source?.capabilities;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v415" ||
    source.status !==
      "detector-noise-likelihood-fixture-qualified-measured-detector-unavailable-v13-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    capabilities?.v414DetectorForwardModel !== "qualified-sixteen-expectation-rows-fixture-only" ||
    capabilities.v415DeterministicReplay !== "qualified-sha-derived-fifty-three-bit-streams" ||
    capabilities.v415SourceCountingModel !==
      "qualified-explicit-high-count-normal-approximation-not-exact-integer-poisson" ||
    capabilities.v415DarkBackgroundModel !== "qualified-small-lambda-poisson-inverse-cdf" ||
    capabilities.v415ReadNoiseModel !== "qualified-independent-gaussian-fixture" ||
    capabilities.v415CalibrationLikelihood !== "qualified-separate-cholesky-gaussian-fixture" ||
    capabilities.v415LikelihoodCombination !== "counting-within-row-only-calibration-separate" ||
    capabilities.v415PrecisionBoundary !== "qualified-base-plus-residual-safe-integer-boundary" ||
    capabilities.v415ObservedCounts !== "unavailable" ||
    capabilities.v415ExactSourcePoissonInteger !== "unavailable-count-exceeds-safe-integer" ||
    capabilities.v415MeasuredDetectorAuthority !== "unavailable-v368-authority-artifacts-missing" ||
    capabilities.v415IndependentPythonOracle !== "qualified" ||
    capabilities.v415Workbench !== "summary-only-full-artifact-download" ||
    capabilities.v415BrowserQualification !== "not-run" ||
    capabilities.v415VisualMatrix !== "not-run" ||
    capabilities.v415Soak !== "not-run" ||
    capabilities.v415RtxWebGpu !== "not-run" ||
    capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    capabilities.denseAggregate !== "unavailable" ||
    !SHA.test(source.evidence?.fileSha256 ?? "") ||
    !SHA.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v415-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV415;
}
