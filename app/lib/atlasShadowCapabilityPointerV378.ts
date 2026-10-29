export type AtlasShadowCapabilityPointerV378 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v378";
  status: "measurement-authority-topology-v378-qualified-inputs-partial-1-of-8-image-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v375MeasuredExpectation: "unavailable-0-of-12";
    v376ScienceImage: "unavailable-no-pixel-arrays";
    v377VisualProfile: "science-cinematic-v11-measurement-lab";
    v378AuthorityTopology: "qualified-acyclic-10-nodes-9-required-edges";
    v378AuthorityInput: "partial-1-of-8";
    v378ObservedCountsBoundary: "outside-graph-no-node-no-promotion";
    v378RuntimeConsumer: "v11-provenance-cryobus-wired";
    v378DefaultBoundary: "manual-local-shadow-only-default-legacy-v9";
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

export function parseAtlasShadowCapabilityPointerV378(
  value: unknown,
): AtlasShadowCapabilityPointerV378 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<AtlasShadowCapabilityPointerV378>)
      : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v378" ||
    source.status !==
      "measurement-authority-topology-v378-qualified-inputs-partial-1-of-8-image-unavailable-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v375MeasuredExpectation !== "unavailable-0-of-12" ||
    source.capabilities.v376ScienceImage !== "unavailable-no-pixel-arrays" ||
    source.capabilities.v377VisualProfile !==
      "science-cinematic-v11-measurement-lab" ||
    source.capabilities.v378AuthorityTopology !==
      "qualified-acyclic-10-nodes-9-required-edges" ||
    source.capabilities.v378AuthorityInput !== "partial-1-of-8" ||
    source.capabilities.v378ObservedCountsBoundary !==
      "outside-graph-no-node-no-promotion" ||
    source.capabilities.v378RuntimeConsumer !==
      "v11-provenance-cryobus-wired" ||
    source.capabilities.v378DefaultBoundary !==
      "manual-local-shadow-only-default-legacy-v9" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v378-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV378;
}
