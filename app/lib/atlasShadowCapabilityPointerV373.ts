export type AtlasShadowCapabilityPointerV373 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v373";
  status: "observation-geometry-authority-v373-controller-implemented-inputs-unavailable-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v371Compiler: "implemented-strict-candidate-only";
    v372Validator: "implemented-independent-raw-recomputation";
    v373AdmissionController: "implemented-identity-sha-validation-fail-closed";
    v373Input: "blocked-0-of-7";
    v373Admission: "not-run-attempt-unconsumed";
    v373AuthorityPointer: "unavailable";
    v373RuntimeGeometry: "unavailable-separate-publication-required";
    v373MeasuredAuthority: "unavailable-no-authority-granted";
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

export function parseAtlasShadowCapabilityPointerV373(
  value: unknown,
): AtlasShadowCapabilityPointerV373 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<AtlasShadowCapabilityPointerV373>)
      : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v373" ||
    source.status !==
      "observation-geometry-authority-v373-controller-implemented-inputs-unavailable-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v371Compiler !== "implemented-strict-candidate-only" ||
    source.capabilities.v372Validator !==
      "implemented-independent-raw-recomputation" ||
    source.capabilities.v373AdmissionController !==
      "implemented-identity-sha-validation-fail-closed" ||
    source.capabilities.v373Input !== "blocked-0-of-7" ||
    source.capabilities.v373Admission !== "not-run-attempt-unconsumed" ||
    source.capabilities.v373AuthorityPointer !== "unavailable" ||
    source.capabilities.v373RuntimeGeometry !==
      "unavailable-separate-publication-required" ||
    source.capabilities.v373MeasuredAuthority !==
      "unavailable-no-authority-granted" ||
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
    throw new Error("v373-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV373;
}
