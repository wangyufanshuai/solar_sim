import {
  parseKerrAuxiliaryConstraintArtifactV396,
  type KerrAuxiliaryConstraintArtifactV396,
} from "./kerrAuxiliaryConstraintDesignV396";
import {
  parseKerrPhysicalObservationAdmissionArtifactV397,
  type KerrPhysicalObservationAdmissionArtifactV397,
} from "./kerrPhysicalObservationAdmissionV397";
import {
  parseKerrPhysicalObservationIntakeArtifactV398,
  type KerrPhysicalObservationIntakeArtifactV398,
} from "./kerrPhysicalObservationIntakeV398";
import {
  parseKerrPhysicalObservationTemplateArtifactV399,
  type KerrPhysicalObservationTemplateArtifactV399,
} from "./kerrPhysicalObservationTemplateV399";

export const ATLAS_OBSERVATION_EVIDENCE_CACHE_VERSION_V401 =
  "v401-atlas-observation-evidence-single-flight-v1" as const;
export const ATLAS_OBSERVATION_EVIDENCE_MAXIMUM_RESPONSE_BYTES_V401 = 131072 as const;

export const ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401 = Object.freeze([
  "constraints",
  "admission",
  "intake",
  "provenance",
] as const);

export type AtlasObservationEvidenceStageIdV401 =
  (typeof ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401)[number];

type AtlasObservationEvidenceArtifactMapV401 = Readonly<{
  constraints: KerrAuxiliaryConstraintArtifactV396;
  admission: KerrPhysicalObservationAdmissionArtifactV397;
  intake: KerrPhysicalObservationIntakeArtifactV398;
  provenance: KerrPhysicalObservationTemplateArtifactV399;
}>;

export type AtlasObservationEvidenceStageStatusV401 =
  | "idle"
  | "loading"
  | "ready"
  | "unavailable";

export type AtlasObservationEvidenceStageSnapshotV401 = Readonly<{
  status: AtlasObservationEvidenceStageStatusV401;
  requestCount: 0 | 1;
  summary: string;
  reason: string | null;
  responseBytes: number;
}>;

export type AtlasObservationEvidenceCacheSnapshotV401 = Readonly<{
  version: typeof ATLAS_OBSERVATION_EVIDENCE_CACHE_VERSION_V401;
  revision: number;
  requestCount: number;
  cacheEntryCount: number;
  cachedBytes: number;
  maximumEntries: 4;
  maximumResponseBytes: 131072;
  automaticRetryAllowed: false;
  stages: Readonly<Record<AtlasObservationEvidenceStageIdV401, AtlasObservationEvidenceStageSnapshotV401>>;
}>;

export const ATLAS_OBSERVATION_EVIDENCE_LIFECYCLE_VERSION_V402 =
  "v402-atlas-observation-evidence-cache-lifecycle-v1" as const;

export type AtlasObservationEvidenceStageAuditV402 = Readonly<{
  lifetimeRequestCount: number;
  successCount: number;
  failureCount: number;
  releasedPendingCount: number;
  lastTerminalStatus: "never-requested" | "ready" | "unavailable" | "released-pending";
  lastReason: string | null;
}>;

export type AtlasObservationEvidenceLifecycleSnapshotV402 = Readonly<{
  version: typeof ATLAS_OBSERVATION_EVIDENCE_LIFECYCLE_VERSION_V402;
  revision: number;
  scopeGeneration: number;
  activeScopeCount: number;
  activeOwners: readonly string[];
  releaseCount: number;
  lifetimeRequestCount: number;
  releasedPendingRequestCount: number;
  cacheEntryCount: number;
  cachedBytes: number;
  cacheAtBaseline: boolean;
  releaseDeferredToMicrotask: true;
  pendingRequestsAbortedOnRelease: true;
  auditRetainedAfterRelease: true;
  stages: Readonly<Record<AtlasObservationEvidenceStageIdV401, AtlasObservationEvidenceStageAuditV402>>;
}>;

type StageRecord = {
  status: AtlasObservationEvidenceStageStatusV401;
  requestCount: 0 | 1;
  summary: string;
  reason: string | null;
  responseBytes: number;
  promise: Promise<unknown> | null;
};

