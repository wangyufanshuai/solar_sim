export type AtlasShadowCapabilityPointerV329 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v329";
  status: "science-observatory-single-flight-wired-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v328PhotonObservables: "four-rays-twelve-fixed-band-photon-radiances";
    v329SingleFlight: "three-consumers-one-v321-acquisition-one-derivation";
    v329ExternalStore: "bounded-models-use-sync-external-store";
    v329BaselineReturn: "last-consumer-releases-cache-and-derived-models";
    v329BrowserGate: "authored-not-run";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV329(value: unknown): value is AtlasShadowCapabilityPointerV329 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV329>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v329"
    && pointer.status === "science-observatory-single-flight-wired-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v328PhotonObservables === "four-rays-twelve-fixed-band-photon-radiances"
    && pointer.capabilities.v329SingleFlight === "three-consumers-one-v321-acquisition-one-derivation"
    && pointer.capabilities.v329ExternalStore === "bounded-models-use-sync-external-store"
    && pointer.capabilities.v329BaselineReturn === "last-consumer-releases-cache-and-derived-models"
    && pointer.capabilities.v329BrowserGate === "authored-not-run"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
