export type AtlasShadowCapabilityPointerV346 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v346";
  generatedAt: string;
  status: "science-image-index-probe-v346-qualified-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v345PreviewRuntime: "qualified-route-orientation-baseline";
    v346ProbeArtifact: "twelve-cell-index-coordinate-sha-locked";
    v346ProbeClient: "intent-single-flight-bounded-json-idempotent-baseline";
    v346ProbeCoordinates: "fits-index-qualified-celestial-wcs-unavailable";
    v346ProbeTelemetry: "local-react-state-non-react-app-shell-dataset";
    v346ScienceBoundary: "raw-values-unchanged-no-cinematic-input";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;
export function parseAtlasShadowCapabilityPointerV346(value: unknown): AtlasShadowCapabilityPointerV346 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV346> : null;
  if (!source || source.version !== "orbit-atlas-current-local-shadow-candidate-v346"
    || source.status !== "science-image-index-probe-v346-qualified-browser-pending-dense-incomplete-0-of-49"
    || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false
    || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true
    || source.capabilities?.v346ProbeArtifact !== "twelve-cell-index-coordinate-sha-locked"
    || source.capabilities.v346ProbeClient !== "intent-single-flight-bounded-json-idempotent-baseline"
    || source.capabilities.v346ProbeCoordinates !== "fits-index-qualified-celestial-wcs-unavailable"
    || source.capabilities.v346ProbeTelemetry !== "local-react-state-non-react-app-shell-dataset"
    || source.capabilities.v346ScienceBoundary !== "raw-values-unchanged-no-cinematic-input"
    || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49"
    || source.capabilities.denseAggregate !== "unavailable" || source.capabilities.browserQualification !== "not-run"
    || !/^[a-f0-9]{64}$/.test(source.pointerSha256 ?? "")) throw new Error("v346-capability-pointer-identity");
  return value as AtlasShadowCapabilityPointerV346;
}
