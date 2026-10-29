export type AtlasShadowCapabilityPointerV390 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v390";
  status: "temperature-systematics-transfer-v390-qualified-physical-covariance-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v389ExactNonlinearInterval: "qualified-12-exact-endpoint-intervals";
    v390TransferOperator: "qualified-12-rank-2-72-coefficients";
    v390FiniteDifference: "qualified-below-2e-7";
    v390PhysicalCovariance: "unavailable-five-input-classes";
    v390CovarianceProjection: "not-run-input-unavailable";
    v390AbsoluteScientificInterval: "not-qualified";
    v390MeasuredAuthority: "unavailable";
    v390RuntimeConsumer: "v11-systematics-switchyard-wired";
    v390PromotionBoundary: "transfer-only-zero-physical-vector-zero-absolute-authority-zero-image-zero-counts";
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

export function parseAtlasShadowCapabilityPointerV390(
  value: unknown,
): AtlasShadowCapabilityPointerV390 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<AtlasShadowCapabilityPointerV390>)
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v390" ||
    source.status !==
      "temperature-systematics-transfer-v390-qualified-physical-covariance-unavailable-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v389ExactNonlinearInterval !==
      "qualified-12-exact-endpoint-intervals" ||
    source.capabilities.v390TransferOperator !==
      "qualified-12-rank-2-72-coefficients" ||
    source.capabilities.v390FiniteDifference !== "qualified-below-2e-7" ||
    source.capabilities.v390PhysicalCovariance !==
      "unavailable-five-input-classes" ||
    source.capabilities.v390CovarianceProjection !==
      "not-run-input-unavailable" ||
    source.capabilities.v390AbsoluteScientificInterval !== "not-qualified" ||
    source.capabilities.v390MeasuredAuthority !== "unavailable" ||
    source.capabilities.v390RuntimeConsumer !==
      "v11-systematics-switchyard-wired" ||
    source.capabilities.v390PromotionBoundary !==
      "transfer-only-zero-physical-vector-zero-absolute-authority-zero-image-zero-counts" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v390-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV390;
}
