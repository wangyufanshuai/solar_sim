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
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !transient.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const tests = [
  "app/lib/kerrPredictedPolarimeterV424.test.ts",
  "app/lib/kerrPredictedPolarimeterServerV424.test.ts",
  "app/lib/kerrPredictedPolarimeterClientV424.test.ts",
  "app/api/atlas/relativity-evidence/v424/predicted-polarimeter/route.test.ts",
  "app/components/KerrPredictedPolarimeterV424.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV424.test.ts",
];
const lint = [
  "app/lib/kerrPredictedPolarimeterV424.ts",
  "app/lib/kerrPredictedPolarimeterV424.test.ts",
  "app/lib/kerrPredictedPolarimeterServerV424.ts",
  "app/lib/kerrPredictedPolarimeterServerV424.test.ts",
  "app/lib/kerrPredictedPolarimeterClientV424.ts",
  "app/lib/kerrPredictedPolarimeterClientV424.test.ts",
  "app/lib/atlasShadowCapabilityPointerV424.ts",
  "app/lib/atlasShadowCapabilityPointerV424.test.ts",
  "app/api/atlas/relativity-evidence/v424/predicted-polarimeter/route.ts",
  "app/api/atlas/relativity-evidence/v424/predicted-polarimeter/route.test.ts",
  "app/components/KerrPredictedPolarimeterV424.tsx",
  "app/components/KerrPredictedPolarimeterV424.test.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "scripts/build-kerr-predicted-polarimeter-v424.ts",
  "scripts/build-kerr-predicted-polarimeter-chain-v424.mjs",
  "scripts/build-shadow-candidate-v424.mjs",
  "scripts/reseal-shadow-evidence-chain-v424.mjs",
  "scripts/verify-shadow-v424-light.mjs",
  "scripts/atlas.mjs",
];
const reproducible = [
  "dist/science/kerr-predicted-polarimeter-v424/python-modulation-oracle.json",
  "dist/science/kerr-predicted-polarimeter-v424/predicted-ideal-dual-beam.json",
  "dist/science/kerr-predicted-polarimeter-v424/predicted-ideal-dual-beam.csv",
  "dist/science/kerr-predicted-polarimeter-v424/predicted-ideal-dual-beam-table.fits",
  "dist/science/kerr-predicted-polarimeter-v424/predicted-modulation-diagnostic.png",
  "dist/science/kerr-predicted-polarimeter-v424/export-manifest.json",
  "dist/science/orbit-atlas-shadow-v424-evidence.json",
  "dist/release/orbit-atlas-current-local-shadow-candidate-v424.json",
];

run("v424 first reseal", node, ["scripts/reseal-shadow-evidence-chain-v424.mjs"]);
const firstSeal = Object.fromEntries(reproducible.map((path) => [path, fileSha(path)]));
run("v424 Python predicted polarimeter verification", "python", ["scripts/test-kerr-predicted-polarimeter-v424.py"]);
run("v424 tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", ...tests]);
run("v424 types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v424 eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), ...lint, "--max-warnings=0"]);
run("v424 final reseal", node, ["scripts/reseal-shadow-evidence-chain-v424.mjs"]);
const secondSeal = Object.fromEntries(reproducible.map((path) => [path, fileSha(path)]));
if (JSON.stringify(firstSeal) !== JSON.stringify(secondSeal)) throw new Error("v424 reseal reproducibility failed");

const artifactPath = "dist/science/kerr-predicted-polarimeter-v424/predicted-ideal-dual-beam.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v424-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v424.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const state = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const view = artifact.view;
if (
  canonicalSha(artifact) !== artifact.artifactSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  fileSha("dist/science/kerr-predicted-stokes-admission-v423/predicted-stokes-catalog.json") !== "121d7ec75ae3ad5fad7f2abd0e07a32ad5181cd2e8c1decf55599364ecf25e73" ||
  fileSha("dist/science/kerr-ideal-polarimeter-v410/ideal-dual-beam.json") !== "fce8084abd73c90a8c087d1b7605b4d4483dc65ddefeb95198291e65b3941776" ||
  fileSha("dist/science/orbit-atlas-shadow-v423-evidence.json") !== "16f63288fcf112f3863c5db75947becb4bc0659c14f23233cfe8bc4040a28ef5" ||
  fileSha("dist/release/orbit-atlas-current-local-shadow-candidate-v423.json") !== "0fd6b18dd4370b49863b8d8c46dcbd6717cbe3e426b5ad70e9fe3075335d3790" ||
  evidence.dependency?.v424ArtifactSha256 !== artifact.artifactSha256 ||
  pointer.evidence?.fileSha256 !== fileSha(evidencePath) ||
  pointer.evidence?.canonicalSha256 !== evidence.evidenceSha256 ||
  view?.modulationRows?.length !== 96 ||
  view.reconstructions?.length !== 24 ||
  view.counts.predictedBeamSpectralRadianceCount !== 192 ||
  view.counts.measuredRowCount !== 0 ||
  view.counts.photonCount !== 0 ||
  view.counts.electronCount !== 0 ||
  view.maxima.beamSumRelative >= 1e-12 ||
  view.maxima.nonnegativeBeamViolation !== 0 ||
  view.maxima.normalizedFluxLawAbsolute >= 1e-12 ||
  view.maxima.qNormalizedAbsolute >= 1e-12 ||
  view.maxima.uNormalizedAbsolute >= 1e-12 ||
  view.maxima.linearFractionAbsolute >= 1e-12 ||
  view.maxima.evpaDeg >= 1e-10 ||
  view.maxima.pythonOracleDifference >= 1e-12 ||
  pointer.capabilities?.v424IdealHwpWollastonModulation !== "qualified-96-rows" ||
  pointer.capabilities.v424PredictedBeamSpectralRadiances !== "qualified-192-values" ||
  pointer.capabilities.v424FourAngleReconstruction !== "qualified-24-reconstructions" ||
  pointer.capabilities.v424MeasurementAuthority !== "unavailable" ||
  pointer.capabilities.v424MeasuredMuellerCalibration !== "unavailable" ||
  pointer.capabilities.v424PhotonElectronCounts !== "unavailable" ||
  pointer.capabilities.v424DetectorAuthority !== "unavailable" ||
  pointer.capabilities.v424PixelRasterAuthority !== "unavailable" ||
  pointer.capabilities.v424BrowserQualification !== "not-run" ||
  pointer.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
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
) throw new Error("v424 fail-closed validation failed");
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (transientPattern.test(JSON.stringify(artifact)) || transientPattern.test(JSON.stringify(evidence)) || transientPattern.test(JSON.stringify(pointer))) {
  throw new Error("v424 transient evidence leak");
}
for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) throw new Error(`v424 source manifest mismatch: ${entry.path}`);
}
console.log(JSON.stringify({
  status: "passed-v424-low-memory",
  artifactSha256: artifact.artifactSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  counts: view.counts,
  maxima: view.maxima,
  measurement: pointer.capabilities.v424MeasurementAuthority,
  browser: pointer.capabilities.v424BrowserQualification,
  dense: pointer.capabilities.v314CorrectedDense,
}, null, 2));
