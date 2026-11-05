import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const temporary = resolve(root, "dist/temp/v430");
mkdirSync(temporary, { recursive: true });
const env = { ...process.env, TEMP: temporary, TMP: temporary };
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false, env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const fileSha = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const tests = [
  "app/lib/kerrHighEnergyCountLikelihoodV430.test.ts",
  "app/lib/kerrHighEnergyCountLikelihoodServerV430.test.ts",
  "app/lib/kerrHighEnergyCountLikelihoodClientV430.test.ts",
  "app/api/atlas/relativity-evidence/v430/high-energy-count-likelihood/route.test.ts",
  "app/components/KerrHighEnergyCountLikelihoodV430.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV430.test.ts",
];
const lint = [
  "app/lib/kerrHighEnergyCountLikelihoodV430.ts",
  "app/lib/kerrHighEnergyCountLikelihoodV430.test.ts",
  "app/lib/kerrHighEnergyCountLikelihoodServerV430.ts",
  "app/lib/kerrHighEnergyCountLikelihoodServerV430.test.ts",
  "app/lib/kerrHighEnergyCountLikelihoodClientV430.ts",
  "app/lib/kerrHighEnergyCountLikelihoodClientV430.test.ts",
  "app/lib/atlasShadowCapabilityPointerV430.ts",
  "app/lib/atlasShadowCapabilityPointerV430.test.ts",
  "app/api/atlas/relativity-evidence/v430/high-energy-count-likelihood/route.ts",
  "app/api/atlas/relativity-evidence/v430/high-energy-count-likelihood/route.test.ts",
  "app/components/KerrHighEnergyCountLikelihoodV430.tsx",
  "app/components/KerrHighEnergyCountLikelihoodV430.test.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "scripts/build-kerr-high-energy-count-likelihood-v430.ts",
  "scripts/build-kerr-high-energy-count-likelihood-chain-v430.mjs",
  "scripts/build-shadow-candidate-v430.mjs",
  "scripts/reseal-shadow-evidence-chain-v430.mjs",
  "scripts/verify-shadow-v430-light.mjs",
  "scripts/atlas.mjs",
];
const reproducible = [
  "dist/science/kerr-high-energy-count-likelihood-v430/count-likelihood-oracle.json",
  "dist/science/kerr-high-energy-count-likelihood-v430/likelihood-contract.json",
  "dist/science/kerr-high-energy-count-likelihood-v430/count-likelihood.json",
  "dist/science/kerr-high-energy-count-likelihood-v430/simulated-residual-diagnostics.csv",
  "dist/science/kerr-high-energy-count-likelihood-v430/simulated-residual-diagnostics.fits",
  "dist/science/kerr-high-energy-count-likelihood-v430/count-likelihood-architecture.png",
  "dist/science/kerr-high-energy-count-likelihood-v430/export-manifest.json",
  "dist/science/orbit-atlas-shadow-v430-evidence.json",
  "dist/release/orbit-atlas-current-local-shadow-candidate-v430.json",
];

