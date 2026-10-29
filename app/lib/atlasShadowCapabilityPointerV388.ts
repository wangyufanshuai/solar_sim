export type AtlasShadowCapabilityPointerV388 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v388";
  status: "geometry-conditioned-temperature-v388-qualified-absolute-authority-withheld-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v387SpectralIdentifiability: "qualified-rank-1";
    v388GeometryPrior: "qualified-v296-dual-formulation-redshift";
    v388ConditionalTemperature: "qualified-12-inversions-augmented-rank-2";
    v388KnownNumericalBudget: "qualified-linear-upper-bound-no-rss";
    v388PhysicalSystematics: "unavailable-geometry-disk-detector";
    v388AbsoluteTemperatureAuthority: "not-qualified";
    v388MeasuredAuthority: "unavailable";
    v388RuntimeConsumer: "v11-geodesic-prior-key-wired";
    v388PromotionBoundary: "conditional-replay-only-zero-absolute-authority-zero-image-zero-counts";
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

export function parseAtlasShadowCapabilityPointerV388(
  value: unknown,
): AtlasShadowCapabilityPointerV388 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<AtlasShadowCapabilityPointerV388>)
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v388" ||
    source.status !==
      "geometry-conditioned-temperature-v388-qualified-absolute-authority-withheld-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v387SpectralIdentifiability !== "qualified-rank-1" ||
    source.capabilities.v388GeometryPrior !==
      "qualified-v296-dual-formulation-redshift" ||
    source.capabilities.v388ConditionalTemperature !==
      "qualified-12-inversions-augmented-rank-2" ||
    source.capabilities.v388KnownNumericalBudget !==
      "qualified-linear-upper-bound-no-rss" ||
    source.capabilities.v388PhysicalSystematics !==
      "unavailable-geometry-disk-detector" ||
    source.capabilities.v388AbsoluteTemperatureAuthority !== "not-qualified" ||
    source.capabilities.v388MeasuredAuthority !== "unavailable" ||
    source.capabilities.v388RuntimeConsumer !==
      "v11-geodesic-prior-key-wired" ||
    source.capabilities.v388PromotionBoundary !==
      "conditional-replay-only-zero-absolute-authority-zero-image-zero-counts" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v388-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV388;
}
