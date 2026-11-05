import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = { previousEvidence: "dist/science/orbit-atlas-shadow-v418-evidence.json", previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v418.json", artifact: "dist/science/kerr-screen-coordinate-provenance-v419/screen-coordinate-provenance.json", oracle: "dist/science/kerr-screen-coordinate-provenance-v419/python-oracle.json", exportManifest: "dist/science/kerr-screen-coordinate-provenance-v419/export-manifest.json", state: "dist/science/kerr-campaign-v314/campaign-state.json", formal: "dist/release/orbit-atlas-current-product-evidence-v263.json", evidence: "dist/science/orbit-atlas-shadow-v419-evidence.json", pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v419.json" };
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };
const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const oracle = read(paths.oracle);
const exports = read(paths.exportManifest);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const view = artifact.view;
if (
  previousEvidence.evidenceSha256 !== "1d9b987d41cc5a81a27c05cda7459cb1ee5905c5081415266a64e2d48b2ecddb" ||
  previousPointer.pointerSha256 !== "e24e57371bc54ae07871c3302c7f08592a35ca8438a5e6bea22b64b153aa16a9" ||
  fileSha(paths.previousEvidence) !== "02ba9fd7c3499a446cf25a046182b0d4fdee71d6eefafdcddd69fbec4022fadc" ||
  fileSha(paths.previousPointer) !== "28100e0523cec8078aeb621b693ed4b5a2d560b44772a83a4883a680d0f16b94" ||
  artifact.version !== "v419-kerr-screen-coordinate-provenance-artifact-v1" || sha(artifact) !== artifact.artifactSha256 ||
  oracle.status !== "qualified-independent-screen-coordinate-replay" || oracle.artifactSha256 !== artifact.pythonOracleArtifactSha256 ||
  view?.status !== "qualified-four-ray-screen-coordinate-provenance-not-a-dense-image" || view.counts?.coordinateRowCount !== 4 || view.counts.qualifiedCoordinateCount !== 4 || view.counts.pixelCoordinateCount !== 0 || view.rows?.length !== 4 ||
  view.maxima?.coordinateReplayResidualM >= 1e-12 || view.maxima.nullResidual >= 1e-12 || view.maxima.tetradOrthonormalResidual >= 1e-12 || view.maxima.constantResidual >= 1e-12 || view.maxima.crossVersionAxialEvpaDifferenceDeg >= 1e-9 || view.maxima.pythonOracleDifference >= 1e-12 ||
  view.rows.some((row, index) => row.rayIndex !== 12 + index || row.pixelCoordinate?.x !== null || row.pixelCoordinate?.y !== null) ||
  view.products?.fitsImage !== "unavailable-sparse-four-ray-and-no-approved-pixel-WCS" || view.products?.densePolarimetricImage !== "unavailable-campaign-incomplete-0-of-49" || view.scienceCinematicBoundary?.coordinateMutationAllowed !== false || view.scienceCinematicBoundary.evpaMutationAllowed !== false ||
  exports.version !== "v419-kerr-screen-coordinate-export-manifest-v1" || exports.artifactSha256 !== artifact.artifactSha256 || exports.exports?.fits?.sha256 !== fileSha(`dist/science/kerr-screen-coordinate-provenance-v419/${exports.exports.fits.path}`) || exports.exports?.png?.sha256 !== fileSha(`dist/science/kerr-screen-coordinate-provenance-v419/${exports.exports.png.path}`) ||
  state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v419-boundary");
const sourcePaths = [
  "app/lib/kerrScreenCoordinateProvenanceV419.ts", "app/lib/kerrScreenCoordinateProvenanceV419.test.ts", "app/lib/kerrScreenCoordinateProvenanceServerV419.ts", "app/lib/kerrScreenCoordinateProvenanceServerV419.test.ts", "app/lib/kerrScreenCoordinateProvenanceClientV419.ts", "app/lib/kerrScreenCoordinateProvenanceClientV419.test.ts", "app/lib/atlasShadowCapabilityPointerV419.ts", "app/lib/atlasShadowCapabilityPointerV419.test.ts", "app/api/atlas/relativity-evidence/v419/screen-coordinates/route.ts", "app/api/atlas/relativity-evidence/v419/screen-coordinates/route.test.ts", "app/components/KerrScreenCoordinatePlaneV419.tsx", "app/components/KerrScreenCoordinatePlaneV419.test.tsx", "app/components/KerrEvidenceObservatoryV405.tsx", "scripts/run-kerr-screen-coordinate-oracle-v419.py", "scripts/test-kerr-screen-coordinate-v419.py", "scripts/build-kerr-screen-coordinate-provenance-v419.ts", "scripts/export-kerr-screen-coordinate-v419.py", "scripts/build-kerr-screen-coordinate-chain-v419.mjs", "scripts/build-shadow-candidate-v419.mjs", "scripts/reseal-shadow-evidence-chain-v419.mjs", "scripts/verify-shadow-v419-light.mjs", "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v419-evidence-v1", generatedAt: artifact.generatedAt,
  status: "screen-coordinate-provenance-qualified-sparse-quiver-not-dense-image-browser-pending-dense-incomplete-0-of-49",
  dependency: { v418EvidenceSha256: previousEvidence.evidenceSha256, v418PointerSha256: previousPointer.pointerSha256, v418EvidenceFileSha256: fileSha(paths.previousEvidence), v418PointerFileSha256: fileSha(paths.previousPointer), v312GeometryEvidenceSha256: view.source.v312GeometryEvidenceSha256, v313PolarizationEvidenceSha256: view.source.v313PolarizationEvidenceSha256, v314RayPlanSha256: view.source.v314RayPlanSha256, v419ArtifactSha256: artifact.artifactSha256, v419ArtifactFileSha256: fileSha(paths.artifact), pythonOracleArtifactSha256: oracle.artifactSha256, pythonOracleFileSha256: fileSha(paths.oracle), exportManifestFileSha256: fileSha(paths.exportManifest) },
  screenCoordinates: { status: view.status, observer: view.observer, convention: view.convention, counts: view.counts, rows: view.rows.map((row) => ({ rayIndex: row.rayIndex, rayId: row.rayId, spinA: row.spinA, alphaM: row.alphaM, betaM: row.betaM, authorityEvpaDeg: row.polarization.v313WalkerPenroseEvpaDeg, pixelCoordinateStatus: row.pixelCoordinate.status })), maxima: view.maxima, thresholds: view.thresholds, products: view.products, exports: Object.fromEntries(Object.entries(exports.exports).map(([id, entry]) => [id, { fileSha256: entry.sha256, semantic: entry.semantic }])) },
  qualification: { finiteZamoObserverQualified: true, screenCoordinatesQualified: true, localTetradBlKsReplayQualified: true, constantsLinkedToV312: true, evpaLinkedToV313: true, independentPythonOracleQualified: true, fitsBinaryTableQualified: true, sparseQuiverPngQualified: true, pixelWcsQualified: false, fitsImageQualified: false, densePolarimetricImageQualified: false, browserQualification: "not-run", visualMatrixQualification: "not-run", soakQualification: "not-run", rtxWebGpuQualification: "not-run" },
  runtimeIntegration: { v13EvidenceObservatory: true, summaryOnlyInReactState: true, trajectoriesInReactState: false, fullArtifactDownloadAvailable: true, canvasCreated: false, coordinateMutation: false, evpaMutation: false, redshiftMutation: false, classificationMutation: false },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: 0, plannedShardCount: state.plannedShardCount, attemptConsumed: false, aggregateAvailable: false, stateSha256: state.stateSha256 },
  sourceManifest, sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, ordinaryStandaloneProfile: "legacy-v9", liteProfile: "legacy-v9", localShadowDefaultProfile: "legacy-v9", localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  releaseBoundary: "v419-four-screen-coordinates-only-no-pixel-WCS-raster-dense-image-browser-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = { version: "orbit-atlas-current-local-shadow-candidate-v419", generatedAt: artifact.generatedAt, status: evidence.status, formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true, capabilities: { v418SparseDiagnosticProduct: "qualified-four-ray-authority-table", v419FiniteZamoObserver: "qualified-r30M-inclination70deg", v419ScreenCoordinates: "qualified-four-canonical-rays", v419ProjectionReplay: "qualified-local-tetrad-BL-KS", v419Constants: "qualified-E-Lz-Q-linked-to-v312", v419Polarization: "qualified-v313-EVPA-linked-to-screen-coordinates", v419FitsBinaryTable: "available-not-image-HDU", v419SparseQuiverPng: "available-not-science-image-map", v419PixelWcs: "unavailable", v419FitsImage: "unavailable-sparse-four-ray-and-no-approved-pixel-WCS", v419DensePolarimetricImage: "unavailable-campaign-incomplete-0-of-49", v419BrowserQualification: "not-run", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable" }, evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 } };
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, observer: view.observer, coordinates: view.rows.map((row) => [row.alphaM, row.betaM]), maxima: view.maxima, pixelWcs: pointer.capabilities.v419PixelWcs, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
