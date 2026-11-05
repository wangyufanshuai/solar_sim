export type AtlasShadowCapabilityPointerV332 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v332";
  status: "instrument-response-boundary-wired-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v331PhotonProvenance: "json-csv-sanitized-twelve-detector-independent-rows";
    v332InstrumentResponse: "explicit-area-solid-angle-exposure-throughput-synthetic-fixture";
    v332NoNoiseClaim: "deterministic-expectation-no-read-noise-dark-current-dead-time-psf-pileup";
    v332ScienceBoundary: "response-never-cinematic-color-input-no-real-instrument-calibration";
    v332BrowserGate: "authored-not-run";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV332(value: unknown): value is AtlasShadowCapabilityPointerV332 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV332>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v332"
    && pointer.status === "instrument-response-boundary-wired-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v331PhotonProvenance === "json-csv-sanitized-twelve-detector-independent-rows"
    && pointer.capabilities.v332InstrumentResponse === "explicit-area-solid-angle-exposure-throughput-synthetic-fixture"
    && pointer.capabilities.v332NoNoiseClaim === "deterministic-expectation-no-read-noise-dark-current-dead-time-psf-pileup"
    && pointer.capabilities.v332ScienceBoundary === "response-never-cinematic-color-input-no-real-instrument-calibration"
    && pointer.capabilities.v332BrowserGate === "authored-not-run"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