type StageAuditRecordV402 = {
  lifetimeRequestCount: number;
  successCount: number;
  failureCount: number;
  releasedPendingCount: number;
  lastTerminalStatus: AtlasObservationEvidenceStageAuditV402["lastTerminalStatus"];
  lastReason: string | null;
};

type StageDescriptor<K extends AtlasObservationEvidenceStageIdV401> = Readonly<{
  url: string;
  parse: (value: unknown) => AtlasObservationEvidenceArtifactMapV401[K];
  summarize: (value: AtlasObservationEvidenceArtifactMapV401[K]) => string;
}>;

const DESCRIPTORS: { [K in AtlasObservationEvidenceStageIdV401]: StageDescriptor<K> } = {
  constraints: {
    url: "/api/atlas/relativity-evidence/v396/constraint-design",
    parse: parseKerrAuxiliaryConstraintArtifactV396,
    summarize: () => "structure qualified",
  },
  admission: {
    url: "/api/atlas/relativity-evidence/v397/observation-admission",
    parse: parseKerrPhysicalObservationAdmissionArtifactV397,
    summarize: (artifact) => `${artifact.productionAdmission.availableSources} / ${artifact.schema.sourceCount} sources`,
  },
  intake: {
    url: "/api/atlas/relativity-evidence/v398/observation-intake",
    parse: parseKerrPhysicalObservationIntakeArtifactV398,
    summarize: (artifact) => `${artifact.inspect.presentFileCount} / ${artifact.inspect.expectedFileCount} files`,
  },
  provenance: {
    url: "/api/atlas/relativity-evidence/v399/provenance-template",
    parse: parseKerrPhysicalObservationTemplateArtifactV399,
    summarize: (artifact) => `${artifact.topology.actualSourceCount} actual sources`,
  },
};

const records = Object.fromEntries(ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401.map((stage) => [stage, {
  status: "idle",
  requestCount: 0,
  summary: "not requested",
  reason: null,
  responseBytes: 0,
  promise: null,
}])) as Record<AtlasObservationEvidenceStageIdV401, StageRecord>;
const auditRecords = Object.fromEntries(ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401.map((stage) => [stage, {
  lifetimeRequestCount: 0,
  successCount: 0,
  failureCount: 0,
  releasedPendingCount: 0,
  lastTerminalStatus: "never-requested",
  lastReason: null,
}])) as Record<AtlasObservationEvidenceStageIdV401, StageAuditRecordV402>;
const activeScopeOwners = new Map<string, number>();
const listeners = new Set<() => void>();
let revision = 0;
let scopeGeneration = 0;
let releaseCount = 0;
let scheduledReleaseToken = 0;
let scopeAbortController = new AbortController();
let cachedSnapshot = createSnapshot();
let cachedLifecycleSnapshot = createLifecycleSnapshot();

class AtlasObservationEvidenceCacheErrorV401 extends Error {
  constructor(readonly reason: string) {
    super(`v401-observation-evidence:${reason}`);
  }
}

function createSnapshot(): AtlasObservationEvidenceCacheSnapshotV401 {
  const stages = Object.fromEntries(ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401.map((stage) => {
    const record = records[stage];
    return [stage, Object.freeze({
      status: record.status,
      requestCount: record.requestCount,
      summary: record.summary,
      reason: record.reason,
      responseBytes: record.responseBytes,
    })];
  })) as Record<AtlasObservationEvidenceStageIdV401, AtlasObservationEvidenceStageSnapshotV401>;
  const requestCount = ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401.reduce((total, stage) => total + records[stage].requestCount, 0);
  const cacheEntryCount = ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401.filter((stage) => records[stage].promise !== null).length;
  const cachedBytes = ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401.reduce((total, stage) => total + records[stage].responseBytes, 0);
  return Object.freeze({
    version: ATLAS_OBSERVATION_EVIDENCE_CACHE_VERSION_V401,
    revision,
    requestCount,
    cacheEntryCount,
    cachedBytes,
    maximumEntries: 4,
    maximumResponseBytes: ATLAS_OBSERVATION_EVIDENCE_MAXIMUM_RESPONSE_BYTES_V401,
    automaticRetryAllowed: false,
    stages: Object.freeze(stages),
  });
}

