import {
  parseAtlasObservationLifecycleReplaySummaryV404,
  type AtlasObservationLifecycleReplaySummaryV404,
  type AtlasObservationLifecycleReplayStageSummaryV404,
  type AtlasObservationLifecycleStageIdV404,
} from "./atlasObservationLifecycleReplaySummaryV404";

export const ATLAS_LIFECYCLE_PROVENANCE_DOSSIER_VERSION_V405 =
  "v405-atlas-lifecycle-provenance-dossier-v1" as const;
export const ATLAS_EVIDENCE_OBSERVATORY_QUALIFICATION_VERSION_V405 =
  "v405-atlas-evidence-observatory-qualification-v1" as const;
export const ATLAS_LIFECYCLE_DOSSIER_RESPONSE_VERSION_V405 =
  "v405-atlas-lifecycle-dossier-response-v1" as const;

export type AtlasLifecycleProvenanceDossierV405 = Readonly<{
  version: typeof ATLAS_LIFECYCLE_PROVENANCE_DOSSIER_VERSION_V405;
  generatedAt: string;
  status: "portable-fixture-provenance-qualified-browser-soak-not-run";
  source: Readonly<{
    v403ReplayArtifactSha256: string;
    v404SummarySha256: string;
    v404EvidenceSha256: string;
    v404PointerSha256: string;
  }>;
  lineage: Readonly<{
    nodeCount: 4;
    edgeCount: 3;
    nodes: readonly Readonly<{
      id: "v403-replay" | "v404-summary" | "v404-evidence" | "v404-pointer";
      contentClass: "fixture-replay" | "bounded-summary" | "qualification-evidence" | "capability-pointer";
      sha256: string;
    }>[];
    edges: readonly Readonly<{
      from: "v403-replay" | "v404-summary" | "v404-evidence";
      to: "v404-summary" | "v404-evidence" | "v404-pointer";
      relation: "summarized-by" | "qualified-by" | "selected-by";
    }>[];
  }>;
  replay: AtlasObservationLifecycleReplaySummaryV404["replay"];
  stages: Readonly<Record<AtlasObservationLifecycleStageIdV404, AtlasObservationLifecycleReplayStageSummaryV404>>;
  qualification: Readonly<{
    fixtureReplayQualified: true;
    portableDossierQualified: true;
    browserSoakQualified: false;
    productionLifecycleQualified: false;
    scientificAuthorityChanged: false;
    cycleDetailsIncluded: false;
  }>;
  release: Readonly<{
    formalProductPointer: "v263";
    ordinaryStandaloneProfile: "legacy-v9";
    liteProfile: "legacy-v9";
    localShadowDefaultProfile: "legacy-v9";
    localShadowDefaultApplied: false;
    denseCampaignStatus: "incomplete-0-of-49";
  }>;
  dossierSha256: string;
}>;

export type AtlasEvidenceObservatoryQualificationV405 = Readonly<{
  version: typeof ATLAS_EVIDENCE_OBSERVATORY_QUALIFICATION_VERSION_V405;
  generatedAt: string;
  status: "science-cinematic-v13-static-qualified-browser-pending";
  source: Readonly<{
    v404SummarySha256: string;
    v404EvidenceSha256: string;
    v404PointerSha256: string;
    dossierSha256: string;
    v12ProfileSha256: string;
    v13ProfileSha256: string;
  }>;
  profile: Readonly<{
    id: "science-cinematic-v13-v405";
    v12Frozen: true;
    stableReference: true;
    hudTokenConsumed: true;
    scienceDisplayTransform: "linear-no-grade";
    localShadowManualOnly: true;
    defaultApplied: false;
  }>;
  runtime: Readonly<{
    portableDossierReadOnly: true;
    cycleDetailsInReactState: false;
    singleFlightRequest: true;
    canvasCreated: false;
    sceneRevisionMutation: false;
    physicsMutation: false;
    scienceBufferMutation: false;
    cinematicBufferMutation: false;
  }>;
  browserQualification: "not-run";
  visualMatrixQualification: "not-run";
  soakQualification: "not-run";
  rtxWebGpuQualification: "not-run";
  artifactSha256: string;
}>;

