export type AtlasShadowCapabilityPointerV372 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v372";
  status: "observation-geometry-validation-v372-validator-implemented-inputs-unavailable-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v371Compiler: "implemented-strict-candidate-only";
    v371Input: "blocked-0-of-4";
    v372Validator: "implemented-independent-raw-recomputation";
    v372Input: "blocked-0-of-6";
    v372Validation: "not-run-attempt-unconsumed";
    v372MeasuredValidation: "unavailable";
    v372RuntimeGeometry: "unavailable";
    v372MeasuredAuthority: "unavailable-explicit-admission-required";
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

export function parseAtlasShadowCapabilityPointerV372(
  value: unknown,
): AtlasShadowCapabilityPointerV372 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<AtlasShadowCapabilityPointerV372>)
      : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v372" ||
    source.status !==
      "observation-geometry-validation-v372-validator-implemented-inputs-unavailable-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v371Compiler !== "implemented-strict-candidate-only" ||
    source.capabilities.v371Input !== "blocked-0-of-4" ||
    source.capabilities.v372Validator !==
      "implemented-independent-raw-recomputation" ||
    source.capabilities.v372Input !== "blocked-0-of-6" ||
    source.capabilities.v372Validation !== "not-run-attempt-unconsumed" ||
    source.capabilities.v372MeasuredValidation !== "unavailable" ||
    source.capabilities.v372RuntimeGeometry !== "unavailable" ||
    source.capabilities.v372MeasuredAuthority !==
      "unavailable-explicit-admission-required" ||
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
    throw new Error("v372-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV372;
}