function createLifecycleSnapshot(): AtlasObservationEvidenceLifecycleSnapshotV402 {
  const stages = Object.fromEntries(ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401.map((stage) => [stage, Object.freeze({ ...auditRecords[stage] })])) as Record<AtlasObservationEvidenceStageIdV401, AtlasObservationEvidenceStageAuditV402>;
  const activeScopeCount = Array.from(activeScopeOwners.values()).reduce((total, count) => total + count, 0);
  const lifetimeRequestCount = ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401.reduce((total, stage) => total + auditRecords[stage].lifetimeRequestCount, 0);
  const releasedPendingRequestCount = ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401.reduce((total, stage) => total + auditRecords[stage].releasedPendingCount, 0);
  const cache = createSnapshot();
  return Object.freeze({
    version: ATLAS_OBSERVATION_EVIDENCE_LIFECYCLE_VERSION_V402,
    revision,
    scopeGeneration,
    activeScopeCount,
    activeOwners: Object.freeze(Array.from(activeScopeOwners.keys()).sort()),
    releaseCount,
    lifetimeRequestCount,
    releasedPendingRequestCount,
    cacheEntryCount: cache.cacheEntryCount,
    cachedBytes: cache.cachedBytes,
    cacheAtBaseline: cache.cacheEntryCount === 0 && cache.cachedBytes === 0,
    releaseDeferredToMicrotask: true,
    pendingRequestsAbortedOnRelease: true,
    auditRetainedAfterRelease: true,
    stages: Object.freeze(stages),
  });
}

function publish(): void {
  revision += 1;
  cachedSnapshot = createSnapshot();
  cachedLifecycleSnapshot = createLifecycleSnapshot();
  listeners.forEach((listener) => listener());
}

function safeReason(value: unknown, fallback: string): string {
  return typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : fallback;
}

async function requestStage<K extends AtlasObservationEvidenceStageIdV401>(stage: K, signal: AbortSignal): Promise<Readonly<{ artifact: AtlasObservationEvidenceArtifactMapV401[K]; responseBytes: number }>> {
  const descriptor = DESCRIPTORS[stage];
  let response: Response;
  try {
    response = await fetch(descriptor.url, { cache: "no-store", signal });
  } catch {
    throw new AtlasObservationEvidenceCacheErrorV401(signal.aborted ? "scope-released" : "request-failed");
  }
  const declaredBytes = Number(response.headers.get("Content-Length"));
  if (Number.isFinite(declaredBytes) && declaredBytes > ATLAS_OBSERVATION_EVIDENCE_MAXIMUM_RESPONSE_BYTES_V401) {
    throw new AtlasObservationEvidenceCacheErrorV401("response-too-large");
  }
  let body: string;
  try {
    body = await response.text();
  } catch {
    throw new AtlasObservationEvidenceCacheErrorV401("invalid-response");
  }
  const responseBytes = new TextEncoder().encode(body).byteLength;
  if (responseBytes > ATLAS_OBSERVATION_EVIDENCE_MAXIMUM_RESPONSE_BYTES_V401) throw new AtlasObservationEvidenceCacheErrorV401("response-too-large");
  let value: { available?: boolean; reason?: unknown; artifact?: unknown };
  try { value = JSON.parse(body) as { available?: boolean; reason?: unknown; artifact?: unknown }; }
  catch { throw new AtlasObservationEvidenceCacheErrorV401("invalid-response"); }
  if (!response.ok || value.available !== true || !value.artifact) {
    throw new AtlasObservationEvidenceCacheErrorV401(safeReason(value.reason, response.ok ? "unavailable" : "http-error"));
  }
  try {
    return { artifact: descriptor.parse(value.artifact), responseBytes };
  } catch {
    throw new AtlasObservationEvidenceCacheErrorV401("invalid-artifact");
  }
}

