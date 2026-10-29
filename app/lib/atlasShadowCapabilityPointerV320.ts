export type AtlasShadowCapabilityPointerV320 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v320";
  status: "fixed-band-science-color-qualified-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v319ThinDiskSpectrum: "qualified-four-authority-disk-rays-si-liouville";
    v320FixedBandImaging: "qualified-three-fixed-disjoint-bands-four-rays";
    v320FalseColor: "fixed-reference-linear-nonadaptive";
    v320SaturationAudit: "explicit-per-channel";
    v320ScienceCinematicBoundary: "physical-radiance-immutable-presentation-copy-only";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v318GpuDifferentialHardware: "pending-webgpu-shadow-disabled";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV320(value: unknown): value is AtlasShadowCapabilityPointerV320 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV320>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v320"
    && pointer.status === "fixed-band-science-color-qualified-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v319ThinDiskSpectrum === "qualified-four-authority-disk-rays-si-liouville"
    && pointer.capabilities.v320FixedBandImaging === "qualified-three-fixed-disjoint-bands-four-rays"
    && pointer.capabilities.v320FalseColor === "fixed-reference-linear-nonadaptive"
    && pointer.capabilities.v320SaturationAudit === "explicit-per-channel"
    && pointer.capabilities.v320ScienceCinematicBoundary === "physical-radiance-immutable-presentation-copy-only"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v318GpuDifferentialHardware === "pending-webgpu-shadow-disabled"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
