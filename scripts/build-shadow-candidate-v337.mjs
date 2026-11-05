import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = { v336Evidence: "dist/science/orbit-atlas-shadow-v336-evidence.json", v336Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v336.json", replay: "dist/science/kerr-science-cinematic-buffer-replay-v337/replay.json", state: "dist/science/kerr-campaign-v314/campaign-state.json", formal: "dist/release/orbit-atlas-current-product-evidence-v263.json", evidence: "dist/science/orbit-atlas-shadow-v337-evidence.json", pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v337.json" };
const bytes = (relative) => readFileSync(resolve(root, relative));
const read = (relative) => JSON.parse(bytes(relative).toString("utf8"));
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "artifactSha256", "pointerSha256", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (relative, value) => { const target = resolve(root, relative); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const v336Evidence = read(paths.v336Evidence);
const v336Pointer = read(paths.v336Pointer);
const artifact = read(paths.replay);
const replay = artifact.replay ?? {};
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const checks = ["allScientificBuffersByteIdentical", "classificationUnchanged", "redshiftUnchanged", "evpaUnchanged", "intensityUnchanged", "errorBudgetBuffersUnchanged", "scienceContractsEquivalent", "scienceOutputProfileInvariant", "scienceOutputDeterministic", "cinematicOutputDeterministic", "cinematicProfileOutputsDistinct", "scienceAndCinematicBuffersDisjoint", "rendererOutputsDisjointFromAuthority", "responseCopyDisjointFromAuthority", "denseIncompleteVisible"];
if (v336Evidence.status !== "runtime-profile-state-replay-v336-qualified-browser-pending-dense-incomplete-0-of-49"
  || v336Pointer.capabilities?.v336SceneRevision !== "zero-increment"
  || artifact.version !== "v337-kerr-science-cinematic-buffer-replay-artifact-v1" || artifact.status !== "qualified-full-sparse-authority-render-boundary-replay"
  || !/^[a-f0-9]{64}$/.test(artifact.artifactSha256 ?? "") || replay.status !== "qualified-full-sparse-authority-render-boundary-replay"
  || replay.authority?.kind !== "v312-v313-short-gate-sparse" || replay.authority?.denseCampaignComplete !== false || replay.authority?.denseAggregateSha256 !== null
  || replay.sampleCount !== 16 || replay.classificationCounts?.capture !== 6 || replay.classificationCounts?.escape !== 6 || replay.classificationCounts?.diskHit !== 4
  || replay.applicableEvpaCount !== 4 || replay.scientificBufferFieldCount < 50 || !(replay.scientificBufferByteLength > 0)
  || checks.some((key) => replay[key] !== true) || replay.v5CinematicOutputDigest === replay.v6CinematicOutputDigest
  || replay.boundary !== "v312-v313-sixteen-ray-sparse-authority-only-no-dense-transfer-map-no-science-buffer-mutation"
  || artifact.browserQualification !== "not-run"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.science?.runtimePromotionApplied !== false
  || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.eihOnePnMutation !== "not-applied") throw new Error("v337 render replay or frozen release boundary mismatch");

const sourcePaths = ["scripts/build-kerr-science-cinematic-buffer-replay-v337.ts", "scripts/build-shadow-candidate-v337.mjs", "scripts/verify-shadow-v337-light.mjs", "scripts/atlas.mjs", "app/lib/kerrScienceCinematicBufferReplayV337.ts", "app/lib/kerrScienceCinematicBufferReplayV337.test.ts", "app/lib/atlasShadowCapabilityPointerV337.ts", "app/lib/atlasShadowCapabilityPointerV337.test.ts"];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v337-evidence-v1", generatedAt: new Date().toISOString(), status: "science-cinematic-buffer-replay-v337-qualified-browser-pending-dense-incomplete-0-of-49",
  dependency: { v336EvidenceSha256: v336Evidence.evidenceSha256, v336PointerSha256: v336Pointer.pointerSha256, bufferReplayArtifactSha256: artifact.artifactSha256, geometryAuthoritySha256: replay.authority.geometrySha256, polarizationAuthoritySha256: replay.authority.polarizationSha256, rayPlanSha256: replay.authority.rayPlanSha256 },
  authority: { kind: replay.authority.kind, sampleCount: replay.sampleCount, classificationCounts: replay.classificationCounts, applicableEvpaCount: replay.applicableEvpaCount, denseCampaignComplete: false, denseAggregateSha256: null },
  buffers: { scientificBufferFieldCount: replay.scientificBufferFieldCount, scientificBufferByteLength: replay.scientificBufferByteLength, allScientificBuffersByteIdentical: replay.allScientificBuffersByteIdentical, classificationUnchanged: replay.classificationUnchanged, redshiftUnchanged: replay.redshiftUnchanged, evpaUnchanged: replay.evpaUnchanged, intensityUnchanged: replay.intensityUnchanged, errorBudgetBuffersUnchanged: replay.errorBudgetBuffersUnchanged, rendererOutputsDisjointFromAuthority: replay.rendererOutputsDisjointFromAuthority, responseCopyDisjointFromAuthority: replay.responseCopyDisjointFromAuthority },
  rendering: { scienceContractsEquivalent: replay.scienceContractsEquivalent, scienceOutputProfileInvariant: replay.scienceOutputProfileInvariant, scienceOutputDeterministic: replay.scienceOutputDeterministic, scienceOutputDigest: replay.scienceOutputDigest, cinematicOutputDeterministic: replay.cinematicOutputDeterministic, cinematicProfileOutputsDistinct: replay.cinematicProfileOutputsDistinct, v5CinematicOutputDigest: replay.v5CinematicOutputDigest, v6CinematicOutputDigest: replay.v6CinematicOutputDigest, scienceAndCinematicBuffersDisjoint: replay.scienceAndCinematicBuffersDisjoint },
  frozenBoundary: { defaultKernel: formalEvidence.science.defaultKernel, workerPhysicsMutation: formalEvidence.contracts.workerPhysicsMutation, eihOnePnMutation: formalEvidence.contracts.eihOnePnMutation, formalProductPointer: "v263", localShadowDefaultApplied: false },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  sourceManifest, sourceSha256: sha(sourceManifest), release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true }, boundary: "sparse-authority-render-replay-only-browser-heavy-and-dense-qualification-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = { version: "orbit-atlas-current-local-shadow-candidate-v337", generatedAt: new Date().toISOString(), status: "science-cinematic-buffer-replay-v337-qualified-browser-pending-dense-incomplete-0-of-49", formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true, capabilities: { v336RuntimeStateReplay: "profile-state-camera-canvas-baseline-qualified", v337SparseAuthority: "v312-v313-sixteen-rays-six-capture-six-escape-four-disk-hit", v337ScientificBuffers: "all-typed-arrays-byte-identical-before-after-rendering", v337ScienceRendering: "v5-v6-profile-invariant-linear-deterministic", v337CinematicRendering: "v5-v6-distinct-seeded-deterministic-disjoint-copy", v337MeasurementIntegrity: "classification-redshift-evpa-intensity-error-budgets-unchanged", v337DenseBoundary: "sparse-only-no-transfer-map-dense-incomplete-visible", cpuScienceAuthority: "v312-geometry+v313-polarization", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable", v5V6Profiles: "manual-local-shadow-only-not-default", browserQualification: "not-run" }, evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 } };
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, samples: evidence.authority.sampleCount, fields: evidence.buffers.scientificBufferFieldCount, scienceDigest: evidence.rendering.scienceOutputDigest, v5Digest: evidence.rendering.v5CinematicOutputDigest, v6Digest: evidence.rendering.v6CinematicOutputDigest, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
