export type AtlasShadowCapabilityPointerV350 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v350";
  generatedAt: string;
  status: "observation-v350-qualified-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v349Visual: "qualified-v8-runtime-wired-science-frozen";
    v350BandObservation: "qualified-read-only-units-applicability-provenance";
    v350MeasuredCounts: "unavailable-synthetic-model-only";
    v350SpectralInference: "unavailable-no-physical-fit";
    v350CelestialWcs: "unavailable-sparse-index-grid";
    v350CinematicBoundary: "observation-layer-never-cinematic-color-input";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

export function parseAtlasShadowCapabilityPointerV350(value: unknown): AtlasShadowCapabilityPointerV350 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV350> : null;
  if (!source || source.version !== "orbit-atlas-current-local-shadow-candidate-v350" || source.status !== "observation-v350-qualified-browser-pending-dense-incomplete-0-of-49" || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true || source.capabilities?.v350BandObservation !== "qualified-read-only-units-applicability-provenance" || source.capabilities.v350MeasuredCounts !== "unavailable-synthetic-model-only" || source.capabilities.v350SpectralInference !== "unavailable-no-physical-fit" || source.capabilities.v350CelestialWcs !== "unavailable-sparse-index-grid" || source.capabilities.v350CinematicBoundary !== "observation-layer-never-cinematic-color-input" || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" || source.capabilities.denseAggregate !== "unavailable" || source.capabilities.browserQualification !== "not-run" || !/^[a-f0-9]{64}$/.test(source.pointerSha256 ?? "")) throw new Error("v350-capability-pointer-identity");
  return value as AtlasShadowCapabilityPointerV350;
}
