export type AtlasShadowCapabilityPointerV323 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v323";
  status: "provenance-export-wired-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v322ScienceHud: "telemetry-only-fixed-band-hud-wired";
    v323ProvenanceExport: "json-csv-read-only-no-ray-buffer";
    v323ProfileAB: "v5-v6-recorded-manual-local-shadow-only";
    v323ObjectUrlLifecycle: "tracked-idempotent";
    v323BrowserGate: "authored-not-run";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v318GpuDifferentialHardware: "pending-webgpu-shadow-disabled";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV323(value: unknown): value is AtlasShadowCapabilityPointerV323 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV323>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v323"
    && pointer.status === "provenance-export-wired-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v322ScienceHud === "telemetry-only-fixed-band-hud-wired"
    && pointer.capabilities.v323ProvenanceExport === "json-csv-read-only-no-ray-buffer"
    && pointer.capabilities.v323ProfileAB === "v5-v6-recorded-manual-local-shadow-only"
    && pointer.capabilities.v323ObjectUrlLifecycle === "tracked-idempotent"
    && pointer.capabilities.v323BrowserGate === "authored-not-run"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v318GpuDifferentialHardware === "pending-webgpu-shadow-disabled"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
