export type AtlasShadowCapabilityPointerV402 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v402";
  status: "observation-evidence-lifecycle-static-qualified-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v401EvidenceCache: "static-qualified-4-stage-single-flight-maximum-1-request-each";
    v402CacheLifecycle: "static-qualified-final-scope-release-entries-0-bytes-0";
    v402PendingRequests: "aborted-on-release-generation-isolated-not-scientific-failure";
    v402AuditLedger: "retained-lifetime-success-failure-released-counts";
    v402StrictMode: "microtask-deferred-idempotent-reacquire-stable";
    v402ScopeWiring: "v11-and-v12-profile-scoped";
    v402BrowserQualification: "not-run";
    v402VisualMatrix: "not-run";
    v402Soak: "not-run";
    v402RtxWebGpu: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
export function parseAtlasShadowCapabilityPointerV402(value: unknown): AtlasShadowCapabilityPointerV402 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV402> : null;
  if (!source || source.version !== "orbit-atlas-current-local-shadow-candidate-v402" || source.status !== "observation-evidence-lifecycle-static-qualified-browser-pending-dense-incomplete-0-of-49" || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true || source.capabilities?.v401EvidenceCache !== "static-qualified-4-stage-single-flight-maximum-1-request-each" || source.capabilities.v402CacheLifecycle !== "static-qualified-final-scope-release-entries-0-bytes-0" || source.capabilities.v402PendingRequests !== "aborted-on-release-generation-isolated-not-scientific-failure" || source.capabilities.v402AuditLedger !== "retained-lifetime-success-failure-released-counts" || source.capabilities.v402StrictMode !== "microtask-deferred-idempotent-reacquire-stable" || source.capabilities.v402ScopeWiring !== "v11-and-v12-profile-scoped" || source.capabilities.v402BrowserQualification !== "not-run" || source.capabilities.v402VisualMatrix !== "not-run" || source.capabilities.v402Soak !== "not-run" || source.capabilities.v402RtxWebGpu !== "not-run" || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" || source.capabilities.denseAggregate !== "unavailable" || !SHA256.test(source.evidence?.fileSha256 ?? "") || !SHA256.test(source.evidence?.canonicalSha256 ?? "") || !SHA256.test(source.pointerSha256 ?? "")) throw new Error("v402-pointer-identity");
  return value as AtlasShadowCapabilityPointerV402;
}
