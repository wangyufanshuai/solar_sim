export const ATLAS_OBSERVATION_EVIDENCE_LIFECYCLE_QUALIFICATION_VERSION_V402 =
  "v402-atlas-observation-evidence-lifecycle-qualification-v1" as const;

export type AtlasObservationEvidenceLifecycleQualificationV402 = Readonly<{
  version: typeof ATLAS_OBSERVATION_EVIDENCE_LIFECYCLE_QUALIFICATION_VERSION_V402;
  generatedAt: string;
  status: "observation-evidence-lifecycle-static-qualified-browser-pending";
  source: Readonly<{
    v401ArtifactSha256: string;
    v401EvidenceSha256: string;
    v401PointerSha256: string;
    lifecycleSourceSha256: string;
    hubSourceSha256: string;
  }>;
  lifecycle: Readonly<{
    scopeOwners: readonly ["v11-measurement-lab", "v12-observation-hub"];
    initialActiveScopeCount: 0;
    initialCacheEntryCount: 0;
    initialCachedBytes: 0;
    initialLifetimeRequestCount: 0;
    finalScopeReleasesPayloads: true;
    releaseDeferredToMicrotask: true;
    strictModeReacquireStable: true;
    releaseIdempotent: true;
    pendingRequestsAbortedOnRelease: true;
    requestGenerationIsolation: true;
    cacheEntriesReturnToZero: true;
    cachedBytesReturnToZero: true;
    currentRequestCountReturnsToZero: true;
    auditRetainedAfterRelease: true;
    successFailureAndReleasedCountsSeparated: true;
    automaticRetryOnRelease: false;
  }>;
  hub: Readonly<{
    v11ScopeConnected: true;
    v12ScopeConnected: true;
    lifecycleTelemetryDirectToDataset: true;
    maximumMountedV12StageCount: 1;
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
export function parseAtlasObservationEvidenceLifecycleQualificationV402(value: unknown): AtlasObservationEvidenceLifecycleQualificationV402 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasObservationEvidenceLifecycleQualificationV402> : null;
  if (!source || source.version !== ATLAS_OBSERVATION_EVIDENCE_LIFECYCLE_QUALIFICATION_VERSION_V402 || source.status !== "observation-evidence-lifecycle-static-qualified-browser-pending" || !source.source || !Object.values(source.source).every((entry) => SHA256.test(entry)) || source.lifecycle?.scopeOwners.join("|") !== "v11-measurement-lab|v12-observation-hub" || source.lifecycle.initialActiveScopeCount !== 0 || source.lifecycle.initialCacheEntryCount !== 0 || source.lifecycle.initialCachedBytes !== 0 || source.lifecycle.initialLifetimeRequestCount !== 0 || source.lifecycle.finalScopeReleasesPayloads !== true || source.lifecycle.releaseDeferredToMicrotask !== true || source.lifecycle.strictModeReacquireStable !== true || source.lifecycle.releaseIdempotent !== true || source.lifecycle.pendingRequestsAbortedOnRelease !== true || source.lifecycle.requestGenerationIsolation !== true || source.lifecycle.cacheEntriesReturnToZero !== true || source.lifecycle.cachedBytesReturnToZero !== true || source.lifecycle.currentRequestCountReturnsToZero !== true || source.lifecycle.auditRetainedAfterRelease !== true || source.lifecycle.successFailureAndReleasedCountsSeparated !== true || source.lifecycle.automaticRetryOnRelease !== false || source.hub?.v11ScopeConnected !== true || source.hub.v12ScopeConnected !== true || source.hub.lifecycleTelemetryDirectToDataset !== true || source.hub.maximumMountedV12StageCount !== 1 || source.hub.canvasCreated !== false || source.hub.sceneRevisionMutation !== false || source.hub.physicsMutation !== false || source.hub.scienceBufferMutation !== false || source.hub.cinematicBufferMutation !== false || source.runtimeBoundary?.formalProductPointer !== "v263" || source.runtimeBoundary.ordinaryStandaloneProfile !== "legacy-v9" || source.runtimeBoundary.liteProfile !== "legacy-v9" || source.runtimeBoundary.localShadowDefaultProfile !== "legacy-v9" || source.runtimeBoundary.denseCampaignStatus !== "incomplete-0-of-49" || source.runtimeBoundary.browserQualification !== "not-run" || source.runtimeBoundary.visualMatrixQualification !== "not-run" || source.runtimeBoundary.soakQualification !== "not-run" || source.runtimeBoundary.rtxWebGpuQualification !== "not-run" || source.networkAttempted !== false || !SHA256.test(source.artifactSha256 ?? "")) throw new Error("v402-observation-evidence-lifecycle-qualification-identity");
  return value as AtlasObservationEvidenceLifecycleQualificationV402;
}
