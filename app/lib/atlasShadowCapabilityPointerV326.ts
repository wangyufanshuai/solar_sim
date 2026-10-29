export type AtlasShadowCapabilityPointerV326 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v326";
  status: "uncertainty-provenance-wired-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v325ScienceUncertainty: "four-rays-twelve-bands-linear-sum-no-rss";
    v326UncertaintyProvenance: "json-csv-sanitized-twelve-derived-rows";
    v326ObjectUrlLifecycle: "tracked-idempotent";
    v326ScienceBoundary: "no-raw-ray-buffer-no-screenshot-no-path-or-host";
    v326BrowserGate: "authored-not-run";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV326(value: unknown): value is AtlasShadowCapabilityPointerV326 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV326>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v326"
    && pointer.status === "uncertainty-provenance-wired-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v325ScienceUncertainty === "four-rays-twelve-bands-linear-sum-no-rss"
    && pointer.capabilities.v326UncertaintyProvenance === "json-csv-sanitized-twelve-derived-rows"
    && pointer.capabilities.v326ObjectUrlLifecycle === "tracked-idempotent"
    && pointer.capabilities.v326ScienceBoundary === "no-raw-ray-buffer-no-screenshot-no-path-or-host"
    && pointer.capabilities.v326BrowserGate === "authored-not-run"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
