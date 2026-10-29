export type AtlasShadowCapabilityPointerV331 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v331";
  status: "photon-provenance-wired-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v330WorkbenchAdapter: "five-versioned-capability-rows";
    v331PhotonProvenance: "json-csv-sanitized-twelve-detector-independent-rows";
    v331PhotonExportLifecycle: "on-demand-weak-single-flight-object-url-tracked-idempotent";
    v331ScienceBoundary: "no-detector-throughput-area-exposure-no-raw-ray-buffer-host-path-pid";
    v331BrowserGate: "authored-not-run";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV331(value: unknown): value is AtlasShadowCapabilityPointerV331 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV331>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v331"
    && pointer.status === "photon-provenance-wired-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v330WorkbenchAdapter === "five-versioned-capability-rows"
    && pointer.capabilities.v331PhotonProvenance === "json-csv-sanitized-twelve-detector-independent-rows"
    && pointer.capabilities.v331PhotonExportLifecycle === "on-demand-weak-single-flight-object-url-tracked-idempotent"
    && pointer.capabilities.v331ScienceBoundary === "no-detector-throughput-area-exposure-no-raw-ray-buffer-host-path-pid"
    && pointer.capabilities.v331BrowserGate === "authored-not-run"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
