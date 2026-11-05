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
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const tests = [
  "app/lib/kerrAxialPolarizationVectorCatalogV421.test.ts",
  "app/lib/kerrAxialPolarizationVectorServerV421.test.ts",
  "app/lib/kerrAxialPolarizationVectorClientV421.test.ts",
  "app/api/atlas/relativity-evidence/v421/axial-vectors/route.test.ts",
  "app/components/KerrAxialPolarizationVectorsV421.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV421.test.ts",
];
const lint = [
  "app/lib/kerrAxialPolarizationVectorCatalogV421.ts",
  "app/lib/kerrAxialPolarizationVectorCatalogV421.test.ts",
  "app/lib/kerrAxialPolarizationVectorServerV421.ts",
  "app/lib/kerrAxialPolarizationVectorServerV421.test.ts",
  "app/lib/kerrAxialPolarizationVectorClientV421.ts",
  "app/lib/kerrAxialPolarizationVectorClientV421.test.ts",
  "app/lib/atlasShadowCapabilityPointerV421.ts",
  "app/lib/atlasShadowCapabilityPointerV421.test.ts",
  "app/api/atlas/relativity-evidence/v421/axial-vectors/route.ts",
  "app/api/atlas/relativity-evidence/v421/axial-vectors/route.test.ts",
  "app/components/KerrAxialPolarizationVectorsV421.tsx",
  "app/components/KerrAxialPolarizationVectorsV421.test.tsx",
  "app/components/KerrScreenCoordinatePlaneV419.tsx",
  "app/components/KerrObserverWcsGridV420.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "scripts/build-kerr-axial-polarization-v421.ts",
  "scripts/build-kerr-axial-polarization-chain-v421.mjs",
  "scripts/build-shadow-candidate-v421.mjs",
  "scripts/reseal-shadow-evidence-chain-v421.mjs",
  "scripts/verify-shadow-v421-light.mjs",
  "scripts/atlas.mjs",
];
const reproducible = [
  "dist/science/kerr-axial-polarization-vectors-v421/python-axial-vector-oracle.json",
  "dist/science/kerr-axial-polarization-vectors-v421/axial-vector-catalog.json",
  "dist/science/kerr-axial-polarization-vectors-v421/axial-vector-catalog.csv",
  "dist/science/kerr-axial-polarization-vectors-v421/axial-vector-endpoints-WCS.fits",
  "dist/science/kerr-axial-polarization-vectors-v421/corrected-sparse-axial-quiver.png",
  "dist/science/kerr-axial-polarization-vectors-v421/export-manifest.json",
  "dist/science/orbit-atlas-shadow-v421-evidence.json",
  "dist/release/orbit-atlas-current-local-shadow-candidate-v421.json",
];
run("v421 first reseal", node, ["scripts/reseal-shadow-evidence-chain-v421.mjs"]);
const firstSeal = Object.fromEntries(reproducible.map((path) => [path, fileSha(path)]));
run("v421 Python axial-vector verification", "python", ["scripts/test-kerr-axial-polarization-v421.py"]);
run("v421 tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", ...tests]);
run("v421 types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v421 eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), ...lint, "--max-warnings=0"]);
run("v421 final reseal", node, ["scripts/reseal-shadow-evidence-chain-v421.mjs"]);
const secondSeal = Object.fromEntries(reproducible.map((path) => [path, fileSha(path)]));
if (JSON.stringify(firstSeal) !== JSON.stringify(secondSeal)) throw new Error("v421 reseal reproducibility failed");

const artifactPath = "dist/science/kerr-axial-polarization-vectors-v421/axial-vector-catalog.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v421-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v421.json";
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
  || fileSha("dist/science/kerr-screen-coordinate-provenance-v419/screen-coordinate-provenance.json") !== "adaebc0d0500c1b856dd8875a6f9edccf9ebd3ca07867d2cd3fdba76007d28aa"
  || fileSha("dist/science/kerr-screen-coordinate-provenance-v419/sparse-screen-quiver.png") !== "e2a13c42d82b29396c59b763142e6b19aca3ed498171ac18128b6789836f9486"
  || fileSha("dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS.json") !== "e6c8ca822d81575d640b90ad87eeb49658d5c88afc44f473b0620fcefadac337"
  || fileSha("dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS-grid.png") !== "6392b55ef2d701bea7ac8bf0581acb5bc70101d1a95020ba7003f62d2f2cb4a0"
  || evidence.dependency?.v421ArtifactSha256 !== artifact.artifactSha256
  || pointer.evidence?.fileSha256 !== fileSha(evidencePath)
  || pointer.evidence?.canonicalSha256 !== evidence.evidenceSha256
  || view?.rows?.length !== 4
  || view.rows.some((row) => row.intensity !== null || row.stokesAmplitude !== null || row.interpolationAllowed !== false)
  || view.convention?.zeroDirection !== "plus-beta"
  || view.convention.positiveDirection !== "toward-plus-alpha"
  || view.priorDisplayAudit?.historicalFilesOverwritten !== false
  || view.maxima?.directionNormResidual >= 1e-12
  || view.maxima.axialTensorNormResidual >= 1e-12
  || view.maxima.recoveredAxialEvpaResidualDeg >= 1e-12
  || view.maxima.plus180EndpointSetResidualM >= 1e-12
  || view.maxima.pythonOracleEndpointDifference >= 1e-10
  || pointer.capabilities?.v419NumericalCoordinates !== "qualified-preserved"
  || pointer.capabilities.v419PngQuiverOrientation !== "withdrawn-display-only-90-degree-convention-mismatch"
  || pointer.capabilities.v420NumericalWcs !== "qualified-preserved"
  || pointer.capabilities.v420PngQuiverOrientation !== "withdrawn-display-only-90-degree-convention-mismatch"
  || pointer.capabilities.v421EvpaConvention !== "qualified-zero-plus-beta-positive-toward-plus-alpha"
  || pointer.capabilities.v421HistoricalFilesOverwritten !== false
  || pointer.capabilities.v421Intensity !== "unavailable"
  || pointer.capabilities.v421StokesAmplitude !== "unavailable"
  || pointer.capabilities.v421BrowserQualification !== "not-run"
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
) throw new Error("v421 fail-closed validation failed");
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (transientPattern.test(JSON.stringify(artifact)) || transientPattern.test(JSON.stringify(evidence)) || transientPattern.test(JSON.stringify(pointer))) throw new Error("v421 transient evidence leak");
for (const entry of evidence.sourceManifest ?? []) if (fileSha(entry.path) !== entry.sha256) throw new Error(`v421 source manifest mismatch: ${entry.path}`);
console.log(JSON.stringify({ status: "passed-v421-low-memory", artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, maxima: view.maxima, priorDisplayAudit: view.priorDisplayAudit, historicalFilesOverwritten: false, browser: pointer.capabilities.v421BrowserQualification, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
