import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v423-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v423.json",
  v423: "dist/science/kerr-predicted-stokes-admission-v423/predicted-stokes-catalog.json",
  v410: "dist/science/kerr-ideal-polarimeter-v410/ideal-dual-beam.json",
  artifact: "dist/science/kerr-predicted-polarimeter-v424/predicted-ideal-dual-beam.json",
  oracle: "dist/science/kerr-predicted-polarimeter-v424/python-modulation-oracle.json",
  exportManifest: "dist/science/kerr-predicted-polarimeter-v424/export-manifest.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v424-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v424.json",
};
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !transient.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const v423 = read(paths.v423);
const v410 = read(paths.v410);
const artifact = read(paths.artifact);
const oracle = read(paths.oracle);
const exports = read(paths.exportManifest);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const view = artifact.view;
if (
  previousEvidence.evidenceSha256 !== "a7662a9d9dc3f54f6021b2bb1015619c8b62d1c072739ee043762ae6b1f2ea7c" ||
  previousPointer.pointerSha256 !== "5a84dc9c53bf21d1260035e7b736299d0ae03f95bc08dc77529ac09f8e800cf7" ||
  fileSha(paths.previousEvidence) !== "16f63288fcf112f3863c5db75947becb4bc0659c14f23233cfe8bc4040a28ef5" ||
  fileSha(paths.previousPointer) !== "0fd6b18dd4370b49863b8d8c46dcbd6717cbe3e426b5ad70e9fe3075335d3790" ||
  fileSha(paths.v423) !== "121d7ec75ae3ad5fad7f2abd0e07a32ad5181cd2e8c1decf55599364ecf25e73" ||
  v423.artifactSha256 !== "41a2ccb38d6199af8b831b868b42827adea1f5187be73241377d8da10f3f9b8f" ||
  fileSha(paths.v410) !== "fce8084abd73c90a8c087d1b7605b4d4483dc65ddefeb95198291e65b3941776" ||
  v410.artifactSha256 !== "5acfc19b1c1af8ac8f63c5d1a56e39f79501138fbe3b8b57a483b8771f949a22" ||
  artifact.version !== "v424-kerr-predicted-ideal-dual-beam-modulation-artifact-v1" ||
  sha(artifact) !== artifact.artifactSha256 ||
  oracle.status !== "qualified-ideal-model-predicted-modulation-no-measurement-authority" ||
  oracle.artifactSha256 !== artifact.pythonOracleArtifactSha256 ||
  view?.modulationRows?.length !== 96 ||
  view.reconstructions?.length !== 24 ||
  view.counts?.predictedBeamSpectralRadianceCount !== 192 ||
  view.counts.measuredRowCount !== 0 ||
  view.counts.photonCount !== 0 ||
  view.counts.electronCount !== 0 ||
  view.modulationRows.some((row) =>
    row.predictedOrdinarySpectralRadiance < 0 ||
    row.predictedExtraordinarySpectralRadiance < 0 ||
    row.provenance?.predictionNotMeasurement !== true ||
    row.provenance.photonOrElectronCountsProduced !== false ||
    row.provenance.measuredMuellerCalibrationApplied !== false) ||
  view.maxima?.beamSumRelative >= 1e-12 ||
  view.maxima.nonnegativeBeamViolation !== 0 ||
  view.maxima.normalizedFluxLawAbsolute >= 1e-12 ||
  view.maxima.qNormalizedAbsolute >= 1e-12 ||
  view.maxima.uNormalizedAbsolute >= 1e-12 ||
  view.maxima.linearFractionAbsolute >= 1e-12 ||
  view.maxima.evpaDeg >= 1e-10 ||
  view.maxima.pythonOracleDifference >= 1e-12 ||
  view.qualification?.idealModelModulationQualified !== true ||
  view.qualification.fourAngleReconstructionQualified !== true ||
  view.qualification.wpAndKsPathsPreserved !== true ||
  view.qualification.measuredPolarimeterQualified !== false ||
  view.qualification.photonOrElectronCountsQualified !== false ||
  view.authorityBoundary?.measurementAuthorityGranted !== false ||
  view.authorityBoundary.detectorAuthorityGranted !== false ||
  view.authorityBoundary.pixelAuthorityGranted !== false ||
  view.authorityBoundary.rasterAuthorityGranted !== false ||
  exports.version !== "v424-kerr-predicted-polarimeter-export-manifest-v1" ||
  exports.artifactSha256 !== artifact.artifactSha256 ||
  exports.measurementAuthority !== "unavailable" ||
  exports.detectorAuthority !== "unavailable" ||
  exports.measuredMuellerCalibration !== "unavailable" ||
  exports.photonOrElectronCounts !== "unavailable" ||
  exports.pixelRasterAuthority !== "unavailable" ||
  Object.values(exports.exports ?? {}).some((entry) => entry.sha256 !== fileSha(`dist/science/kerr-predicted-polarimeter-v424/${entry.path}`)) ||
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
) throw new Error("v424-boundary");

