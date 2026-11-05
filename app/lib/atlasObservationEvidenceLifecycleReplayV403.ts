import type { AtlasObservationEvidenceStageIdV401, AtlasObservationEvidenceStageAuditV402 } from "./atlasObservationEvidenceCacheV401";

export const ATLAS_OBSERVATION_EVIDENCE_LIFECYCLE_REPLAY_VERSION_V403 =
  "v403-atlas-observation-evidence-lifecycle-replay-v1" as const;

export type AtlasObservationEvidenceLifecycleReplayV403 = Readonly<{
  version: typeof ATLAS_OBSERVATION_EVIDENCE_LIFECYCLE_REPLAY_VERSION_V403;
  generatedAt: string;
  status: "fixture-lifecycle-replay-qualified-browser-soak-pending";
  source: Readonly<{
    v402ArtifactSha256: string;
    v402EvidenceSha256: string;
    v402PointerSha256: string;
  }>;
  campaign: Readonly<{
    cycleCount: 30;
    deterministicExecutionCount: 2;
    successfulCycleCount: 24;
    unavailableCycleCount: 4;
    releasedPendingCycleCount: 2;
    totalRequestCount: 114;
    successCount: 108;
    failureCount: 4;
    releasedPendingRequestCount: 2;
    baselineCycleCount: 30;
    maximumCacheEntryCount: 4;
    maximumCachedBytes: number;
    deterministicReplay: true;
    networkAttempted: false;
  }>;
  stageAudit: Readonly<Record<AtlasObservationEvidenceStageIdV401, AtlasObservationEvidenceStageAuditV402>>;
  cycles: readonly Readonly<{
    cycle: number;
    kind: "success" | "unavailable" | "released-pending";
    unavailableStage: AtlasObservationEvidenceStageIdV401 | null;
    requestDelta: number;
    cacheEntriesAfterRelease: 0;
    cachedBytesAfterRelease: 0;
    activeScopesAfterRelease: 0;
    baseline: true;
  }>[];
  finalLifecycle: Readonly<{
    activeScopeCount: 0;
    releaseCount: 30;
    lifetimeRequestCount: 114;
    releasedPendingRequestCount: 2;
    cacheEntryCount: 0;
    cachedBytes: 0;
    cacheAtBaseline: true;
  }>;
  qualification: Readonly<{
    fixtureReplayQualified: true;
    browserSoakQualified: false;
    productionLifecycleQualified: false;
    scientificAuthorityChanged: false;
  }>;
  artifactSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
export function parseAtlasObservationEvidenceLifecycleReplayV403(value: unknown): AtlasObservationEvidenceLifecycleReplayV403 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasObservationEvidenceLifecycleReplayV403> : null;
  const audits = source?.stageAudit;
  if (!source || source.version !== ATLAS_OBSERVATION_EVIDENCE_LIFECYCLE_REPLAY_VERSION_V403 || source.status !== "fixture-lifecycle-replay-qualified-browser-soak-pending" || !source.source || !Object.values(source.source).every((entry) => SHA256.test(entry)) || source.campaign?.cycleCount !== 30 || source.campaign.deterministicExecutionCount !== 2 || source.campaign.successfulCycleCount !== 24 || source.campaign.unavailableCycleCount !== 4 || source.campaign.releasedPendingCycleCount !== 2 || source.campaign.totalRequestCount !== 114 || source.campaign.successCount !== 108 || source.campaign.failureCount !== 4 || source.campaign.releasedPendingRequestCount !== 2 || source.campaign.baselineCycleCount !== 30 || source.campaign.maximumCacheEntryCount !== 4 || !(source.campaign.maximumCachedBytes > 0 && source.campaign.maximumCachedBytes <= 4 * 131072) || source.campaign.deterministicReplay !== true || source.campaign.networkAttempted !== false || !audits || audits.constraints.lifetimeRequestCount !== 30 || audits.constraints.successCount !== 27 || audits.constraints.failureCount !== 1 || audits.constraints.releasedPendingCount !== 2 || audits.admission.lifetimeRequestCount !== 28 || audits.admission.successCount !== 27 || audits.admission.failureCount !== 1 || audits.admission.releasedPendingCount !== 0 || audits.intake.lifetimeRequestCount !== 28 || audits.intake.successCount !== 27 || audits.intake.failureCount !== 1 || audits.intake.releasedPendingCount !== 0 || audits.provenance.lifetimeRequestCount !== 28 || audits.provenance.successCount !== 27 || audits.provenance.failureCount !== 1 || audits.provenance.releasedPendingCount !== 0 || source.cycles?.length !== 30 || source.cycles.some((cycle, index) => cycle.cycle !== index + 1 || cycle.cacheEntriesAfterRelease !== 0 || cycle.cachedBytesAfterRelease !== 0 || cycle.activeScopesAfterRelease !== 0 || cycle.baseline !== true) || source.finalLifecycle?.activeScopeCount !== 0 || source.finalLifecycle.releaseCount !== 30 || source.finalLifecycle.lifetimeRequestCount !== 114 || source.finalLifecycle.releasedPendingRequestCount !== 2 || source.finalLifecycle.cacheEntryCount !== 0 || source.finalLifecycle.cachedBytes !== 0 || source.finalLifecycle.cacheAtBaseline !== true || source.qualification?.fixtureReplayQualified !== true || source.qualification.browserSoakQualified !== false || source.qualification.productionLifecycleQualified !== false || source.qualification.scientificAuthorityChanged !== false || !SHA256.test(source.artifactSha256 ?? "")) throw new Error("v403-lifecycle-replay-identity");
  return value as AtlasObservationEvidenceLifecycleReplayV403;
}
