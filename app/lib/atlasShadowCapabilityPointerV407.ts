export type AtlasShadowCapabilityPointerV407 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v407";
  status: "sparse-scattering-atmosphere-approximation-qualified-v13-integrated-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v406StokesTransfer: "qualified-24-samples-3-bands-2-independent-transports";
    v407LocalEmissionAngle: "qualified-4-disk-rays-no-observer-or-screen-substitution";
    v407ScatteringAtmosphere: "qualified-closed-form-approximation-boundary-only";
    v407ExactHFunctionAccuracy: "not-qualified";
    v407StokesTransfer: "qualified-24-angle-dependent-samples";
    v407Workbench: "summary-only-full-angle-and-sample-artifact-download";
    v407BrowserQualification: "not-run";
    v407VisualMatrix: "not-run";
    v407Soak: "not-run";
    v407RtxWebGpu: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
export function parseAtlasShadowCapabilityPointerV407(value: unknown): AtlasShadowCapabilityPointerV407 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV407> : null;
  if (!source || source.version !== "orbit-atlas-current-local-shadow-candidate-v407" || source.status !== "sparse-scattering-atmosphere-approximation-qualified-v13-integrated-browser-pending-dense-incomplete-0-of-49" || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true || source.capabilities?.v406StokesTransfer !== "qualified-24-samples-3-bands-2-independent-transports" || source.capabilities.v407LocalEmissionAngle !== "qualified-4-disk-rays-no-observer-or-screen-substitution" || source.capabilities.v407ScatteringAtmosphere !== "qualified-closed-form-approximation-boundary-only" || source.capabilities.v407ExactHFunctionAccuracy !== "not-qualified" || source.capabilities.v407StokesTransfer !== "qualified-24-angle-dependent-samples" || source.capabilities.v407Workbench !== "summary-only-full-angle-and-sample-artifact-download" || source.capabilities.v407BrowserQualification !== "not-run" || source.capabilities.v407VisualMatrix !== "not-run" || source.capabilities.v407Soak !== "not-run" || source.capabilities.v407RtxWebGpu !== "not-run" || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" || source.capabilities.denseAggregate !== "unavailable" || !SHA.test(source.evidence?.fileSha256 ?? "") || !SHA.test(source.evidence?.canonicalSha256 ?? "") || !SHA.test(source.pointerSha256 ?? "")) throw new Error("v407-pointer-identity");
  return value as AtlasShadowCapabilityPointerV407;
}