const sourcePaths = [
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
  "scripts/run-kerr-predicted-polarimeter-oracle-v424.py",
  "scripts/test-kerr-predicted-polarimeter-v424.py",
  "scripts/build-kerr-predicted-polarimeter-v424.ts",
  "scripts/export-kerr-predicted-polarimeter-v424.py",
  "scripts/build-kerr-predicted-polarimeter-chain-v424.mjs",
  "scripts/build-shadow-candidate-v424.mjs",
  "scripts/reseal-shadow-evidence-chain-v424.mjs",
  "scripts/verify-shadow-v424-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v424-evidence-v1",
  generatedAt: artifact.generatedAt,
  status: "ideal-model-predicted-dual-beam-modulation-qualified-measurement-detector-counts-pixel-raster-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v423EvidenceSha256: previousEvidence.evidenceSha256,
    v423PointerSha256: previousPointer.pointerSha256,
    v423EvidenceFileSha256: fileSha(paths.previousEvidence),
    v423PointerFileSha256: fileSha(paths.previousPointer),
    v423PredictedStokesArtifactSha256: v423.artifactSha256,
    v423PredictedStokesFileSha256: fileSha(paths.v423),
    v410OperatorReferenceArtifactSha256: v410.artifactSha256,
    v410OperatorReferenceFileSha256: fileSha(paths.v410),
    v424ArtifactSha256: artifact.artifactSha256,
    v424ArtifactFileSha256: fileSha(paths.artifact),
    pythonOracleArtifactSha256: oracle.artifactSha256,
    pythonOracleFileSha256: fileSha(paths.oracle),
    exportManifestFileSha256: fileSha(paths.exportManifest),
  },
  predictedPolarimeter: {
    status: view.status,
    operator: view.operator,
    counts: view.counts,
    modulationRows: view.modulationRows,
    reconstructions: view.reconstructions,
    maxima: view.maxima,
    thresholds: view.thresholds,
    qualification: view.qualification,
    authorityBoundary: view.authorityBoundary,
    products: view.products,
    exports: Object.fromEntries(Object.entries(exports.exports).map(([id, entry]) => [id, { fileSha256: entry.sha256, semantic: entry.semantic }])),
  },
  qualification: {
    idealModelModulationQualified: true,
    fourAngleReconstructionQualified: true,
    beamConservationQualified: true,
    nonnegativeBeamsQualified: true,
    wpAndKsPathsPreserved: true,
    independentPythonOracleQualified: true,
    measuredPolarimeterQualified: false,
    measuredMuellerCalibrationQualified: false,
    throughputGainNoiseCovarianceQualified: false,
    photonOrElectronCountsQualified: false,
    detectorAuthorityQualified: false,
    pixelRasterAuthorityQualified: false,
    denseAuthorityQualified: false,
    browserQualification: "not-run",
    visualMatrixQualification: "not-run",
    soakQualification: "not-run",
    rtxWebGpuQualification: "not-run",
  },
  runtimeIntegration: {
    v13EvidenceObservatory: true,
    summaryOnlyInReactState: true,
    fullModulationArrayInReactState: false,
    detectorImageInReactState: false,
    fullArtifactDownloadAvailable: true,
    canvasCreated: false,
    predictedValueMutation: false,
    measurementClaim: false,
    detectorImageClaim: false,
  },
  correctedCampaign: {
    namespace: "v314",
    status: state.status,
    completedShardCount: 0,
    plannedShardCount: state.plannedShardCount,
    attemptConsumed: false,
    aggregateAvailable: false,
    stateSha256: state.stateSha256,
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerSha256: fileSha(paths.formal),
    formalProductPointerAdvanced: false,
    ordinaryStandaloneProfile: "legacy-v9",
    liteProfile: "legacy-v9",
    localShadowDefaultProfile: "legacy-v9",
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  releaseBoundary: "v424-ideal-model-predicted-modulation-only-no-measurement-calibrated-Mueller-throughput-gain-noise-counts-detector-pixel-raster-dense-browser-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v424",
  generatedAt: artifact.generatedAt,
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v423PredictedStokes: "qualified-preserved-24-rows",
    v410IdealOperatorReference: "qualified-preserved-reference-only",
    v424IdealHwpWollastonModulation: "qualified-96-rows",
    v424PredictedBeamSpectralRadiances: "qualified-192-values",
    v424FourAngleReconstruction: "qualified-24-reconstructions",
    v424BeamConservation: "qualified",
    v424WpKsPaths: "preserved-independent",
    v424PythonOracle: "qualified-independent",
    v424MeasurementAuthority: "unavailable",
    v424MeasuredMuellerCalibration: "unavailable",
    v424ThroughputGainNoiseCovariance: "unavailable",
    v424PhotonElectronCounts: "unavailable",
    v424DetectorAuthority: "unavailable",
    v424PixelRasterAuthority: "unavailable",
    v424FitsPredictionTable: "available-no-image-data",
    v424DiagnosticPng: "available-not-detector-image",
    v424BrowserQualification: "not-run",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
  },
  evidence: {
    path: paths.evidence,
    fileSha256: fileSha(paths.evidence),
    canonicalSha256: evidence.evidenceSha256,
  },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({
  status: pointer.status,
  artifactSha256: artifact.artifactSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  counts: view.counts,
  maxima: view.maxima,
  measurement: pointer.capabilities.v424MeasurementAuthority,
  browser: pointer.capabilities.v424BrowserQualification,
  dense: pointer.capabilities.v314CorrectedDense,
}, null, 2));
