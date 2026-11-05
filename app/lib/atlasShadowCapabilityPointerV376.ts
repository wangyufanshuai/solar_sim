export type AtlasShadowCapabilityPointerV376 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v376";
  status: "expected-electron-image-v376-compiler-implemented-envelope-unavailable-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v375DualAuthorityEnvelope: "unavailable";
    v376Compiler: "implemented-4x3-float64-eight-layer-conservative";
    v376Input: "blocked-0-of-1";
    v376Build: "not-run-attempt-unconsumed";
    v376ScienceImage: "unavailable-no-pixel-arrays";
    v376JsonCsv: "unavailable";
    v376ZeroImageFallback: "disabled";
    v376ObservedCounts: "unavailable-expectation-is-not-observation";
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

export function parseAtlasShadowCapabilityPointerV376(
  value: unknown,
): AtlasShadowCapabilityPointerV376 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<AtlasShadowCapabilityPointerV376>)
      : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v376" ||
    source.status !==
      "expected-electron-image-v376-compiler-implemented-envelope-unavailable-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v375DualAuthorityEnvelope !== "unavailable" ||
    source.capabilities.v376Compiler !==
      "implemented-4x3-float64-eight-layer-conservative" ||
    source.capabilities.v376Input !== "blocked-0-of-1" ||
    source.capabilities.v376Build !== "not-run-attempt-unconsumed" ||
    source.capabilities.v376ScienceImage !== "unavailable-no-pixel-arrays" ||
    source.capabilities.v376JsonCsv !== "unavailable" ||
    source.capabilities.v376ZeroImageFallback !== "disabled" ||
    source.capabilities.v376ObservedCounts !==
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
    throw new Error("v376-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV376;
}
