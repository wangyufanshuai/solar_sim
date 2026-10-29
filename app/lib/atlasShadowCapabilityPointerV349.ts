export type AtlasShadowCapabilityPointerV349 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v349";
  generatedAt: string;
  status: "visual-v8-v349-qualified-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v348BandContrast: "qualified-detector-independent-and-synthetic-response-separated";
    v349VisualProfile: "science-cinematic-v8-relativistic-spectral-observatory";
    v349RuntimeMatrix: "v5-v6-v7-v8-eight-groups-thirty-two-consumption-rows";
    v349ScienceBoundary: "linear-exposure-one-bloom-zero-noise-zero-profile-invariant";
    v349CinematicBoundary: "v5-v6-v7-v8-seeded-deterministic-pairwise-distinct";
    v349PresentationConsumer: "spectral-ribbon-reticle-channel-separation-seeded-overlay";
    v349AssetRuntime: "licensed-nasa-2k-local-shadow-v8-intent-only";
    v349DefaultBoundary: "manual-local-shadow-only-default-legacy-v9";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

export function parseAtlasShadowCapabilityPointerV349(value: unknown): AtlasShadowCapabilityPointerV349 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV349> : null;
  if (!source
    || source.version !== "orbit-atlas-current-local-shadow-candidate-v349"
    || source.status !== "visual-v8-v349-qualified-browser-pending-dense-incomplete-0-of-49"
    || source.formalProductPointer !== "v263"
    || source.formalProductPointerAdvanced !== false
    || source.localShadowDefaultApplied !== false
    || source.publicDeploymentBlocked !== true
    || source.capabilities?.v349VisualProfile !== "science-cinematic-v8-relativistic-spectral-observatory"
    || source.capabilities.v349RuntimeMatrix !== "v5-v6-v7-v8-eight-groups-thirty-two-consumption-rows"
    || source.capabilities.v349ScienceBoundary !== "linear-exposure-one-bloom-zero-noise-zero-profile-invariant"
    || source.capabilities.v349CinematicBoundary !== "v5-v6-v7-v8-seeded-deterministic-pairwise-distinct"
    || source.capabilities.v349PresentationConsumer !== "spectral-ribbon-reticle-channel-separation-seeded-overlay"
    || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49"
    || source.capabilities.denseAggregate !== "unavailable"
    || source.capabilities.browserQualification !== "not-run"
    || !/^[a-f0-9]{64}$/.test(source.pointerSha256 ?? "")) throw new Error("v349-capability-pointer-identity");
  return value as AtlasShadowCapabilityPointerV349;
}
