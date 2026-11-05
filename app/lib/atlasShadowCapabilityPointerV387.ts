export type AtlasShadowCapabilityPointerV387 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v387";
  status: "photon-identifiability-v387-qualified-degeneracy-persists-covariance-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v386SensitivityKernel: "qualified-4-rays-12-bins-56-coefficients";
    v387ThreeBandIdentifiability: "qualified-12-measurements-global-rank-1";
    v387ContinuumDegeneracy: "persists-only-ln-g-plus-ln-T";
    v387CovarianceValidator: "implemented-14x14-identity-symmetry-psd";
    v387CovariancePack: "unavailable";
    v387UncertaintyProjection: "unavailable-no-covariance";
    v387AbsoluteScientificUncertainty: "not-qualified";
    v387RuntimeConsumer: "v11-rank-collapse-spectrometer-wired";
    v387PromotionBoundary: "identifiability-only-zero-projection-zero-authority-zero-image-zero-counts";
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

export function parseAtlasShadowCapabilityPointerV387(
  value: unknown,
): AtlasShadowCapabilityPointerV387 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<AtlasShadowCapabilityPointerV387>)
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v387" ||
    source.status !==
      "photon-identifiability-v387-qualified-degeneracy-persists-covariance-unavailable-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v386SensitivityKernel !==
      "qualified-4-rays-12-bins-56-coefficients" ||
    source.capabilities.v387ThreeBandIdentifiability !==
      "qualified-12-measurements-global-rank-1" ||
    source.capabilities.v387ContinuumDegeneracy !==
      "persists-only-ln-g-plus-ln-T" ||
    source.capabilities.v387CovarianceValidator !==
      "implemented-14x14-identity-symmetry-psd" ||
    source.capabilities.v387CovariancePack !== "unavailable" ||
    source.capabilities.v387UncertaintyProjection !==
      "unavailable-no-covariance" ||
    source.capabilities.v387AbsoluteScientificUncertainty !== "not-qualified" ||
    source.capabilities.v387RuntimeConsumer !==
      "v11-rank-collapse-spectrometer-wired" ||
    source.capabilities.v387PromotionBoundary !==
      "identifiability-only-zero-projection-zero-authority-zero-image-zero-counts" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v387-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV387;
}
