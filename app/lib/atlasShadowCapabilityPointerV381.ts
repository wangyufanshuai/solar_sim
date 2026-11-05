export type AtlasShadowCapabilityPointerV381 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v381";
  status: "measured-authority-identity-v381-corrected-per-band-inputs-0-of-3-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v379HistoricalStructuralContracts: "qualified-7-of-7";
    v379HistoricalMeasuredInputs: "missing-0-of-7-present";
    v380AdversarialCampaign: "qualified-12-of-12-fail-closed";
    v381LegacyScientificFusion:
      "withdrawn-single-instrument-three-band-identity-not-demonstrated";
    v381PerBandIdentityModel: "qualified-three-lanes-independent-instrument-identities";
    v381MeasuredBandAuthorities: "missing-0-of-3-present";
    v381NextRequiredInput:
      "one-traceable-measured-detector-and-geometry-pair-for-one-band";
    v381RuntimeConsumer: "v11-spectral-authority-patch-bay-wired";
    v381PromotionBoundary: "zero-authority-zero-image-zero-observed-counts";
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

export function parseAtlasShadowCapabilityPointerV381(
  value: unknown,
): AtlasShadowCapabilityPointerV381 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<AtlasShadowCapabilityPointerV381>)
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v381" ||
    source.status !==
      "measured-authority-identity-v381-corrected-per-band-inputs-0-of-3-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v379HistoricalStructuralContracts !==
      "qualified-7-of-7" ||
    source.capabilities.v379HistoricalMeasuredInputs !==
      "missing-0-of-7-present" ||
    source.capabilities.v380AdversarialCampaign !==
      "qualified-12-of-12-fail-closed" ||
    source.capabilities.v381LegacyScientificFusion !==
      "withdrawn-single-instrument-three-band-identity-not-demonstrated" ||
    source.capabilities.v381PerBandIdentityModel !==
      "qualified-three-lanes-independent-instrument-identities" ||
    source.capabilities.v381MeasuredBandAuthorities !==
      "missing-0-of-3-present" ||
    source.capabilities.v381NextRequiredInput !==
      "one-traceable-measured-detector-and-geometry-pair-for-one-band" ||
    source.capabilities.v381RuntimeConsumer !==
      "v11-spectral-authority-patch-bay-wired" ||
    source.capabilities.v381PromotionBoundary !==
      "zero-authority-zero-image-zero-observed-counts" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v381-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV381;
}
