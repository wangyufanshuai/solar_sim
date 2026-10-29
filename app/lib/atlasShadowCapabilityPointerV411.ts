export type AtlasShadowCapabilityPointerV411 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v411";
  status: "calibration-schema-qualified-measured-polarimeter-unavailable-v13-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v410IdealDualBeamOperator: "qualified-96-modulation-rows-192-beams-24-reconstructions";
    v411CalibrationSchema: "qualified-11-input-contract-4x4-response-16x16-covariance";
    v411Compiler: "ready-no-input-compiled";
    v411MeasuredManifest: "unavailable";
    v411Admission: "blocked-input-unavailable";
    v411MeasuredPolarimeterAuthority: "not-qualified";
    v411DetectorProjection: "unavailable";
    v411Workbench: "summary-only-full-inspect-download";
    v411BrowserQualification: "not-run";
    v411VisualMatrix: "not-run";
    v411Soak: "not-run";
    v411RtxWebGpu: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
export function parseAtlasShadowCapabilityPointerV411(value: unknown): AtlasShadowCapabilityPointerV411 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV411> : null;
  const capabilities = source?.capabilities;
  if (!source || source.version !== "orbit-atlas-current-local-shadow-candidate-v411" || source.status !== "calibration-schema-qualified-measured-polarimeter-unavailable-v13-browser-pending-dense-incomplete-0-of-49" || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true || capabilities?.v410IdealDualBeamOperator !== "qualified-96-modulation-rows-192-beams-24-reconstructions" || capabilities.v411CalibrationSchema !== "qualified-11-input-contract-4x4-response-16x16-covariance" || capabilities.v411Compiler !== "ready-no-input-compiled" || capabilities.v411MeasuredManifest !== "unavailable" || capabilities.v411Admission !== "blocked-input-unavailable" || capabilities.v411MeasuredPolarimeterAuthority !== "not-qualified" || capabilities.v411DetectorProjection !== "unavailable" || capabilities.v411Workbench !== "summary-only-full-inspect-download" || capabilities.v411BrowserQualification !== "not-run" || capabilities.v411VisualMatrix !== "not-run" || capabilities.v411Soak !== "not-run" || capabilities.v411RtxWebGpu !== "not-run" || capabilities.v314CorrectedDense !== "incomplete-0-of-49" || capabilities.denseAggregate !== "unavailable" || !SHA.test(source.evidence?.fileSha256 ?? "") || !SHA.test(source.evidence?.canonicalSha256 ?? "") || !SHA.test(source.pointerSha256 ?? "")) throw new Error("v411-pointer-identity");
  return value as AtlasShadowCapabilityPointerV411;
}
