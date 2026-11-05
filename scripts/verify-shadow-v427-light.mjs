import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
function run(label, command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
}
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const fileSha = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const tests = [
  "app/lib/kerrHighEnergyResponseAcquisitionPackV427.test.ts",
  "app/lib/kerrHighEnergyResponseAcquisitionPackServerV427.test.ts",
  "app/lib/kerrHighEnergyResponseAcquisitionPackClientV427.test.ts",
  "app/api/atlas/relativity-evidence/v427/high-energy-response-acquisition/route.test.ts",
  "app/components/KerrHighEnergyResponseAcquisitionV427.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV427.test.ts",
];
const lint = [
  "app/lib/kerrHighEnergyResponseAcquisitionPackV427.ts",
  "app/lib/kerrHighEnergyResponseAcquisitionPackV427.test.ts",
  "app/lib/kerrHighEnergyResponseAcquisitionPackServerV427.ts",
  "app/lib/kerrHighEnergyResponseAcquisitionPackServerV427.test.ts",
  "app/lib/kerrHighEnergyResponseAcquisitionPackClientV427.ts",
  "app/lib/kerrHighEnergyResponseAcquisitionPackClientV427.test.ts",
  "app/lib/atlasShadowCapabilityPointerV427.ts",
  "app/lib/atlasShadowCapabilityPointerV427.test.ts",
  "app/api/atlas/relativity-evidence/v427/high-energy-response-acquisition/route.ts",
  "app/api/atlas/relativity-evidence/v427/high-energy-response-acquisition/route.test.ts",
  "app/components/KerrHighEnergyResponseAcquisitionV427.tsx",
  "app/components/KerrHighEnergyResponseAcquisitionV427.test.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "scripts/build-kerr-high-energy-response-acquisition-pack-v427.ts",
  "scripts/build-kerr-high-energy-response-acquisition-chain-v427.mjs",
  "scripts/build-shadow-candidate-v427.mjs",
  "scripts/reseal-shadow-evidence-chain-v427.mjs",
  "scripts/verify-shadow-v427-light.mjs",
  "scripts/atlas.mjs",
];
const reproducible = [
  "dist/science/kerr-high-energy-response-acquisition-pack-v427/validator-fixture.json",
  "dist/science/kerr-high-energy-response-acquisition-pack-v427/validator-oracle.json",
  "dist/science/kerr-high-energy-response-acquisition-pack-v427/manifest.template.json",
  "dist/science/kerr-high-energy-response-acquisition-pack-v427/effective-area.template.csv",
  "dist/science/kerr-high-energy-response-acquisition-pack-v427/modulation.template.csv",
  "dist/science/kerr-high-energy-response-acquisition-pack-v427/redistribution.template.csv",
  "dist/science/kerr-high-energy-response-acquisition-pack-v427/background.template.csv",
  "dist/science/kerr-high-energy-response-acquisition-pack-v427/response-covariance.template.csv",
  "dist/science/kerr-high-energy-response-acquisition-pack-v427/redistribution-covariance.template.csv",
  "dist/science/kerr-high-energy-response-acquisition-pack-v427/acquisition-plan.csv",
  "dist/science/kerr-high-energy-response-acquisition-pack-v427/README.md",
  "dist/science/kerr-high-energy-response-acquisition-pack-v427/acquisition-pack.json",
  "dist/science/kerr-high-energy-response-acquisition-pack-v427/response-acquisition-pack.zip",
  "dist/science/kerr-high-energy-response-acquisition-pack-v427/acquisition-plan.fits",
  "dist/science/kerr-high-energy-response-acquisition-pack-v427/response-acquisition-pack-architecture.png",
  "dist/science/kerr-high-energy-response-acquisition-pack-v427/export-manifest.json",
  "dist/science/orbit-atlas-shadow-v427-evidence.json",
  "dist/release/orbit-atlas-current-local-shadow-candidate-v427.json",
];

run("v427 first reseal", node, ["scripts/reseal-shadow-evidence-chain-v427.mjs"]);
const firstSeal = Object.fromEntries(reproducible.map((path) => [path, fileSha(path)]));
run("v427 Python acquisition pack verification", "python", ["scripts/test-kerr-high-energy-response-acquisition-v427.py"]);
run("v427 tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", ...tests]);
run("v427 types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v427 eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), ...lint, "--max-warnings=0"]);
run("v427 final reseal", node, ["scripts/reseal-shadow-evidence-chain-v427.mjs"]);
const secondSeal = Object.fromEntries(reproducible.map((path) => [path, fileSha(path)]));
if (JSON.stringify(firstSeal) !== JSON.stringify(secondSeal)) throw new Error("v427 reseal reproducibility failed");

const artifactPath = "dist/science/kerr-high-energy-response-acquisition-pack-v427/acquisition-pack.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v427-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v427.json";
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
  fileSha("dist/science/kerr-high-energy-response-v426/response-contract.json") !== "03158769935c494638445adde9689ef94fc3199eefe6db4afd0ec6a824222061" ||
  fileSha("dist/science/orbit-atlas-shadow-v426-evidence.json") !== "51776e08d6394082edbbf7593d13eb8fdd010893a1ed19ccbb8a57b60184b9a2" ||
  fileSha("dist/release/orbit-atlas-current-local-shadow-candidate-v426.json") !== "ebef90d600ea0ffe4546e344112db2a4c46edfc48b468fffb9ba9f886023e369" ||
  evidence.dependency?.v427ArtifactSha256 !== artifact.artifactSha256 ||
  pointer.evidence?.fileSha256 !== fileSha(evidencePath) ||
  pointer.evidence?.canonicalSha256 !== evidence.evidenceSha256 ||
  view?.counts?.packFileCount !== 9 ||
  view.counts.measurementTemplateCount !== 7 ||
  view.counts.measurementTemplateDataRowCount !== 0 ||
  view.counts.measuredDataRowCount !== 0 ||
  view.counts.scienceResponseApplicationCount !== 0 ||
  view.validator?.invalidFixtureMutationCount !== 12 ||
  view.validator.invalidFixtureRejectionCount !== 12 ||
  view.authorityBoundary?.measuredResponseAuthorityGranted !== false ||
  pointer.capabilities?.v427AcquisitionPack !== "qualified-nine-files" ||
  pointer.capabilities.v427MeasurementTemplates !== "qualified-seven-empty-zero-rows" ||
  pointer.capabilities.v427InvalidFixtureMutations !== "rejected-12-of-12" ||
  pointer.capabilities.v427MeasuredResponseAuthority !== "unavailable" ||
  pointer.capabilities.v427ScienceResponseApplications !== "zero" ||
  pointer.capabilities.v427BrowserQualification !== "not-run" ||
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
) throw new Error("v427 fail-closed validation failed");
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (transientPattern.test(JSON.stringify(artifact)) || transientPattern.test(JSON.stringify(evidence)) || transientPattern.test(JSON.stringify(pointer))) throw new Error("v427 transient evidence leak");
for (const entry of evidence.sourceManifest ?? []) if (fileSha(entry.path) !== entry.sha256) throw new Error(`v427 source manifest mismatch: ${entry.path}`);
console.log(JSON.stringify({ status: "passed-v427-low-memory", artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, counts: view.counts, validator: view.validator, measured: pointer.capabilities.v427MeasuredResponseAuthority, scienceApplications: pointer.capabilities.v427ScienceResponseApplications, browser: pointer.capabilities.v427BrowserQualification, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
