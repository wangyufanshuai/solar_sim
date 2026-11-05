import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v529-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v529.json",
  artifact: "dist/science/kerr-allocation-regret-v530/atlas.json",
  runtime: "dist/science/kerr-allocation-regret-v530/runtime-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v530-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v530.json",
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
  previousEvidence.version !== "orbit-atlas-shadow-v529-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v529" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  artifact.version !== "v530-kerr-allocation-regret-fragility-atlas-v1" ||
  sha(artifact) !== artifact.artifactSha256 ||
  runtime.version !== "v530-kerr-allocation-regret-runtime-audit-v1" ||
  sha(runtime) !== runtime.artifactSha256 ||
  runtime.source.regretArtifactSha256 !== artifact.artifactSha256 ||
  artifact.counts.candidateAllocationCount !== 49 ||
  artifact.counts.sourceGridCellCount !== 1000 ||
  artifact.counts.regretEvaluationCount !== 49000 ||
  artifact.counts.overheadAbsoluteRegretInvarianceComparisonCount !== 36750 ||
  artifact.counts.relativeRegretOverheadMonotonicityComparisonCount !== 36750 ||
  artifact.counts.scientificGeometryInputCount !== 148 ||
  artifact.stochasticRegretAtlas.candidateEnvelope.length !== 49 ||
  artifact.deterministicRegretAtlas.candidateEnvelope.length !== 49 ||
  artifact.regretDefinition.absoluteRegretIndependentOfAdditiveOverhead !== true ||
  artifact.regretDefinition.relativeRegretDependsOnAdditiveOverheadNormalization !== true ||
  artifact.regretDefinition.gridCoverageIsProbability !== false ||
  artifact.regretDefinition.priorUsed !== false ||
  artifact.regretAudits.absoluteRegretOverheadInvariant !== true ||
  artifact.regretAudits.relativeRegretNonIncreasingWithOverhead !== true ||
  artifact.regretAudits.descriptiveMinimaxPromotedToRecommendation !== false ||
  artifact.selectionBoundary.modelPriorAvailable !== false ||
  artifact.selectionBoundary.recommendedAllocationAvailable !== false ||
  artifact.selectionBoundary.operationalSchedulingAllowed !== false ||
  artifact.acquisitionBoundary.readyMeasuredFileCount !== 0 ||
  artifact.acquisitionBoundary.numericalScienceErrorBarsAvailable !== false ||
  maxima.some((value) => value >= Number(artifact.limits.multiprecisionResidual)) ||
  artifact.qualification.allocationRegretAtlasQualified !== true ||
  artifact.qualification.operationalDecisionModelQualified !== false ||
  runtime.runtime.automaticRequestCount !== 0 ||
  runtime.runtime.explicitRequestCount !== 1 ||
  runtime.runtime.singleFlightConsumerCount !== 2 ||
  runtime.runtime.finalResourceStatus !== "baseline" ||
  runtime.detailCatalog.detailCount !== 32 ||
  runtime.detailCatalog.inheritedDetailCount !== 31 ||
  runtime.detailCatalog.newLazyImportCount !== 1 ||
  runtime.detailCatalog.concurrentDetailSurfaceBudget !== 1 ||
  runtime.visualProfile.scientificGeometryStable !== true ||
  runtime.visualProfile.scientificGeometryInputCount !== 148 ||
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
  throw new Error("v530-evidence-boundary");
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
  "app/lib/kerrAllocationRegretV530.ts",
  "app/lib/kerrAllocationRegretV530.test.ts",
  "app/lib/kerrAllocationRegretServerV530.ts",
  "app/lib/kerrAllocationRegretServerV530.test.ts",
  "app/lib/kerrAllocationRegretClientV530.ts",
  "app/lib/kerrAllocationRegretClientV530.test.ts",
  "app/api/atlas/relativity-evidence/v530/allocation-regret/route.ts",
  "app/api/atlas/relativity-evidence/v530/allocation-regret/route.test.ts",
  "app/components/KerrAllocationRegretV530.tsx",
  "app/components/KerrAllocationRegretV530.test.tsx",
  "app/components/kerrPhotonMetrologyDetailCatalogV530.ts",
  "app/components/kerrPhotonMetrologyDetailCatalogV530.test.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV530.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV530.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV530.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV530.test.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV529.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/run-kerr-allocation-regret-v530.py",
  "scripts/test-kerr-allocation-regret-v530.py",
  "scripts/build-kerr-allocation-regret-runtime-v530.ts",
  "scripts/build-shadow-candidate-v530.mjs",
  "scripts/build-shadow-v530.mjs",
  "scripts/verify-shadow-v530-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths
  .map((path) => ({ path, sha256: fileSha(path) }))
  .sort((a, b) => compare(a.path, b.path));
