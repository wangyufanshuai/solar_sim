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
  "app/lib/kerrSparsePolarimetricProductV418.test.ts",
  "app/lib/kerrSparsePolarimetricProductServerV418.test.ts",
  "app/lib/kerrSparsePolarimetricProductClientV418.test.ts",
  "app/api/atlas/relativity-evidence/v418/sparse-polarimetry/route.test.ts",
  "app/components/KerrSparsePolarimetricStripV418.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV418.test.ts",
];
const lint = [
  "app/lib/kerrSparsePolarimetricProductV418.ts",
  "app/lib/kerrSparsePolarimetricProductV418.test.ts",
  "app/lib/kerrSparsePolarimetricProductServerV418.ts",
  "app/lib/kerrSparsePolarimetricProductServerV418.test.ts",
  "app/lib/kerrSparsePolarimetricProductClientV418.ts",
  "app/lib/kerrSparsePolarimetricProductClientV418.test.ts",
  "app/lib/atlasShadowCapabilityPointerV418.ts",
  "app/lib/atlasShadowCapabilityPointerV418.test.ts",
  "app/api/atlas/relativity-evidence/v418/sparse-polarimetry/route.ts",
  "app/api/atlas/relativity-evidence/v418/sparse-polarimetry/route.test.ts",
  "app/components/KerrSparsePolarimetricStripV418.tsx",
  "app/components/KerrSparsePolarimetricStripV418.test.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "scripts/build-kerr-sparse-polarimetric-product-v418.ts",
  "scripts/build-kerr-sparse-polarimetric-chain-v418.mjs",
  "scripts/build-shadow-candidate-v418.mjs",
  "scripts/reseal-shadow-evidence-chain-v418.mjs",
  "scripts/verify-shadow-v418-light.mjs",
  "scripts/atlas.mjs",
];
const reproduciblePaths = [
  "dist/science/kerr-sparse-polarimetric-product-v418/diagnostic-product.json",
  "dist/science/kerr-sparse-polarimetric-product-v418/diagnostic-product.csv",
  "dist/science/kerr-sparse-polarimetric-product-v418/diagnostic-product-table.fits",
  "dist/science/kerr-sparse-polarimetric-product-v418/diagnostic-strip.png",
  "dist/science/kerr-sparse-polarimetric-product-v418/export-manifest.json",
  "dist/science/orbit-atlas-shadow-v418-evidence.json",
  "dist/release/orbit-atlas-current-local-shadow-candidate-v418.json",
];

run("v418 chain reseal", node, ["scripts/reseal-shadow-evidence-chain-v418.mjs"]);
const firstSeal = Object.fromEntries(reproduciblePaths.map((path) => [path, fileSha(path)]));
run("v418 tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", ...tests]);
run("v418 types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v418 eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), ...lint, "--max-warnings=0"]);
run("v418 final reseal", node, ["scripts/reseal-shadow-evidence-chain-v418.mjs"]);
const secondSeal = Object.fromEntries(reproduciblePaths.map((path) => [path, fileSha(path)]));
if (JSON.stringify(firstSeal) !== JSON.stringify(secondSeal)) throw new Error("v418 reseal reproducibility failed");

const artifactPath = "dist/science/kerr-sparse-polarimetric-product-v418/diagnostic-product.json";
const manifestPath = "dist/science/kerr-sparse-polarimetric-product-v418/export-manifest.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v418-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v418.json";
const artifact = read(artifactPath);
const manifest = read(manifestPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const state = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
if (
  canonicalSha(artifact) !== artifact.artifactSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  fileSha("dist/science/orbit-atlas-shadow-v417-evidence.json") !== "857bee996efc4dfe9d9e7616ec9c143f23ec0ed9ca618e986b05b5fc83f3efce" ||
  fileSha("dist/release/orbit-atlas-current-local-shadow-candidate-v417.json") !== "8464bcc3f168f1d89f9c177ec6407e1164029c33f67759ab1730cfab9193e556" ||
  evidence.dependency?.v417EvidenceSha256 !== "cdba432979dd64789bba454d6b86ab49145672ddef2c7b2c02a670d1753066e7" ||
  evidence.dependency?.v417PointerSha256 !== "0a8f38de0a1dff577af61e6b23859fac997f6a6ca20bed96164a65f740102652" ||
  evidence.dependency?.v418ArtifactSha256 !== artifact.artifactSha256 ||
  pointer.evidence?.fileSha256 !== fileSha(evidencePath) ||
  pointer.evidence?.canonicalSha256 !== evidence.evidenceSha256 ||
  artifact.view?.counts?.diagnosticRowCount !== 4 ||
  artifact.view.counts.instrumentFixtureEllipseCount !== 8 ||
  artifact.view.counts.imagePlaneCoordinateCount !== 0 ||
  artifact.view.rows?.some((row) => row.imagePlane?.alpha !== null || row.imagePlane?.beta !== null || row.instrumentFixture?.authorityEvpaReplacementAllowed !== false) ||
  artifact.view.products?.fitsImage !== "unavailable-dense-and-screen-coordinate-boundary" ||
  artifact.view.products?.scienceImageMap !== "unavailable-dense-and-screen-coordinate-boundary" ||
  artifact.view.measuredPolarization !== "unavailable" ||
  artifact.scienceImageGenerated !== false ||
  manifest.exports?.fits?.sha256 !== fileSha(`dist/science/kerr-sparse-polarimetric-product-v418/${manifest.exports.fits.path}`) ||
  manifest.exports?.png?.sha256 !== fileSha(`dist/science/kerr-sparse-polarimetric-product-v418/${manifest.exports.png.path}`) ||
  manifest.exports.fits.semantic !== "binary-table-not-image-HDU" ||
  manifest.exports.png.semantic !== "diagnostic-strip-only-not-science-image" ||
  pointer.capabilities?.v418SparseDiagnosticProduct !== "qualified-four-ray-authority-table" ||
  pointer.capabilities?.v418FitsBinaryTable !== "available-not-image-HDU" ||
  pointer.capabilities?.v418FitsImage !== "unavailable-dense-and-screen-coordinate-boundary" ||
  pointer.capabilities?.v418MeasuredPolarization !== "unavailable" ||
  pointer.capabilities?.v418BrowserQualification !== "not-run" ||
  pointer.capabilities?.v314CorrectedDense !== "incomplete-0-of-49" ||
  state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v418 fail-closed validation failed");
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (transientPattern.test(JSON.stringify(artifact)) || transientPattern.test(JSON.stringify(evidence)) || transientPattern.test(JSON.stringify(pointer))) throw new Error("v418 transient evidence leak");
for (const entry of evidence.sourceManifest ?? []) if (fileSha(entry.path) !== entry.sha256) throw new Error(`v418 source manifest mismatch: ${entry.path}`);
console.log(JSON.stringify({ status: "passed-v418-low-memory", artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, rows: artifact.view.counts.diagnosticRowCount, ellipses: artifact.view.counts.instrumentFixtureEllipseCount, fits: pointer.capabilities.v418FitsBinaryTable, png: pointer.capabilities.v418PngDiagnostic, scienceImageMap: pointer.capabilities.v418ScienceImageMap, measured: pointer.capabilities.v418MeasuredPolarization, browser: pointer.capabilities.v418BrowserQualification, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
