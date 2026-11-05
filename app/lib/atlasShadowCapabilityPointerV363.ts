export type AtlasShadowCapabilityPointerV363 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v363";
  status: "calibration-plan-v363-qualified-plan-only-measured-input-blocked-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v361Calibration: "blocked-measured-calibration-input-unavailable";
    v362VisualProfile: "science-cinematic-v9-instrument-lab-shadow";
    v363CalibrationPlan: "qualified-plan-only-nine-tasks-eleven-requirements";
    v363Identifiability: "structural-full-rank-7-of-7-numerical-conditioning-awaits-measurements";
    v363MeasuredAuthority: "blocked-input-unavailable-no-performance-claim";
    v363TaskExecution: "not-run-plan-only-attempt-not-consumed";
    v314CorrectedDense: "incomplete-0-of-49";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function parseAtlasShadowCapabilityPointerV363(value: unknown): AtlasShadowCapabilityPointerV363 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v363-pointer-object");
  const source = value as Partial<AtlasShadowCapabilityPointerV363>;
  if (source.version !== "orbit-atlas-current-local-shadow-candidate-v363"
    || source.status !== "calibration-plan-v363-qualified-plan-only-measured-input-blocked-browser-pending-dense-incomplete-0-of-49"
    || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false
    || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true
    || source.capabilities?.v361Calibration !== "blocked-measured-calibration-input-unavailable"
    || source.capabilities.v362VisualProfile !== "science-cinematic-v9-instrument-lab-shadow"
    || source.capabilities.v363CalibrationPlan !== "qualified-plan-only-nine-tasks-eleven-requirements"
    || source.capabilities.v363Identifiability !== "structural-full-rank-7-of-7-numerical-conditioning-awaits-measurements"
    || source.capabilities.v363MeasuredAuthority !== "blocked-input-unavailable-no-performance-claim"
    || source.capabilities.v363TaskExecution !== "not-run-plan-only-attempt-not-consumed"
    || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" || source.capabilities.browserQualification !== "not-run"
    || !/^[a-f0-9]{64}$/.test(source.pointerSha256 ?? "")) throw new Error("v363-pointer-identity");
  return value as AtlasShadowCapabilityPointerV363;
}
