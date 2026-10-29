import type { AtlasObservationEvidenceStageIdV401 } from "./atlasObservationEvidenceCacheV401";

export const ATLAS_OBSERVATION_EVIDENCE_CACHE_QUALIFICATION_VERSION_V401 =
  "v401-atlas-observation-evidence-cache-qualification-v1" as const;

export type AtlasObservationEvidenceCacheQualificationV401 = Readonly<{
  version: typeof ATLAS_OBSERVATION_EVIDENCE_CACHE_QUALIFICATION_VERSION_V401;
  generatedAt: string;
  status: "observation-evidence-single-flight-static-qualified-browser-pending";
  source: Readonly<{
    v400ArtifactSha256: string;
    v400EvidenceSha256: string;
    v400PointerSha256: string;
    cacheSourceSha256: string;
    hubSourceSha256: string;
  }>;
  cache: Readonly<{
    stageIds: readonly AtlasObservationEvidenceStageIdV401[];
    stageCount: 4;
    maximumEntries: 4;
    maximumResponseBytes: 131072;
    maximumRequestsPerStage: 1;
    initialRequestCount: 0;
    initialCacheEntryCount: 0;
    initialCachedBytes: 0;
    noRequestBeforeStageMount: true;
    noStoreTransport: true;
    parserValidatedArtifacts: true;
    failedPromiseRetained: true;
    automaticRetryAllowed: false;
    snapshotContainsArtifacts: false;
    responseBytesTracked: true;
    sanitizedFailureReasons: true;
  }>;
  hub: Readonly<{
    dynamicStageStatus: true;
    externalStoreSnapshot: true;
    maximumMountedStageCount: 1;
    resourceTelemetryDirectToDom: true;
    resourceTelemetryStoredInReactState: false;
    canvasCreated: false;
    sceneRevisionMutation: false;
    physicsMutation: false;
    scienceBufferMutation: false;
    cinematicBufferMutation: false;
  }>;
  runtimeBoundary: Readonly<{
    formalProductPointer: "v263";
    ordinaryStandaloneProfile: "legacy-v9";
    liteProfile: "legacy-v9";
    localShadowDefaultProfile: "legacy-v9";
    denseCampaignStatus: "incomplete-0-of-49";
    browserQualification: "not-run";
    visualMatrixQualification: "not-run";
    soakQualification: "not-run";
    rtxWebGpuQualification: "not-run";
  }>;
  networkAttempted: false;
  artifactSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
export function parseAtlasObservationEvidenceCacheQualificationV401(value: unknown): AtlasObservationEvidenceCacheQualificationV401 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasObservationEvidenceCacheQualificationV401> : null;
  if (!source || source.version !== ATLAS_OBSERVATION_EVIDENCE_CACHE_QUALIFICATION_VERSION_V401 || source.status !== "observation-evidence-single-flight-static-qualified-browser-pending" || !source.source || !Object.values(source.source).every((entry) => SHA256.test(entry)) || source.cache?.stageIds.join("|") !== "constraints|admission|intake|provenance" || source.cache.stageCount !== 4 || source.cache.maximumEntries !== 4 || source.cache.maximumResponseBytes !== 131072 || source.cache.maximumRequestsPerStage !== 1 || source.cache.initialRequestCount !== 0 || source.cache.initialCacheEntryCount !== 0 || source.cache.initialCachedBytes !== 0 || source.cache.noRequestBeforeStageMount !== true || source.cache.noStoreTransport !== true || source.cache.parserValidatedArtifacts !== true || source.cache.failedPromiseRetained !== true || source.cache.automaticRetryAllowed !== false || source.cache.snapshotContainsArtifacts !== false || source.cache.responseBytesTracked !== true || source.cache.sanitizedFailureReasons !== true || source.hub?.dynamicStageStatus !== true || source.hub.externalStoreSnapshot !== true || source.hub.maximumMountedStageCount !== 1 || source.hub.resourceTelemetryDirectToDom !== true || source.hub.resourceTelemetryStoredInReactState !== false || source.hub.canvasCreated !== false || source.hub.sceneRevisionMutation !== false || source.hub.physicsMutation !== false || source.hub.scienceBufferMutation !== false || source.hub.cinematicBufferMutation !== false || source.runtimeBoundary?.formalProductPointer !== "v263" || source.runtimeBoundary.ordinaryStandaloneProfile !== "legacy-v9" || source.runtimeBoundary.liteProfile !== "legacy-v9" || source.runtimeBoundary.localShadowDefaultProfile !== "legacy-v9" || source.runtimeBoundary.denseCampaignStatus !== "incomplete-0-of-49" || source.runtimeBoundary.browserQualification !== "not-run" || source.runtimeBoundary.visualMatrixQualification !== "not-run" || source.runtimeBoundary.soakQualification !== "not-run" || source.runtimeBoundary.rtxWebGpuQualification !== "not-run" || source.networkAttempted !== false || !SHA256.test(source.artifactSha256 ?? "")) throw new Error("v401-observation-evidence-cache-qualification-identity");
  return value as AtlasObservationEvidenceCacheQualificationV401;
}
