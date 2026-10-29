export type AtlasShadowCapabilityPointerV391 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v391";
  status: "temperature-curvature-trust-region-v391-qualified-stress-grid-nonphysical-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v390TransferOperator: "qualified-12-rank-2-72-coefficients";
    v391AnalyticCurvature: "qualified-12-hessians";
    v391LinearTrustRegion: "qualified-minimum-radius-0.003";
    v391QuadraticTrustRegion: "qualified-minimum-radius-0.01";
    v391CrossTermSeparation: "qualified-864-mixed-corners";
    v391StressGridSemantics: "validation-only-nonphysical-no-probability";
    v391PhysicalCovariance: "unavailable";
    v391AbsoluteScientificInterval: "not-qualified";
    v391RuntimeConsumer: "v11-curvature-relay-wired";
    v391PromotionBoundary: "trust-region-only-zero-physical-vector-zero-absolute-authority-zero-image-zero-counts";
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

export function parseAtlasShadowCapabilityPointerV391(
  value: unknown,
): AtlasShadowCapabilityPointerV391 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<AtlasShadowCapabilityPointerV391>)
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v391" ||
    source.status !==
      "temperature-curvature-trust-region-v391-qualified-stress-grid-nonphysical-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v390TransferOperator !==
      "qualified-12-rank-2-72-coefficients" ||
    source.capabilities.v391AnalyticCurvature !== "qualified-12-hessians" ||
    source.capabilities.v391LinearTrustRegion !==
      "qualified-minimum-radius-0.003" ||
    source.capabilities.v391QuadraticTrustRegion !==
      "qualified-minimum-radius-0.01" ||
    source.capabilities.v391CrossTermSeparation !==
      "qualified-864-mixed-corners" ||
    source.capabilities.v391StressGridSemantics !==
      "validation-only-nonphysical-no-probability" ||
    source.capabilities.v391PhysicalCovariance !== "unavailable" ||
    source.capabilities.v391AbsoluteScientificInterval !== "not-qualified" ||
    source.capabilities.v391RuntimeConsumer !== "v11-curvature-relay-wired" ||
    source.capabilities.v391PromotionBoundary !==
      "trust-region-only-zero-physical-vector-zero-absolute-authority-zero-image-zero-counts" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v391-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV391;
}
