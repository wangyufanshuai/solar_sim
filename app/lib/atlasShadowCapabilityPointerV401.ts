export type AtlasShadowCapabilityPointerV401 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v401";
  status: "observation-evidence-single-flight-static-qualified-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v400ObservationHub: "static-qualified-4-stages-maximum-1-mounted";
    v401EvidenceCache: "static-qualified-4-stage-single-flight-maximum-1-request-each";
    v401FailurePolicy: "failed-promise-retained-no-automatic-retry";
    v401DynamicNavigation: "implemented-awaiting-browser-qualification";
    v401SnapshotBoundary: "sanitized-status-only-no-artifacts";
    v401CacheTelemetry: "entries-requests-response-bytes-128-kib-per-stage";
    v401BrowserQualification: "not-run";
    v401VisualMatrix: "not-run";
    v401Soak: "not-run";
    v401RtxWebGpu: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
export function parseAtlasShadowCapabilityPointerV401(value: unknown): AtlasShadowCapabilityPointerV401 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV401> : null;
  if (!source || source.version !== "orbit-atlas-current-local-shadow-candidate-v401" || source.status !== "observation-evidence-single-flight-static-qualified-browser-pending-dense-incomplete-0-of-49" || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true || source.capabilities?.v400ObservationHub !== "static-qualified-4-stages-maximum-1-mounted" || source.capabilities.v401EvidenceCache !== "static-qualified-4-stage-single-flight-maximum-1-request-each" || source.capabilities.v401FailurePolicy !== "failed-promise-retained-no-automatic-retry" || source.capabilities.v401DynamicNavigation !== "implemented-awaiting-browser-qualification" || source.capabilities.v401SnapshotBoundary !== "sanitized-status-only-no-artifacts" || source.capabilities.v401CacheTelemetry !== "entries-requests-response-bytes-128-kib-per-stage" || source.capabilities.v401BrowserQualification !== "not-run" || source.capabilities.v401VisualMatrix !== "not-run" || source.capabilities.v401Soak !== "not-run" || source.capabilities.v401RtxWebGpu !== "not-run" || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" || source.capabilities.denseAggregate !== "unavailable" || !SHA256.test(source.evidence?.fileSha256 ?? "") || !SHA256.test(source.evidence?.canonicalSha256 ?? "") || !SHA256.test(source.pointerSha256 ?? "")) throw new Error("v401-pointer-identity");
  return value as AtlasShadowCapabilityPointerV401;
}
