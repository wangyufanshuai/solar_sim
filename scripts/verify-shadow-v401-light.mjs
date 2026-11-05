import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd(); const node = process.execPath;
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const fileSha = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

run("v401 cache artifact", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-atlas-observation-evidence-cache-v401.ts"]);
run("v401 tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/atlasObservationEvidenceCacheV401.test.ts", "app/lib/atlasObservationEvidenceCacheQualificationV401.test.ts", "app/lib/atlasShadowCapabilityPointerV401.test.ts",
  "app/components/KerrObservationHubV400.test.tsx", "app/components/KerrConstraintForgeV396.test.tsx", "app/components/KerrObservationAirlockV397.test.tsx", "app/components/KerrObservationDockV398.test.tsx", "app/components/KerrProvenanceRailV399.test.tsx",
]);
run("v401 types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v401 eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"),
  "app/lib/atlasObservationEvidenceCacheV401.ts", "app/lib/atlasObservationEvidenceCacheV401.test.ts",
  "app/lib/atlasObservationEvidenceCacheQualificationV401.ts", "app/lib/atlasObservationEvidenceCacheQualificationV401.test.ts",
  "app/lib/atlasShadowCapabilityPointerV401.ts", "app/lib/atlasShadowCapabilityPointerV401.test.ts",
  "app/components/KerrConstraintForgeV396.tsx", "app/components/KerrConstraintForgeV396.test.tsx",
  "app/components/KerrObservationAirlockV397.tsx", "app/components/KerrObservationAirlockV397.test.tsx",
  "app/components/KerrObservationDockV398.tsx", "app/components/KerrObservationDockV398.test.tsx",
  "app/components/KerrProvenanceRailV399.tsx", "app/components/KerrProvenanceRailV399.test.tsx",
  "app/components/KerrObservationHubV400.tsx", "app/components/KerrObservationHubV400.test.tsx",
  "scripts/build-atlas-observation-evidence-cache-v401.ts", "scripts/build-shadow-candidate-v401.mjs", "scripts/reseal-shadow-evidence-chain-v401.mjs", "scripts/verify-shadow-v401-light.mjs", "scripts/atlas.mjs",
]);
run("v401 chain reseal", node, ["scripts/reseal-shadow-evidence-chain-v401.mjs"]);

const artifactPath = "dist/science/atlas-observation-evidence-cache-v401/cache-qualification.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v401-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v401.json";
const artifact = read(artifactPath); const evidence = read(evidencePath); const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v400-evidence.json"); const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v400.json");
const state = read("dist/science/kerr-campaign-v314/campaign-state.json"); const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json"); const formalEvidence = read(formal.source);
if (canonicalSha(artifact) !== artifact.artifactSha256 || canonicalSha(evidence) !== evidence.evidenceSha256 || canonicalSha(pointer) !== pointer.pointerSha256 || evidence.dependency?.v400EvidenceSha256 !== previousEvidence.evidenceSha256 || evidence.dependency?.v400PointerSha256 !== previousPointer.pointerSha256 || evidence.dependency?.cacheArtifactSha256 !== artifact.artifactSha256 || pointer.evidence?.fileSha256 !== fileSha(evidencePath) || pointer.evidence?.canonicalSha256 !== evidence.evidenceSha256 || artifact.cache?.stageCount !== 4 || artifact.cache.maximumEntries !== 4 || artifact.cache.maximumResponseBytes !== 128 * 1024 || artifact.cache.maximumRequestsPerStage !== 1 || artifact.cache.failedPromiseRetained !== true || artifact.cache.automaticRetryAllowed !== false || artifact.cache.snapshotContainsArtifacts !== false || artifact.cache.responseBytesTracked !== true || artifact.hub?.dynamicStageStatus !== true || artifact.hub.externalStoreSnapshot !== true || artifact.hub.maximumMountedStageCount !== 1 || pointer.capabilities?.v401CacheTelemetry !== "entries-requests-response-bytes-128-kib-per-stage" || pointer.capabilities?.v401BrowserQualification !== "not-run" || pointer.capabilities?.v401VisualMatrix !== "not-run" || pointer.capabilities?.v401Soak !== "not-run" || pointer.capabilities?.v401RtxWebGpu !== "not-run" || pointer.localShadowDefaultApplied !== false || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.eihOnePnMutation !== "not-applied" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v401 fail-closed validation failed");
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (transientPattern.test(JSON.stringify(evidence)) || transientPattern.test(JSON.stringify(pointer))) throw new Error("v401 transient evidence leak");
for (const entry of evidence.sourceManifest ?? []) if (fileSha(entry.path) !== entry.sha256) throw new Error(`v401 source manifest mismatch: ${entry.path}`);
console.log(JSON.stringify({ status: "passed-v401-low-memory", artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, stages: artifact.cache.stageCount, maximumResponseBytes: artifact.cache.maximumResponseBytes, maximumRequestsPerStage: artifact.cache.maximumRequestsPerStage, automaticRetryAllowed: artifact.cache.automaticRetryAllowed, dense: pointer.capabilities.v314CorrectedDense, browser: pointer.capabilities.v401BrowserQualification }, null, 2));
