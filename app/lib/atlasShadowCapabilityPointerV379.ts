export type AtlasShadowCapabilityPointerV379 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v379";
  status: "measured-authority-readiness-v379-qualified-contracts-7-of-7-inputs-missing-0-of-7-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v378AuthorityTopology: "qualified-acyclic-10-nodes-9-required-edges";
    v379SchemaContracts: "qualified-7-of-7";
    v379BoundedAuthorityReads: "qualified-8-of-8-v375-inputs";
    v379MeasuredInputs: "missing-0-of-7-present";
    v379FailurePropagation: "v375-withheld-v376-withheld-observed-counts-unavailable";
    v379RuntimeConsumer: "v11-qualification-breakers-wired";
    v379DefaultBoundary: "manual-local-shadow-only-default-legacy-v9";
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

export function parseAtlasShadowCapabilityPointerV379(
  value: unknown,
): AtlasShadowCapabilityPointerV379 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<AtlasShadowCapabilityPointerV379>)
      : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v379" ||
    source.status !==
      "measured-authority-readiness-v379-qualified-contracts-7-of-7-inputs-missing-0-of-7-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v378AuthorityTopology !==
      "qualified-acyclic-10-nodes-9-required-edges" ||
    source.capabilities.v379SchemaContracts !== "qualified-7-of-7" ||
    source.capabilities.v379BoundedAuthorityReads !==
      "qualified-8-of-8-v375-inputs" ||
    source.capabilities.v379MeasuredInputs !== "missing-0-of-7-present" ||
    source.capabilities.v379FailurePropagation !==
      "v375-withheld-v376-withheld-observed-counts-unavailable" ||
    source.capabilities.v379RuntimeConsumer !==
      "v11-qualification-breakers-wired" ||
    source.capabilities.v379DefaultBoundary !==
      "manual-local-shadow-only-default-legacy-v9" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v379-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV379;
}
