export type AtlasShadowCapabilityPointerV389 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v389";
  status: "exact-conditional-temperature-interval-v389-qualified-absolute-authority-withheld-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v388ConditionalTemperature: "qualified-12-inversions-augmented-rank-2";
    v389ExactNonlinearInterval: "qualified-12-exact-endpoint-intervals";
    v389KnownNumericalInterval: "qualified-max-radius-below-3e-6";
    v389SourceModelInterval: "qualified-page-thorne-fourth-root";
    v389IntervalSemantics: "deterministic-bounds-no-confidence-no-probability-no-rss";
    v389PhysicalSystematics: "unavailable-detector-geometry-non-planck";
    v389AbsoluteTemperatureInterval: "not-qualified";
    v389MeasuredAuthority: "unavailable";
    v389RuntimeConsumer: "v11-interval-loom-wired";
    v389PromotionBoundary: "conditional-interval-only-zero-absolute-authority-zero-image-zero-counts";
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

export function parseAtlasShadowCapabilityPointerV389(
  value: unknown,
): AtlasShadowCapabilityPointerV389 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<AtlasShadowCapabilityPointerV389>)
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v389" ||
    source.status !==
      "exact-conditional-temperature-interval-v389-qualified-absolute-authority-withheld-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v388ConditionalTemperature !==
      "qualified-12-inversions-augmented-rank-2" ||
    source.capabilities.v389ExactNonlinearInterval !==
      "qualified-12-exact-endpoint-intervals" ||
    source.capabilities.v389KnownNumericalInterval !==
      "qualified-max-radius-below-3e-6" ||
    source.capabilities.v389SourceModelInterval !==
      "qualified-page-thorne-fourth-root" ||
    source.capabilities.v389IntervalSemantics !==
      "deterministic-bounds-no-confidence-no-probability-no-rss" ||
    source.capabilities.v389PhysicalSystematics !==
      "unavailable-detector-geometry-non-planck" ||
    source.capabilities.v389AbsoluteTemperatureInterval !== "not-qualified" ||
    source.capabilities.v389MeasuredAuthority !== "unavailable" ||
    source.capabilities.v389RuntimeConsumer !== "v11-interval-loom-wired" ||
    source.capabilities.v389PromotionBoundary !==
      "conditional-interval-only-zero-absolute-authority-zero-image-zero-counts" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v389-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV389;
}
