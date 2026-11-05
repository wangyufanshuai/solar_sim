import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v420-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v420.json",
  v419Artifact: "dist/science/kerr-screen-coordinate-provenance-v419/screen-coordinate-provenance.json",
  v419Png: "dist/science/kerr-screen-coordinate-provenance-v419/sparse-screen-quiver.png",
  v420Artifact: "dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS.json",
  v420Png: "dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS-grid.png",
  artifact: "dist/science/kerr-axial-polarization-vectors-v421/axial-vector-catalog.json",
  oracle: "dist/science/kerr-axial-polarization-vectors-v421/python-axial-vector-oracle.json",
  exportManifest: "dist/science/kerr-axial-polarization-vectors-v421/export-manifest.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v421-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v421.json",
};
const historicalHashes = Object.freeze({
  v419Artifact: "adaebc0d0500c1b856dd8875a6f9edccf9ebd3ca07867d2cd3fdba76007d28aa",
  v419Png: "e2a13c42d82b29396c59b763142e6b19aca3ed498171ac18128b6789836f9486",
  v420Artifact: "e6c8ca822d81575d640b90ad87eeb49658d5c88afc44f473b0620fcefadac337",
  v420Png: "6392b55ef2d701bea7ac8bf0581acb5bc70101d1a95020ba7003f62d2f2cb4a0",
});
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
  previousEvidence.evidenceSha256 !== "b3beae4072f81034771bf19a735077f773582c856a8daecfa5a33a6241968ae4"
  || previousPointer.pointerSha256 !== "d52cdaf1dd93a995be4c6fa04b0afd0447344185fb375af81649cc205b262fe5"
  || fileSha(paths.previousEvidence) !== "9cd869b6fbd1d0f4ded91e1a379ebab140e5058c2f21b67b2e18bee9896b6849"
  || fileSha(paths.previousPointer) !== "cf1b5463a753953fb4e07e50308f0afd3406ccb404f0b54e50e8998c35b077f8"
  || fileSha(paths.v419Artifact) !== historicalHashes.v419Artifact
  || fileSha(paths.v419Png) !== historicalHashes.v419Png
  || fileSha(paths.v420Artifact) !== historicalHashes.v420Artifact
  || fileSha(paths.v420Png) !== historicalHashes.v420Png
  || artifact.version !== "v421-kerr-axial-polarization-vector-artifact-v1"
  || sha(artifact) !== artifact.artifactSha256
  || oracle.status !== "qualified-independent-axial-vector-WCS-endpoints"
  || oracle.artifactSha256 !== artifact.pythonOracleArtifactSha256
  || view?.status !== "qualified-four-ray-WCS-aware-axial-vector-catalog-prior-quiver-display-withdrawn"
  || view.rows?.length !== 4
  || view.rows.some((row) => row.intensity !== null || row.stokesAmplitude !== null || row.interpolationAllowed !== false || row.instrumentPrecisionFixture?.confidenceWedgeGenerated !== false)
  || view.convention?.zeroDirection !== "plus-beta"
  || view.convention.positiveDirection !== "toward-plus-alpha"
  || view.convention.worldDirection !== "dAlpha=sin-chi-dBeta=cos-chi"
  || view.priorDisplayAudit?.v419NumericalCoordinates !== "qualified-preserved"
  || view.priorDisplayAudit.v419PngQuiverOrientation !== "withdrawn-display-only-90-degree-convention-mismatch"
  || view.priorDisplayAudit.v420NumericalWcs !== "qualified-preserved"
  || view.priorDisplayAudit.v420PngQuiverOrientation !== "withdrawn-display-only-90-degree-convention-mismatch"
  || view.priorDisplayAudit.historicalFilesOverwritten !== false
  || view.maxima?.directionNormResidual >= 1e-12
  || view.maxima.axialTensorNormResidual >= 1e-12
  || view.maxima.midpointResidualM >= 1e-12
  || view.maxima.recoveredAxialEvpaResidualDeg >= 1e-12
  || view.maxima.plus180EndpointSetResidualM >= 1e-12
  || view.maxima.pythonOracleEndpointDifference >= 1e-10
  || exports.version !== "v421-kerr-axial-polarization-export-manifest-v1"
  || exports.artifactSha256 !== artifact.artifactSha256
  || exports.historicalFilesOverwritten !== false
  || exports.interpolationAllowed !== false
  || exports.exports?.fits?.sha256 !== fileSha(`dist/science/kerr-axial-polarization-vectors-v421/${exports.exports.fits.path}`)
  || exports.exports?.png?.sha256 !== fileSha(`dist/science/kerr-axial-polarization-vectors-v421/${exports.exports.png.path}`)
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
) throw new Error("v421-boundary");

