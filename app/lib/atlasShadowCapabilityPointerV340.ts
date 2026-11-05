export type AtlasShadowCapabilityPointerV340 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v340";
  status: "visual-v7-v340-wired-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v339Provenance: "sanitized-json-csv-object-url-baseline-qualified";
    v340VisualProfile: "science-cinematic-v7-deep-space-precision-observatory";
    v340RuntimeMatrix: "v5-v6-v7-eight-groups-twenty-four-consumption-rows";
    v340ScienceBoundary: "linear-exposure-one-bloom-zero-noise-zero-profile-invariant";
    v340CinematicBoundary: "v5-v6-v7-seeded-deterministic-pairwise-distinct";
    v340AssetRuntime: "licensed-nasa-2k-local-shadow-v7-intent-only";
    v340DefaultBoundary: "manual-local-shadow-only-default-legacy-v9";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV340(value: unknown): value is AtlasShadowCapabilityPointerV340 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV340>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v340" && pointer.status === "visual-v7-v340-wired-browser-pending-dense-incomplete-0-of-49" && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true && pointer.capabilities?.v339Provenance === "sanitized-json-csv-object-url-baseline-qualified" && pointer.capabilities.v340VisualProfile === "science-cinematic-v7-deep-space-precision-observatory" && pointer.capabilities.v340RuntimeMatrix === "v5-v6-v7-eight-groups-twenty-four-consumption-rows" && pointer.capabilities.v340ScienceBoundary === "linear-exposure-one-bloom-zero-noise-zero-profile-invariant" && pointer.capabilities.v340CinematicBoundary === "v5-v6-v7-seeded-deterministic-pairwise-distinct" && pointer.capabilities.v340AssetRuntime === "licensed-nasa-2k-local-shadow-v7-intent-only" && pointer.capabilities.v340DefaultBoundary === "manual-local-shadow-only-default-legacy-v9" && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization" && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49" && pointer.capabilities.denseAggregate === "unavailable" && pointer.capabilities.browserQualification === "not-run" && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}
