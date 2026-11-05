export type AtlasShadowCapabilityPointerV400 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v400";
  status: "observation-hub-v12-static-qualified-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v399ValueFreeTemplate: "qualified-13-slots-no-values-not-compile-eligible";
    v400VisualProfile: "science-cinematic-v12-stable-v11-frozen";
    v400ScienceBoundary: "qualified-linear-exposure-1-bloom-0-noise-0";
    v400ObservationHub: "static-qualified-4-stages-maximum-1-mounted";
    v400ResourceTelemetry: "direct-dom-registry-workers-textures-gpu-object-urls-camera-leases";
    v400ManualAb: "local-shadow-only-default-legacy-v9";
    v400BrowserQualification: "not-run";
    v400VisualMatrix: "not-run";
    v400Soak: "not-run";
    v400RtxWebGpu: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
export function parseAtlasShadowCapabilityPointerV400(value: unknown): AtlasShadowCapabilityPointerV400 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV400> : null;
  if (!source || source.version !== "orbit-atlas-current-local-shadow-candidate-v400" || source.status !== "observation-hub-v12-static-qualified-browser-pending-dense-incomplete-0-of-49" || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true || source.capabilities?.v399ValueFreeTemplate !== "qualified-13-slots-no-values-not-compile-eligible" || source.capabilities.v400VisualProfile !== "science-cinematic-v12-stable-v11-frozen" || source.capabilities.v400ScienceBoundary !== "qualified-linear-exposure-1-bloom-0-noise-0" || source.capabilities.v400ObservationHub !== "static-qualified-4-stages-maximum-1-mounted" || source.capabilities.v400ResourceTelemetry !== "direct-dom-registry-workers-textures-gpu-object-urls-camera-leases" || source.capabilities.v400ManualAb !== "local-shadow-only-default-legacy-v9" || source.capabilities.v400BrowserQualification !== "not-run" || source.capabilities.v400VisualMatrix !== "not-run" || source.capabilities.v400Soak !== "not-run" || source.capabilities.v400RtxWebGpu !== "not-run" || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" || source.capabilities.denseAggregate !== "unavailable" || !SHA256.test(source.evidence?.fileSha256 ?? "") || !SHA256.test(source.evidence?.canonicalSha256 ?? "") || !SHA256.test(source.pointerSha256 ?? "")) throw new Error("v400-pointer-identity");
  return value as AtlasShadowCapabilityPointerV400;
}
