import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v528-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v528.json",
  artifact: "dist/science/kerr-cost-law-robustness-v529/envelope.json",
  runtime: "dist/science/kerr-cost-law-robustness-v529/runtime-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v529-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v529.json",
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
  previousEvidence.version !== "orbit-atlas-shadow-v528-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v528" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  artifact.version !== "v529-kerr-cost-law-robustness-envelope-v1" ||
  sha(artifact) !== artifact.artifactSha256 ||
  runtime.version !== "v529-kerr-cost-law-robustness-runtime-audit-v1" ||
  sha(runtime) !== runtime.artifactSha256 ||
  runtime.source.envelopeArtifactSha256 !== artifact.artifactSha256 ||
  artifact.counts.precisionExponentCount !== 5 ||
  artifact.counts.costRatioCount !== 5 ||
  artifact.counts.systematicFloorCount !== 5 ||
  artifact.counts.fixedOverheadCount !== 4 ||
  artifact.counts.stochasticRobustnessCellCount !== 500 ||
  artifact.counts.deterministicRobustnessCellCount !== 500 ||
  artifact.counts.fullFactorialCellCount !== 1000 ||
  artifact.counts.optimizerIterationCount !== 512000 ||
  artifact.counts.scientificGeometryInputCount !== 68 ||
  artifact.stochasticRobustness.samples.length !== 500 ||
  artifact.deterministicRobustness.samples.length !== 500 ||
  artifact.stochasticRobustness.selectedSampleIndex !== null ||
  artifact.deterministicRobustness.selectedSampleIndex !== null ||
  artifact.costLaw.stressModelOnlyNotOperationalCost !== true ||
  artifact.costLaw.fixedOverheadCanShiftOptimum !== false ||
  artifact.robustnessAudits.overheadAllocationInvarianceComparisons !== 750 ||
  artifact.robustnessAudits.floorMonotonicityComparisons !== 800 ||
  artifact.robustnessAudits.overheadAllocationInvariant !== true ||
  artifact.robustnessAudits.floorCostStrictlyIncreasing !== true ||
  artifact.selectionBoundary.recommendedModelAvailable !== false ||
  artifact.selectionBoundary.recommendedAllocationAvailable !== false ||
  artifact.selectionBoundary.operationalSchedulingAllowed !== false ||
  artifact.acquisitionBoundary.readyMeasuredFileCount !== 0 ||
  artifact.acquisitionBoundary.numericalScienceErrorBarsAvailable !== false ||
  maxima.some((value) => value >= Number(artifact.limits.multiprecisionResidual)) ||
  artifact.qualification.parametricRobustnessQualified !== true ||
  artifact.qualification.operationalCostModelQualified !== false ||
  runtime.runtime.automaticRequestCount !== 0 ||
  runtime.runtime.explicitRequestCount !== 1 ||
  runtime.runtime.singleFlightConsumerCount !== 2 ||
  runtime.runtime.finalResourceStatus !== "baseline" ||
  runtime.detailCatalog.detailCount !== 31 ||
  runtime.detailCatalog.inheritedDetailCount !== 30 ||
  runtime.detailCatalog.newLazyImportCount !== 1 ||
  runtime.detailCatalog.concurrentDetailSurfaceBudget !== 1 ||
  runtime.visualProfile.scientificGeometryStable !== true ||
  runtime.visualProfile.scientificGeometryInputCount !== 68 ||
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
  throw new Error("v529-evidence-boundary");
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
  "app/lib/kerrCostLawRobustnessV529.ts",
  "app/lib/kerrCostLawRobustnessV529.test.ts",
  "app/lib/kerrCostLawRobustnessServerV529.ts",
  "app/lib/kerrCostLawRobustnessServerV529.test.ts",
  "app/lib/kerrCostLawRobustnessClientV529.ts",
  "app/lib/kerrCostLawRobustnessClientV529.test.ts",
  "app/api/atlas/relativity-evidence/v529/cost-law-robustness/route.ts",
  "app/api/atlas/relativity-evidence/v529/cost-law-robustness/route.test.ts",
  "app/components/KerrCostLawRobustnessV529.tsx",
  "app/components/KerrCostLawRobustnessV529.test.tsx",
  "app/components/kerrPhotonMetrologyDetailCatalogV529.ts",
  "app/components/kerrPhotonMetrologyDetailCatalogV529.test.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV529.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV529.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV529.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV529.test.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV528.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/run-kerr-cost-law-robustness-v529.py",
  "scripts/test-kerr-cost-law-robustness-v529.py",
  "scripts/build-kerr-cost-law-robustness-runtime-v529.ts",
  "scripts/build-shadow-candidate-v529.mjs",
  "scripts/build-shadow-v529.mjs",
  "scripts/verify-shadow-v529-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths
  .map((path) => ({ path, sha256: fileSha(path) }))
  .sort((a, b) => compare(a.path, b.path));
