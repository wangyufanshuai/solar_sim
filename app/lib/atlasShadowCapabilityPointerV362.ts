export type AtlasShadowCapabilityPointerV362 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v362";
  status: "visual-v9-instrument-lab-v362-implemented-browser-pending-calibration-blocked-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v361Calibration: "blocked-measured-calibration-input-unavailable";
    v362VisualProfile: "science-cinematic-v9-instrument-lab-shadow";
    v362InstrumentLab: "five-synthetic-stages-qualified-measured-stage-blocked-read-only";
    v362DefaultBoundary: "manual-local-shadow-only-default-legacy-v9";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function parseAtlasShadowCapabilityPointerV362(value: unknown): AtlasShadowCapabilityPointerV362 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v362-pointer-object");
  const source = value as Partial<AtlasShadowCapabilityPointerV362>;
  if (source.version !== "orbit-atlas-current-local-shadow-candidate-v362"
    || source.status !== "visual-v9-instrument-lab-v362-implemented-browser-pending-calibration-blocked-dense-incomplete-0-of-49"
    || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false
    || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true
    || source.capabilities?.v361Calibration !== "blocked-measured-calibration-input-unavailable"
    || source.capabilities.v362VisualProfile !== "science-cinematic-v9-instrument-lab-shadow"
    || source.capabilities.v362InstrumentLab !== "five-synthetic-stages-qualified-measured-stage-blocked-read-only"
    || source.capabilities.v362DefaultBoundary !== "manual-local-shadow-only-default-legacy-v9"
    || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49"
    || source.capabilities.denseAggregate !== "unavailable" || source.capabilities.browserQualification !== "not-run"
    || !/^[a-f0-9]{64}$/.test(source.pointerSha256 ?? "")) throw new Error("v362-pointer-identity");
  return value as AtlasShadowCapabilityPointerV362;
}