const sourcePaths = [
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
  "scripts/run-kerr-axial-polarization-oracle-v421.py",
  "scripts/test-kerr-axial-polarization-v421.py",
  "scripts/build-kerr-axial-polarization-v421.ts",
  "scripts/export-kerr-axial-polarization-v421.py",
  "scripts/build-kerr-axial-polarization-chain-v421.mjs",
  "scripts/build-shadow-candidate-v421.mjs",
  "scripts/reseal-shadow-evidence-chain-v421.mjs",
  "scripts/verify-shadow-v421-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v421-evidence-v1",
  generatedAt: artifact.generatedAt,
  status: "axial-polarization-vector-orientation-corrected-prior-quiver-display-withdrawn-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v420EvidenceSha256: previousEvidence.evidenceSha256,
    v420PointerSha256: previousPointer.pointerSha256,
    v420EvidenceFileSha256: fileSha(paths.previousEvidence),
    v420PointerFileSha256: fileSha(paths.previousPointer),
    v418ArtifactSha256: view.source.v418InstrumentFixtureArtifactSha256,
    v420ArtifactSha256: view.source.v420ObserverWcsArtifactSha256,
    v421ArtifactSha256: artifact.artifactSha256,
    v421ArtifactFileSha256: fileSha(paths.artifact),
    pythonOracleArtifactSha256: oracle.artifactSha256,
    pythonOracleFileSha256: fileSha(paths.oracle),
    exportManifestFileSha256: fileSha(paths.exportManifest),
  },
  orientationCorrection: {
    convention: view.convention,
    priorDisplayAudit: view.priorDisplayAudit,
    historicalFileHashes: historicalHashes,
    currentRuntimeDirectionCorrected: true,
    axialTensorRepresentation: "cos-2chi-sin-2chi",
    endpointLengthM: 4,
    endpointLengthSemantic: "fixed-display-scale-not-polarization-magnitude",
    rows: view.rows.map((row) => ({ rayIndex: row.rayIndex, rayId: row.rayId, authorityEvpaDeg: row.authorityEvpaDeg, axialOrientationTensor: row.axialOrientationTensor, worldDirectionUnit: row.worldDirectionUnit, negative: row.presentationGlyph.negative, positive: row.presentationGlyph.positive, intensity: null, stokesAmplitude: null, interpolationAllowed: false })),
    maxima: view.maxima,
    thresholds: view.thresholds,
    products: view.products,
    exports: Object.fromEntries(Object.entries(exports.exports).map(([id, entry]) => [id, { fileSha256: entry.sha256, semantic: entry.semantic }])),
  },
  qualification: {
    numericalCoordinatesV419Preserved: true,
    numericalEvpaV419Preserved: true,
    numericalWcsV420Preserved: true,
    priorV419PngDisplayQualified: false,
    priorV420PngDisplayQualified: false,
    axialConventionQualified: true,
    axialTensorQualified: true,
    independentAstropyEndpointOracleQualified: true,
    correctedRuntimeDirectionQualified: true,
    correctedSparsePngQualified: true,
    fitsVectorTableQualified: true,
    rasterValuesAvailable: false,
    fitsImageQualified: false,
    browserQualification: "not-run",
    visualMatrixQualification: "not-run",
    soakQualification: "not-run",
    rtxWebGpuQualification: "not-run",
  },
  runtimeIntegration: { v13EvidenceObservatory: true, summaryOnlyInReactState: true, rasterArrayInReactState: false, svgCoordinateOverlay: true, fullArtifactDownloadAvailable: true, canvasCreated: false, scienceBufferMutation: false, coordinateMutation: false, evpaMutation: false, intensitySynthesis: false, interpolation: false },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: 0, plannedShardCount: state.plannedShardCount, attemptConsumed: false, aggregateAvailable: false, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, ordinaryStandaloneProfile: "legacy-v9", liteProfile: "legacy-v9", localShadowDefaultProfile: "legacy-v9", localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  releaseBoundary: "v421-corrected-four-ray-axial-vector-display-and-provenance-only-no-raster-values-dense-browser-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v421",
  generatedAt: artifact.generatedAt,
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v419NumericalCoordinates: "qualified-preserved",
    v419NumericalEvpa: "qualified-preserved",
    v419PngQuiverOrientation: "withdrawn-display-only-90-degree-convention-mismatch",
    v420NumericalWcs: "qualified-preserved",
    v420PngQuiverOrientation: "withdrawn-display-only-90-degree-convention-mismatch",
    v421EvpaConvention: "qualified-zero-plus-beta-positive-toward-plus-alpha",
    v421AxialTensor: "qualified-cos2chi-sin2chi",
    v421WcsEndpoints: "qualified-eight-endpoints-independent-astropy-oracle",
    v421VectorCatalog: "qualified-four-authority-rays",
    v421FitsVectorTable: "available-primary-WCS-plus-binary-table-no-image-data",
    v421CorrectedPng: "available-sparse-axial-quiver-not-science-raster",
    v421HistoricalFilesOverwritten: false,
    v421Intensity: "unavailable",
    v421StokesAmplitude: "unavailable",
    v421Interpolation: "prohibited",
    v421FitsImage: "unavailable-no-raster-science-values",
    v421BrowserQualification: "not-run",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, maxima: view.maxima, priorDisplayAudit: view.priorDisplayAudit, browser: pointer.capabilities.v421BrowserQualification, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
