import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const fileSha = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

run("v400 observation hub artifact", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-atlas-observation-hub-v400.ts"]);
run("v400 focused tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/atlasVisualProfileV400.test.ts",
  "app/lib/atlasObservationHubV400.test.ts",
  "app/lib/atlasObservationEvidenceCacheV401.test.ts",
  "app/components/KerrObservationHubV400.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV400.test.ts",
  "app/components/KerrConstraintForgeV396.test.tsx",
  "app/components/KerrObservationAirlockV397.test.tsx",
  "app/components/KerrObservationDockV398.test.tsx",
  "app/components/KerrProvenanceRailV399.test.tsx",
  "app/lib/atlasVisualProfileV299.test.ts",
  "app/lib/atlasVisualProfileV377.test.ts",
  "app/lib/atlasVisualRuntimeMatrixV340.test.ts",
]);
run("v400 types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v400 eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"),
  "app/lib/atlasVisualProfileV299.ts", "app/lib/atlasVisualProfileV299.test.ts", "app/lib/atlasVisualProfileV377.test.ts", "app/lib/atlasVisualProfileV400.test.ts", "app/lib/atlasVisualRuntimeMatrixV340.test.ts", "app/lib/atlasObservationHubV400.ts", "app/lib/atlasObservationHubV400.test.ts", "app/lib/atlasObservationEvidenceCacheV401.ts", "app/lib/atlasObservationEvidenceCacheV401.test.ts",
  "app/lib/atlasShadowCapabilityPointerV400.ts", "app/lib/atlasShadowCapabilityPointerV400.test.ts",
  "app/components/AtlasVisualABControlV261.tsx", "app/components/KerrObservationHubV400.tsx", "app/components/KerrObservationHubV400.test.tsx",
  "app/components/KerrConstraintForgeV396.tsx", "app/components/KerrConstraintForgeV396.test.tsx",
  "app/components/KerrObservationAirlockV397.tsx", "app/components/KerrObservationAirlockV397.test.tsx",
  "app/components/KerrObservationDockV398.tsx", "app/components/KerrObservationDockV398.test.tsx",
  "app/components/KerrProvenanceRailV399.tsx", "app/components/KerrProvenanceRailV399.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx", "scripts/build-atlas-observation-hub-v400.ts",
  "scripts/build-shadow-candidate-v400.mjs", "scripts/reseal-shadow-evidence-chain-v400.mjs", "scripts/verify-shadow-v400-light.mjs", "scripts/atlas.mjs",
]);
run("v400 chain reseal", node, ["scripts/reseal-shadow-evidence-chain-v400.mjs"]);

const artifactPath = "dist/science/atlas-observation-hub-v400/hub-qualification.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v400-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v400.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v399-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v399.json");
const state = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);

if (
  canonicalSha(artifact) !== artifact.artifactSha256
  || canonicalSha(evidence) !== evidence.evidenceSha256
  || canonicalSha(pointer) !== pointer.pointerSha256
  || evidence.dependency?.v399EvidenceSha256 !== previousEvidence.evidenceSha256
  || evidence.dependency?.v399PointerSha256 !== previousPointer.pointerSha256
  || evidence.dependency?.hubArtifactSha256 !== artifact.artifactSha256
  || pointer.evidence?.fileSha256 !== fileSha(evidencePath)
  || pointer.evidence?.canonicalSha256 !== evidence.evidenceSha256
  || artifact.profile?.id !== "science-cinematic-v12-v400"
  || artifact.profile?.v11Frozen !== true
  || artifact.source?.v11ProfileSha256 !== "8e8ac9dd5d1bd7a8446349211d90ac311b27755c01edf03aa97aab904d30ea9c"
  || artifact.profile?.scienceExposure !== 1
  || artifact.profile?.scienceBloom !== 0
  || artifact.profile?.scienceNoise !== 0
  || artifact.profile?.scienceDisplayTransform !== "linear-no-grade"
  || artifact.profile?.cinematicDetailSeed !== 400
  || artifact.profile?.defaultApplied !== false
  || artifact.hub?.stageCount !== 4
  || artifact.hub?.maximumMountedStageCount !== 1
  || artifact.hub?.directResourceTelemetry !== true
  || artifact.hub?.reactStateUsedForResourceTelemetry !== false
  || artifact.hub?.canvasCreated !== false
  || artifact.hub?.sceneRevisionMutation !== false
  || artifact.hub?.physicsMutation !== false
  || pointer.capabilities?.v400BrowserQualification !== "not-run"
  || pointer.capabilities?.v400VisualMatrix !== "not-run"
  || pointer.capabilities?.v400Soak !== "not-run"
  || pointer.capabilities?.v400RtxWebGpu !== "not-run"
  || pointer.localShadowDefaultApplied !== false
  || state.status !== "incomplete-0-of-49"
  || state.completedShardCount !== 0
  || state.attemptConsumed !== false
  || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied"
  || formalEvidence.contracts?.eihOnePnMutation !== "not-applied"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84
  || evidence.browserQualification !== undefined
  || evidence.qualification?.browserQualification !== "not-run"
) throw new Error("v400 fail-closed validation failed");

const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (transientPattern.test(JSON.stringify(evidence)) || transientPattern.test(JSON.stringify(pointer))) throw new Error("v400 transient evidence leak");
for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) throw new Error(`v400 source manifest mismatch: ${entry.path}`);
}

console.log(JSON.stringify({
  status: "passed-v400-low-memory",
  artifactSha256: artifact.artifactSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  v11FrozenSha256: artifact.source.v11ProfileSha256,
  v12ProfileSha256: artifact.source.v12ProfileSha256,
  stages: artifact.hub.stageCount,
  maximumMountedStages: artifact.hub.maximumMountedStageCount,
  dense: pointer.capabilities.v314CorrectedDense,
  browser: pointer.capabilities.v400BrowserQualification,
}, null, 2));
