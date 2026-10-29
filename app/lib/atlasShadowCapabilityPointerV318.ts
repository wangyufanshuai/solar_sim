export type AtlasShadowCapabilityPointerV318 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v318";
  status: "gpu-differential-reference-qualified-hardware-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v317ScienceBufferIntegrity: "qualified-67-of-67-byte-digested-raster-disjoint";
    v318GpuDifferentialReference: "qualified-16-rays-40-brackets-current-authority";
    v318GpuDifferentialHardware: "pending-webgpu-shadow-disabled";
    v318BrowserBufferLifecycleGate: "authored-not-run";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV318(value: unknown): value is AtlasShadowCapabilityPointerV318 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV318>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v318"
    && pointer.status === "gpu-differential-reference-qualified-hardware-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263"
    && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false
    && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v317ScienceBufferIntegrity === "qualified-67-of-67-byte-digested-raster-disjoint"
    && pointer.capabilities.v318GpuDifferentialReference === "qualified-16-rays-40-brackets-current-authority"
    && pointer.capabilities.v318GpuDifferentialHardware === "pending-webgpu-shadow-disabled"
    && pointer.capabilities.v318BrowserBufferLifecycleGate === "authored-not-run"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
