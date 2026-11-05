import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v527-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v527.json",
  artifact: "dist/science/kerr-calibration-cost-sensitivity-v528/sensitivity.json",
  runtime: "dist/science/kerr-calibration-cost-sensitivity-v528/runtime-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v528-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v528.json",
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
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([a], [b]) => compare(a, b))
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

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const runtime = read(paths.runtime);
const detector = read(paths.detector);
const intake = read(paths.intake);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const maxima = Object.values(artifact.maxima).map(Number);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v527-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v527" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  artifact.version !== "v528-kerr-calibration-cost-sensitivity-v1" ||
  sha(artifact) !== artifact.artifactSha256 ||
  runtime.version !== "v528-kerr-calibration-cost-sensitivity-runtime-audit-v1" ||
  sha(runtime) !== runtime.artifactSha256 ||
  runtime.source.sensitivityArtifactSha256 !== artifact.artifactSha256 ||
  artifact.counts.stochasticCostSampleCount !== 17 ||
  artifact.counts.deterministicCostSampleCount !== 17 ||
  artifact.counts.costSensitivitySampleCount !== 34 ||
  artifact.counts.optimizerIterationCount !== 17_408 ||
  artifact.stochasticCostSensitivity.samples.length !== 17 ||
  artifact.deterministicCostSensitivity.samples.length !== 17 ||
  artifact.stochasticCostSensitivity.selectedSampleIndex !== null ||
  artifact.deterministicCostSensitivity.selectedSampleIndex !== null ||
  artifact.stochasticCostSensitivity.samples.some(
    (row) => row.costLawValidatedByMeasurement !== false || row.recommended !== false,
  ) ||
  artifact.deterministicCostSensitivity.samples.some(
    (row) => row.costLawValidatedByMeasurement !== false || row.recommended !== false,
  ) ||
  artifact.assumedCostLaw.inverseSquareEffortScaling !== true ||
  artifact.assumedCostLaw.inverseSquareLawValidatedForInstrument !== false ||
  artifact.assumedCostLaw.acquisitionOverheadIncluded !== false ||
  artifact.assumedCostLaw.systematicFloorIncluded !== false ||
  artifact.assumedCostLaw.stressModelOnlyNotOperationalCost !== true ||
  artifact.selectionBoundary.calibrationToScienceCostRatioAvailable !== false ||
  artifact.selectionBoundary.recommendedAllocationAvailable !== false ||
  artifact.selectionBoundary.automaticSelectionAllowed !== false ||
  artifact.selectionBoundary.operationalSchedulingAllowed !== false ||
  artifact.acquisitionBoundary.readyMeasuredFileCount !== 0 ||
  artifact.acquisitionBoundary.numericalScienceErrorBarsAvailable !== false ||
  maxima.some((value) => value >= Number(artifact.limits.multiprecisionResidual)) ||
  artifact.qualification.parametricCostSensitivityQualified !== true ||
  artifact.qualification.operationalCostModelQualified !== false ||
  artifact.qualification.recommendedAllocationQualified !== false ||
  artifact.qualification.measuredInstrumentQualified !== false ||
  runtime.runtime.automaticRequestCount !== 0 ||
  runtime.runtime.explicitRequestCount !== 1 ||
  runtime.runtime.singleFlightConsumerCount !== 2 ||
  runtime.runtime.finalResourceStatus !== "baseline" ||
  runtime.detailCatalog.detailCount !== 30 ||
  runtime.detailCatalog.uniqueDetailCount !== 30 ||
  runtime.detailCatalog.concurrentDetailSurfaceBudget !== 1 ||
  runtime.detailCatalog.automaticDetailRequestCount !== 0 ||
  runtime.visualProfile.scientificPayloadStable !== true ||
  runtime.visualProfile.scientificGeometryStable !== true ||
  runtime.visualProfile.scientificGeometryInputCount !== 34 ||
  runtime.visualProfile.numericScientificStyleInputCount !== 0 ||
  detector.counts.measuredCalibrationFiles !== 0 ||
  detector.counts.requiredMeasuredCalibrationFiles !== 6 ||
  intake.inspect.readyFileCount !== 0 ||
  intake.inspect.attemptConsumed !== false ||
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
  throw new Error("v528-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.artifact,
  paths.runtime,
  paths.detector,
  paths.intake,
  paths.dense,
  paths.formal,
  "app/lib/kerrCalibrationCostSensitivityV528.ts",
  "app/lib/kerrCalibrationCostSensitivityV528.test.ts",
  "app/lib/kerrCalibrationCostSensitivityServerV528.ts",
  "app/lib/kerrCalibrationCostSensitivityServerV528.test.ts",
  "app/lib/kerrCalibrationCostSensitivityClientV528.ts",
  "app/lib/kerrCalibrationCostSensitivityClientV528.test.ts",
  "app/api/atlas/relativity-evidence/v528/calibration-cost-sensitivity/route.ts",
  "app/api/atlas/relativity-evidence/v528/calibration-cost-sensitivity/route.test.ts",
  "app/components/KerrCalibrationCostSensitivityV528.tsx",
  "app/components/KerrCalibrationCostSensitivityV528.test.tsx",
  "app/components/kerrPhotonMetrologyDetailCatalogV528.ts",
  "app/components/kerrPhotonMetrologyDetailCatalogV528.test.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV528.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV528.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV528.test.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV527.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/run-kerr-calibration-cost-sensitivity-v528.py",
  "scripts/test-kerr-calibration-cost-sensitivity-v528.py",
  "scripts/build-kerr-calibration-cost-sensitivity-runtime-v528.ts",
  "scripts/build-shadow-candidate-v528.mjs",
  "scripts/build-shadow-v528.mjs",
  "scripts/verify-shadow-v528-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths
  .map((path) => ({ path, sha256: fileSha(path) }))
  .sort((a, b) => compare(a.path, b.path));
const status =
  "v528-parametric-cost-sensitivity-qualified-operational-cost-and-allocation-unavailable-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v528-evidence-v1",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  dependency: {
    v527EvidenceSha256: previousEvidence.evidenceSha256,
    v527PointerSha256: previousPointer.pointerSha256,
    v528SensitivityArtifactSha256: artifact.artifactSha256,
    v528RuntimeArtifactSha256: runtime.artifactSha256,
    v511InstrumentMatrixSha256: detector.artifactSha256,
    v458IntakeArtifactSha256: intake.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  oracle: artifact.oracle,
  assumedCostLaw: artifact.assumedCostLaw,
  stochasticCostSensitivity: {
    constraint: artifact.stochasticCostSensitivity.constraint,
    sampleCount: artifact.stochasticCostSensitivity.sampleCount,
    selectedSampleIndex: artifact.stochasticCostSensitivity.selectedSampleIndex,
  },
  deterministicCostSensitivity: {
    constraint: artifact.deterministicCostSensitivity.constraint,
    sampleCount: artifact.deterministicCostSensitivity.sampleCount,
    selectedSampleIndex: artifact.deterministicCostSensitivity.selectedSampleIndex,
  },
  selectionBoundary: artifact.selectionBoundary,
  acquisitionBoundary: artifact.acquisitionBoundary,
  counts: artifact.counts,
  maxima: artifact.maxima,
  limits: artifact.limits,
  qualification: artifact.qualification,
  runtime: runtime.runtime,
  detailCatalog: runtime.detailCatalog,
  visualProfile: runtime.visualProfile,
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
    "v528-qualifies-17-ratio-stochastic-and-17-ratio-deterministic-parametric-cost-sensitivity-with-analytic-and-independent-optimizer-agreement",
  boundaryStatement:
    "The inverse-square acquisition-cost law is a normalized stress model only; no measured cost ratio, validated operational cost law, acquisition overhead, systematic floor, recommended allocation, schedule, physical error bars, electron counts, observed counts, science raster, or product promotion is available.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v528",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v527NormalizedBudgetFrontiers: "qualified-preserved",
    v528StochasticCostSensitivity: "qualified-17-of-17-parametric-stress-model",
    v528DeterministicCostSensitivity: "qualified-17-of-17-parametric-stress-model",
    v528AnalyticOptimizer: "qualified-closed-form",
    v528IndependentOptimizer: "qualified-17408-iterations",
    v528StrictConvexity: "qualified",
    v528ScientificGeometry: "qualified-34-identical-science-cinematic",
    v528SharedDetailCatalog: "qualified-30-of-30-single-active-surface",
    v528CostLaw: "unvalidated-stress-model-only",
    v528CalibrationToScienceCostRatio: "unavailable",
    v528AcquisitionOverhead: "not-modeled",
    v528SystematicFloor: "not-modeled",
    v528RecommendedAllocation: "unavailable",
    v528OperationalSchedule: "unavailable",
    v528MeasuredFileContract: "incomplete-0-of-6",
    v528NumericalScienceErrorBars: "unavailable",
    v528ExpectedElectronCounts: "unavailable-0-rows",
    v528ObservedCounts: "unavailable-0-rows",
    v528ScienceRecovery: "blocked",
    v528ScienceRaster: "unavailable",
    v528RuntimeRequestPolicy: "qualified-auto-0-explicit-1-single-flight-2-consumers",
    v528Lifecycle: "qualified-baseline",
    v528BrowserQualification: "not-run",
    v528VisualMatrixQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    operationalCostModelPromotionAllowed: false,
    recommendedAllocationAllowed: false,
    operationalScheduleAllowed: false,
    scienceRecoveryAllowed: false,
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
      sensitivityArtifactSha256: artifact.artifactSha256,
      runtimeArtifactSha256: runtime.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      costRatios: 17,
      scientificGeometryInputs: 34,
      optimizerIterations: 17_408,
      detailCatalog: "30/30",
      recommendedAllocation: "unavailable",
      operationalSchedule: "unavailable",
      measuredCalibration: "0/6",
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
