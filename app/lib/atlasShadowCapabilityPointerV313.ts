export type AtlasShadowCapabilityPointerV313 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v313";
  status: "full-kerr-short-authority-qualified-corrected-dense-not-created";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v312GeometryTolerance: "corrected-authority-qualified";
    v313Polarization: "qualified-against-v312";
    fullKerrShortAuthority: "qualified-v312-v313-envelope";
    historicalV298r1: "quarantined-1-of-49-tolerance-ladder-degenerate";
    correctedDenseCampaign: "not-created";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  continuation: "initialize-new-corrected-dense-namespace-then-require-explicit-authorization-per-shard-series";
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV313(value: unknown): value is AtlasShadowCapabilityPointerV313 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV313>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v313"
    && pointer.status === "full-kerr-short-authority-qualified-corrected-dense-not-created"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v312GeometryTolerance === "corrected-authority-qualified"
    && pointer.capabilities.v313Polarization === "qualified-against-v312"
    && pointer.capabilities.fullKerrShortAuthority === "qualified-v312-v313-envelope"
    && pointer.capabilities.historicalV298r1 === "quarantined-1-of-49-tolerance-ladder-degenerate"
    && pointer.capabilities.correctedDenseCampaign === "not-created" && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.continuation === "initialize-new-corrected-dense-namespace-then-require-explicit-authorization-per-shard-series"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