const status =
  "v529-parametric-cost-law-robustness-qualified-operational-model-and-selection-unavailable-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v529-evidence-v1",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  dependency: {
    v528EvidenceSha256: previousEvidence.evidenceSha256,
    v528PointerSha256: previousPointer.pointerSha256,
    v529EnvelopeArtifactSha256: artifact.artifactSha256,
    v529RuntimeArtifactSha256: runtime.artifactSha256,
    v511InstrumentMatrixSha256: detector.artifactSha256,
    v458IntakeArtifactSha256: intake.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  oracle: artifact.oracle,
  parameterGrid: artifact.parameterGrid,
  costLaw: artifact.costLaw,
  robustnessAudits: artifact.robustnessAudits,
  displayGeometry: {
    scientificGeometryInputCount: artifact.displayGeometry.scientificGeometryInputCount,
    stochasticExponentRatioPointCount:
      artifact.displayGeometry.stochasticExponentRatioSurface.length,
    deterministicExponentRatioPointCount:
      artifact.displayGeometry.deterministicExponentRatioSurface.length,
    stochasticFloorPointCount: artifact.displayGeometry.stochasticFloorEnvelope.length,
    deterministicFloorPointCount: artifact.displayGeometry.deterministicFloorEnvelope.length,
    stochasticOverheadPointCount: artifact.displayGeometry.stochasticOverheadTranslation.length,
    deterministicOverheadPointCount: artifact.displayGeometry.deterministicOverheadTranslation.length,
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
    "v529-qualifies-a-1000-cell-parametric-precision-exponent-cost-ratio-systematic-floor-and-fixed-overhead-robustness-envelope-with-512000-independent-optimizer-iterations",
  boundaryStatement:
    "All exponent, cost-ratio, floor, and overhead coordinates are hypothetical stress parameters. No measured operational cost law, coupled overhead model, recommended model, allocation, schedule, physical error bars, counts, raster, or product promotion is available.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v529",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v528CostSensitivity: "qualified-preserved",
    v529FullFactorialEnvelope: "qualified-1000-of-1000-cells",
    v529IndependentOptimizer: "qualified-512000-iterations",
    v529OverheadAllocationInvariance: "qualified-750-comparisons-by-definition",
    v529FloorMonotonicity: "qualified-800-comparisons",
    v529ScientificGeometry: "qualified-68-identical-science-cinematic",
    v529SharedDetailCatalog: "qualified-31-of-31-one-new-lazy-import",
    v529PrecisionExponent: "unmeasured-parametric-grid-only",
    v529CalibrationToScienceCostRatio: "unavailable",
    v529SystematicFloor: "unmeasured-parametric-grid-only",
    v529FixedOverhead: "unmeasured-allocation-independent-stress-only",
    v529CoupledOverheadModel: "not-modeled",
    v529RecommendedModel: "unavailable",
    v529RecommendedAllocation: "unavailable",
    v529OperationalSchedule: "unavailable",
    v529MeasuredFileContract: "incomplete-0-of-6",
    v529NumericalScienceErrorBars: "unavailable",
    v529ExpectedElectronCounts: "unavailable-0-rows",
    v529ObservedCounts: "unavailable-0-rows",
    v529ScienceRecovery: "blocked",
    v529ScienceRaster: "unavailable",
    v529RuntimeRequestPolicy: "qualified-auto-0-explicit-1-single-flight-2-consumers",
    v529Lifecycle: "qualified-baseline",
    v529BrowserQualification: "not-run",
    v529VisualMatrixQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    operationalCostModelPromotionAllowed: false,
    modelSelectionAllowed: false,
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
      envelopeArtifactSha256: artifact.artifactSha256,
      runtimeArtifactSha256: runtime.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      fullFactorialCells: 1000,
      optimizerIterations: 512000,
      scientificGeometryInputs: 68,
      detailCatalog: "31/31",
      recommendedModel: "unavailable",
      recommendedAllocation: "unavailable",
      measuredCalibration: "0/6",
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
