export type AtlasShadowCapabilityPointerV374 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v374";
  status: "observation-geometry-runtime-v374-publisher-implemented-inputs-unavailable-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v373AdmissionController: "implemented-identity-sha-validation-fail-closed";
    v374Publisher: "implemented-nine-input-authority-revalidation";
    v374Input: "blocked-0-of-9";
    v374Publication: "not-run-attempt-unconsumed";
    v374RuntimeGeometry: "unavailable";
    v374MeasuredAuthority: "unavailable-no-v373-authority-pointer";
    v374MeasuredExpectation: "unavailable-detector-and-geometry-authority-required";
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

export function parseAtlasShadowCapabilityPointerV374(
  value: unknown,
): AtlasShadowCapabilityPointerV374 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<AtlasShadowCapabilityPointerV374>)
      : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v374" ||
    source.status !==
      "observation-geometry-runtime-v374-publisher-implemented-inputs-unavailable-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v373AdmissionController !==
      "implemented-identity-sha-validation-fail-closed" ||
    source.capabilities.v374Publisher !==
      "implemented-nine-input-authority-revalidation" ||
    source.capabilities.v374Input !== "blocked-0-of-9" ||
    source.capabilities.v374Publication !== "not-run-attempt-unconsumed" ||
    source.capabilities.v374RuntimeGeometry !== "unavailable" ||
    source.capabilities.v374MeasuredAuthority !==
      "unavailable-no-v373-authority-pointer" ||
    source.capabilities.v374MeasuredExpectation !==
      "unavailable-detector-and-geometry-authority-required" ||
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
    throw new Error("v374-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV374;
}
