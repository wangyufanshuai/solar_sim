export type AtlasShadowCapabilityPointerV324 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v324";
  status: "science-profile-equivalent-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v323ProvenanceExport: "json-csv-read-only-no-ray-buffer";
    v324ScienceProfileAB: "science-equivalent-cinematic-distinct";
    v324ScienceDigest: "stable-v321-authority-digests";
    v324BrowserGate: "authored-not-run";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV324(value: unknown): value is AtlasShadowCapabilityPointerV324 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV324>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v324"
    && pointer.status === "science-profile-equivalent-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v323ProvenanceExport === "json-csv-read-only-no-ray-buffer"
    && pointer.capabilities.v324ScienceProfileAB === "science-equivalent-cinematic-distinct"
    && pointer.capabilities.v324ScienceDigest === "stable-v321-authority-digests"
    && pointer.capabilities.v324BrowserGate === "authored-not-run"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
