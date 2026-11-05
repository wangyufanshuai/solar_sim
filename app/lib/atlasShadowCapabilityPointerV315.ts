export type AtlasShadowCapabilityPointerV315 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v315";
  status: "science-runtime-upgraded-corrected-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v312GeometryTolerance: "corrected-authority-qualified";
    v313Polarization: "qualified-against-v312";
    fullKerrShortAuthority: "qualified-v312-v313-envelope";
    historicalV298r1: "quarantined-1-of-49-tolerance-ladder-degenerate";
    v314CorrectedDense: "incomplete-0-of-49";
    v315ScienceRuntime: "implemented-v312-v313-sparse-authority";
    denseBoundary: "incomplete-no-aggregate";
    browserQualification: "not-run";
    visualProfile: "manual-local-shadow-only-not-default";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV315(value: unknown): value is AtlasShadowCapabilityPointerV315 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV315>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v315"
    && pointer.status === "science-runtime-upgraded-corrected-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263"
    && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false
    && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v312GeometryTolerance === "corrected-authority-qualified"
    && pointer.capabilities.v313Polarization === "qualified-against-v312"
    && pointer.capabilities.fullKerrShortAuthority === "qualified-v312-v313-envelope"
    && pointer.capabilities.historicalV298r1 === "quarantined-1-of-49-tolerance-ladder-degenerate"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.v315ScienceRuntime === "implemented-v312-v313-sparse-authority"
    && pointer.capabilities.denseBoundary === "incomplete-no-aggregate"
    && pointer.capabilities.browserQualification === "not-run"
    && pointer.capabilities.visualProfile === "manual-local-shadow-only-not-default"
    && typeof pointer.pointerSha256 === "string"
    && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}

