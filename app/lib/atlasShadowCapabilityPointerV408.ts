export type AtlasShadowCapabilityPointerV408 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v408";
  status: "independent-scattering-oracle-envelope-qualified-v13-integrated-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v407ScatteringAtmosphere: "qualified-closed-form-approximation-boundary-only";
    v408SiewertSource: "verified-doi-ads-equations-1-2";
    v408NumericalOracle: "qualified-independent-discrete-ordinates-reference-envelope";
    v408FourRayErrorEnvelope: "qualified-v407-underestimates-6.77-to-9.02-percent";
    v408FullCurveSign: "mixed-146-underestimate-35-overestimate";
    v408ExactHFunctionTable: "not-qualified";
    v408Endpoints: "not-qualified-mu-0-and-1";
    v408Workbench: "summary-only-181-point-artifact-download";
    v408BrowserQualification: "not-run";
    v408VisualMatrix: "not-run";
    v408Soak: "not-run";
    v408RtxWebGpu: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
export function parseAtlasShadowCapabilityPointerV408(value: unknown): AtlasShadowCapabilityPointerV408 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV408> : null;
  const capabilities = source?.capabilities;
  if (
    !source || source.version !== "orbit-atlas-current-local-shadow-candidate-v408" ||
    source.status !== "independent-scattering-oracle-envelope-qualified-v13-integrated-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true ||
    capabilities?.v407ScatteringAtmosphere !== "qualified-closed-form-approximation-boundary-only" ||
    capabilities.v408SiewertSource !== "verified-doi-ads-equations-1-2" ||
    capabilities.v408NumericalOracle !== "qualified-independent-discrete-ordinates-reference-envelope" ||
    capabilities.v408FourRayErrorEnvelope !== "qualified-v407-underestimates-6.77-to-9.02-percent" ||
    capabilities.v408FullCurveSign !== "mixed-146-underestimate-35-overestimate" ||
    capabilities.v408ExactHFunctionTable !== "not-qualified" || capabilities.v408Endpoints !== "not-qualified-mu-0-and-1" ||
    capabilities.v408Workbench !== "summary-only-181-point-artifact-download" ||
    capabilities.v408BrowserQualification !== "not-run" || capabilities.v408VisualMatrix !== "not-run" ||
    capabilities.v408Soak !== "not-run" || capabilities.v408RtxWebGpu !== "not-run" ||
    capabilities.v314CorrectedDense !== "incomplete-0-of-49" || capabilities.denseAggregate !== "unavailable" ||
    !SHA.test(source.evidence?.fileSha256 ?? "") || !SHA.test(source.evidence?.canonicalSha256 ?? "") || !SHA.test(source.pointerSha256 ?? "")
  ) throw new Error("v408-pointer-identity");
  return value as AtlasShadowCapabilityPointerV408;
}
