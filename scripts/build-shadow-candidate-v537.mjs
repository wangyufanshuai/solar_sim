import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v536-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v536.json",
  artifact: "dist/science/kerr-response-aware-sparse-fits-v537/atlas.json",
  fits: "dist/science/kerr-response-aware-sparse-fits-v537/response-aware-sparse-table.fits",
  runtime: "dist/science/kerr-response-aware-sparse-fits-v537/runtime-audit.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v537-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v537.json",
};
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => compare(left, right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`); renameSync(part, target); };

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const runtime = read(paths.runtime);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (previousEvidence.version !== "orbit-atlas-shadow-v536-evidence-v1" || sha(previousEvidence) !== previousEvidence.evidenceSha256
  || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v536" || sha(previousPointer) !== previousPointer.pointerSha256
  || sha(artifact) !== artifact.artifactSha256 || sha(runtime) !== runtime.artifactSha256
  || artifact.fits.fileSha256 !== fileSha(paths.fits) || artifact.fits.imageHduCount !== 0 || artifact.fits.binaryTableHduCount !== 1
  || artifact.fits.rowCount !== 4 || artifact.fits.columnCount !== 17 || artifact.fits.checksumValidationPassed !== true || artifact.fits.abByteIdentical !== true
  || runtime.runtime.finalResourceStatus !== "baseline" || runtime.detailCatalog.detailCount !== 39
  || dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false || dense.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v537-evidence-boundary");

const sourcePaths = [
  paths.previousEvidence, paths.previousPointer, paths.artifact, paths.fits, paths.runtime, paths.dense, paths.formal,
  "scripts/export-kerr-response-aware-sparse-fits-v537.py",
  "scripts/test-kerr-response-aware-sparse-fits-v537.py",
  "app/lib/kerrResponseAwareSparseFitsV537.ts", "app/lib/kerrResponseAwareSparseFitsV537.test.ts",
  "app/lib/kerrResponseAwareSparseFitsServerV537.ts", "app/lib/kerrResponseAwareSparseFitsServerV537.test.ts",
  "app/lib/kerrResponseAwareSparseFitsClientV537.ts",
  "app/api/atlas/relativity-evidence/v537/response-aware-sparse-fits/route.ts",
  "app/api/atlas/relativity-evidence/v537/response-aware-sparse-fits/route.test.ts",
  "app/components/KerrResponseAwareSparseFitsV537.tsx", "app/components/KerrResponseAwareSparseFitsV537.test.tsx",
  "app/components/kerrPhotonMetrologyDetailCatalogV537.ts", "app/components/kerrPhotonMetrologyDetailCatalogV537.test.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV537.ts", "app/components/KerrPhotonMetrologyObservatoryIntentV537.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx", "app/lib/atlasResourceLifecycle.ts",
  "scripts/build-kerr-response-aware-sparse-fits-runtime-v537.ts", "scripts/build-shadow-candidate-v537.mjs",
  "scripts/build-shadow-v537.mjs", "scripts/verify-shadow-v537-light.mjs", "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) })).sort((left, right) => compare(left.path, right.path));
const status = "v537-sparse-fits-binary-table-qualified-image-hdu-unavailable-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v537-evidence-v1",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  dependency: { v536EvidenceSha256: previousEvidence.evidenceSha256, v536PointerSha256: previousPointer.pointerSha256, v537ArtifactSha256: artifact.artifactSha256, v537RuntimeSha256: runtime.artifactSha256, v314StateSha256: dense.stateSha256 },
  fits: artifact.fits,
  counts: artifact.counts,
  qualification: artifact.qualification,
  runtime: runtime.runtime,
  detailCatalog: runtime.detailCatalog,
  visualProfile: runtime.visualProfile,
  boundary: artifact.boundary,
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  qualificationStatement: "v537-qualifies-a-deterministic-four-row-seventeen-column-fits-binary-table-with-row-sha-replay-and-hdu-checksums",
  boundaryStatement: "The FITS product is a binary table, not an image HDU. It contains four sparse continuous-coordinate samples and zero raster pixels; no interpolation, detector measurement, physical uncertainty interval, dense authority, or product promotion is claimed.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v537",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v536AtomicResponseAwareSparseSamples: "qualified-preserved-4",
    v537FitsBinaryTable: "qualified-1-table-4-rows-17-columns",
    v537FitsChecksums: "qualified-checksum-and-datasum-4-of-4",
    v537DeterministicReplay: "qualified-a-b-byte-identical",
    v537RowShaReplay: "qualified-4-of-4",
    v537ImageHdus: "unavailable-0",
    v537RasterPixels: "unavailable-0",
    v537PngImages: "unavailable-0",
    v537PhysicalUncertainty: "unavailable-measured-calibration-0-of-6",
    v537SharedDetailCatalog: "qualified-39-of-39-one-new-lazy-import",
    v537RuntimeRequestPolicy: "qualified-auto-0-explicit-1-single-flight-2-consumers",
    v537Lifecycle: "qualified-baseline",
    v537BrowserQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: { promotionAllowed: false, scienceRasterPayloadAllowed: false, productionImageAllowed: false, localShadowDefaultApplied: false },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status, artifactSha256: artifact.artifactSha256, fitsFileSha256: artifact.fits.fileSha256, runtimeArtifactSha256: runtime.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, fitsBinaryTables: 1, fitsImageHdus: 0, rows: 4, columns: 17, detailCatalog: "39/39", denseCampaign: "0/49", formalProductPointer: "v263" }, null, 2));
