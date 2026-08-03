export const ATLAS_OBSERVATION_LIFECYCLE_REPLAY_SUMMARY_VERSION_V404 =
  "v404-atlas-observation-lifecycle-replay-summary-v1" as const;
export const RELATIVITY_LIFECYCLE_EVIDENCE_RESPONSE_VERSION_V404 =
  "v404-relativity-lifecycle-evidence-response-v1" as const;
export const ATLAS_OBSERVATION_LIFECYCLE_SUMMARY_MAXIMUM_RESPONSE_BYTES_V404 = 131072 as const;
export const ATLAS_OBSERVATION_LIFECYCLE_STAGE_IDS_V404 = Object.freeze([
  "constraints",
  "admission",
  "intake",
  "provenance",
] as const);
export type AtlasObservationLifecycleStageIdV404 =
  (typeof ATLAS_OBSERVATION_LIFECYCLE_STAGE_IDS_V404)[number];

export type AtlasObservationLifecycleReplayStageSummaryV404 = Readonly<{
  lifetimeRequestCount: number;
  successCount: number;
  failureCount: number;
  releasedPendingCount: number;
}>;

export type AtlasObservationLifecycleReplaySummaryV404 = Readonly<{
  version: typeof ATLAS_OBSERVATION_LIFECYCLE_REPLAY_SUMMARY_VERSION_V404;
  generatedAt: string;
  status: "fixture-replay-summary-ready-browser-soak-not-run";
  source: Readonly<{
    replayArtifactSha256: string;
    replayArtifactFileSha256: string;
    v403EvidenceSha256: string;
    v403PointerSha256: string;
  }>;
  replay: Readonly<{
    cycleCount: 30;
    deterministicExecutionCount: 2;
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
  stages: Readonly<Record<AtlasObservationLifecycleStageIdV404, AtlasObservationLifecycleReplayStageSummaryV404>>;
  qualification: Readonly<{
    fixtureReplayQualified: true;
    browserSoakQualified: false;
    productionLifecycleQualified: false;
    scientificAuthorityChanged: false;
    cycleDetailsExposed: false;
  }>;
  summarySha256: string;
}>;

export type RelativityLifecycleEvidenceResponseV404 = Readonly<{
  version: typeof RELATIVITY_LIFECYCLE_EVIDENCE_RESPONSE_VERSION_V404;
  available: boolean;
  reason: "ready" | "lite-boundary" | "evidence-corrupt" | "request-failed";
  summary: AtlasObservationLifecycleReplaySummaryV404 | null;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function parseAtlasObservationLifecycleReplaySummaryV404(
  value: unknown,
): AtlasObservationLifecycleReplaySummaryV404 {
  const source = isObject(value) ? value as Partial<AtlasObservationLifecycleReplaySummaryV404> : null;
  if (!source || "cycles" in source) throw new Error("v404-lifecycle-summary-shape");
  const sourceIdentity = source.source;
  const replay = source.replay;
  const stages = source.stages;
  const qualification = source.qualification;
  if (
    source.version !== ATLAS_OBSERVATION_LIFECYCLE_REPLAY_SUMMARY_VERSION_V404
    || source.status !== "fixture-replay-summary-ready-browser-soak-not-run"
    || !sourceIdentity
    || !Object.values(sourceIdentity).every((entry) => SHA256.test(entry))
    || replay?.cycleCount !== 30
    || replay.deterministicExecutionCount !== 2
    || replay.totalRequestCount !== 114
    || replay.successCount !== 108
    || replay.failureCount !== 4
    || replay.releasedPendingRequestCount !== 2
    || replay.baselineCycleCount !== 30
    || replay.maximumCacheEntryCount !== 4
    || !(replay.maximumCachedBytes > 0 && replay.maximumCachedBytes <= 4 * 131072)
    || replay.deterministicReplay !== true
    || replay.networkAttempted !== false
    || !stages
    || qualification?.fixtureReplayQualified !== true
    || qualification.browserSoakQualified !== false
    || qualification.productionLifecycleQualified !== false
    || qualification.scientificAuthorityChanged !== false
    || qualification.cycleDetailsExposed !== false
    || !SHA256.test(source.summarySha256 ?? "")
  ) throw new Error("v404-lifecycle-summary-identity");

  const expected: Readonly<Record<AtlasObservationLifecycleStageIdV404, readonly [number, number, number, number]>> = {
    constraints: [30, 27, 1, 2],
    admission: [28, 27, 1, 0],
    intake: [28, 27, 1, 0],
    provenance: [28, 27, 1, 0],
  };
  for (const stage of ATLAS_OBSERVATION_LIFECYCLE_STAGE_IDS_V404) {
    const actual = stages[stage];
    const [requests, success, failure, released] = expected[stage];
    if (
      actual?.lifetimeRequestCount !== requests
      || actual.successCount !== success
      || actual.failureCount !== failure
      || actual.releasedPendingCount !== released
    ) throw new Error(`v404-lifecycle-summary-stage-${stage}`);
  }
  return value as AtlasObservationLifecycleReplaySummaryV404;
}

export function parseRelativityLifecycleEvidenceResponseV404(
  value: unknown,
): RelativityLifecycleEvidenceResponseV404 {
  const source = isObject(value) ? value as Partial<RelativityLifecycleEvidenceResponseV404> : null;
  if (!source || source.version !== RELATIVITY_LIFECYCLE_EVIDENCE_RESPONSE_VERSION_V404) {
    throw new Error("v404-lifecycle-response-version");
  }
  if (source.available === true && source.reason === "ready" && source.summary) {
    return {
      version: RELATIVITY_LIFECYCLE_EVIDENCE_RESPONSE_VERSION_V404,
      available: true,
      reason: "ready",
      summary: parseAtlasObservationLifecycleReplaySummaryV404(source.summary),
    };
  }
  if (
    source.available === false
    && (source.reason === "lite-boundary" || source.reason === "evidence-corrupt" || source.reason === "request-failed")
    && source.summary === null
  ) return source as RelativityLifecycleEvidenceResponseV404;
  throw new Error("v404-lifecycle-response-identity");
}
