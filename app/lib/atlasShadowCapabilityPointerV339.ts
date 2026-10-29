export type AtlasShadowCapabilityPointerV339 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v339";
  status: "sanitized-provenance-v339-qualified-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v338WorkbenchEvidence: "v336-v337-status-sha-dense-boundary-visible";
    v339Provenance: "sanitized-json-csv-summary-only-no-raw-ray-buffer";
    v339Authority: "v312-v313-sparse-full-short-sha-exported";
    v339DenseBoundary: "v314-incomplete-0-of-49-aggregate-unavailable";
    v339ObjectUrlLifecycle: "two-format-reverse-idempotent-baseline-return";
    v339LiteBoundary: "explicit-lite-boundary-no-export-artifact";
    v339BrowserBoundary: "intent-local-shadow-workbench-only-browser-not-run";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV339(value: unknown): value is AtlasShadowCapabilityPointerV339 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV339>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v339" && pointer.status === "sanitized-provenance-v339-qualified-browser-pending-dense-incomplete-0-of-49" && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v338WorkbenchEvidence === "v336-v337-status-sha-dense-boundary-visible" && pointer.capabilities.v339Provenance === "sanitized-json-csv-summary-only-no-raw-ray-buffer" && pointer.capabilities.v339Authority === "v312-v313-sparse-full-short-sha-exported" && pointer.capabilities.v339DenseBoundary === "v314-incomplete-0-of-49-aggregate-unavailable" && pointer.capabilities.v339ObjectUrlLifecycle === "two-format-reverse-idempotent-baseline-return" && pointer.capabilities.v339LiteBoundary === "explicit-lite-boundary-no-export-artifact" && pointer.capabilities.v339BrowserBoundary === "intent-local-shadow-workbench-only-browser-not-run" && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization" && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49" && pointer.capabilities.denseAggregate === "unavailable" && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default" && pointer.capabilities.browserQualification === "not-run" && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
