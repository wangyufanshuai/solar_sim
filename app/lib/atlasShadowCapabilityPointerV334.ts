export type AtlasShadowCapabilityPointerV334 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v334";
  status: "visual-runtime-matrix-v334-wired-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v333VisualDirection: "deep-space-precision-instrument";
    v334RuntimeMatrix: "v5-v6-eight-groups-sixteen-consumption-rows";
    v334ScienceEquivalence: "fields-equivalent-linear-no-grade-no-science-mutation";
    v334CinematicDistinctness: "presentation-fields-distinct-seeded-only";
    v334ResolverStability: "resolved-reference-stable-no-profile-default-promotion";
    v334BrowserGate: "authored-not-run";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV334(value: unknown): value is AtlasShadowCapabilityPointerV334 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV334>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v334"
    && pointer.status === "visual-runtime-matrix-v334-wired-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v333VisualDirection === "deep-space-precision-instrument"
    && pointer.capabilities.v334RuntimeMatrix === "v5-v6-eight-groups-sixteen-consumption-rows"
    && pointer.capabilities.v334ScienceEquivalence === "fields-equivalent-linear-no-grade-no-science-mutation"
    && pointer.capabilities.v334CinematicDistinctness === "presentation-fields-distinct-seeded-only"
    && pointer.capabilities.v334ResolverStability === "resolved-reference-stable-no-profile-default-promotion"
    && pointer.capabilities.v334BrowserGate === "authored-not-run"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
