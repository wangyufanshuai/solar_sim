export type AtlasShadowCapabilityPointerV341 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v341";
  generatedAt: string;
  status: "sparse-observation-product-v341-qualified-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v340VisualProfile: "science-cinematic-v7-deep-space-precision-observatory";
    v341ObservationProduct: "four-disk-rays-twelve-band-geometry-polarization-radiance-uncertainty-instrument-product";
    v341ScienceProfiles: "v5-v6-v7-physical-measurements-invariant";
    v341CinematicBoundary: "seeded-presentation-copies-disjoint-no-physical-fields";
    v341InstrumentBoundary: "synthetic-audit-fixture-not-calibrated-observatory";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

export function parseAtlasShadowCapabilityPointerV341(value: unknown): AtlasShadowCapabilityPointerV341 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV341> : null;
  if (!source || source.version !== "orbit-atlas-current-local-shadow-candidate-v341"
    || source.status !== "sparse-observation-product-v341-qualified-browser-pending-dense-incomplete-0-of-49"
    || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false
    || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true
    || source.capabilities?.v341ObservationProduct !== "four-disk-rays-twelve-band-geometry-polarization-radiance-uncertainty-instrument-product"
    || source.capabilities.v341ScienceProfiles !== "v5-v6-v7-physical-measurements-invariant"
    || source.capabilities.v341CinematicBoundary !== "seeded-presentation-copies-disjoint-no-physical-fields"
    || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" || source.capabilities.denseAggregate !== "unavailable"
    || source.capabilities.browserQualification !== "not-run"
    || !/^[a-f0-9]{64}$/.test(source.evidence?.fileSha256 ?? "")
    || !/^[a-f0-9]{64}$/.test(source.evidence?.canonicalSha256 ?? "")
    || !/^[a-f0-9]{64}$/.test(source.pointerSha256 ?? "")) throw new Error("v341-capability-pointer-identity");
  return value as AtlasShadowCapabilityPointerV341;
}
