export const ATLAS_OBSERVATION_HUB_ARTIFACT_VERSION_V400 =
  "v400-atlas-observation-hub-qualification-v1" as const;

export type AtlasObservationHubQualificationV400 = Readonly<{
  version: typeof ATLAS_OBSERVATION_HUB_ARTIFACT_VERSION_V400;
  generatedAt: string;
  status: "observation-hub-v12-static-qualified-browser-pending";
  source: Readonly<{
    v399TemplateArtifactSha256: string;
    v399EvidenceSha256: string;
    v11ProfileSha256: string;
    v12ProfileSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  profile: Readonly<{
    id: "science-cinematic-v12-v400";
    stableReference: true;
    v11Frozen: true;
    scienceExposure: 1;
    scienceBloom: 0;
    scienceNoise: 0;
    scienceDisplayTransform: "linear-no-grade";
    cinematicDetailSeed: 400;
    localShadowManualOnly: true;
    defaultApplied: false;
  }>;
  hub: Readonly<{
    stageCount: 4;
    maximumMountedStageCount: 1;
    stageIds: readonly ["constraints", "admission", "intake", "provenance"];
    directResourceTelemetry: true;
    reactStateUsedForResourceTelemetry: false;
    workerCountObservedViaRegistry: true;
    textureCountObservedViaRegistry: true;
    gpuBufferCountObservedViaRegistry: true;
    objectUrlCountObservedViaRegistry: true;
    cameraLeaseCountObservedViaRegistry: true;
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
    localShadowV12ManualAvailable: true;
    denseCampaignStatus: "incomplete-0-of-49";
    browserQualification: "not-run";
    visualMatrixQualification: "not-run";
    soakQualification: "not-run";
    rtxWebGpuQualification: "not-run";
  }>;
  networkAttempted: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: true;
  artifactSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
export function parseAtlasObservationHubQualificationV400(value: unknown): AtlasObservationHubQualificationV400 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasObservationHubQualificationV400> : null;
  if (!source || source.version !== ATLAS_OBSERVATION_HUB_ARTIFACT_VERSION_V400 || source.status !== "observation-hub-v12-static-qualified-browser-pending" || !source.source || !Object.values(source.source).every((entry) => SHA256.test(entry)) || source.profile?.id !== "science-cinematic-v12-v400" || source.profile.stableReference !== true || source.profile.v11Frozen !== true || source.profile.scienceExposure !== 1 || source.profile.scienceBloom !== 0 || source.profile.scienceNoise !== 0 || source.profile.scienceDisplayTransform !== "linear-no-grade" || source.profile.cinematicDetailSeed !== 400 || source.profile.localShadowManualOnly !== true || source.profile.defaultApplied !== false || source.hub?.stageCount !== 4 || source.hub.maximumMountedStageCount !== 1 || source.hub.stageIds.join("|") !== "constraints|admission|intake|provenance" || source.hub.directResourceTelemetry !== true || source.hub.reactStateUsedForResourceTelemetry !== false || source.hub.workerCountObservedViaRegistry !== true || source.hub.textureCountObservedViaRegistry !== true || source.hub.gpuBufferCountObservedViaRegistry !== true || source.hub.objectUrlCountObservedViaRegistry !== true || source.hub.cameraLeaseCountObservedViaRegistry !== true || source.hub.canvasCreated !== false || source.hub.sceneRevisionMutation !== false || source.hub.physicsMutation !== false || source.hub.scienceBufferMutation !== false || source.hub.cinematicBufferMutation !== false || source.runtimeBoundary?.formalProductPointer !== "v263" || source.runtimeBoundary.ordinaryStandaloneProfile !== "legacy-v9" || source.runtimeBoundary.liteProfile !== "legacy-v9" || source.runtimeBoundary.localShadowDefaultProfile !== "legacy-v9" || source.runtimeBoundary.localShadowV12ManualAvailable !== true || source.runtimeBoundary.denseCampaignStatus !== "incomplete-0-of-49" || source.runtimeBoundary.browserQualification !== "not-run" || source.runtimeBoundary.visualMatrixQualification !== "not-run" || source.runtimeBoundary.soakQualification !== "not-run" || source.runtimeBoundary.rtxWebGpuQualification !== "not-run" || source.networkAttempted !== false || source.sciencePayloadMutationAllowed !== false || source.cinematicConsumerAllowed !== true || !SHA256.test(source.artifactSha256 ?? "")) throw new Error("v400-observation-hub-artifact-identity");
  return value as AtlasObservationHubQualificationV400;
}
