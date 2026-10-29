export type AtlasShadowCapabilityPointerV338 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v338";
  status: "workbench-evidence-v338-wired-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v337BufferReplay: "qualified-sparse-science-cinematic-buffer-boundary";
    v338EvidenceAdapter: "v336-v337-bounded-sanitized-read-only";
    v338EvidenceApi: "no-store-128kib-single-flight-mtime-size-sha-cache";
    v338Workbench: "v336-v337-status-sha-dense-boundary-visible";
    v338LiteBoundary: "explicit-lite-boundary-no-science-artifacts";
    v338Exports: "summary-only-no-raw-ray-buffer";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV338(value: unknown): value is AtlasShadowCapabilityPointerV338 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV338>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v338"
    && pointer.status === "workbench-evidence-v338-wired-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v337BufferReplay === "qualified-sparse-science-cinematic-buffer-boundary"
    && pointer.capabilities.v338EvidenceAdapter === "v336-v337-bounded-sanitized-read-only"
    && pointer.capabilities.v338EvidenceApi === "no-store-128kib-single-flight-mtime-size-sha-cache"
    && pointer.capabilities.v338Workbench === "v336-v337-status-sha-dense-boundary-visible"
    && pointer.capabilities.v338LiteBoundary === "explicit-lite-boundary-no-science-artifacts"
    && pointer.capabilities.v338Exports === "summary-only-no-raw-ray-buffer"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
