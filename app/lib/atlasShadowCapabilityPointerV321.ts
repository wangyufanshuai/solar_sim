export type AtlasShadowCapabilityPointerV321 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v321";
  status: "runtime-fixed-band-science-raster-static-qualified-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v320FixedBandImaging: "qualified-three-fixed-disjoint-bands-four-rays";
    v321ScienceRaster: "runtime-wired-v320-fixed-band-four-rays";
    v321BufferIntegrity: "payload-band-view-raster-byte-disjoint";
    v321Telemetry: "fixed-band-digest-and-normalization-wired-browser-pending";
    v321BrowserGate: "authored-not-run";
    scienceCinematicBoundary: "physical-radiance-immutable-presentation-copy-only";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v318GpuDifferentialHardware: "pending-webgpu-shadow-disabled";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV321(value: unknown): value is AtlasShadowCapabilityPointerV321 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV321>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v321"
    && pointer.status === "runtime-fixed-band-science-raster-static-qualified-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v320FixedBandImaging === "qualified-three-fixed-disjoint-bands-four-rays"
    && pointer.capabilities.v321ScienceRaster === "runtime-wired-v320-fixed-band-four-rays"
    && pointer.capabilities.v321BufferIntegrity === "payload-band-view-raster-byte-disjoint"
    && pointer.capabilities.v321Telemetry === "fixed-band-digest-and-normalization-wired-browser-pending"
    && pointer.capabilities.v321BrowserGate === "authored-not-run"
    && pointer.capabilities.scienceCinematicBoundary === "physical-radiance-immutable-presentation-copy-only"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v318GpuDifferentialHardware === "pending-webgpu-shadow-disabled"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
