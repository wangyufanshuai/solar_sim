import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = { v334Evidence: "dist/science/orbit-atlas-shadow-v334-evidence.json", v334Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v334.json", replay: "dist/science/atlas-resource-lifecycle-v335/replay.json", state: "dist/science/kerr-campaign-v314/campaign-state.json", formal: "dist/release/orbit-atlas-current-product-evidence-v263.json", evidence: "dist/science/orbit-atlas-shadow-v335-evidence.json", pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v335.json" };
const bytes = (relative) => readFileSync(resolve(root, relative));
const read = (relative) => JSON.parse(bytes(relative).toString("utf8"));
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "artifactSha256", "pointerSha256", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds", "baselineIdentityDigest", "returnIdentityDigest"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (relative, value) => { const target = resolve(root, relative); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const v334Evidence = read(paths.v334Evidence);
const v334Pointer = read(paths.v334Pointer);
const artifact = read(paths.replay);
const replay = artifact.replay ?? {};
const state = read(paths.state);
const formal = read(paths.formal);
if (v334Evidence.status !== "visual-runtime-matrix-v334-wired-browser-pending-dense-incomplete-0-of-49" || v334Pointer.capabilities?.v334RuntimeMatrix !== "v5-v6-eight-groups-sixteen-consumption-rows"
  || artifact.version !== "v335-atlas-resource-lifecycle-replay-artifact-v1" || !/^[a-f0-9]{64}$/.test(artifact.artifactSha256 ?? "")
  || replay.status !== "qualified-all-kinds-idempotent-baseline-return" || replay.resourceKindCount !== 11 || replay.acquiredCount !== 11 || replay.uniqueIdentityCount !== 11
  || replay.allKindsCovered !== true || replay.reverseRelease !== true || replay.idempotentRelease !== true || replay.identityReturnedToBaseline !== true || replay.ownerReturnedToBaseline !== true
  || replay.afterFirstRelease?.status !== "baseline" || replay.afterDuplicateRelease?.status !== "baseline" || replay.boundary !== "bounded-in-process-fixture-no-worker-gpu-or-network-created"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true) throw new Error("v335 lifecycle replay or release boundary mismatch");

const sourcePaths = ["scripts/build-atlas-lifecycle-replay-v335.ts", "scripts/build-shadow-candidate-v335.mjs", "scripts/verify-shadow-v335-light.mjs", "scripts/atlas.mjs", "app/lib/atlasResourceLifecycleReplayV335.ts", "app/lib/atlasResourceLifecycleReplayV335.test.ts", "app/lib/atlasShadowCapabilityPointerV335.ts", "app/lib/atlasShadowCapabilityPointerV335.test.ts"];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v335-evidence-v1", generatedAt: new Date().toISOString(), status: "resource-lifecycle-replay-v335-qualified-browser-pending-dense-incomplete-0-of-49",
  dependency: { v334EvidenceSha256: v334Evidence.evidenceSha256, v334PointerSha256: v334Pointer.pointerSha256, lifecycleReplayArtifactSha256: artifact.artifactSha256, fullShortAuthoritySha256: state.authority?.fullShortAuthoritySha256 ?? null },
  lifecycle: { resourceKindCount: replay.resourceKindCount, acquiredCount: replay.acquiredCount, uniqueIdentityCount: replay.uniqueIdentityCount, allKindsCovered: replay.allKindsCovered, reverseRelease: replay.reverseRelease, idempotentRelease: replay.idempotentRelease, identityReturnedToBaseline: replay.identityReturnedToBaseline, ownerReturnedToBaseline: replay.ownerReturnedToBaseline, afterFirstRelease: replay.afterFirstRelease.status, afterDuplicateRelease: replay.afterDuplicateRelease.status, numericDimensionsReturnedToZero: replay.afterDuplicateRelease.total === 0 && replay.afterDuplicateRelease.estimatedBytes === 0 && replay.afterDuplicateRelease.estimatedGpuBytes === 0 },
  boundary: { replay: replay.boundary, browserQualification: "not-run", heavyQualification: "not-run" },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  sourceManifest, sourceSha256: sha(sourceManifest), release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = { version: "orbit-atlas-current-local-shadow-candidate-v335", generatedAt: new Date().toISOString(), status: "resource-lifecycle-replay-v335-qualified-browser-pending-dense-incomplete-0-of-49", formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true, capabilities: { v334RuntimeMatrix: "v5-v6-eight-groups-sixteen-consumption-rows", v335LifecycleKinds: "eleven-registry-kinds-covered", v335BaselineReturn: "identity-owner-bytes-all-zero-diff", v335ReleaseSemantics: "reverse-order-idempotent-duplicate-safe", v335ReplayBoundary: "bounded-in-process-no-worker-gpu-network-created", v335BrowserGate: "authored-not-run", cpuScienceAuthority: "v312-geometry+v313-polarization", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable", v5V6Profiles: "manual-local-shadow-only-not-default", browserQualification: "not-run" }, evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 } };
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, kinds: evidence.lifecycle.resourceKindCount, baseline: evidence.lifecycle.afterDuplicateRelease, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