run("v430 first reseal", node, ["scripts/reseal-shadow-evidence-chain-v430.mjs"]);
const firstSeal = Object.fromEntries(reproducible.map((path) => [path, fileSha(path)]));
run("v430 Python likelihood verification", "python", ["scripts/test-kerr-high-energy-count-likelihood-v430.py"]);
run("v430 tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", ...tests]);
run("v430 types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v430 eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), ...lint, "--max-warnings=0"]);
run("v430 final reseal", node, ["scripts/reseal-shadow-evidence-chain-v430.mjs"]);
const secondSeal = Object.fromEntries(reproducible.map((path) => [path, fileSha(path)]));
if (JSON.stringify(firstSeal) !== JSON.stringify(secondSeal)) throw new Error("v430 reseal reproducibility failed");

const artifactPath = "dist/science/kerr-high-energy-count-likelihood-v430/count-likelihood.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v430-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v430.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const state = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const view = artifact.view;
if (
  canonicalSha(artifact) !== artifact.artifactSha256
  || canonicalSha(evidence) !== evidence.evidenceSha256
  || canonicalSha(pointer) !== pointer.pointerSha256
  || artifact.artifactSha256 !== "e666aa7c7d7f65dcc65e91e3e1075b60752f1996aa5d7deba6878c6b26bd7405"
  || evidence.dependency?.v430ArtifactSha256 !== artifact.artifactSha256
  || pointer.evidence?.fileSha256 !== fileSha(evidencePath)
  || pointer.evidence?.canonicalSha256 !== evidence.evidenceSha256
  || view?.fixture?.maximumPythonRelativeDifference >= 1e-8
  || view.fixture.metrics.maximumMahalanobisIdentityDifference >= 1e-8
  || view.fixture.metrics.minimumPredictiveCovarianceEigenvalue <= 0
  || view.fixture.metrics.effectiveCovarianceRank !== 24
  || view.counts?.fixtureSimulatedCountCount !== 24
  || view.counts.measuredObservedCountCount !== 0
  || view.counts.measuredHoldoutDatasetCount !== 0
  || view.counts.measuredResidualMetricCount !== 0
  || view.counts.measuredValidationRunCount !== 0
  || view.counts.measuredResponseAuthorityCount !== 0
  || view.counts.scienceResponseApplicationCount !== 0
  || view.authorityBoundary?.likelihoodMathAuthorityGranted !== true
  || view.authorityBoundary.residualMathAuthorityGranted !== true
  || view.authorityBoundary.whiteningMathAuthorityGranted !== true
  || view.authorityBoundary.fixtureGoodnessOfFitAuthorityGranted !== false
  || view.authorityBoundary.measuredLikelihoodAuthorityGranted !== false
  || view.authorityBoundary.measuredResidualClosureAuthorityGranted !== false
  || view.authorityBoundary.measuredResponseAuthorityGranted !== false
  || pointer.capabilities?.v430PoissonLikelihoodMath !== "qualified-fixture-only"
  || pointer.capabilities.v430DevianceResidualMath !== "qualified-fixture-only"
  || pointer.capabilities.v430PearsonResidualMath !== "qualified-fixture-only"
  || pointer.capabilities.v430PredictiveCovarianceWhitening !== "qualified-fixture-only"
  || pointer.capabilities.v430AngleChannelClosure !== "qualified-fixture-only"
  || pointer.capabilities.v430FixtureGoodnessOfFitAuthority !== "not-granted"
  || pointer.capabilities.v430MeasuredObservedCounts !== "zero"
  || pointer.capabilities.v430MeasuredResidualMetrics !== "zero"
  || pointer.capabilities.v430MeasuredValidationRuns !== "zero"
  || pointer.capabilities.v430MeasuredResponseAuthority !== "unavailable"
  || pointer.capabilities.v430ScienceResponseApplications !== "zero"
  || pointer.capabilities.v430BrowserQualification !== "not-run"
  || pointer.capabilities.v314CorrectedDense !== "incomplete-0-of-49"
  || state.status !== "incomplete-0-of-49"
  || state.completedShardCount !== 0
  || state.attemptConsumed !== false
  || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v430 fail-closed validation failed");
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (transientPattern.test(JSON.stringify(artifact)) || transientPattern.test(JSON.stringify(evidence)) || transientPattern.test(JSON.stringify(pointer))) throw new Error("v430 transient evidence leak");
for (const entry of evidence.sourceManifest ?? []) if (fileSha(entry.path) !== entry.sha256) throw new Error(`v430 source manifest mismatch: ${entry.path}`);
console.log(JSON.stringify({ status: "passed-v430-low-memory", artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, counts: view.counts, metrics: view.fixture.metrics, measuredAuthority: pointer.capabilities.v430MeasuredResponseAuthority, browser: pointer.capabilities.v430BrowserQualification, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
