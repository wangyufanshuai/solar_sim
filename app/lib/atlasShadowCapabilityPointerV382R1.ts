export type AtlasShadowCapabilityPointerV382R1 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v382r1";
  status: "visible-source-v382r1-parser-corrected-offline-1-of-7-attempt1-failed-no-retry-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v381PerBandIdentityModel: "qualified-three-lanes-independent-instrument-identities";
    v382Attempt1: "failed-parser-provenance-no-automatic-retry";
    v382r1ParserCorrection: "qualified-apostrophe-regression-covered";
    v382r1RecoveredSource: "qualified-svo-f350lp-offline-1-of-7";
    v382r1SourceDossier: "incomplete-1-of-7";
    v382r1VisibleMeasuredAuthority: "unavailable-0-of-1-visible-lane";
    v382r1MeasuredBandAuthorities: "missing-0-of-3-present";
    v382r1RuntimeConsumer: "v11-source-tape-forensic-wired";
    v382r1PromotionBoundary: "zero-authority-zero-image-zero-observed-counts";
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

export function parseAtlasShadowCapabilityPointerV382R1(
  value: unknown,
): AtlasShadowCapabilityPointerV382R1 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<AtlasShadowCapabilityPointerV382R1>)
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v382r1" ||
    source.status !==
      "visible-source-v382r1-parser-corrected-offline-1-of-7-attempt1-failed-no-retry-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v381PerBandIdentityModel !==
      "qualified-three-lanes-independent-instrument-identities" ||
    source.capabilities.v382Attempt1 !==
      "failed-parser-provenance-no-automatic-retry" ||
    source.capabilities.v382r1ParserCorrection !==
      "qualified-apostrophe-regression-covered" ||
    source.capabilities.v382r1RecoveredSource !==
      "qualified-svo-f350lp-offline-1-of-7" ||
    source.capabilities.v382r1SourceDossier !== "incomplete-1-of-7" ||
    source.capabilities.v382r1VisibleMeasuredAuthority !==
      "unavailable-0-of-1-visible-lane" ||
    source.capabilities.v382r1MeasuredBandAuthorities !==
      "missing-0-of-3-present" ||
    source.capabilities.v382r1RuntimeConsumer !==
      "v11-source-tape-forensic-wired" ||
    source.capabilities.v382r1PromotionBoundary !==
      "zero-authority-zero-image-zero-observed-counts" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v382r1-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV382R1;
}
