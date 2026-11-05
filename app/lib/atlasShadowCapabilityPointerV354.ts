export type AtlasShadowCapabilityPointerV354 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v354";
  generatedAt: string;
  status: "spectral-correlation-v354-qualified-fixture-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v353SpectralShape: "qualified-energy-normalized-frequency-tilt-fixture";
    v354SpectralCorrelation: "qualified-explicit-positive-definite-synthetic-covariance";
    v354CovariancePolicy: "explicit-synthetic-correlation-quadratic-form-not-rss-independence-claim";
    v354MeasuredCovariance: "unavailable-synthetic-model-not-observatory-calibration";
    v354FullMeasuredResponseEnvelope: "unavailable-synthetic-correlation-model-not-measured-spectral-covariance";
    v354CinematicBoundary: "correlated-spectral-response-audit-never-cinematic-color-input";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

export function parseAtlasShadowCapabilityPointerV354(value: unknown): AtlasShadowCapabilityPointerV354 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<AtlasShadowCapabilityPointerV354>
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v354" ||
    source.status !== "spectral-correlation-v354-qualified-fixture-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v353SpectralShape !== "qualified-energy-normalized-frequency-tilt-fixture" ||
    source.capabilities.v354SpectralCorrelation !== "qualified-explicit-positive-definite-synthetic-covariance" ||
    source.capabilities.v354CovariancePolicy !== "explicit-synthetic-correlation-quadratic-form-not-rss-independence-claim" ||
    source.capabilities.v354MeasuredCovariance !== "unavailable-synthetic-model-not-observatory-calibration" ||
    source.capabilities.v354FullMeasuredResponseEnvelope !== "unavailable-synthetic-correlation-model-not-measured-spectral-covariance" ||
    source.capabilities.v354CinematicBoundary !== "correlated-spectral-response-audit-never-cinematic-color-input" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !/^[a-f0-9]{64}$/.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v354-capability-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV354;
}
