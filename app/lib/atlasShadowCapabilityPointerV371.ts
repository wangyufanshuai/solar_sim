export type AtlasShadowCapabilityPointerV371 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v371";
  status: "observation-geometry-import-v371-compiler-implemented-inputs-unavailable-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v371Compiler: "implemented-strict-candidate-only";
    v371Input: "blocked-0-of-4";
    v371Compile: "not-run-attempt-unconsumed";
    v371Candidate: "unavailable";
    v371RuntimeGeometry: "unavailable";
    v371MeasuredAuthority: "unavailable-independent-validation-required";
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

export function parseAtlasShadowCapabilityPointerV371(
  value: unknown,
): AtlasShadowCapabilityPointerV371 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<AtlasShadowCapabilityPointerV371>)
      : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v371" ||
    source.status !==
      "observation-geometry-import-v371-compiler-implemented-inputs-unavailable-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v371Compiler !== "implemented-strict-candidate-only" ||
    source.capabilities.v371Input !== "blocked-0-of-4" ||
    source.capabilities.v371Compile !== "not-run-attempt-unconsumed" ||
    source.capabilities.v371Candidate !== "unavailable" ||
    source.capabilities.v371RuntimeGeometry !== "unavailable" ||
    source.capabilities.v371MeasuredAuthority !==
      "unavailable-independent-validation-required" ||
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
    throw new Error("v371-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV371;
}