export function loadAtlasObservationEvidenceStageV401<K extends AtlasObservationEvidenceStageIdV401>(
  stage: K,
): Promise<AtlasObservationEvidenceArtifactMapV401[K]> {
  const record = records[stage];
  if (record.promise) return record.promise as Promise<AtlasObservationEvidenceArtifactMapV401[K]>;
  record.status = "loading";
  record.requestCount = 1;
  record.summary = "loading";
  record.reason = null;
  record.responseBytes = 0;
  const requestGeneration = scopeGeneration;
  const audit = auditRecords[stage];
  audit.lifetimeRequestCount += 1;
  const promise = requestStage(stage, scopeAbortController.signal)
    .then(({ artifact, responseBytes }) => {
      if (requestGeneration !== scopeGeneration) return artifact;
      record.status = "ready";
      record.summary = DESCRIPTORS[stage].summarize(artifact);
      record.reason = null;
      record.responseBytes = responseBytes;
      audit.successCount += 1;
      audit.lastTerminalStatus = "ready";
      audit.lastReason = null;
      publish();
      return artifact;
    })
    .catch((error: unknown) => {
      if (requestGeneration !== scopeGeneration) throw error;
      record.status = "unavailable";
      record.summary = "unavailable";
      record.reason = error instanceof AtlasObservationEvidenceCacheErrorV401 ? error.reason : "request-failed";
      record.responseBytes = 0;
      audit.failureCount += 1;
      audit.lastTerminalStatus = "unavailable";
      audit.lastReason = record.reason;
      publish();
      throw error;
    });
  record.promise = promise;
  publish();
  return promise;
}

export function getAtlasObservationEvidenceCacheSnapshotV401(): AtlasObservationEvidenceCacheSnapshotV401 {
  return cachedSnapshot;
}

export function subscribeAtlasObservationEvidenceCacheV401(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function releaseCachePayloadsV402(): void {
  scopeGeneration += 1;
  scopeAbortController.abort();
  scopeAbortController = new AbortController();
  for (const stage of ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401) {
    if (records[stage].status === "loading") {
      auditRecords[stage].releasedPendingCount += 1;
      auditRecords[stage].lastTerminalStatus = "released-pending";
      auditRecords[stage].lastReason = "scope-released";
    }
    records[stage] = { status: "idle", requestCount: 0, summary: "not requested", reason: null, responseBytes: 0, promise: null };
  }
  releaseCount += 1;
  publish();
}

export function acquireAtlasObservationEvidenceCacheScopeV402(owner: string): () => void {
  if (!/^[A-Za-z0-9:-]{1,80}$/.test(owner)) throw new Error("v402-cache-scope-owner");
  scheduledReleaseToken += 1;
  activeScopeOwners.set(owner, (activeScopeOwners.get(owner) ?? 0) + 1);
  publish();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const remaining = (activeScopeOwners.get(owner) ?? 1) - 1;
    if (remaining > 0) activeScopeOwners.set(owner, remaining);
    else activeScopeOwners.delete(owner);
    publish();
    if (activeScopeOwners.size > 0) return;
    const token = ++scheduledReleaseToken;
    queueMicrotask(() => {
      if (token === scheduledReleaseToken && activeScopeOwners.size === 0) releaseCachePayloadsV402();
    });
  };
}

export function getAtlasObservationEvidenceLifecycleSnapshotV402(): AtlasObservationEvidenceLifecycleSnapshotV402 {
  return cachedLifecycleSnapshot;
}

export function resetAtlasObservationEvidenceCacheForTestsV401(): void {
  scheduledReleaseToken += 1;
  scopeAbortController.abort();
  scopeAbortController = new AbortController();
  for (const stage of ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401) {
    records[stage] = { status: "idle", requestCount: 0, summary: "not requested", reason: null, responseBytes: 0, promise: null };
    auditRecords[stage] = { lifetimeRequestCount: 0, successCount: 0, failureCount: 0, releasedPendingCount: 0, lastTerminalStatus: "never-requested", lastReason: null };
  }
  activeScopeOwners.clear();
  revision = 0;
  scopeGeneration = 0;
  releaseCount = 0;
  cachedSnapshot = createSnapshot();
  cachedLifecycleSnapshot = createLifecycleSnapshot();
  listeners.clear();
}
