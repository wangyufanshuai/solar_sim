export type AtlasShadowCapabilityPointerV406 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v406";
  status: "sparse-stokes-transfer-qualified-v13-integrated-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263"; formalProductPointerAdvanced: false; localShadowDefaultApplied: false; publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v405PortableDossier: "qualified-4-nodes-3-edges-no-cycle-details";
    v405V13EvidenceObservatory: "static-qualified-local-shadow-manual-only";
    v406StokesTransfer: "qualified-24-samples-3-bands-2-independent-transports";
    v406InvariantGate: "i-over-nu3-l-over-nu3-fraction-and-inverse-rotation-qualified";
    v406ModelBoundary: "stokes-v-and-faraday-unavailable-no-plasma-claim";
    v406Workbench: "summary-only-full-artifact-download";
    v406BrowserQualification: "not-run"; v406VisualMatrix: "not-run"; v406Soak: "not-run"; v406RtxWebGpu: "not-run";
    v314CorrectedDense: "incomplete-0-of-49"; denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;
const SHA = /^[a-f0-9]{64}$/;
export function parseAtlasShadowCapabilityPointerV406(value: unknown): AtlasShadowCapabilityPointerV406 { const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV406> : null; if (!source || source.version !== "orbit-atlas-current-local-shadow-candidate-v406" || source.status !== "sparse-stokes-transfer-qualified-v13-integrated-browser-pending-dense-incomplete-0-of-49" || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true || source.capabilities?.v405PortableDossier !== "qualified-4-nodes-3-edges-no-cycle-details" || source.capabilities.v405V13EvidenceObservatory !== "static-qualified-local-shadow-manual-only" || source.capabilities.v406StokesTransfer !== "qualified-24-samples-3-bands-2-independent-transports" || source.capabilities.v406InvariantGate !== "i-over-nu3-l-over-nu3-fraction-and-inverse-rotation-qualified" || source.capabilities.v406ModelBoundary !== "stokes-v-and-faraday-unavailable-no-plasma-claim" || source.capabilities.v406Workbench !== "summary-only-full-artifact-download" || source.capabilities.v406BrowserQualification !== "not-run" || source.capabilities.v406VisualMatrix !== "not-run" || source.capabilities.v406Soak !== "not-run" || source.capabilities.v406RtxWebGpu !== "not-run" || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" || source.capabilities.denseAggregate !== "unavailable" || !SHA.test(source.evidence?.fileSha256 ?? "") || !SHA.test(source.evidence?.canonicalSha256 ?? "") || !SHA.test(source.pointerSha256 ?? "")) throw new Error("v406-pointer-identity"); return value as AtlasShadowCapabilityPointerV406; }
