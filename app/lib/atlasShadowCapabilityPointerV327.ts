export type AtlasShadowCapabilityPointerV327 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v327";
  status: "science-cinematic-ab-wired-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v326UncertaintyProvenance: "json-csv-sanitized-twelve-derived-rows";
    v327ScienceCinematicAB: "four-ray-science-v5-v6-deterministic-swatches";
    v327ProductionMapping: "v305-cinematic-rgba-token-consumer";
    v327ScienceIsolation: "values-unchanged-buffers-disjoint";
    v327BrowserGate: "authored-not-run";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV327(value: unknown): value is AtlasShadowCapabilityPointerV327 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV327>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v327"
    && pointer.status === "science-cinematic-ab-wired-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v326UncertaintyProvenance === "json-csv-sanitized-twelve-derived-rows"
    && pointer.capabilities.v327ScienceCinematicAB === "four-ray-science-v5-v6-deterministic-swatches"
    && pointer.capabilities.v327ProductionMapping === "v305-cinematic-rgba-token-consumer"
    && pointer.capabilities.v327ScienceIsolation === "values-unchanged-buffers-disjoint"
    && pointer.capabilities.v327BrowserGate === "authored-not-run"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
