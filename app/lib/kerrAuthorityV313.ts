export const KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313 = "e4b6044ed828f31b7eb511b4e722bc474414acdcab8cedbdf16484b20216ae6f" as const;
export const KERR_POLARIZATION_AUTHORITY_FILE_SHA256_V313 = "b102cff3adcd9f5c0f4b6e51c9a05e6baaa2516b21d7fa816ed86dbe6f0ec12b" as const;
export const KERR_GEOMETRY_AUTHORITY_EVIDENCE_SHA256_V313 = "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e" as const;

export type KerrPolarizationRequalificationV313 = Readonly<{
  version: "v313-kerr-disk-polarization-requalification-v1";
  attemptId: "v313-polarization-attempt-1";
  status: "full-kerr-short-authority-qualified";
  qualified: true;
  fullKerrShortAuthorityQualified: true;
  geometryAuthorityVersion: "v312";
  geometryEvidenceSha256: string;
  sourceExecutionCount: 128;
  captureEscapeNotApplicableCount: 96;
  sourceDiskHitExecutionCount: 32;
  applicableExecutionCount: 16;
  uniqueDiskRayCount: 4;
  thresholds: Readonly<{
    maxReleaseEvpaDifferenceDeg: number;
    maxInternalEvpaDifferenceDeg: number;
    releaseEvpaDifferenceLimitDeg: 0.5;
    internalEvpaDifferenceLimitDeg: 0.1;
    releaseInvariantLimit: 1e-10;
    internalInvariantLimit: 1e-11;
    maxKsDiskRadiusDifferenceM: number;
  }>;
  gates: Readonly<Record<string, boolean>>;
  resource: Readonly<{ peakRssGiB: number; minimumFreeMemoryGiB: 4; minimumFreeDiskGiB: 30; passed: true }>;
  historicalV297: Readonly<{ evidenceSha256: string; preserved: true }>;
  tolerancePolicy: Readonly<{ geometrySolverLadder: "v312-release-1e-11-internal-1e-13"; polarizationTransportThresholds: "v297-frozen"; thresholdRelaxation: "not-applied" }>;
  release: Readonly<{ formalProductPointer: "v263"; formalProductPointerAdvanced: false; denseShardExecuted: false; correctedDenseCampaignCreated: false; correctedDenseShardExecuted: false }>;
  evidenceSha256: string;
}>;

