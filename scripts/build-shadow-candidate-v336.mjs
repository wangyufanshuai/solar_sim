import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v335Evidence: "dist/science/orbit-atlas-shadow-v335-evidence.json",
  v335Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v335.json",
  replay: "dist/science/atlas-runtime-state-replay-v336/replay.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v336-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v336.json",
};
const bytes = (relative) => readFileSync(resolve(root, relative));
const read = (relative) => JSON.parse(bytes(relative).toString("utf8"));
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "artifactSha256", "pointerSha256", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds", "originalStateDigest", "restoredStateDigest", "baselineResourceIdentityDigest", "restoredResourceIdentityDigest"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (relative, value) => { const target = resolve(root, relative); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const v335Evidence = read(paths.v335Evidence);
const v335Pointer = read(paths.v335Pointer);
const artifact = read(paths.replay);
const replay = artifact.replay ?? {};
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (v335Evidence.status !== "resource-lifecycle-replay-v335-qualified-browser-pending-dense-incomplete-0-of-49"
  || v335Pointer.capabilities?.v335BaselineReturn !== "identity-owner-bytes-all-zero-diff"
  || artifact.version !== "v336-atlas-runtime-state-replay-artifact-v1" || artifact.status !== "qualified-profile-state-camera-canvas-baseline-return"
  || !/^[a-f0-9]{64}$/.test(artifact.artifactSha256 ?? "") || replay.status !== "qualified-profile-state-camera-canvas-baseline-return"
  || replay.sequence?.join("|") !== "legacy-v9|science-cinematic-v5-v299|science-cinematic-v6-v300|legacy-v9" || replay.transitions?.length !== 3
  || replay.transitions.some((entry) => entry.sceneRevisionDelta !== 0 || entry.changedKeys?.join(",") !== "visualProfile" || entry.resolverReferenceStable !== true)
  || replay.sceneRevisionDelta !== 0 || replay.selectionStable !== true || replay.sceneModeStable !== true || replay.scaleBandStable !== true
  || replay.scaleJourneyStable !== true || replay.researchStateStable !== true || replay.focusStateStable !== true || replay.panelStateStable !== true
  || replay.safeViewportStable !== true || replay.profileResourceDriftAbsent !== true || replay.cameraLeaseIdentityReturnedToBaseline !== true
  || replay.afterCameraRelease?.status !== "baseline" || replay.singleCanvasStable !== true || replay.runtimePhysicsContextStable !== true
  || replay.scienceCinematicPresentationDidNotMutateSelectionOrPhysics !== true || replay.allModifiedGlobalStoreFieldsRestored !== true
  || artifact.staticAudit?.universeCanvasComponentCount !== 1 || artifact.staticAudit?.sceneHostMountCount !== 1
  || artifact.staticAudit?.sceneHostLimitDeclared !== true || artifact.staticAudit?.visualSetterPresentationOnly !== true
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.science?.runtimePromotionApplied !== false
  || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.eihOnePnMutation !== "not-applied"
  || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84 || formalEvidence.product?.v261?.candidateAppliedAsDefault !== false) {
  throw new Error("v336 runtime replay or frozen release boundary mismatch");
}

