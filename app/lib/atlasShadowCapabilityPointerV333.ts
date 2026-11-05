export type AtlasShadowCapabilityPointerV333 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v333";
  status: "science-observatory-visual-v333-wired-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v332InstrumentResponse: "explicit-area-solid-angle-exposure-throughput-synthetic-fixture";
    v333VisualDirection: "deep-space-precision-instrument";
    v333ScienceHud: "single-runtime-header-three-band-rail-authority-boundaries";
    v333Utf8Audit: "semantic-codepoints-qualified-no-mojibake";
    v333ScienceCinematicBoundary: "telemetry-only-linear-no-grade-presentation-copy-disjoint";
    v333BrowserGate: "authored-not-run";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV333(value: unknown): value is AtlasShadowCapabilityPointerV333 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV333>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v333"
    && pointer.status === "science-observatory-visual-v333-wired-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v332InstrumentResponse === "explicit-area-solid-angle-exposure-throughput-synthetic-fixture"
    && pointer.capabilities.v333VisualDirection === "deep-space-precision-instrument"
    && pointer.capabilities.v333ScienceHud === "single-runtime-header-three-band-rail-authority-boundaries"
    && pointer.capabilities.v333Utf8Audit === "semantic-codepoints-qualified-no-mojibake"
    && pointer.capabilities.v333ScienceCinematicBoundary === "telemetry-only-linear-no-grade-presentation-copy-disjoint"
    && pointer.capabilities.v333BrowserGate === "authored-not-run"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
