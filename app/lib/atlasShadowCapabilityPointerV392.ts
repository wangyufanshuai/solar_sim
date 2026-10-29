export type AtlasShadowCapabilityPointerV392 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v392";
  status: "covariance-admission-v392-qualified-physical-input-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v390TransferOperator: "qualified-12-rank-2-72-coefficients";
    v391TrustRegion: "qualified-linear-0.003-quadratic-0.01";
    v392CovarianceSchema: "qualified-3-input-2-output-12-row";
    v392AdmissionValidator: "qualified-6-of-6-adversarial-rejections";
    v392ProjectionPrimitive: "qualified-synthetic-control-only";
    v392PhysicalCovariance: "unavailable";
    v392ProductionProjection: "not-run";
    v392AbsoluteScientificInterval: "not-qualified";
    v392RuntimeConsumer: "v11-covariance-interlock-wired";
    v392PromotionBoundary: "validator-only-zero-physical-pack-zero-production-projection-zero-probability-zero-absolute-authority";
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

export function parseAtlasShadowCapabilityPointerV392(
  value: unknown,
): AtlasShadowCapabilityPointerV392 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<AtlasShadowCapabilityPointerV392>)
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v392" ||
    source.status !==
      "covariance-admission-v392-qualified-physical-input-unavailable-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v390TransferOperator !==
      "qualified-12-rank-2-72-coefficients" ||
    source.capabilities.v391TrustRegion !==
      "qualified-linear-0.003-quadratic-0.01" ||
    source.capabilities.v392CovarianceSchema !==
      "qualified-3-input-2-output-12-row" ||
    source.capabilities.v392AdmissionValidator !==
      "qualified-6-of-6-adversarial-rejections" ||
    source.capabilities.v392ProjectionPrimitive !==
      "qualified-synthetic-control-only" ||
    source.capabilities.v392PhysicalCovariance !== "unavailable" ||
    source.capabilities.v392ProductionProjection !== "not-run" ||
    source.capabilities.v392AbsoluteScientificInterval !== "not-qualified" ||
    source.capabilities.v392RuntimeConsumer !==
      "v11-covariance-interlock-wired" ||
    source.capabilities.v392PromotionBoundary !==
      "validator-only-zero-physical-pack-zero-production-projection-zero-probability-zero-absolute-authority" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v392-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV392;
}
