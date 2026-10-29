export type AtlasShadowCapabilityPointerV319 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v319";
  status: "thin-disk-spectrum-qualified-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v318GpuDifferentialHardware: "pending-webgpu-shadow-disabled";
    v319ThinDiskSpectrum: "qualified-four-authority-disk-rays-si-liouville";
    v319SpectrumArtifact: "canonical-source-locked";
    v319ScienceDisplay: "implemented-linear-workbench-browser-pending";
    v319CinematicBoundary: "no-science-value-mutation";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV319(value: unknown): value is AtlasShadowCapabilityPointerV319 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV319>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v319"
    && pointer.status === "thin-disk-spectrum-qualified-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v318GpuDifferentialHardware === "pending-webgpu-shadow-disabled"
    && pointer.capabilities.v319ThinDiskSpectrum === "qualified-four-authority-disk-rays-si-liouville"
    && pointer.capabilities.v319SpectrumArtifact === "canonical-source-locked"
    && pointer.capabilities.v319ScienceDisplay === "implemented-linear-workbench-browser-pending"
    && pointer.capabilities.v319CinematicBoundary === "no-science-value-mutation"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