const sourcePaths = ["scripts/build-atlas-runtime-state-replay-v336.ts", "scripts/build-shadow-candidate-v336.mjs", "scripts/verify-shadow-v336-light.mjs", "scripts/atlas.mjs", "app/lib/atlasRuntimeStateReplayV336.ts", "app/lib/atlasRuntimeStateReplayV336.test.ts", "app/lib/atlasShadowCapabilityPointerV336.ts", "app/lib/atlasShadowCapabilityPointerV336.test.ts"];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v336-evidence-v1", generatedAt: new Date().toISOString(), status: "runtime-profile-state-replay-v336-qualified-browser-pending-dense-incomplete-0-of-49",
  dependency: { v335EvidenceSha256: v335Evidence.evidenceSha256, v335PointerSha256: v335Pointer.pointerSha256, runtimeStateReplayArtifactSha256: artifact.artifactSha256, fullShortAuthoritySha256: state.authority?.fullShortAuthoritySha256 ?? null },
  replay: { sequence: replay.sequence, transitionCount: replay.transitions.length, modifiedGlobalStoreFields: replay.modifiedGlobalStoreFields, allModifiedGlobalStoreFieldsRestored: replay.allModifiedGlobalStoreFieldsRestored, sceneRevisionDelta: replay.sceneRevisionDelta, selectionStable: replay.selectionStable, sceneModeStable: replay.sceneModeStable, scaleBandStable: replay.scaleBandStable, scaleJourneyStable: replay.scaleJourneyStable, researchStateStable: replay.researchStateStable, focusStateStable: replay.focusStateStable, panelStateStable: replay.panelStateStable, qualityTierStable: replay.qualityTierStable, safeViewportStable: replay.safeViewportStable, resolverReferencesStable: replay.resolverReferencesStable, scienceFieldsEquivalent: replay.scienceFieldsEquivalent, cinematicFieldsDistinct: replay.cinematicFieldsDistinct, profileResourceDriftAbsent: replay.profileResourceDriftAbsent },
  cameraLease: { duringStatus: replay.cameraLeaseDuring.status, duringLocks: replay.cameraLeaseDuring.cameraLocks, afterStatus: replay.afterCameraRelease.status, identityReturnedToBaseline: replay.cameraLeaseIdentityReturnedToBaseline },
  canvas: { universeCanvasComponentCount: artifact.staticAudit.universeCanvasComponentCount, sceneHostMountCount: artifact.staticAudit.sceneHostMountCount, sceneHostLimitDeclared: artifact.staticAudit.sceneHostLimitDeclared, stable: replay.singleCanvasStable, browserQualification: "not-run" },
  frozenBoundary: { defaultKernel: formalEvidence.science.defaultKernel, runtimePromotionApplied: formalEvidence.science.runtimePromotionApplied, workerPhysicsMutation: formalEvidence.contracts.workerPhysicsMutation, eihOnePnMutation: formalEvidence.contracts.eihOnePnMutation, legacyRootAttributes: formalEvidence.contracts.legacyRootAttributes, evidenceLedgerClaims: formalEvidence.contracts.evidenceLedgerClaims, runtimePhysicsContextStable: replay.runtimePhysicsContextStable, scienceCinematicPresentationDidNotMutateSelectionOrPhysics: replay.scienceCinematicPresentationDidNotMutateSelectionOrPhysics },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  sourceManifest, sourceSha256: sha(sourceManifest), release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "bounded-store-registry-and-static-canvas-replay-browser-heavy-and-dense-qualification-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = { version: "orbit-atlas-current-local-shadow-candidate-v336", generatedAt: new Date().toISOString(), status: "runtime-profile-state-replay-v336-qualified-browser-pending-dense-incomplete-0-of-49", formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true, capabilities: { v335LifecycleBaseline: "eleven-registry-kinds-identity-owner-bytes-returned", v336ProfileSequence: "legacy-v9-to-v5-to-v6-to-legacy-v9", v336StateInvariants: "scene-selection-scale-research-focus-panels-safe-viewport-no-drift", v336SceneRevision: "zero-increment", v336CameraLease: "identity-returned-to-baseline-idempotent", v336SingleCanvas: "static-main-scene-host-count-one-browser-pending", v336ScienceCinematicBoundary: "presentation-only-no-selection-or-runtime-physics-mutation", v336ResolverStability: "v5-v6-reference-stable", cpuScienceAuthority: "v312-geometry+v313-polarization", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable", v5V6Profiles: "manual-local-shadow-only-not-default", browserQualification: "not-run" }, evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 } };
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, transitions: evidence.replay.transitionCount, sceneRevisionDelta: evidence.replay.sceneRevisionDelta, cameraBaseline: evidence.cameraLease.afterStatus, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