export type AtlasLifecycleDossierResponseV405 = Readonly<{
  version: typeof ATLAS_LIFECYCLE_DOSSIER_RESPONSE_VERSION_V405;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  dossier: AtlasLifecycleProvenanceDossierV405 | null;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function parseAtlasLifecycleProvenanceDossierV405(value: unknown): AtlasLifecycleProvenanceDossierV405 {
  const source = isObject(value) ? value as Partial<AtlasLifecycleProvenanceDossierV405> : null;
  if (!source || "cycles" in source) throw new Error("v405-dossier-shape");
  const nodes = source.lineage?.nodes ?? [];
  const edges = source.lineage?.edges ?? [];
  const nodeIds = nodes.map((node) => node.id);
  const expectedNodeIds = ["v403-replay", "v404-summary", "v404-evidence", "v404-pointer"];
  if (
    source.version !== ATLAS_LIFECYCLE_PROVENANCE_DOSSIER_VERSION_V405
    || source.status !== "portable-fixture-provenance-qualified-browser-soak-not-run"
    || !source.source
    || !Object.values(source.source).every((entry) => SHA256.test(entry))
    || source.lineage?.nodeCount !== 4
    || source.lineage.edgeCount !== 3
    || nodes.length !== 4
    || edges.length !== 3
    || expectedNodeIds.some((id) => !nodeIds.includes(id as (typeof nodes)[number]["id"]))
    || nodes.some((node) => !SHA256.test(node.sha256))
    || source.replay?.cycleCount !== 30
    || source.replay.totalRequestCount !== 114
    || source.replay.successCount !== 108
    || source.replay.failureCount !== 4
    || source.replay.releasedPendingRequestCount !== 2
    || source.replay.baselineCycleCount !== 30
    || source.qualification?.fixtureReplayQualified !== true
    || source.qualification.portableDossierQualified !== true
    || source.qualification.browserSoakQualified !== false
    || source.qualification.productionLifecycleQualified !== false
    || source.qualification.scientificAuthorityChanged !== false
    || source.qualification.cycleDetailsIncluded !== false
    || source.release?.formalProductPointer !== "v263"
    || source.release.ordinaryStandaloneProfile !== "legacy-v9"
    || source.release.liteProfile !== "legacy-v9"
    || source.release.localShadowDefaultProfile !== "legacy-v9"
    || source.release.localShadowDefaultApplied !== false
    || source.release.denseCampaignStatus !== "incomplete-0-of-49"
    || !SHA256.test(source.dossierSha256 ?? "")
  ) throw new Error("v405-dossier-identity");
  parseAtlasObservationLifecycleReplaySummaryV404({
    version: "v404-atlas-observation-lifecycle-replay-summary-v1",
    generatedAt: source.generatedAt,
    status: "fixture-replay-summary-ready-browser-soak-not-run",
    source: {
      replayArtifactSha256: source.source.v403ReplayArtifactSha256,
      replayArtifactFileSha256: source.source.v403ReplayArtifactSha256,
      v403EvidenceSha256: source.source.v404EvidenceSha256,
      v403PointerSha256: source.source.v404PointerSha256,
    },
    replay: source.replay,
    stages: source.stages,
    qualification: { fixtureReplayQualified: true, browserSoakQualified: false, productionLifecycleQualified: false, scientificAuthorityChanged: false, cycleDetailsExposed: false },
    summarySha256: source.source.v404SummarySha256,
  });
  return value as AtlasLifecycleProvenanceDossierV405;
}

export function parseAtlasEvidenceObservatoryQualificationV405(value: unknown): AtlasEvidenceObservatoryQualificationV405 {
  const source = isObject(value) ? value as Partial<AtlasEvidenceObservatoryQualificationV405> : null;
  if (
    !source
    || source.version !== ATLAS_EVIDENCE_OBSERVATORY_QUALIFICATION_VERSION_V405
    || source.status !== "science-cinematic-v13-static-qualified-browser-pending"
    || !source.source
    || !Object.values(source.source).every((entry) => SHA256.test(entry))
    || source.profile?.id !== "science-cinematic-v13-v405"
    || source.profile.v12Frozen !== true
    || source.profile.stableReference !== true
    || source.profile.hudTokenConsumed !== true
    || source.profile.scienceDisplayTransform !== "linear-no-grade"
    || source.profile.localShadowManualOnly !== true
    || source.profile.defaultApplied !== false
    || source.runtime?.portableDossierReadOnly !== true
    || source.runtime.cycleDetailsInReactState !== false
    || source.runtime.singleFlightRequest !== true
    || source.runtime.canvasCreated !== false
    || source.runtime.sceneRevisionMutation !== false
    || source.runtime.physicsMutation !== false
    || source.runtime.scienceBufferMutation !== false
    || source.runtime.cinematicBufferMutation !== false
    || source.browserQualification !== "not-run"
    || source.visualMatrixQualification !== "not-run"
    || source.soakQualification !== "not-run"
    || source.rtxWebGpuQualification !== "not-run"
    || !SHA256.test(source.artifactSha256 ?? "")
  ) throw new Error("v405-observatory-qualification-identity");
  return value as AtlasEvidenceObservatoryQualificationV405;
}

export function parseAtlasLifecycleDossierResponseV405(value: unknown): AtlasLifecycleDossierResponseV405 {
  const source = isObject(value) ? value as Partial<AtlasLifecycleDossierResponseV405> : null;
  if (!source || source.version !== ATLAS_LIFECYCLE_DOSSIER_RESPONSE_VERSION_V405) throw new Error("v405-dossier-response-version");
  if (source.available === true && source.reason === "ready" && source.dossier) {
    return { version: ATLAS_LIFECYCLE_DOSSIER_RESPONSE_VERSION_V405, available: true, reason: "ready", dossier: parseAtlasLifecycleProvenanceDossierV405(source.dossier) };
  }
  if (source.available === false && source.dossier === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")) {
    return source as AtlasLifecycleDossierResponseV405;
  }
  throw new Error("v405-dossier-response-identity");
}
