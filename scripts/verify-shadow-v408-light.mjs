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
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256", "observedPeakRssGiB"]);
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const tests = [
  "app/lib/kerrScatteringOracleV408.test.ts",
  "app/lib/kerrScatteringOracleServerV408.test.ts",
  "app/lib/kerrScatteringOracleClientV408.test.ts",
  "app/api/atlas/relativity-evidence/v408/scattering-oracle/route.test.ts",
  "app/components/KerrScatteringOracleSurfaceV408.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV408.test.ts",
];
const lint = [
  "app/lib/kerrScatteringOracleV408.ts", "app/lib/kerrScatteringOracleV408.test.ts",
  "app/lib/kerrScatteringOracleServerV408.ts", "app/lib/kerrScatteringOracleServerV408.test.ts",
  "app/lib/kerrScatteringOracleClientV408.ts", "app/lib/kerrScatteringOracleClientV408.test.ts",
  "app/api/atlas/relativity-evidence/v408/scattering-oracle/route.ts", "app/api/atlas/relativity-evidence/v408/scattering-oracle/route.test.ts",
  "app/components/KerrScatteringOracleSurfaceV408.tsx", "app/components/KerrScatteringOracleSurfaceV408.test.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "app/lib/atlasShadowCapabilityPointerV408.ts", "app/lib/atlasShadowCapabilityPointerV408.test.ts",
  "scripts/build-kerr-scattering-oracle-v408.ts", "scripts/build-shadow-candidate-v408.mjs",
  "scripts/reseal-shadow-evidence-chain-v408.mjs", "scripts/verify-shadow-v408-light.mjs", "scripts/atlas.mjs",
];

run("v408 chain reseal", node, ["scripts/reseal-shadow-evidence-chain-v408.mjs"]);
run("v408 tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", ...tests]);
run("v408 types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v408 eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), ...lint]);
run("v408 final reseal", node, ["scripts/reseal-shadow-evidence-chain-v408.mjs"]);

const artifactPath = "dist/science/kerr-scattering-oracle-v408/portable-envelope.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v408-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v408.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const state = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const previousEvidencePath = "dist/science/orbit-atlas-shadow-v407-evidence.json";
const previousPointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v407.json";
const samples = artifact.view?.curveEnvelope?.samples ?? [];
const signCounts = samples.reduce((counts, sample) => {
  if (sample.signedApproximationError < 0) counts.underestimate += 1;
  else if (sample.signedApproximationError > 0) counts.overestimate += 1;
  else counts.equal += 1;
  return counts;
}, { underestimate: 0, overestimate: 0, equal: 0 });

if (
  canonicalSha(artifact) !== artifact.artifactSha256 || canonicalSha(evidence) !== evidence.evidenceSha256 || canonicalSha(pointer) !== pointer.pointerSha256 ||
  fileSha(previousEvidencePath) !== "f70ba41901edaf66d76c2f8f10ff43fc921ea31cd764d0cda97fee0631042e65" ||
  fileSha(previousPointerPath) !== "69b60b27d8d70cca3a97b15256e5ca20ba1d682966e806ee7e74e46296fcb969" ||
  evidence.dependency?.v407EvidenceSha256 !== "f8c51cb64b604f343f800338846d332dabffd0d4823aa16959e68afb61e078df" ||
  evidence.dependency?.v407PointerSha256 !== "ef0889304eaa935b8366be5cf3364c597780463a73ed5f1c17f7b73822c132eb" ||
  evidence.dependency?.pythonOracleEvidenceSha256 !== "7fc3772ebde21ddad6beecf8487b0814055d3c133bc14048677e0160a9a6565e" ||
  evidence.dependency?.portableOracleArtifactSha256 !== artifact.artifactSha256 ||
  pointer.evidence?.fileSha256 !== fileSha(evidencePath) || pointer.evidence?.canonicalSha256 !== evidence.evidenceSha256 ||
  artifact.view?.status !== "qualified-independent-discrete-ordinates-reference-envelope" || artifact.view?.rayComparisons?.length !== 4 || samples.length !== 181 ||
  signCounts.underestimate !== 146 || signCounts.overestimate !== 35 || signCounts.equal !== 0 ||
  artifact.view.rayComparisons.some((ray) => ray.relativeApproximationError >= -0.067 || ray.relativeApproximationError <= -0.091) ||
  artifact.view.maxima?.linearSystemResidual >= 1e-10 || artifact.view.maxima?.relativeFluxDrift >= 1e-10 || artifact.view.maxima?.kernelEquilibriumResidual >= 1e-13 ||
  artifact.view.authorityBoundary?.exactChandrasekharHFunctionTableAuthority !== false || artifact.view.authorityBoundary?.limbEndpointMuZeroQualified !== false || artifact.view.authorityBoundary?.faceOnEndpointMuOneQualified !== false ||
  evidence.runtimeIntegration?.summaryOnlyInReactState !== true || evidence.runtimeIntegration?.curveSamplesInReactState !== false || evidence.runtimeIntegration?.canvasCreated !== false ||
  pointer.capabilities?.v408NumericalOracle !== "qualified-independent-discrete-ordinates-reference-envelope" ||
  pointer.capabilities?.v408FullCurveSign !== "mixed-146-underestimate-35-overestimate" || pointer.capabilities?.v408ExactHFunctionTable !== "not-qualified" ||
  pointer.capabilities?.v408BrowserQualification !== "not-run" || pointer.capabilities?.v314CorrectedDense !== "incomplete-0-of-49" ||
  state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.eihOnePnMutation !== "not-applied" ||
  formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v408 fail-closed validation failed");

const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (transientPattern.test(JSON.stringify(artifact)) || transientPattern.test(JSON.stringify(evidence)) || transientPattern.test(JSON.stringify(pointer))) throw new Error("v408 transient evidence leak");
for (const entry of evidence.sourceManifest ?? []) if (fileSha(entry.path) !== entry.sha256) throw new Error(`v408 source manifest mismatch: ${entry.path}`);

console.log(JSON.stringify({
  status: "passed-v408-low-memory",
  artifactSha256: artifact.artifactSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  rayUnderestimatePercentRange: evidence.fourRayEnvelope.v407UnderestimateRange.map((value) => value * 100),
  curveSignCounts: signCounts,
  exactHFunctionTable: pointer.capabilities.v408ExactHFunctionTable,
  browser: pointer.capabilities.v408BrowserQualification,
  dense: pointer.capabilities.v314CorrectedDense,
}, null, 2));
