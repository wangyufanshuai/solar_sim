export type AtlasShadowCapabilityPointerV417 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v417";
  status: "nonlinear-polarization-coverage-fixture-qualified-measured-authority-unavailable-v13-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v416StokesEnsemble: "qualified-streaming-fixture-only";
    v417LinearPolarizationFraction: "qualified-nonlinear-coverage-fixture-only";
    v417CircularPolarizationFraction: "qualified-signed-coverage-fixture-only";
    v417Evpa: "qualified-axial-pi-period-coverage-fixture-only";
    v417DeltaMethod: "qualified-against-nonlinear-ensemble";
    v417PLDebias: "qualified-high-snr-fixture-not-general-authority";
    v417PhysicalStokesCone: "qualified-zero-violations";
    v417CovarianceCombination: "prohibited-counting-and-calibration-remain-independent";
    v417ObservedPolarization: "unavailable";
    v417MeasuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing";
    v417IndependentPythonOracle: "qualified";
    v417Workbench: "summary-only-full-artifact-download";
    v417BrowserQualification: "not-run";
    v417VisualMatrix: "not-run";
    v417Soak: "not-run";
    v417RtxWebGpu: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
export function parseAtlasShadowCapabilityPointerV417(value: unknown): AtlasShadowCapabilityPointerV417 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<AtlasShadowCapabilityPointerV417>)
      : null;
  const capabilities = source?.capabilities;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v417" ||
    source.status !==
      "nonlinear-polarization-coverage-fixture-qualified-measured-authority-unavailable-v13-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    capabilities?.v416StokesEnsemble !== "qualified-streaming-fixture-only" ||
    capabilities.v417LinearPolarizationFraction !== "qualified-nonlinear-coverage-fixture-only" ||
    capabilities.v417CircularPolarizationFraction !== "qualified-signed-coverage-fixture-only" ||
    capabilities.v417Evpa !== "qualified-axial-pi-period-coverage-fixture-only" ||
    capabilities.v417DeltaMethod !== "qualified-against-nonlinear-ensemble" ||
    capabilities.v417PLDebias !== "qualified-high-snr-fixture-not-general-authority" ||
    capabilities.v417PhysicalStokesCone !== "qualified-zero-violations" ||
    capabilities.v417CovarianceCombination !== "prohibited-counting-and-calibration-remain-independent" ||
    capabilities.v417ObservedPolarization !== "unavailable" ||
    capabilities.v417MeasuredDetectorAuthority !== "unavailable-v368-authority-artifacts-missing" ||
    capabilities.v417IndependentPythonOracle !== "qualified" ||
    capabilities.v417Workbench !== "summary-only-full-artifact-download" ||
    capabilities.v417BrowserQualification !== "not-run" ||
    capabilities.v417VisualMatrix !== "not-run" ||
    capabilities.v417Soak !== "not-run" ||
    capabilities.v417RtxWebGpu !== "not-run" ||
    capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    capabilities.denseAggregate !== "unavailable" ||
    !SHA.test(source.evidence?.fileSha256 ?? "") ||
    !SHA.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v417-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV417;
}
