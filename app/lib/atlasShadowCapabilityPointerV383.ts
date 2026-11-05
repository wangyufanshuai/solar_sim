export type AtlasShadowCapabilityPointerV383 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v383";
  status: "visible-throughput-v383-dual-implementation-qualified-candidate-only-authority-withheld-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v382r1RecoveredSource: "qualified-svo-f350lp-offline-1-of-7";
    v382r1SourceDossier: "incomplete-1-of-7";
    v383NormalizedProfile: "qualified-3301-rows-400-to-700-nm-no-interpolation";
    v383DualImplementation: "qualified-typescript-float64-vs-python-decimal50";
    v383SourceRowIdentity: "qualified-canonical-sha-identical";
    v383VisibleMeasuredAuthority: "withheld-no-noise-or-geometry-authority";
    v383MeasuredBandAuthorities: "missing-0-of-3-present";
    v383RuntimeConsumer: "v11-dual-path-spectrophotometer-wired";
    v383PromotionBoundary: "candidate-only-zero-image-zero-observed-counts";
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

export function parseAtlasShadowCapabilityPointerV383(
  value: unknown,
): AtlasShadowCapabilityPointerV383 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<AtlasShadowCapabilityPointerV383>)
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v383" ||
    source.status !==
      "visible-throughput-v383-dual-implementation-qualified-candidate-only-authority-withheld-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v382r1RecoveredSource !==
      "qualified-svo-f350lp-offline-1-of-7" ||
    source.capabilities.v382r1SourceDossier !== "incomplete-1-of-7" ||
    source.capabilities.v383NormalizedProfile !==
      "qualified-3301-rows-400-to-700-nm-no-interpolation" ||
    source.capabilities.v383DualImplementation !==
      "qualified-typescript-float64-vs-python-decimal50" ||
    source.capabilities.v383SourceRowIdentity !==
      "qualified-canonical-sha-identical" ||
    source.capabilities.v383VisibleMeasuredAuthority !==
      "withheld-no-noise-or-geometry-authority" ||
    source.capabilities.v383MeasuredBandAuthorities !==
      "missing-0-of-3-present" ||
    source.capabilities.v383RuntimeConsumer !==
      "v11-dual-path-spectrophotometer-wired" ||
    source.capabilities.v383PromotionBoundary !==
      "candidate-only-zero-image-zero-observed-counts" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v383-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV383;
}
