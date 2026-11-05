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
  "app/lib/kerrPolarimeterStokesEnsembleV416.test.ts",
  "app/lib/kerrPolarimeterStokesEnsembleServerV416.test.ts",
  "app/lib/kerrPolarimeterStokesEnsembleClientV416.test.ts",
  "app/api/atlas/relativity-evidence/v416/polarimeter-stokes-ensemble/route.test.ts",
  "app/components/KerrPolarimeterStokesEnsembleSurfaceV416.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV416.test.ts",
];
const lint = [
  "app/lib/kerrPolarimeterStokesEnsembleV416.ts",
  "app/lib/kerrPolarimeterStokesEnsembleV416.test.ts",
  "app/lib/kerrPolarimeterStokesEnsembleServerV416.ts",
  "app/lib/kerrPolarimeterStokesEnsembleServerV416.test.ts",
  "app/lib/kerrPolarimeterStokesEnsembleClientV416.ts",
  "app/lib/kerrPolarimeterStokesEnsembleClientV416.test.ts",
  "app/api/atlas/relativity-evidence/v416/polarimeter-stokes-ensemble/route.ts",
  "app/api/atlas/relativity-evidence/v416/polarimeter-stokes-ensemble/route.test.ts",
  "app/components/KerrPolarimeterStokesEnsembleSurfaceV416.tsx",
  "app/components/KerrPolarimeterStokesEnsembleSurfaceV416.test.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "app/lib/atlasShadowCapabilityPointerV416.ts",
  "app/lib/atlasShadowCapabilityPointerV416.test.ts",
  "scripts/build-kerr-polarimeter-stokes-ensemble-v416.ts",
  "scripts/build-kerr-polarimeter-stokes-ensemble-chain-v416.mjs",
  "scripts/build-shadow-candidate-v416.mjs",
  "scripts/reseal-shadow-evidence-chain-v416.mjs",
  "scripts/verify-shadow-v416-light.mjs",
  "scripts/atlas.mjs",
];

run("v416 chain reseal", node, ["scripts/reseal-shadow-evidence-chain-v416.mjs"]);
run("v416 tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", ...tests]);
run("v416 types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v416 eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), ...lint, "--max-warnings=0"]);
run("v416 final reseal", node, ["scripts/reseal-shadow-evidence-chain-v416.mjs"]);

const artifactPath = "dist/science/kerr-polarimeter-stokes-ensemble-v416/stokes-ensemble.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v416-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v416.json";
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
  fileSha("dist/science/orbit-atlas-shadow-v415-evidence.json") !==
    "a2addc1a8204460a25b9f07d4ac9e2e048df5bec7f48e313692e9f8cb9b93338" ||
  fileSha("dist/release/orbit-atlas-current-local-shadow-candidate-v415.json") !==
    "13e5167881b4b6d43caa322b85e3f8406c75844f56fca99e1b132a392c4a24d5" ||
  evidence.dependency?.v415EvidenceSha256 !==
    "3f9435f4d7ced51e272123ca0bc780456a2f85b275edd4d8cb0a1d156ec2fec3" ||
  evidence.dependency?.v415PointerSha256 !==
    "2709261dea2701234541c67ea75298ee9653b5bcd7253c31535e59a9913b792a" ||
  evidence.dependency?.ensembleArtifactSha256 !== artifact.artifactSha256 ||
  pointer.evidence?.fileSha256 !== fileSha(evidencePath) ||
  pointer.evidence?.canonicalSha256 !== evidence.evidenceSha256 ||
  view?.trialCountPerRay !== 4096 ||
  view.totalTrialCount !== 16384 ||
  view.retainedTrialCount !== 4 ||
  view.rays?.length !== 4 ||
  metrics?.maximumSourceExpectationClosureRelative >= 1e-12 ||
  metrics?.maximumNoiselessStokesRecoveryAbsolute >= 1e-12 ||
  metrics?.maximumResponseConditionNumber >= 1e4 ||
  metrics?.maximumCountingPullMeanAbsolute >= 0.06 ||
  metrics?.maximumCountingPullStandardDeviationError >= 0.06 ||
  metrics?.maximumCountingCoverageOneSigmaError >= 0.025 ||
  metrics?.maximumCountingCoverageTwoSigmaError >= 0.015 ||
  metrics?.maximumCalibrationPullMeanAbsolute >= 0.06 ||
  metrics?.maximumCalibrationPullStandardDeviationError >= 0.06 ||
  metrics?.maximumCalibrationCoverageOneSigmaError >= 0.025 ||
  metrics?.maximumCalibrationCoverageTwoSigmaError >= 0.015 ||
  metrics?.maximumCovarianceSymmetryRelative >= 1e-12 ||
  Math.max(...Object.values(artifact.oracleComparison ?? {})) >= 1e-10 ||
  view.observedCounts !== "unavailable-synthetic-ensemble-is-not-observed-detector-data" ||
  view.publishableMeasurement !== false ||
  evidence.runtimeIntegration?.rayMatricesInReactState !== false ||
  evidence.runtimeIntegration?.trialVectorsInReactState !== false ||
  pointer.capabilities?.v416EffectiveMuellerResponse !== "qualified-four-rays-spectrum-weighted-four-by-four" ||
  pointer.capabilities?.v416StreamingEnsemble !== "qualified-four-thousand-ninety-six-trials-per-ray" ||
  pointer.capabilities?.v416ObservedCounts !== "unavailable" ||
  pointer.capabilities?.v416BrowserQualification !== "not-run" ||
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
  throw new Error("v416 fail-closed validation failed");
}
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (
  transientPattern.test(JSON.stringify(artifact)) ||
  transientPattern.test(JSON.stringify(evidence)) ||
  transientPattern.test(JSON.stringify(pointer))
) {
  throw new Error("v416 transient evidence leak");
}
for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) throw new Error(`v416 source manifest mismatch: ${entry.path}`);
}
console.log(
  JSON.stringify(
    {
      status: "passed-v416-low-memory",
      artifactSha256: artifact.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      totalTrialCount: view.totalTrialCount,
      retainedTrialCount: view.retainedTrialCount,
      metrics,
      oracleMaximumDifference: Math.max(...Object.values(artifact.oracleComparison)),
      measuredAuthority: pointer.capabilities.v416MeasuredDetectorAuthority,
      observedCounts: pointer.capabilities.v416ObservedCounts,
      browser: pointer.capabilities.v416BrowserQualification,
      dense: pointer.capabilities.v314CorrectedDense,
    },
    null,
    2,
  ),
);
