export type AtlasShadowCapabilityPointerV322 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v322";
  status: "hud-runtime-wired-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v321ScienceRaster: "runtime-wired-v320-fixed-band-four-rays";
    v322ScienceHud: "telemetry-only-fixed-band-hud-wired";
    v322ProfileConsumers: "v5-and-v6-manual-local-shadow-ab";
    v322ScienceBoundary: "linear-no-grade-read-only-no-cinematic-sharing";
    v322BrowserGate: "authored-not-run";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v318GpuDifferentialHardware: "pending-webgpu-shadow-disabled";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV322(value: unknown): value is AtlasShadowCapabilityPointerV322 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV322>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v322"
    && pointer.status === "hud-runtime-wired-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v321ScienceRaster === "runtime-wired-v320-fixed-band-four-rays"
    && pointer.capabilities.v322ScienceHud === "telemetry-only-fixed-band-hud-wired"
    && pointer.capabilities.v322ProfileConsumers === "v5-and-v6-manual-local-shadow-ab"
    && pointer.capabilities.v322ScienceBoundary === "linear-no-grade-read-only-no-cinematic-sharing"
    && pointer.capabilities.v322BrowserGate === "authored-not-run"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v318GpuDifferentialHardware === "pending-webgpu-shadow-disabled"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
