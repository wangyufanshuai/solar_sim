import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401,
  getAtlasObservationEvidenceCacheSnapshotV401,
} from "../app/lib/atlasObservationEvidenceCacheV401";
import {
  ATLAS_OBSERVATION_EVIDENCE_CACHE_QUALIFICATION_VERSION_V401,
  parseAtlasObservationEvidenceCacheQualificationV401,
} from "../app/lib/atlasObservationEvidenceCacheQualificationV401";

const root = process.cwd();
const paths = {
  v400Artifact: "dist/science/atlas-observation-hub-v400/hub-qualification.json",
  v400Evidence: "dist/science/orbit-atlas-shadow-v400-evidence.json",
  v400Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v400.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  cacheSource: "app/lib/atlasObservationEvidenceCacheV401.ts",
  hubSource: "app/components/KerrObservationHubV400.tsx",
  artifact: "dist/science/atlas-observation-evidence-cache-v401/cache-qualification.json",
};
const bounded = (path: string, maximum = 512 * 1024) => { const target = resolve(root, path); const metadata = statSync(target); if (!metadata.isFile() || metadata.size <= 0 || metadata.size > maximum) throw new Error(`v401-input-size:${path}`); return readFileSync(target); };
const read = (path: string) => JSON.parse(bounded(path, 256 * 1024).toString("utf8"));
const shaBytes = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value: unknown) => shaBytes(JSON.stringify(canonicalize(value)));
const atomic = (path: string, value: unknown) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const v400Artifact = read(paths.v400Artifact);
const v400Evidence = read(paths.v400Evidence);
const v400Pointer = read(paths.v400Pointer);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const initial = getAtlasObservationEvidenceCacheSnapshotV401();
const cacheSource = bounded(paths.cacheSource).toString("utf8");
const hubSource = bounded(paths.hubSource).toString("utf8");
const componentSources = [
  ["constraints", "app/components/KerrConstraintForgeV396.tsx"],
  ["admission", "app/components/KerrObservationAirlockV397.tsx"],
  ["intake", "app/components/KerrObservationDockV398.tsx"],
  ["provenance", "app/components/KerrProvenanceRailV399.tsx"],
] as const;
if (v400Artifact.version !== "v400-atlas-observation-hub-qualification-v1" || v400Evidence.version !== "orbit-atlas-shadow-v400-evidence-v1" || v400Pointer.version !== "orbit-atlas-current-local-shadow-candidate-v400" || initial.requestCount !== 0 || initial.cacheEntryCount !== 0 || initial.cachedBytes !== 0 || initial.maximumEntries !== 4 || initial.maximumResponseBytes !== 128 * 1024 || initial.automaticRetryAllowed !== false || ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401.join("|") !== "constraints|admission|intake|provenance" || !cacheSource.includes('if (record.promise) return record.promise') || !cacheSource.includes('cache: "no-store"') || !cacheSource.includes('response-too-large') || !cacheSource.includes('record.status = "unavailable"') || !hubSource.includes("useSyncExternalStore") || !hubSource.includes("subscribeAtlasObservationEvidenceCacheV401") || !hubSource.includes("data-atlas-v401-stage-evidence-status") || !hubSource.includes("data-atlas-v401-evidence-cached-bytes") || !hubSource.includes("evidence.summary") || !hubSource.includes('data-atlas-v400-single-stage-mounted="true"') || hubSource.includes("<canvas") || hubSource.includes("Math.random") || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v401-static-boundary");
for (const [stage, path] of componentSources) { const source = bounded(path).toString("utf8"); if (!source.includes(`loadAtlasObservationEvidenceStageV401("${stage}")`) || source.includes("void fetch(")) throw new Error(`v401-component-cache-boundary:${stage}`); }

const unsigned = {
  version: ATLAS_OBSERVATION_EVIDENCE_CACHE_QUALIFICATION_VERSION_V401,
  generatedAt: new Date().toISOString(),
  status: "observation-evidence-single-flight-static-qualified-browser-pending",
  source: { v400ArtifactSha256: v400Artifact.artifactSha256, v400EvidenceSha256: v400Evidence.evidenceSha256, v400PointerSha256: v400Pointer.pointerSha256, cacheSourceSha256: shaBytes(cacheSource), hubSourceSha256: shaBytes(hubSource) },
  cache: { stageIds: ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401, stageCount: 4, maximumEntries: 4, maximumResponseBytes: 128 * 1024, maximumRequestsPerStage: 1, initialRequestCount: 0, initialCacheEntryCount: 0, initialCachedBytes: 0, noRequestBeforeStageMount: true, noStoreTransport: true, parserValidatedArtifacts: true, failedPromiseRetained: true, automaticRetryAllowed: false, snapshotContainsArtifacts: false, responseBytesTracked: true, sanitizedFailureReasons: true },
  hub: { dynamicStageStatus: true, externalStoreSnapshot: true, maximumMountedStageCount: 1, resourceTelemetryDirectToDom: true, resourceTelemetryStoredInReactState: false, canvasCreated: false, sceneRevisionMutation: false, physicsMutation: false, scienceBufferMutation: false, cinematicBufferMutation: false },
  runtimeBoundary: { formalProductPointer: "v263", ordinaryStandaloneProfile: "legacy-v9", liteProfile: "legacy-v9", localShadowDefaultProfile: "legacy-v9", denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run", visualMatrixQualification: "not-run", soakQualification: "not-run", rtxWebGpuQualification: "not-run" },
  networkAttempted: false,
} as const;
const artifact = { ...unsigned, artifactSha256: canonicalSha(unsigned) };
parseAtlasObservationEvidenceCacheQualificationV401(artifact);
atomic(paths.artifact, artifact);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, stages: artifact.cache.stageCount, maximumResponseBytes: artifact.cache.maximumResponseBytes, maximumRequestsPerStage: artifact.cache.maximumRequestsPerStage, automaticRetryAllowed: artifact.cache.automaticRetryAllowed, defaultProfile: artifact.runtimeBoundary.localShadowDefaultProfile, browser: artifact.runtimeBoundary.browserQualification }, null, 2));
