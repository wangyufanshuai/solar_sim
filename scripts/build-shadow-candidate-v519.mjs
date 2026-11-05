import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v518-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v518.json",
  artifact: "dist/science/kerr-fixed-band-radiometry-oracle-v519/oracle.json",
  runtime: "dist/science/kerr-fixed-band-radiometry-oracle-v519/runtime-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v519-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v519.json",
};
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "evidenceSha256",
  "pointerSha256",
  "stageChainSha256",
]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};
const below = (value, limit) => Number(value) < Number(limit);

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const runtime = read(paths.runtime);
const detector = read(paths.detector);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v518-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v518" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  artifact.version !== "v519-kerr-fixed-band-radiometry-multiprecision-oracle-v1" ||
  sha(artifact) !== artifact.artifactSha256 ||
  runtime.version !== "v519-kerr-fixed-band-radiometry-runtime-audit-v1" ||
  sha(runtime) !== runtime.artifactSha256 ||
  runtime.source.radiometryOracleSha256 !== artifact.artifactSha256 ||
  artifact.oracle.backend !== "mpmath-1.3.0" ||
  artifact.oracle.decimalDigits !== 80 ||
  artifact.oracle.integration !== "adaptive-tanh-sinh-log-frequency" ||
  artifact.counts.rayCount !== 4 ||
  artifact.counts.bandCount !== 3 ||
  artifact.counts.rowCount !== 12 ||
  artifact.rows.length !== 12 ||
  artifact.counts.measuredRadianceRowCount !== 0 ||
  artifact.counts.detectorProjectedRowCount !== 0 ||
  artifact.counts.sciencePixelRowCount !== 0 ||
  !below(
    artifact.maxima.energyRadianceRelativeDifference,
    artifact.limits.energyRadianceRelativeDifference,
  ) ||
  !below(
    artifact.maxima.photonRadianceRelativeDifference,
    artifact.limits.photonRadianceRelativeDifference,
  ) ||
  !below(
    artifact.maxima.meanFrequencyRelativeDifference,
    artifact.limits.meanFrequencyRelativeDifference,
  ) ||
  !below(
    artifact.maxima.g3TransferRelativeDifference,
    artifact.limits.transferCoefficientRelativeDifference,
  ) ||
  !below(
    artifact.maxima.g4TransferRelativeDifference,
    artifact.limits.transferCoefficientRelativeDifference,
  ) ||
  artifact.qualification.independentAlgorithm !== true ||
  artifact.qualification.productionMeasuredRadiometryQualified !== false ||
  artifact.boundary.modelPredictionOnly !== true ||
  artifact.boundary.detectorThroughputAvailable !== false ||
  artifact.boundary.observedDetectorCountsAvailable !== false ||
  artifact.boundary.scienceRasterAuthorityAvailable !== false ||
  runtime.runtime.serverFingerprintCacheHit !== true ||
  runtime.runtime.automaticRequestCount !== 0 ||
  runtime.runtime.explicitRequestCount !== 1 ||
  runtime.runtime.singleFlightConsumerCount !== 2 ||
  runtime.runtime.finalResourceStatus !== "baseline" ||
  detector.counts.measuredCalibrationFiles !== 0 ||
  detector.counts.requiredMeasuredCalibrationFiles !== 6 ||
  detector.boundary.detectorResponseAvailable !== false ||
  detector.boundary.scienceRasterAvailable !== false ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v519-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.artifact,
  paths.runtime,
  paths.detector,
  paths.dense,
  paths.formal,
  "app/lib/kerrFixedBandRadiometryOracleV519.ts",
  "app/lib/kerrFixedBandRadiometryOracleV519.test.ts",
  "app/lib/kerrFixedBandRadiometryOracleServerV519.ts",
  "app/lib/kerrFixedBandRadiometryOracleServerV519.test.ts",
  "app/lib/kerrFixedBandRadiometryOracleClientV519.ts",
  "app/lib/kerrFixedBandRadiometryOracleClientV519.test.ts",
  "app/api/atlas/relativity-evidence/v519/radiometry-oracle/route.ts",
  "app/api/atlas/relativity-evidence/v519/radiometry-oracle/route.test.ts",
  "app/components/KerrFixedBandRadiometryOracleV519.tsx",
  "app/components/KerrFixedBandRadiometryOracleV519.test.tsx",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV519.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV519.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV519.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV519.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/run-kerr-fixed-band-radiometry-oracle-v519.py",
  "scripts/test-kerr-fixed-band-radiometry-oracle-v519.py",
  "scripts/build-kerr-fixed-band-radiometry-runtime-v519.ts",
  "scripts/build-shadow-candidate-v519.mjs",
  "scripts/build-shadow-v519.mjs",
  "scripts/verify-shadow-v519-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "v519-fixed-band-radiometry-multiprecision-oracle-qualified-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v519-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v518EvidenceSha256: previousEvidence.evidenceSha256,
    v518PointerSha256: previousPointer.pointerSha256,
    v519RadiometryOracleSha256: artifact.artifactSha256,
    v519RuntimeArtifactSha256: runtime.artifactSha256,
    v511InstrumentMatrixSha256: detector.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  oracle: artifact.oracle,
  counts: artifact.counts,
  maxima: artifact.maxima,
  limits: artifact.limits,
  qualification: artifact.qualification,
  runtime: runtime.runtime,
  detectorBoundary: {
    measuredCalibrationFiles: detector.counts.measuredCalibrationFiles,
    requiredMeasuredCalibrationFiles: detector.counts.requiredMeasuredCalibrationFiles,
    detectorAuthorityAvailable: detector.boundary.detectorResponseAvailable,
    scienceRasterAvailable: detector.boundary.scienceRasterAvailable,
    fitsProducts: detector.boundary.fitsProducts,
    pngProducts: detector.boundary.pngProducts,
  },
  scienceBoundary: artifact.boundary,
  denseCampaign: {
    namespace: "v314",
    status: dense.status,
    completedShardCount: dense.completedShardCount,
    plannedShardCount: dense.plannedShardCount,
    attemptConsumed: dense.attemptConsumed,
    aggregateAvailable: dense.aggregateAvailable,
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  qualificationStatement:
    "v519-independent-80-digit-adaptive-tanh-sinh-log-frequency-oracle-four-rays-three-bands-twelve-energy-twelve-photon-integrals-mean-frequency-and-g3-g4-transfer-all-below-frozen-limits-model-prediction-only-single-flight-runtime-baseline",
  boundaryStatement:
    "The oracle independently validates model-predicted thin-disk fixed-band radiometry. It does not represent measured emission, detector throughput, observed counts, dense images, science raster authority, or product promotion.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v519",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v518ScienceCinematicV7R2: "qualified",
    v519IndependentAlgorithm: "qualified-mpmath-80-digit-adaptive-tanh-sinh",
    v519RadiometryRows: "qualified-12-of-12",
    v519EnergyIntegrals: "qualified-12",
    v519PhotonIntegrals: "qualified-12",
    v519MeanFrequencies: "qualified-12",
    v519G3G4Transfer: "qualified-4-rays",
    v519CrossLanguageCanonicalSha: "qualified",
    v519ModelPredictionBoundary: "explicit",
    v519MeasuredRadiometry: "unavailable-0-rows",
    v519DetectorProjection: "unavailable-0-rows",
    v519RuntimeRequestPolicy: "qualified-auto-0-explicit-1-single-flight-2-consumers",
    v519Lifecycle: "qualified-baseline",
    v519DetectorCalibration: "incomplete-0-of-6",
    v519ScienceRaster: "unavailable",
    v519BrowserQualification: "not-run",
    v519VisualMatrixQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    scienceRasterPayloadAllowed: false,
    fitsWriteAllowed: false,
    pngWriteAllowed: false,
    localShadowDefaultApplied: false,
  },
  evidence: {
    path: paths.evidence,
    fileSha256: fileSha(paths.evidence),
    canonicalSha256: evidence.evidenceSha256,
  },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);

console.log(
  JSON.stringify(
    {
      status,
      oracleSha256: artifact.artifactSha256,
      runtimeArtifactSha256: runtime.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rows: artifact.counts.rowCount,
      maximumEnergyRelativeDifference: artifact.maxima.energyRadianceRelativeDifference,
      maximumPhotonRelativeDifference: artifact.maxima.photonRadianceRelativeDifference,
      maximumMeanFrequencyRelativeDifference: artifact.maxima.meanFrequencyRelativeDifference,
      measuredRadianceRows: 0,
      detectorCalibration: "0/6",
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
