export type AtlasShadowCapabilityPointerV330 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v330";
  status: "science-workbench-v325-v329-evidence-wired-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v325Uncertainty: "four-rays-twelve-bands-componentwise-linear-envelope";
    v326Provenance: "sanitized-json-csv-no-ray-buffer-host-path-pid";
    v327ScienceCinematicAB: "science-unchanged-v5-v6-cinematic-distinct";
    v328PhotonObservables: "four-rays-twelve-fixed-band-photon-radiances";
    v329SingleFlight: "three-consumers-one-v321-acquisition-one-derivation";
    v330WorkbenchAdapter: "five-versioned-capability-rows";
    v330EvidenceApi: "parallel-bounded-single-flight-no-store-lite-unavailable-128kib";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV330(value: unknown): value is AtlasShadowCapabilityPointerV330 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV330>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v330"
    && pointer.status === "science-workbench-v325-v329-evidence-wired-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v325Uncertainty === "four-rays-twelve-bands-componentwise-linear-envelope"
    && pointer.capabilities.v326Provenance === "sanitized-json-csv-no-ray-buffer-host-path-pid"
    && pointer.capabilities.v327ScienceCinematicAB === "science-unchanged-v5-v6-cinematic-distinct"
    && pointer.capabilities.v328PhotonObservables === "four-rays-twelve-fixed-band-photon-radiances"
    && pointer.capabilities.v329SingleFlight === "three-consumers-one-v321-acquisition-one-derivation"
    && pointer.capabilities.v330WorkbenchAdapter === "five-versioned-capability-rows"
    && pointer.capabilities.v330EvidenceApi === "parallel-bounded-single-flight-no-store-lite-unavailable-128kib"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
