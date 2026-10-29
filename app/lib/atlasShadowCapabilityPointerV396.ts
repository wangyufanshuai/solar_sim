export type AtlasShadowCapabilityPointerV396 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v396";
  status: "auxiliary-constraint-structure-qualified-instrument-feasibility-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v395GlobalObservability: "qualified-rank-24-nullity-12";
    v396StructuralConstraintDesign: "qualified-60-evaluations-36-lifting-24-controls";
    v396MinimumConstraintsForFullRank: "12";
    v396Conditioning: "qualified-maximum-7.382690818495658";
    v396InstrumentFeasibility: "unavailable";
    v396PhysicalRecommendation: "forbidden";
    v396RuntimeConsumer: "v11-constraint-forge-wired";
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

export function parseAtlasShadowCapabilityPointerV396(
  value: unknown,
): AtlasShadowCapabilityPointerV396 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<AtlasShadowCapabilityPointerV396>)
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v396" ||
    source.status !==
      "auxiliary-constraint-structure-qualified-instrument-feasibility-unavailable-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v395GlobalObservability !==
      "qualified-rank-24-nullity-12" ||
    source.capabilities.v396StructuralConstraintDesign !==
      "qualified-60-evaluations-36-lifting-24-controls" ||
    source.capabilities.v396MinimumConstraintsForFullRank !== "12" ||
    source.capabilities.v396Conditioning !==
      "qualified-maximum-7.382690818495658" ||
    source.capabilities.v396InstrumentFeasibility !== "unavailable" ||
    source.capabilities.v396PhysicalRecommendation !== "forbidden" ||
    source.capabilities.v396RuntimeConsumer !== "v11-constraint-forge-wired" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v396-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV396;
}
