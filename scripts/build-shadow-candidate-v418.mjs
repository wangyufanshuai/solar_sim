import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v417-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v417.json",
  artifact: "dist/science/kerr-sparse-polarimetric-product-v418/diagnostic-product.json",
  exportManifest: "dist/science/kerr-sparse-polarimetric-product-v418/export-manifest.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v418-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v418.json",
};
const previous = {
  evidenceCanonical: "cdba432979dd64789bba454d6b86ab49145672ddef2c7b2c02a670d1753066e7",
  pointerCanonical: "0a8f38de0a1dff577af61e6b23859fac997f6a6ca20bed96164a65f740102652",
  evidenceFile: "857bee996efc4dfe9d9e7616ec9c143f23ec0ed9ca618e986b05b5fc83f3efce",
  pointerFile: "8464bcc3f168f1d89f9c177ec6407e1164029c33f67759ab1730cfab9193e556",
};
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const exports = read(paths.exportManifest);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const view = artifact.view;
if (
  previousEvidence.evidenceSha256 !== previous.evidenceCanonical ||
  previousPointer.pointerSha256 !== previous.pointerCanonical ||
  fileSha(paths.previousEvidence) !== previous.evidenceFile ||
  fileSha(paths.previousPointer) !== previous.pointerFile ||
  artifact.version !== "v418-kerr-sparse-polarimetric-diagnostic-artifact-v1" ||
  artifact.status !== "qualified-four-ray-authority-diagnostic-product-not-a-polarimetric-image" ||
  sha(artifact) !== artifact.artifactSha256 ||
  view?.source?.v297PolarizationEvidenceSha256 !== "a3ac11de0ad8dc48c742507f8aee169c53a3c983cb7a38fbf41eb580b4d58854" ||
  view.source.v328PhotonRadianceArtifactSha256 !== "16a8d7ff382203a24ee4565101b8fb5580e046af99f47612269f66655bb8a91e" ||
  view.source.v417NonlinearObservablesArtifactSha256 !== "723b8b71c97b3cb2cfc0706e8d242083d7449cbe33bce087ef097975198e1e61" ||
  view.counts?.diagnosticRowCount !== 4 ||
  view.counts.authorityEvpaCount !== 4 ||
  view.counts.instrumentFixtureEllipseCount !== 8 ||
  view.counts.imagePlaneCoordinateCount !== 0 ||
  view.rows?.length !== 4 ||
  view.rows.some((row, index) => row.rayIndex !== 12 + index || row.imagePlane?.alpha !== null || row.imagePlane?.beta !== null || row.instrumentFixture?.authorityEvpaReplacementAllowed !== false) ||
  view.products?.fitsBinaryTable !== "available-science-diagnostic-table-not-image-HDU" ||
  view.products?.png !== "available-diagnostic-strip-only-not-science-image" ||
  view.products?.fitsImage !== "unavailable-dense-and-screen-coordinate-boundary" ||
  view.products?.scienceImageMap !== "unavailable-dense-and-screen-coordinate-boundary" ||
  view.renderingBoundary?.scienceBufferMutationAllowed !== false ||
  view.renderingBoundary?.cinematicAuthorityMutationAllowed !== false ||
  view.measuredPolarization !== "unavailable" ||
  artifact.scienceImageGenerated !== false ||
  artifact.networkAttempted !== false ||
  artifact.denseShardExecuted !== false ||
  exports.version !== "v418-kerr-sparse-polarimetric-export-manifest-v1" ||
  exports.artifactSha256 !== artifact.artifactSha256 ||
  exports.exports?.json?.sha256 !== fileSha(`dist/science/kerr-sparse-polarimetric-product-v418/${exports.exports.json.path}`) ||
  exports.exports?.csv?.sha256 !== fileSha(`dist/science/kerr-sparse-polarimetric-product-v418/${exports.exports.csv.path}`) ||
  exports.exports?.fits?.sha256 !== fileSha(`dist/science/kerr-sparse-polarimetric-product-v418/${exports.exports.fits.path}`) ||
  exports.exports?.png?.sha256 !== fileSha(`dist/science/kerr-sparse-polarimetric-product-v418/${exports.exports.png.path}`) ||
  exports.exports.fits.semantic !== "binary-table-not-image-HDU" ||
  exports.exports.png.semantic !== "diagnostic-strip-only-not-science-image" ||
  exports.fitsImage !== "unavailable-dense-and-screen-coordinate-boundary" ||
  state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v418-boundary");

const sourcePaths = [
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
  "scripts/export-kerr-sparse-polarimetric-product-v418.py",
  "scripts/build-kerr-sparse-polarimetric-chain-v418.mjs",
  "scripts/build-shadow-candidate-v418.mjs",
  "scripts/reseal-shadow-evidence-chain-v418.mjs",
  "scripts/verify-shadow-v418-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v418-evidence-v1",
  generatedAt: artifact.generatedAt,
  status: "sparse-polarimetric-diagnostic-product-qualified-not-a-science-image-measured-authority-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v417EvidenceSha256: previous.evidenceCanonical,
    v417PointerSha256: previous.pointerCanonical,
    v417EvidenceFileSha256: previous.evidenceFile,
    v417PointerFileSha256: previous.pointerFile,
    v297PolarizationEvidenceSha256: view.source.v297PolarizationEvidenceSha256,
    v328PhotonRadianceArtifactSha256: view.source.v328PhotonRadianceArtifactSha256,
    v417NonlinearObservablesArtifactSha256: view.source.v417NonlinearObservablesArtifactSha256,
    v418ArtifactSha256: artifact.artifactSha256,
    v418ArtifactFileSha256: fileSha(paths.artifact),
    v418ExportManifestFileSha256: fileSha(paths.exportManifest),
  },
  sparsePolarimetry: {
    status: view.status,
    counts: view.counts,
    rayIdentity: view.rows.map((row) => ({ rayIndex: row.rayIndex, rayId: row.rayId, spinA: row.spinA, authorityEvpaDeg: row.authorityPolarization.walkerPenroseEvpaDeg, imagePlaneStatus: row.imagePlane.status })),
    products: view.products,
    exports: Object.fromEntries(Object.entries(exports.exports).map(([id, entry]) => [id, { fileSha256: entry.sha256, semantic: entry.semantic }])),
    renderingBoundary: view.renderingBoundary,
    measuredPolarization: view.measuredPolarization,
  },
  qualification: {
    sparseAuthorityTableQualified: true,
    standardizedConfidenceEllipseQualified: true,
    jsonCsvQualified: true,
    fitsBinaryTableQualified: true,
    diagnosticPngQualified: true,
    fitsImageQualified: false,
    scienceImageMapQualified: false,
    imagePlaneCoordinatesAvailable: false,
    measuredPolarizationAvailable: false,
    browserQualification: "not-run",
    visualMatrixQualification: "not-run",
    soakQualification: "not-run",
    rtxWebGpuQualification: "not-run",
  },
  runtimeIntegration: {
    v13EvidenceObservatory: true,
    summaryOnlyInReactState: true,
    covarianceMatricesInReactState: false,
    fullArtifactDownloadAvailable: true,
    csvDownloadAvailable: true,
    fitsBinaryTableDownloadAvailable: true,
    diagnosticPngDownloadAvailable: true,
    canvasCreated: false,
    scienceBufferMutation: false,
    cinematicAuthorityMutation: false,
  },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: 0, plannedShardCount: state.plannedShardCount, attemptConsumed: false, aggregateAvailable: false, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, ordinaryStandaloneProfile: "legacy-v9", liteProfile: "legacy-v9", localShadowDefaultProfile: "legacy-v9", localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  releaseBoundary: "v418-four-ray-diagnostic-table-only-no-image-plane-science-map-measured-polarization-browser-dense-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v418",
  generatedAt: artifact.generatedAt,
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v297PolarizationAuthority: "full-kerr-short-authority-qualified",
    v328PhotonRadiance: "qualified-four-ray-fixed-band-input",
    v417InstrumentPrecisionFixture: "qualified-nonlinear-coverage-fixture-only",
    v418SparseDiagnosticProduct: "qualified-four-ray-authority-table",
    v418JsonCsv: "available-science-diagnostic-table",
    v418FitsBinaryTable: "available-not-image-HDU",
    v418PngDiagnostic: "available-not-science-image",
    v418FitsImage: "unavailable-dense-and-screen-coordinate-boundary",
    v418ScienceImageMap: "unavailable-dense-and-screen-coordinate-boundary",
    v418ImagePlaneCoordinates: "unavailable",
    v418MeasuredPolarization: "unavailable",
    v418BrowserQualification: "not-run",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, rows: view.counts.diagnosticRowCount, fits: pointer.capabilities.v418FitsBinaryTable, png: pointer.capabilities.v418PngDiagnostic, fitsImage: pointer.capabilities.v418FitsImage, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
