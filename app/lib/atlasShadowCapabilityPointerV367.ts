export type AtlasShadowCapabilityPointerV367 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v367";
  status: "detector-calibration-authority-admission-v367-blocked-inputs-unavailable-controller-implemented-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v365Compiler: "implemented-strict-csv-derived-no-authority-grant";
    v366Validator: "implemented-independent-recomputation-frozen-gates";
    v367AdmissionController: "implemented-explicit-identity-sha-independent-validation-fail-closed";
    v367AdmissionInput: "blocked-0-of-7-inputs-present";
    v367AdmissionExecution: "not-run-attempt-not-consumed";
    v367TestFixture: "rejected-nonpublishable-even-if-numerically-qualified";
    v367MeasuredAuthority: "unavailable-no-authority-granted";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

export function parseAtlasShadowCapabilityPointerV367(value: unknown): AtlasShadowCapabilityPointerV367 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<AtlasShadowCapabilityPointerV367>
    : null;
  if (!source
    || source.version !== "orbit-atlas-current-local-shadow-candidate-v367"
    || source.status !== "detector-calibration-authority-admission-v367-blocked-inputs-unavailable-controller-implemented-dense-incomplete-0-of-49"
    || source.formalProductPointer !== "v263"
    || source.formalProductPointerAdvanced !== false
    || source.localShadowDefaultApplied !== false
    || source.publicDeploymentBlocked !== true
    || source.capabilities?.v365Compiler !== "implemented-strict-csv-derived-no-authority-grant"
    || source.capabilities.v366Validator !== "implemented-independent-recomputation-frozen-gates"
    || source.capabilities.v367AdmissionController !== "implemented-explicit-identity-sha-independent-validation-fail-closed"
    || source.capabilities.v367AdmissionInput !== "blocked-0-of-7-inputs-present"
    || source.capabilities.v367AdmissionExecution !== "not-run-attempt-not-consumed"
    || source.capabilities.v367TestFixture !== "rejected-nonpublishable-even-if-numerically-qualified"
    || source.capabilities.v367MeasuredAuthority !== "unavailable-no-authority-granted"
    || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49"
    || source.capabilities.denseAggregate !== "unavailable"
    || source.capabilities.browserQualification !== "not-run"
    || !/^[a-f0-9]{64}$/.test(source.evidence?.fileSha256 ?? "")
    || !/^[a-f0-9]{64}$/.test(source.evidence?.canonicalSha256 ?? "")
    || !/^[a-f0-9]{64}$/.test(source.pointerSha256 ?? "")) throw new Error("v367-pointer-identity");
  return value as AtlasShadowCapabilityPointerV367;
}
