import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v399-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v399.json",
  artifact: "dist/science/atlas-observation-hub-v400/hub-qualification.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v400-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v400.json",
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
if (previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) || previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 || previousPointer.capabilities?.v399ValueFreeTemplate !== "qualified-13-slots-no-values-not-compile-eligible" || artifact.version !== "v400-atlas-observation-hub-qualification-v1" || artifact.status !== "observation-hub-v12-static-qualified-browser-pending" || sha(artifact) !== artifact.artifactSha256 || artifact.profile?.id !== "science-cinematic-v12-v400" || artifact.profile?.v11Frozen !== true || artifact.profile?.scienceExposure !== 1 || artifact.profile?.scienceBloom !== 0 || artifact.profile?.scienceNoise !== 0 || artifact.profile?.defaultApplied !== false || artifact.hub?.stageCount !== 4 || artifact.hub?.maximumMountedStageCount !== 1 || artifact.hub?.directResourceTelemetry !== true || artifact.hub?.reactStateUsedForResourceTelemetry !== false || artifact.hub?.canvasCreated !== false || artifact.hub?.sceneRevisionMutation !== false || artifact.hub?.physicsMutation !== false || artifact.runtimeBoundary?.localShadowDefaultProfile !== "legacy-v9" || artifact.runtimeBoundary?.browserQualification !== "not-run" || artifact.runtimeBoundary?.visualMatrixQualification !== "not-run" || artifact.runtimeBoundary?.soakQualification !== "not-run" || artifact.runtimeBoundary?.rtxWebGpuQualification !== "not-run" || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.eihOnePnMutation !== "not-applied" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v400-boundary");

const sourcePaths = [
  "app/lib/atlasVisualProfileV299.ts", "app/lib/atlasVisualProfileV400.test.ts", "app/lib/atlasVisualProfileV377.test.ts", "app/lib/atlasVisualProfileV299.test.ts", "app/lib/atlasVisualRuntimeMatrixV340.test.ts",
  "app/lib/atlasObservationHubV400.ts", "app/lib/atlasObservationHubV400.test.ts",
  "app/lib/atlasObservationEvidenceCacheV401.ts", "app/lib/atlasObservationEvidenceCacheV401.test.ts",
  "app/lib/atlasShadowCapabilityPointerV400.ts", "app/lib/atlasShadowCapabilityPointerV400.test.ts",
  "app/components/AtlasVisualABControlV261.tsx", "app/components/KerrObservationHubV400.tsx", "app/components/KerrObservationHubV400.test.tsx",
  "app/components/KerrConstraintForgeV396.tsx", "app/components/KerrConstraintForgeV396.test.tsx",
  "app/components/KerrObservationAirlockV397.tsx", "app/components/KerrObservationAirlockV397.test.tsx",
  "app/components/KerrObservationDockV398.tsx", "app/components/KerrObservationDockV398.test.tsx",
  "app/components/KerrProvenanceRailV399.tsx", "app/components/KerrProvenanceRailV399.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx", "scripts/build-atlas-observation-hub-v400.ts",
  "scripts/build-shadow-candidate-v400.mjs", "scripts/reseal-shadow-evidence-chain-v400.mjs", "scripts/verify-shadow-v400-light.mjs", "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v400-evidence-v1", generatedAt: new Date().toISOString(), status: "observation-hub-v12-static-qualified-browser-pending-dense-incomplete-0-of-49",
  dependency: { v399EvidenceSha256: previousEvidence.evidenceSha256, v399PointerSha256: previousPointer.pointerSha256, hubArtifactSha256: artifact.artifactSha256, hubArtifactFileSha256: fileSha(paths.artifact), v399TemplateArtifactSha256: artifact.source.v399TemplateArtifactSha256, v11ProfileSha256: artifact.source.v11ProfileSha256, v12ProfileSha256: artifact.source.v12ProfileSha256, fullShortAuthoritySha256: artifact.source.fullShortAuthoritySha256 },
  visualProfile: { id: artifact.profile.id, stableReference: true, v11Frozen: true, scienceExposure: 1, scienceBloom: 0, scienceNoise: 0, scienceDisplayTransform: "linear-no-grade", cinematicDetailSeed: 400, manualLocalShadowOnly: true, defaultApplied: false },
  observationHub: { stageCount: 4, maximumMountedStageCount: 1, stageIds: artifact.hub.stageIds, directResourceTelemetry: true, reactStateUsedForResourceTelemetry: false, workerTextureGpuObjectUrlCameraLeaseTelemetry: true, canvasCreated: false, sceneRevisionMutation: false, physicsMutation: false, scienceBufferMutation: false, cinematicBufferMutation: false },
  qualification: { staticProfileQualified: true, staticHubQualified: true, browserQualification: "not-run", visualMatrixQualification: "not-run", soakQualification: "not-run", rtxWebGpuQualification: "not-run" },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  networkAttempted: false, automaticRetryApplied: false, sourceManifest, sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, ordinaryStandaloneProfile: "legacy-v9", liteProfile: "legacy-v9", localShadowDefaultProfile: "legacy-v9", localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  releaseBoundary: "v12-static-local-shadow-manual-only-no-default-no-browser-or-performance-qualification-no-science-or-physics-mutation",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v400", generatedAt: new Date().toISOString(), status: evidence.status,
  formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true,
  capabilities: { v399ValueFreeTemplate: "qualified-13-slots-no-values-not-compile-eligible", v400VisualProfile: "science-cinematic-v12-stable-v11-frozen", v400ScienceBoundary: "qualified-linear-exposure-1-bloom-0-noise-0", v400ObservationHub: "static-qualified-4-stages-maximum-1-mounted", v400ResourceTelemetry: "direct-dom-registry-workers-textures-gpu-object-urls-camera-leases", v400ManualAb: "local-shadow-only-default-legacy-v9", v400BrowserQualification: "not-run", v400VisualMatrix: "not-run", v400Soak: "not-run", v400RtxWebGpu: "not-run", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable" },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, profile: pointer.capabilities.v400VisualProfile, hub: pointer.capabilities.v400ObservationHub, defaultProfile: "legacy-v9", browser: pointer.capabilities.v400BrowserQualification, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
