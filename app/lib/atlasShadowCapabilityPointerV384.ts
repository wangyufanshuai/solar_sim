export type AtlasShadowCapabilityPointerV384 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v384";
  status: "visible-photon-v384-dual-domain-qualified-electron-authority-withheld-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v383NormalizedProfile: "qualified-3301-rows-400-to-700-nm-no-interpolation";
    v384PhotonObservable: "qualified-four-authority-disk-rays";
    v384DualDomainIntegration: "qualified-wavelength-trapezoid-vs-frequency-simpson";
    v384ElectronExpectation: "unavailable-no-detector-or-geometry-authority";
    v384ObservedCounts: "unavailable-expectation-boundary";
    v384SourceDossier: "incomplete-1-of-7";
    v384MeasuredBandAuthorities: "missing-0-of-3-present";
    v384RuntimeConsumer: "v11-photon-integrating-sphere-wired";
    v384PromotionBoundary: "photon-only-zero-electrons-zero-image-zero-observed-counts";
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

export function parseAtlasShadowCapabilityPointerV384(
  value: unknown,
): AtlasShadowCapabilityPointerV384 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<AtlasShadowCapabilityPointerV384>)
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v384" ||
    source.status !==
      "visible-photon-v384-dual-domain-qualified-electron-authority-withheld-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v383NormalizedProfile !==
      "qualified-3301-rows-400-to-700-nm-no-interpolation" ||
    source.capabilities.v384PhotonObservable !==
      "qualified-four-authority-disk-rays" ||
    source.capabilities.v384DualDomainIntegration !==
      "qualified-wavelength-trapezoid-vs-frequency-simpson" ||
    source.capabilities.v384ElectronExpectation !==
      "unavailable-no-detector-or-geometry-authority" ||
    source.capabilities.v384ObservedCounts !==
      "unavailable-expectation-boundary" ||
    source.capabilities.v384SourceDossier !== "incomplete-1-of-7" ||
    source.capabilities.v384MeasuredBandAuthorities !==
      "missing-0-of-3-present" ||
    source.capabilities.v384RuntimeConsumer !==
      "v11-photon-integrating-sphere-wired" ||
    source.capabilities.v384PromotionBoundary !==
      "photon-only-zero-electrons-zero-image-zero-observed-counts" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v384-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV384;
}
