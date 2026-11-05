import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v400-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v400.json",
  artifact: "dist/science/atlas-observation-evidence-cache-v401/cache-qualification.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v401-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v401.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) || previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 || previousPointer.capabilities?.v400ObservationHub !== "static-qualified-4-stages-maximum-1-mounted" || artifact.version !== "v401-atlas-observation-evidence-cache-qualification-v1" || artifact.status !== "observation-evidence-single-flight-static-qualified-browser-pending" || sha(artifact) !== artifact.artifactSha256 || artifact.source?.v400EvidenceSha256 !== previousEvidence.evidenceSha256 || artifact.source?.v400PointerSha256 !== previousPointer.pointerSha256 || artifact.cache?.stageCount !== 4 || artifact.cache.maximumEntries !== 4 || artifact.cache.maximumResponseBytes !== 128 * 1024 || artifact.cache.maximumRequestsPerStage !== 1 || artifact.cache.failedPromiseRetained !== true || artifact.cache.automaticRetryAllowed !== false || artifact.cache.snapshotContainsArtifacts !== false || artifact.cache.responseBytesTracked !== true || artifact.hub?.dynamicStageStatus !== true || artifact.hub.externalStoreSnapshot !== true || artifact.hub.maximumMountedStageCount !== 1 || artifact.hub.resourceTelemetryDirectToDom !== true || artifact.hub.resourceTelemetryStoredInReactState !== false || artifact.runtimeBoundary?.browserQualification !== "not-run" || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.eihOnePnMutation !== "not-applied" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v401-boundary");

const sourcePaths = [
  "app/lib/atlasObservationEvidenceCacheV401.ts", "app/lib/atlasObservationEvidenceCacheV401.test.ts",
  "app/lib/atlasObservationEvidenceCacheQualificationV401.ts", "app/lib/atlasObservationEvidenceCacheQualificationV401.test.ts",
  "app/lib/atlasShadowCapabilityPointerV401.ts", "app/lib/atlasShadowCapabilityPointerV401.test.ts",
  "app/components/KerrConstraintForgeV396.tsx", "app/components/KerrConstraintForgeV396.test.tsx",
  "app/components/KerrObservationAirlockV397.tsx", "app/components/KerrObservationAirlockV397.test.tsx",
  "app/components/KerrObservationDockV398.tsx", "app/components/KerrObservationDockV398.test.tsx",
  "app/components/KerrProvenanceRailV399.tsx", "app/components/KerrProvenanceRailV399.test.tsx",
  "app/components/KerrObservationHubV400.tsx", "app/components/KerrObservationHubV400.test.tsx",
  "scripts/build-atlas-observation-evidence-cache-v401.ts", "scripts/build-shadow-candidate-v401.mjs",
  "scripts/reseal-shadow-evidence-chain-v401.mjs", "scripts/verify-shadow-v401-light.mjs", "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v401-evidence-v1", generatedAt: new Date().toISOString(), status: "observation-evidence-single-flight-static-qualified-browser-pending-dense-incomplete-0-of-49",
  dependency: { v400EvidenceSha256: previousEvidence.evidenceSha256, v400PointerSha256: previousPointer.pointerSha256, cacheArtifactSha256: artifact.artifactSha256, cacheArtifactFileSha256: fileSha(paths.artifact), v400ArtifactSha256: artifact.source.v400ArtifactSha256 },
  evidenceCache: { stageIds: artifact.cache.stageIds, stageCount: 4, maximumEntries: 4, maximumResponseBytes: 128 * 1024, maximumRequestsPerStage: 1, noRequestBeforeStageMount: true, noStoreTransport: true, parserValidatedArtifacts: true, failedPromiseRetained: true, automaticRetryAllowed: false, snapshotContainsArtifacts: false, responseBytesTracked: true, sanitizedFailureReasons: true },
  observationHub: { dynamicStageStatus: true, externalStoreSnapshot: true, maximumMountedStageCount: 1, resourceTelemetryDirectToDom: true, resourceTelemetryStoredInReactState: false, canvasCreated: false, sceneRevisionMutation: false, physicsMutation: false, scienceBufferMutation: false, cinematicBufferMutation: false },
  qualification: { staticCacheQualified: true, staticHubQualified: true, browserQualification: "not-run", visualMatrixQualification: "not-run", soakQualification: "not-run", rtxWebGpuQualification: "not-run" },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  networkAttempted: false, automaticRetryApplied: false, sourceManifest, sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, ordinaryStandaloneProfile: "legacy-v9", liteProfile: "legacy-v9", localShadowDefaultProfile: "legacy-v9", localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  releaseBoundary: "v401-static-local-shadow-evidence-cache-no-browser-or-performance-qualification-no-default-no-science-or-physics-mutation",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v401", generatedAt: new Date().toISOString(), status: evidence.status,
  formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true,
  capabilities: { v400ObservationHub: "static-qualified-4-stages-maximum-1-mounted", v401EvidenceCache: "static-qualified-4-stage-single-flight-maximum-1-request-each", v401FailurePolicy: "failed-promise-retained-no-automatic-retry", v401DynamicNavigation: "implemented-awaiting-browser-qualification", v401SnapshotBoundary: "sanitized-status-only-no-artifacts", v401CacheTelemetry: "entries-requests-response-bytes-128-kib-per-stage", v401BrowserQualification: "not-run", v401VisualMatrix: "not-run", v401Soak: "not-run", v401RtxWebGpu: "not-run", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable" },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, cache: pointer.capabilities.v401EvidenceCache, failurePolicy: pointer.capabilities.v401FailurePolicy, dense: pointer.capabilities.v314CorrectedDense, browser: pointer.capabilities.v401BrowserQualification }, null, 2));
