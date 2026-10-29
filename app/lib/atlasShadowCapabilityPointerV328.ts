export type AtlasShadowCapabilityPointerV328 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v328";
  status: "photon-observables-wired-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v327ScienceCinematicAB: "four-ray-science-v5-v6-deterministic-swatches";
    v328PhotonObservables: "four-rays-twelve-fixed-band-photon-radiances";
    v328Quadrature: "fixed-simpson-512-with-256-componentwise-audit";
    v328DetectorBoundary: "per-unit-area-solid-angle-not-detector-count-rate";
    v328BrowserGate: "authored-not-run";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV328(value: unknown): value is AtlasShadowCapabilityPointerV328 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV328>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v328"
    && pointer.status === "photon-observables-wired-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v327ScienceCinematicAB === "four-ray-science-v5-v6-deterministic-swatches"
    && pointer.capabilities.v328PhotonObservables === "four-rays-twelve-fixed-band-photon-radiances"
    && pointer.capabilities.v328Quadrature === "fixed-simpson-512-with-256-componentwise-audit"
    && pointer.capabilities.v328DetectorBoundary === "per-unit-area-solid-angle-not-detector-count-rate"
    && pointer.capabilities.v328BrowserGate === "authored-not-run"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
