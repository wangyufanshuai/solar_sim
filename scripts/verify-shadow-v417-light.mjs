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
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const canonicalSha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const tests = [
  "app/lib/kerrPolarimeterNonlinearObservablesV417.test.ts",
  "app/lib/kerrPolarimeterNonlinearObservablesServerV417.test.ts",
  "app/lib/kerrPolarimeterNonlinearObservablesClientV417.test.ts",
  "app/api/atlas/relativity-evidence/v417/polarimeter-nonlinear-observables/route.test.ts",
  "app/components/KerrPolarimeterNonlinearCompassV417.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV417.test.ts",
];
const lint = [
  "app/lib/kerrPolarimeterNonlinearObservablesV417.ts",
  "app/lib/kerrPolarimeterNonlinearObservablesV417.test.ts",
  "app/lib/kerrPolarimeterNonlinearObservablesServerV417.ts",
  "app/lib/kerrPolarimeterNonlinearObservablesServerV417.test.ts",
  "app/lib/kerrPolarimeterNonlinearObservablesClientV417.ts",
  "app/lib/kerrPolarimeterNonlinearObservablesClientV417.test.ts",
  "app/api/atlas/relativity-evidence/v417/polarimeter-nonlinear-observables/route.ts",
  "app/api/atlas/relativity-evidence/v417/polarimeter-nonlinear-observables/route.test.ts",
  "app/components/KerrPolarimeterNonlinearCompassV417.tsx",
  "app/components/KerrPolarimeterNonlinearCompassV417.test.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "app/lib/atlasShadowCapabilityPointerV417.ts",
  "app/lib/atlasShadowCapabilityPointerV417.test.ts",
  "scripts/build-kerr-polarimeter-nonlinear-v417.ts",
  "scripts/build-kerr-polarimeter-nonlinear-chain-v417.mjs",
  "scripts/build-shadow-candidate-v417.mjs",
  "scripts/reseal-shadow-evidence-chain-v417.mjs",
  "scripts/verify-shadow-v417-light.mjs",
  "scripts/atlas.mjs",
];

run("v417 chain reseal", node, ["scripts/reseal-shadow-evidence-chain-v417.mjs"]);
run("v417 tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", ...tests]);
run("v417 types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v417 eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), ...lint, "--max-warnings=0"]);
run("v417 final reseal", node, ["scripts/reseal-shadow-evidence-chain-v417.mjs"]);

const artifactPath = "dist/science/kerr-polarimeter-nonlinear-observables-v417/nonlinear-observables.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v417-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v417.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const state = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const view = artifact.view;
const metrics = view?.metrics;
if (
  canonicalSha(artifact) !== artifact.artifactSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  fileSha("dist/science/orbit-atlas-shadow-v416-evidence.json") !==
    "20b25efe6701d2a0883a547a83ceb791bae3339b4644711eaf2621524d1e5e49" ||
  fileSha("dist/release/orbit-atlas-current-local-shadow-candidate-v416.json") !==
    "4af5b04c1b1ffb116836a8c1c979376f331655fce314c113e2fbe6bb7284ddfd" ||
  evidence.dependency?.v416EvidenceSha256 !==
    "2e1fd13df65d011b68c767410806a9abd75e2ee97bf80ee652a31dbd08a1fa9f" ||
  evidence.dependency?.v416PointerSha256 !==
    "b41b08b39d5488e9b9b06fbcf8d8971f9baa03c46d4aa508e6062423619f078b" ||
  evidence.dependency?.nonlinearArtifactSha256 !== artifact.artifactSha256 ||
  pointer.evidence?.fileSha256 !== fileSha(evidencePath) ||
  pointer.evidence?.canonicalSha256 !== evidence.evidenceSha256 ||
  view?.trialCountPerRay !== 8192 ||
  view.totalTrialCount !== 32768 ||
  view.retainedTrialCount !== 4 ||
  view.rays?.length !== 4 ||
  metrics?.maximumStandardizedBiasAbsolute >= 0.05 ||
  metrics?.maximumStandardDeviationRatioError >= 0.05 ||
  metrics?.maximumCoverageOneSigmaError >= 0.02 ||
  metrics?.maximumCoverageTwoSigmaError >= 0.01 ||
  metrics?.maximumEvpaAxialMeanSigmaAbsolute >= 0.05 ||
  metrics?.minimumEvpaAxialResultantLength <= 0.999 ||
  metrics?.maximumPLRawBiasSigmaAbsolute >= 0.05 ||
  metrics?.maximumPLDebiasedBiasSigmaAbsolute >= 0.05 ||
  metrics?.pLDebiasClampCount !== 0 ||
  metrics?.physicalConeViolationCount !== 0 ||
  metrics?.invalidObservableCount !== 0 ||
  metrics?.maximumObservableCovarianceSymmetryRelative >= 1e-12 ||
  Math.max(...Object.values(artifact.oracleComparison ?? {})) >= 1e-10 ||
  view.observedPolarization !== "unavailable-synthetic-nonlinear-ensemble-is-not-observed-polarization" ||
  view.publishableMeasurement !== false ||
  evidence.runtimeIntegration?.rayCovariancesInReactState !== false ||
  evidence.runtimeIntegration?.trialObservablesInReactState !== false ||
  pointer.capabilities?.v417Evpa !== "qualified-axial-pi-period-coverage-fixture-only" ||
  pointer.capabilities?.v417PhysicalStokesCone !== "qualified-zero-violations" ||
  pointer.capabilities?.v417ObservedPolarization !== "unavailable" ||
  pointer.capabilities?.v417BrowserQualification !== "not-run" ||
  pointer.capabilities?.v314CorrectedDense !== "incomplete-0-of-49" ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v417 fail-closed validation failed");
}
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (
  transientPattern.test(JSON.stringify(artifact)) ||
  transientPattern.test(JSON.stringify(evidence)) ||
  transientPattern.test(JSON.stringify(pointer))
) {
  throw new Error("v417 transient evidence leak");
}
for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) throw new Error(`v417 source manifest mismatch: ${entry.path}`);
}
console.log(
  JSON.stringify(
    {
      status: "passed-v417-low-memory",
      artifactSha256: artifact.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      totalTrialCount: view.totalTrialCount,
      retainedTrialCount: view.retainedTrialCount,
      truth: view.truth,
      metrics,
      oracleMaximumDifference: Math.max(...Object.values(artifact.oracleComparison)),
      measuredAuthority: pointer.capabilities.v417MeasuredDetectorAuthority,
      observedPolarization: pointer.capabilities.v417ObservedPolarization,
      browser: pointer.capabilities.v417BrowserQualification,
      dense: pointer.capabilities.v314CorrectedDense,
    },
    null,
    2,
  ),
);