const status =
  "v530-allocation-regret-and-fragility-qualified-operational-decision-unavailable-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v530-evidence-v1",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  dependency: {
    v529EvidenceSha256: previousEvidence.evidenceSha256,
    v529PointerSha256: previousPointer.pointerSha256,
    v530RegretArtifactSha256: artifact.artifactSha256,
    v530RuntimeArtifactSha256: runtime.artifactSha256,
    v511InstrumentMatrixSha256: detector.artifactSha256,
    v458IntakeArtifactSha256: intake.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  oracle: artifact.oracle,
  regretDefinition: artifact.regretDefinition,
  stochasticDescriptor: {
    descriptiveAbsoluteMinimax: artifact.stochasticRegretAtlas.descriptiveAbsoluteMinimax,
    descriptiveRelativeMinimax: artifact.stochasticRegretAtlas.descriptiveRelativeMinimax,
    sourceOptimalFractionRange: artifact.stochasticRegretAtlas.sourceOptimalFractionRange,
    selectionBoundary: artifact.stochasticRegretAtlas.selectionBoundary,
  },
  deterministicDescriptor: {
    descriptiveAbsoluteMinimax: artifact.deterministicRegretAtlas.descriptiveAbsoluteMinimax,
    descriptiveRelativeMinimax: artifact.deterministicRegretAtlas.descriptiveRelativeMinimax,
    sourceOptimalFractionRange: artifact.deterministicRegretAtlas.sourceOptimalFractionRange,
    selectionBoundary: artifact.deterministicRegretAtlas.selectionBoundary,
  },
  regretAudits: artifact.regretAudits,
  displayGeometry: {
    stochasticCandidateCount: artifact.displayGeometry.stochasticCandidateEnvelope.length,
    deterministicCandidateCount: artifact.displayGeometry.deterministicCandidateEnvelope.length,
    stochasticLatticeCount: artifact.displayGeometry.stochasticOptimalFractionLattice.length,
    deterministicLatticeCount: artifact.displayGeometry.deterministicOptimalFractionLattice.length,
    scientificGeometryInputCount: artifact.displayGeometry.scientificGeometryInputCount,
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
    "v530-qualifies-49000-allocation-regret-evaluations-plus-36750-additive-overhead-invariance-and-normalization-audits",
  boundaryStatement:
    "Absolute and relative minimax coordinates are descriptive grid statistics only. No prior, utility, measured cost law, operational recommendation, physical error bar, detector count, science raster, or product promotion is available.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v530",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v529CostLawRobustness: "qualified-preserved",
    v530RegretEvaluations: "qualified-49000-of-49000",
    v530AbsoluteOverheadInvariance: "qualified-36750-comparisons",
    v530RelativeOverheadNormalization: "qualified-36750-monotonicity-comparisons",
    v530AllocationFragility: "qualified-descriptive-grid-only",
    v530ScientificGeometry: "qualified-148-identical-science-cinematic",
    v530SharedDetailCatalog: "qualified-32-of-32-one-new-lazy-import",
    v530ModelPrior: "unavailable",
    v530GridCoverageProbability: "false",
    v530DescriptiveMinimax: "available-not-recommendation",
    v530RecommendedModel: "unavailable",
    v530RecommendedAllocation: "unavailable",
    v530OperationalSchedule: "unavailable",
    v530MeasuredFileContract: "incomplete-0-of-6",
    v530NumericalScienceErrorBars: "unavailable",
    v530ExpectedElectronCounts: "unavailable-0-rows",
    v530ObservedCounts: "unavailable-0-rows",
    v530ScienceRecovery: "blocked",
    v530ScienceRaster: "unavailable",
    v530RuntimeRequestPolicy: "qualified-auto-0-explicit-1-single-flight-2-consumers",
    v530Lifecycle: "qualified-baseline",
    v530BrowserQualification: "not-run",
    v530VisualMatrixQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    operationalDecisionPromotionAllowed: false,
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
      regretArtifactSha256: artifact.artifactSha256,
      runtimeArtifactSha256: runtime.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      regretEvaluations: 49000,
      overheadComparisons: 36750,
      scientificGeometryInputs: 148,
      detailCatalog: "32/32",
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
