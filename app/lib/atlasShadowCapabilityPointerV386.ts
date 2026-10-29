export type AtlasShadowCapabilityPointerV386 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v386";
  status: "photon-sensitivity-v386-qualified-covariance-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v385ComputationalBudget: "qualified-four-components-linear-upper-bound";
    v386SensitivityKernel: "qualified-4-rays-12-bins-56-coefficients";
    v386SourceIdentifiability: "rank-1-only-ln-g-plus-ln-T";
    v386CalibrationCovariance: "unavailable-12x12-2x2-12x2-required";
    v386UncertaintyProjection: "unavailable-no-covariance";
    v386AbsoluteScientificUncertainty: "not-qualified";
    v386MeasuredAuthority: "unavailable";
    v386RuntimeConsumer: "v11-spectral-breaker-bus-wired";
    v386PromotionBoundary: "sensitivity-only-zero-projection-zero-authority-zero-image-zero-counts";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  evidence: Readonly<{
    path: string;
    fileSha256: string;
    canonicalSha256: string;
  }>;
  pointerSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;

export function parseAtlasShadowCapabilityPointerV386(
  value: unknown,
): AtlasShadowCapabilityPointerV386 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<AtlasShadowCapabilityPointerV386>)
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v386" ||
    source.status !==
      "photon-sensitivity-v386-qualified-covariance-unavailable-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v385ComputationalBudget !==
      "qualified-four-components-linear-upper-bound" ||
    source.capabilities.v386SensitivityKernel !==
      "qualified-4-rays-12-bins-56-coefficients" ||
    source.capabilities.v386SourceIdentifiability !==
      "rank-1-only-ln-g-plus-ln-T" ||
    source.capabilities.v386CalibrationCovariance !==
      "unavailable-12x12-2x2-12x2-required" ||
    source.capabilities.v386UncertaintyProjection !==
      "unavailable-no-covariance" ||
    source.capabilities.v386AbsoluteScientificUncertainty !== "not-qualified" ||
    source.capabilities.v386MeasuredAuthority !== "unavailable" ||
    source.capabilities.v386RuntimeConsumer !==
      "v11-spectral-breaker-bus-wired" ||
    source.capabilities.v386PromotionBoundary !==
      "sensitivity-only-zero-projection-zero-authority-zero-image-zero-counts" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v386-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV386;
}
