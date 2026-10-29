export type AtlasShadowCapabilityPointerV375 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v375";
  status: "measured-expectation-v375-dual-authority-builder-implemented-inputs-partial-1-of-8-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v328PhotonPayload: "qualified-4-rays-12-band-measurements";
    v367DetectorAuthority: "unavailable";
    v374GeometryAuthority: "unavailable";
    v375EnvelopeBuilder: "implemented-dual-authority-no-synthetic-fallback";
    v375Input: "partial-1-of-8";
    v375Build: "not-run-attempt-unconsumed";
    v375MeasuredExpectation: "unavailable-0-of-12";
    v375ObservedCounts: "unavailable-expectation-is-not-observation";
    v370VisualProfile: "science-cinematic-v10-observatory";
    v370DefaultBoundary: "manual-local-shadow-only-default-legacy-v9";
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

export function parseAtlasShadowCapabilityPointerV375(
  value: unknown,
): AtlasShadowCapabilityPointerV375 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<AtlasShadowCapabilityPointerV375>)
      : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v375" ||
    source.status !==
      "measured-expectation-v375-dual-authority-builder-implemented-inputs-partial-1-of-8-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v328PhotonPayload !==
      "qualified-4-rays-12-band-measurements" ||
    source.capabilities.v367DetectorAuthority !== "unavailable" ||
    source.capabilities.v374GeometryAuthority !== "unavailable" ||
    source.capabilities.v375EnvelopeBuilder !==
      "implemented-dual-authority-no-synthetic-fallback" ||
    source.capabilities.v375Input !== "partial-1-of-8" ||
    source.capabilities.v375Build !== "not-run-attempt-unconsumed" ||
    source.capabilities.v375MeasuredExpectation !== "unavailable-0-of-12" ||
    source.capabilities.v375ObservedCounts !==
      "unavailable-expectation-is-not-observation" ||
    source.capabilities.v370VisualProfile !== "science-cinematic-v10-observatory" ||
    source.capabilities.v370DefaultBoundary !==
      "manual-local-shadow-only-default-legacy-v9" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v375-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV375;
}