export type KerrPolarizationRequalificationViewV313 = Readonly<{
  version: "v313-kerr-polarization-requalification-view-v1";
  status: "full-kerr-short-authority-qualified";
  authoritySha256: string;
  geometryAuthoritySha256: string;
  counts: Readonly<{ sourceExecutionCount: 128; captureEscapeNotApplicableCount: 96; diskHitSourceCount: 32; applicableExecutionCount: 16; uniqueDiskRayCount: 4 }>;
  maxima: Readonly<{ releaseEvpaDifferenceDeg: number; internalEvpaDifferenceDeg: number; ksDiskRadiusDifferenceM: number }>;
  resource: Readonly<{ peakRssGiB: number; qualified: true }>;
  policy: Readonly<{ geometrySolverLadder: "v312-release-1e-11-internal-1e-13"; polarizationTransportThresholds: "v297-frozen"; thresholdRelaxation: "not-applied" }>;
  boundary: "v312-geometry-plus-v313-polarization-full-short-authority-no-dense-map";
}>;

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v313-${label}-invalid`);
  return value as Record<string, unknown>;
}

export function parseKerrPolarizationRequalificationV313(value: unknown): KerrPolarizationRequalificationV313 {
  const source = record(value, "authority");
  const thresholds = record(source.thresholds, "thresholds");
  const gates = record(source.gates, "gates");
  const resource = record(source.resource, "resource");
  const historical = record(source.historicalV297, "history");
  const policy = record(source.tolerancePolicy, "policy");
  const release = record(source.release, "release");
  if (source.version !== "v313-kerr-disk-polarization-requalification-v1" || source.attemptId !== "v313-polarization-attempt-1"
    || source.status !== "full-kerr-short-authority-qualified" || source.qualified !== true || source.fullKerrShortAuthorityQualified !== true
    || source.geometryAuthorityVersion !== "v312" || source.geometryEvidenceSha256 !== KERR_GEOMETRY_AUTHORITY_EVIDENCE_SHA256_V313
    || source.sourceExecutionCount !== 128 || source.captureEscapeNotApplicableCount !== 96 || source.sourceDiskHitExecutionCount !== 32
    || source.applicableExecutionCount !== 16 || source.uniqueDiskRayCount !== 4 || source.evidenceSha256 !== KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313) throw new Error("v313-authority-identity-invalid");
  if (Object.keys(gates).length < 9 || Object.values(gates).some((passed) => passed !== true)
    || Number(thresholds.maxReleaseEvpaDifferenceDeg) >= 0.5 || Number(thresholds.maxInternalEvpaDifferenceDeg) >= 0.1
    || Number(thresholds.maxKsDiskRadiusDifferenceM) >= 1e-10 || thresholds.releaseInvariantLimit !== 1e-10 || thresholds.internalInvariantLimit !== 1e-11) throw new Error("v313-polarization-threshold-invalid");
  if (Number(resource.peakRssGiB) <= 0 || Number(resource.peakRssGiB) >= 2 || resource.minimumFreeMemoryGiB !== 4 || resource.minimumFreeDiskGiB !== 30 || resource.passed !== true) throw new Error("v313-resource-invalid");
  if (historical.preserved !== true || typeof historical.evidenceSha256 !== "string"
    || policy.geometrySolverLadder !== "v312-release-1e-11-internal-1e-13" || policy.polarizationTransportThresholds !== "v297-frozen" || policy.thresholdRelaxation !== "not-applied"
    || release.formalProductPointer !== "v263" || release.formalProductPointerAdvanced !== false || release.denseShardExecuted !== false || release.correctedDenseCampaignCreated !== false || release.correctedDenseShardExecuted !== false) throw new Error("v313-boundary-invalid");
  return value as KerrPolarizationRequalificationV313;
}

export function createKerrPolarizationRequalificationViewV313(value: unknown): KerrPolarizationRequalificationViewV313 {
  const authority = parseKerrPolarizationRequalificationV313(value);
  return {
    version: "v313-kerr-polarization-requalification-view-v1",
    status: authority.status,
    authoritySha256: authority.evidenceSha256,
    geometryAuthoritySha256: authority.geometryEvidenceSha256,
    counts: { sourceExecutionCount: 128, captureEscapeNotApplicableCount: 96, diskHitSourceCount: 32, applicableExecutionCount: 16, uniqueDiskRayCount: 4 },
    maxima: { releaseEvpaDifferenceDeg: authority.thresholds.maxReleaseEvpaDifferenceDeg, internalEvpaDifferenceDeg: authority.thresholds.maxInternalEvpaDifferenceDeg, ksDiskRadiusDifferenceM: authority.thresholds.maxKsDiskRadiusDifferenceM },
    resource: { peakRssGiB: authority.resource.peakRssGiB, qualified: true },
    policy: authority.tolerancePolicy,
    boundary: "v312-geometry-plus-v313-polarization-full-short-authority-no-dense-map",
  };
}

export function parseKerrPolarizationRequalificationViewV313(value: unknown): KerrPolarizationRequalificationViewV313 {
  const source = record(value, "view");
  const counts = record(source.counts, "view-counts");
  if (source.version !== "v313-kerr-polarization-requalification-view-v1" || source.status !== "full-kerr-short-authority-qualified"
    || source.authoritySha256 !== KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313 || source.geometryAuthoritySha256 !== KERR_GEOMETRY_AUTHORITY_EVIDENCE_SHA256_V313
    || counts.applicableExecutionCount !== 16 || counts.captureEscapeNotApplicableCount !== 96
    || source.boundary !== "v312-geometry-plus-v313-polarization-full-short-authority-no-dense-map") throw new Error("v313-view-invalid");
  return value as KerrPolarizationRequalificationViewV313;
}
