export type AtlasShadowCapabilityPointerV368 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v368";
  status: "detector-response-authority-gate-v368-implemented-authority-unavailable-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v367AdmissionController: "implemented-explicit-identity-sha-independent-validation-fail-closed";
    v368MeasuredResponseGate: "implemented-manifest-file-canonical-sha-authority-locked";
    v368MeasuredResponse: "unavailable-v367-authority-artifacts-missing";
    v368SyntheticBoundary: "v332-separate-qualified-fixture-never-measured-fallback";
    v368RuntimeLoading: "local-shadow-research-instrument-intent-only";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

export function parseAtlasShadowCapabilityPointerV368(value: unknown): AtlasShadowCapabilityPointerV368 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV368> : null;
  if (!source
    || source.version !== "orbit-atlas-current-local-shadow-candidate-v368"
    || source.status !== "detector-response-authority-gate-v368-implemented-authority-unavailable-dense-incomplete-0-of-49"
    || source.formalProductPointer !== "v263"
    || source.formalProductPointerAdvanced !== false
    || source.localShadowDefaultApplied !== false
    || source.publicDeploymentBlocked !== true
    || source.capabilities?.v367AdmissionController !== "implemented-explicit-identity-sha-independent-validation-fail-closed"
    || source.capabilities.v368MeasuredResponseGate !== "implemented-manifest-file-canonical-sha-authority-locked"
    || source.capabilities.v368MeasuredResponse !== "unavailable-v367-authority-artifacts-missing"
    || source.capabilities.v368SyntheticBoundary !== "v332-separate-qualified-fixture-never-measured-fallback"
    || source.capabilities.v368RuntimeLoading !== "local-shadow-research-instrument-intent-only"
    || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49"
    || source.capabilities.denseAggregate !== "unavailable"
    || source.capabilities.browserQualification !== "not-run"
    || !/^[a-f0-9]{64}$/.test(source.evidence?.fileSha256 ?? "")
    || !/^[a-f0-9]{64}$/.test(source.evidence?.canonicalSha256 ?? "")
    || !/^[a-f0-9]{64}$/.test(source.pointerSha256 ?? "")) throw new Error("v368-pointer-identity");
  return value as AtlasShadowCapabilityPointerV368;
}
