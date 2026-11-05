export type AtlasShadowCapabilityPointerV405 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v405";
  status: "portable-lifecycle-provenance-v13-static-qualified-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v404BoundedSummary: "qualified-cycles-omitted-response-under-128-kib";
    v405PortableDossier: "qualified-4-nodes-3-edges-no-cycle-details";
    v405V13EvidenceObservatory: "static-qualified-local-shadow-manual-only";
    v405DossierRuntime: "implemented-single-flight-read-only-export";
    v405LiteBoundary: "unavailable";
    v405OrdinaryStandaloneBoundary: "local-shadow-only";
    v405BrowserQualification: "not-run";
    v405VisualMatrix: "not-run";
    v405Soak: "not-run";
    v405RtxWebGpu: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;
const SHA256 = /^[a-f0-9]{64}$/;
export function parseAtlasShadowCapabilityPointerV405(value: unknown): AtlasShadowCapabilityPointerV405 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV405> : null;
  if (!source || source.version !== "orbit-atlas-current-local-shadow-candidate-v405" || source.status !== "portable-lifecycle-provenance-v13-static-qualified-browser-pending-dense-incomplete-0-of-49" || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true || source.capabilities?.v404BoundedSummary !== "qualified-cycles-omitted-response-under-128-kib" || source.capabilities.v405PortableDossier !== "qualified-4-nodes-3-edges-no-cycle-details" || source.capabilities.v405V13EvidenceObservatory !== "static-qualified-local-shadow-manual-only" || source.capabilities.v405DossierRuntime !== "implemented-single-flight-read-only-export" || source.capabilities.v405LiteBoundary !== "unavailable" || source.capabilities.v405OrdinaryStandaloneBoundary !== "local-shadow-only" || source.capabilities.v405BrowserQualification !== "not-run" || source.capabilities.v405VisualMatrix !== "not-run" || source.capabilities.v405Soak !== "not-run" || source.capabilities.v405RtxWebGpu !== "not-run" || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" || source.capabilities.denseAggregate !== "unavailable" || !SHA256.test(source.evidence?.fileSha256 ?? "") || !SHA256.test(source.evidence?.canonicalSha256 ?? "") || !SHA256.test(source.pointerSha256 ?? "")) throw new Error("v405-pointer-identity");
  return value as AtlasShadowCapabilityPointerV405;
}
