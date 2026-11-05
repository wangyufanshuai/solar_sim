import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v519-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v519.json",
  artifact: "dist/science/kerr-fixed-band-stokes-v520/stokes-payload.json",
  runtime: "dist/science/kerr-fixed-band-stokes-v520/runtime-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v520-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v520.json",
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
  previousEvidence.version !== "orbit-atlas-shadow-v519-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v519" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  artifact.version !== "v520-kerr-fixed-band-stokes-payload-v1" ||
  sha(artifact) !== artifact.artifactSha256 ||
  runtime.version !== "v520-kerr-fixed-band-stokes-runtime-audit-v1" ||
  sha(runtime) !== runtime.artifactSha256 ||
  runtime.source.stokesArtifactSha256 !== artifact.artifactSha256 ||
  artifact.oracle.backend !== "mpmath-1.3.0" ||
  artifact.oracle.decimalDigits !== 80 ||
  artifact.oracle.independentTransportPathsPreserved !== true ||
  artifact.oracle.methodValuesAveraged !== false ||
  artifact.counts.rayCount !== 4 ||
  artifact.counts.bandCount !== 3 ||
  artifact.counts.transportMethodCount !== 2 ||
  artifact.counts.rowCount !== 24 ||
  artifact.rows.length !== 24 ||
  artifact.counts.energyStokesTripletCount !== 24 ||
  artifact.counts.photonStokesTripletCount !== 24 ||
  artifact.counts.measuredStokesRowCount !== 0 ||
  artifact.counts.circularStokesRowCount !== 0 ||
  artifact.counts.detectorProjectedRowCount !== 0 ||
  artifact.counts.sciencePixelRowCount !== 0 ||
  !below(artifact.maxima.linearFractionResidual, artifact.limits.linearFractionResidual) ||
  !below(artifact.maxima.evpaReconstructionDeg, artifact.limits.evpaReconstructionDeg) ||
  !below(artifact.maxima.wpKsEvpaDifferenceDeg, artifact.limits.wpKsEvpaDifferenceDeg) ||
  !below(
    artifact.maxima.wpKsNormalizedQDifference,
    artifact.limits.wpKsNormalizedStokesDifference,
  ) ||
  !below(
    artifact.maxima.wpKsNormalizedUDifference,
    artifact.limits.wpKsNormalizedStokesDifference,
  ) ||
  Number(artifact.maxima.physicalConeViolation) !== 0 ||
  artifact.qualification.fixedBandEnergyStokesQualified !== true ||
  artifact.qualification.fixedBandPhotonStokesQualified !== true ||
  artifact.qualification.walkerPenrosePathQualified !== true ||
  artifact.qualification.independentKsParallelTransportPathQualified !== true ||
  artifact.qualification.measuredPolarimetryQualified !== false ||
  artifact.boundary.modelPredictionOnly !== true ||
  artifact.boundary.measuredPolarimeterAvailable !== false ||
  artifact.boundary.measuredMuellerCalibrationAvailable !== false ||
  artifact.boundary.circularPolarizationAvailable !== false ||
  artifact.boundary.faradayRotationAvailable !== false ||
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
  throw new Error("v520-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.artifact,
  paths.runtime,
  paths.detector,
  paths.dense,
  paths.formal,
  "app/lib/kerrFixedBandStokesV520.ts",
  "app/lib/kerrFixedBandStokesV520.test.ts",
  "app/lib/kerrFixedBandStokesServerV520.ts",
  "app/lib/kerrFixedBandStokesServerV520.test.ts",
  "app/lib/kerrFixedBandStokesClientV520.ts",
  "app/lib/kerrFixedBandStokesClientV520.test.ts",
  "app/api/atlas/relativity-evidence/v520/fixed-band-stokes/route.ts",
  "app/api/atlas/relativity-evidence/v520/fixed-band-stokes/route.test.ts",
  "app/components/KerrFixedBandStokesV520.tsx",
  "app/components/KerrFixedBandStokesV520.test.tsx",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV520.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV520.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV520.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV520.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/run-kerr-fixed-band-stokes-v520.py",
  "scripts/test-kerr-fixed-band-stokes-v520.py",
  "scripts/build-kerr-fixed-band-stokes-runtime-v520.ts",
  "scripts/build-shadow-candidate-v520.mjs",
  "scripts/build-shadow-v520.mjs",
  "scripts/verify-shadow-v520-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths
  .map((path) => ({ path, sha256: fileSha(path) }))
  .sort((a, b) => a.path.localeCompare(b.path));
const status =
  "v520-fixed-band-dual-transport-stokes-qualified-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v520-evidence-v1",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  dependency: {
    v519EvidenceSha256: previousEvidence.evidenceSha256,
    v519PointerSha256: previousPointer.pointerSha256,
    v520StokesArtifactSha256: artifact.artifactSha256,
    v520RuntimeArtifactSha256: runtime.artifactSha256,
    v511InstrumentMatrixSha256: detector.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  model: artifact.model,
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
    "v520-four-rays-three-fixed-bands-two-independent-polarization-transports-twenty-four-energy-and-photon-IQU-model-rows-cross-language-canonical-and-runtime-baseline-qualified",
  boundaryStatement:
    "The payload contains model-predicted linear Stokes only. It is not measured polarimetry, Mueller calibration, circular polarization, Faraday rotation, detector counts, dense imaging, science raster authority, or product promotion.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v520",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v519IndependentRadiometryOracle: "qualified",
    v520FixedBandEnergyStokes: "qualified-24-of-24-model-rows",
    v520FixedBandPhotonStokes: "qualified-24-of-24-model-rows",
    v520WalkerPenrosePath: "qualified-preserved-independent",
    v520KsParallelTransportPath: "qualified-preserved-independent",
    v520MethodAveraging: "forbidden-not-applied",
    v520PhysicalPolarizationCone: "qualified-zero-violation",
    v520CrossLanguageCanonicalSha: "qualified",
    v520MeasuredStokes: "unavailable-0-rows",
    v520CircularStokes: "unavailable-0-rows",
    v520DetectorProjection: "unavailable-0-rows",
    v520RuntimeRequestPolicy: "qualified-auto-0-explicit-1-single-flight-2-consumers",
    v520Lifecycle: "qualified-baseline",
    v520DetectorCalibration: "incomplete-0-of-6",
    v520ScienceRaster: "unavailable",
    v520BrowserQualification: "not-run",
    v520VisualMatrixQualification: "not-run",
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
      stokesArtifactSha256: artifact.artifactSha256,
      runtimeArtifactSha256: runtime.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rows: artifact.counts.rowCount,
      maximumWpKsEvpaDifferenceDeg: artifact.maxima.wpKsEvpaDifferenceDeg,
      maximumWpKsNormalizedQDifference: artifact.maxima.wpKsNormalizedQDifference,
      maximumWpKsNormalizedUDifference: artifact.maxima.wpKsNormalizedUDifference,
      measuredStokesRows: 0,
      circularStokesRows: 0,
      detectorCalibration: "0/6",
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
