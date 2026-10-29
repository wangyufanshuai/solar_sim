export type AtlasShadowCapabilityPointerV409 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v409";
  status: "corrected-sparse-stokes-qualified-v13-integrated-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v408NumericalOracle: "qualified-independent-discrete-ordinates-reference-envelope";
    v409CorrectedStokesPayload: "qualified-24-samples-4-rays-3-bands-2-transports";
    v409CorrectionMagnitude: "qualified-plus-7.26-to-9.91-percent";
    v409Uncertainty: "linear-no-rss-no-independence-claim";
    v409CurveInterpolation: "not-applied";
    v409ExactHFunctionTable: "not-qualified";
    v409DenseImage: "not-qualified";
    v409Workbench: "summary-only-full-24-sample-artifact-download";
    v409BrowserQualification: "not-run";
    v409VisualMatrix: "not-run";
    v409Soak: "not-run";
    v409RtxWebGpu: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;
const SHA = /^[a-f0-9]{64}$/;
export function parseAtlasShadowCapabilityPointerV409(value: unknown): AtlasShadowCapabilityPointerV409 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV409> : null; const c = source?.capabilities;
  if (!source || source.version !== "orbit-atlas-current-local-shadow-candidate-v409" || source.status !== "corrected-sparse-stokes-qualified-v13-integrated-browser-pending-dense-incomplete-0-of-49" || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true || c?.v408NumericalOracle !== "qualified-independent-discrete-ordinates-reference-envelope" || c.v409CorrectedStokesPayload !== "qualified-24-samples-4-rays-3-bands-2-transports" || c.v409CorrectionMagnitude !== "qualified-plus-7.26-to-9.91-percent" || c.v409Uncertainty !== "linear-no-rss-no-independence-claim" || c.v409CurveInterpolation !== "not-applied" || c.v409ExactHFunctionTable !== "not-qualified" || c.v409DenseImage !== "not-qualified" || c.v409Workbench !== "summary-only-full-24-sample-artifact-download" || c.v409BrowserQualification !== "not-run" || c.v409VisualMatrix !== "not-run" || c.v409Soak !== "not-run" || c.v409RtxWebGpu !== "not-run" || c.v314CorrectedDense !== "incomplete-0-of-49" || c.denseAggregate !== "unavailable" || !SHA.test(source.evidence?.fileSha256 ?? "") || !SHA.test(source.evidence?.canonicalSha256 ?? "") || !SHA.test(source.pointerSha256 ?? "")) throw new Error("v409-pointer-identity");
  return value as AtlasShadowCapabilityPointerV409;
}
