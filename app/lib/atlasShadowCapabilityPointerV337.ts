export type AtlasShadowCapabilityPointerV337 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v337";
  status: "science-cinematic-buffer-replay-v337-qualified-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v336RuntimeStateReplay: "profile-state-camera-canvas-baseline-qualified";
    v337SparseAuthority: "v312-v313-sixteen-rays-six-capture-six-escape-four-disk-hit";
    v337ScientificBuffers: "all-typed-arrays-byte-identical-before-after-rendering";
    v337ScienceRendering: "v5-v6-profile-invariant-linear-deterministic";
    v337CinematicRendering: "v5-v6-distinct-seeded-deterministic-disjoint-copy";
    v337MeasurementIntegrity: "classification-redshift-evpa-intensity-error-budgets-unchanged";
    v337DenseBoundary: "sparse-only-no-transfer-map-dense-incomplete-visible";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV337(value: unknown): value is AtlasShadowCapabilityPointerV337 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV337>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v337"
    && pointer.status === "science-cinematic-buffer-replay-v337-qualified-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v336RuntimeStateReplay === "profile-state-camera-canvas-baseline-qualified"
    && pointer.capabilities.v337SparseAuthority === "v312-v313-sixteen-rays-six-capture-six-escape-four-disk-hit"
    && pointer.capabilities.v337ScientificBuffers === "all-typed-arrays-byte-identical-before-after-rendering"
    && pointer.capabilities.v337ScienceRendering === "v5-v6-profile-invariant-linear-deterministic"
    && pointer.capabilities.v337CinematicRendering === "v5-v6-distinct-seeded-deterministic-disjoint-copy"
    && pointer.capabilities.v337MeasurementIntegrity === "classification-redshift-evpa-intensity-error-budgets-unchanged"
    && pointer.capabilities.v337DenseBoundary === "sparse-only-no-transfer-map-dense-incomplete-visible"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
