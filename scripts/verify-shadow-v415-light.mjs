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
  "app/lib/kerrPolarimeterDetectorLikelihoodV415.test.ts",
  "app/lib/kerrPolarimeterDetectorLikelihoodServerV415.test.ts",
  "app/lib/kerrPolarimeterDetectorLikelihoodClientV415.test.ts",
  "app/api/atlas/relativity-evidence/v415/polarimeter-detector-likelihood/route.test.ts",
  "app/components/KerrPolarimeterDetectorLikelihoodSurfaceV415.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV415.test.ts",
];
const lint = [
  "app/lib/kerrPolarimeterDetectorLikelihoodV415.ts",
  "app/lib/kerrPolarimeterDetectorLikelihoodV415.test.ts",
  "app/lib/kerrPolarimeterDetectorLikelihoodServerV415.ts",
  "app/lib/kerrPolarimeterDetectorLikelihoodServerV415.test.ts",
  "app/lib/kerrPolarimeterDetectorLikelihoodClientV415.ts",
  "app/lib/kerrPolarimeterDetectorLikelihoodClientV415.test.ts",
  "app/api/atlas/relativity-evidence/v415/polarimeter-detector-likelihood/route.ts",
  "app/api/atlas/relativity-evidence/v415/polarimeter-detector-likelihood/route.test.ts",
  "app/components/KerrPolarimeterDetectorLikelihoodSurfaceV415.tsx",
  "app/components/KerrPolarimeterDetectorLikelihoodSurfaceV415.test.tsx",
  "app/components/KerrPolarimeterDetectorSurfaceV414.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "app/lib/atlasShadowCapabilityPointerV415.ts",
  "app/lib/atlasShadowCapabilityPointerV415.test.ts",
  "scripts/build-kerr-polarimeter-detector-likelihood-v415.ts",
  "scripts/build-kerr-polarimeter-detector-likelihood-chain-v415.mjs",
  "scripts/build-shadow-candidate-v415.mjs",
  "scripts/reseal-shadow-evidence-chain-v415.mjs",
  "scripts/verify-shadow-v415-light.mjs",
  "scripts/atlas.mjs",
];

run("v415 chain reseal", node, ["scripts/reseal-shadow-evidence-chain-v415.mjs"]);
run("v415 tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", ...tests]);
run("v415 types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v415 eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), ...lint, "--max-warnings=0"]);
run("v415 final reseal", node, ["scripts/reseal-shadow-evidence-chain-v415.mjs"]);

const artifactPath = "dist/science/kerr-polarimeter-detector-likelihood-v415/noise-likelihood.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v415-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v415.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const state = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const view = artifact.view;
const maxima = view?.maxima;
if (
  canonicalSha(artifact) !== artifact.artifactSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  fileSha("dist/science/orbit-atlas-shadow-v414-evidence.json") !==
    "b789944ef9e3fd4cffd3c29c17f693e89a6161e9a59b0d0f5944b2406cc66761" ||
  fileSha("dist/release/orbit-atlas-current-local-shadow-candidate-v414.json") !==
    "842b6295279a0be9b5a264eec6515fa7cffbab25b1bf57b0c3b6a507c33ee3aa" ||
  evidence.dependency?.v414EvidenceSha256 !==
    "66a807e1cf3140e76fa948ffc3972ffd591cbc50f6096d6c20c5c24a3566b4f7" ||
  evidence.dependency?.v414PointerSha256 !==
    "5df74a8dedb272fa5777535fd712c55e39e76122f44c92eee65fcd2843de2e6d" ||
  evidence.dependency?.likelihoodArtifactSha256 !== artifact.artifactSha256 ||
  pointer.evidence?.fileSha256 !== fileSha(evidencePath) ||
  pointer.evidence?.canonicalSha256 !== evidence.evidenceSha256 ||
  view?.counts.likelihoodRowCount !== 16 ||
  view.rays?.flatMap((ray) => ray.rows).length !== 16 ||
  maxima?.sourceHighCountApproximationIndicator >= 2e-9 ||
  maxima?.countingComponentClosureRelative > 1e-15 ||
  maxima?.absoluteAdditionLossRelativeToResidual >= 1e-6 ||
  maxima?.calibrationCholeskyReconstructionRelative >= 1e-12 ||
  Math.max(...Object.values(artifact.oracleComparison ?? {})) >= 1e-10 ||
  view.observedCounts !== "unavailable-synthetic-fixture-is-not-observed-detector-data" ||
  view.exactSourcePoissonIntegerAvailable !== false ||
  view.measuredDetectorAuthority !== "unavailable-v368-authority-artifacts-missing" ||
  evidence.runtimeIntegration?.likelihoodRowsInReactState !== false ||
  pointer.capabilities?.v415DeterministicReplay !== "qualified-sha-derived-fifty-three-bit-streams" ||
  pointer.capabilities?.v415SourceCountingModel !==
    "qualified-explicit-high-count-normal-approximation-not-exact-integer-poisson" ||
  pointer.capabilities?.v415ObservedCounts !== "unavailable" ||
  pointer.capabilities?.v415ExactSourcePoissonInteger !== "unavailable-count-exceeds-safe-integer" ||
  pointer.capabilities?.v415BrowserQualification !== "not-run" ||
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
  throw new Error("v415 fail-closed validation failed");
}
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (
  transientPattern.test(JSON.stringify(artifact)) ||
  transientPattern.test(JSON.stringify(evidence)) ||
  transientPattern.test(JSON.stringify(pointer))
) {
  throw new Error("v415 transient evidence leak");
}
for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) throw new Error(`v415 source manifest mismatch: ${entry.path}`);
}
console.log(
  JSON.stringify(
    {
      status: "passed-v415-low-memory",
      artifactSha256: artifact.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rows: view.counts.likelihoodRowCount,
      maxima,
      oracleMaximumDifference: Math.max(...Object.values(artifact.oracleComparison)),
      measuredAuthority: pointer.capabilities.v415MeasuredDetectorAuthority,
      observedCounts: pointer.capabilities.v415ObservedCounts,
      exactSourcePoissonInteger: pointer.capabilities.v415ExactSourcePoissonInteger,
      browser: pointer.capabilities.v415BrowserQualification,
      dense: pointer.capabilities.v314CorrectedDense,
    },
    null,
    2,
  ),
);
