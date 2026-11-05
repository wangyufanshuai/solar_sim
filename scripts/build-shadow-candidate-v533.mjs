import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v532-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v532.json",
  artifact: "dist/science/kerr-grid-axis-influence-v533/atlas.json",
  runtime: "dist/science/kerr-grid-axis-influence-v533/runtime-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v533-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v533.json",
};
const transient = new Set([
  "generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256",
]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !transient.has(key))
    .sort(([a], [b]) => compare(a, b))
    .map(([key, entry]) => [key, canonicalize(entry)]));
};
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
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

if (previousEvidence.version !== "orbit-atlas-shadow-v532-evidence-v1"
  || sha(previousEvidence) !== previousEvidence.evidenceSha256
  || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v532"
  || sha(previousPointer) !== previousPointer.pointerSha256
  || artifact.version !== "v533-kerr-grid-axis-influence-atlas-v1"
  || sha(artifact) !== artifact.artifactSha256
  || runtime.version !== "v533-kerr-grid-axis-influence-runtime-audit-v1"
  || sha(runtime) !== runtime.artifactSha256
  || runtime.source.axisInfluenceArtifactSha256 !== artifact.artifactSha256
  || artifact.counts.axisSummaryRowCount !== 8
  || artifact.counts.directedAxisComparisonCount !== 24
  || artifact.counts.scientificGeometryInputCount !== 46
  || artifact.stochasticInfluence.singleDominantAxis !== "cost-ratio"
  || artifact.deterministicInfluence.singleDominantAxis !== "cost-ratio"
  || artifact.influenceDefinition.singleScoreComputed !== false
  || artifact.influenceDefinition.aggregationIsProbability !== false
  || artifact.selectionBoundary.axisPriorAvailable !== false
  || artifact.selectionBoundary.recommendedAxisAvailable !== false
  || artifact.acquisitionBoundary.readyMeasuredFileCount !== 0
  || maxima.some((value) => value >= Number(artifact.limits.multiprecisionResidual))
  || artifact.qualification.axisInfluenceAtlasQualified !== true
  || artifact.qualification.operationalAxisImportanceQualified !== false
  || runtime.runtime.automaticRequestCount !== 0
  || runtime.runtime.explicitRequestCount !== 1
  || runtime.runtime.singleFlightConsumerCount !== 2
  || runtime.runtime.finalResourceStatus !== "baseline"
  || runtime.detailCatalog.detailCount !== 35
  || runtime.visualProfile.scientificGeometryInputCount !== 46
  || runtime.visualProfile.numericScientificStyleInputCount !== 0
  || detector.counts.measuredCalibrationFiles !== 0
  || intake.inspect.readyFileCount !== 0
  || dense.status !== "incomplete-0-of-49"
  || dense.completedShardCount !== 0
  || dense.attemptConsumed !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84) {
  throw new Error("v533-evidence-boundary");
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
  "app/lib/kerrGridAxisInfluenceV533.ts",
  "app/lib/kerrGridAxisInfluenceV533.test.ts",
  "app/lib/kerrGridAxisInfluenceServerV533.ts",
  "app/lib/kerrGridAxisInfluenceServerV533.test.ts",
  "app/lib/kerrGridAxisInfluenceClientV533.ts",
  "app/lib/kerrGridAxisInfluenceClientV533.test.ts",
  "app/api/atlas/relativity-evidence/v533/grid-axis-influence/route.ts",
  "app/api/atlas/relativity-evidence/v533/grid-axis-influence/route.test.ts",
  "app/components/KerrGridAxisInfluenceV533.tsx",
  "app/components/KerrGridAxisInfluenceV533.test.tsx",
  "app/components/kerrPhotonMetrologyDetailCatalogV533.ts",
  "app/components/kerrPhotonMetrologyDetailCatalogV533.test.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV533.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV533.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV533.test.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV532.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/run-kerr-grid-axis-influence-v533.py",
  "scripts/test-kerr-grid-axis-influence-v533.py",
  "scripts/build-kerr-grid-axis-influence-runtime-v533.ts",
  "scripts/build-shadow-candidate-v533.mjs",
  "scripts/build-shadow-v533.mjs",
  "scripts/verify-shadow-v533-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths
  .map((path) => ({ path, sha256: fileSha(path) }))
  .sort((a, b) => compare(a.path, b.path));
const status = "v533-deterministic-grid-axis-influence-qualified-operational-axis-prior-unavailable-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v533-evidence-v1",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  dependency: {
    v532EvidenceSha256: previousEvidence.evidenceSha256,
    v532PointerSha256: previousPointer.pointerSha256,
    v533AxisInfluenceArtifactSha256: artifact.artifactSha256,
    v533RuntimeArtifactSha256: runtime.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  oracle: artifact.oracle,
  influenceDefinition: artifact.influenceDefinition,
  stochasticDescriptor: {
    singleDominantAxis: artifact.stochasticInfluence.singleDominantAxis,
    singleDominantAxisPromotedToRecommendation: artifact.stochasticInfluence.singleDominantAxisPromotedToRecommendation,
    costRatio: artifact.stochasticInfluence.axisSummaries.find((row) => row.axis === "cost-ratio"),
  },
  deterministicDescriptor: {
    singleDominantAxis: artifact.deterministicInfluence.singleDominantAxis,
    singleDominantAxisPromotedToRecommendation: artifact.deterministicInfluence.singleDominantAxisPromotedToRecommendation,
    costRatio: artifact.deterministicInfluence.axisSummaries.find((row) => row.axis === "cost-ratio"),
  },
  influenceAudits: artifact.influenceAudits,
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
  qualificationStatement: "v533-qualifies-eight-deterministic-axis-summaries-and-twenty-four-directed-multi-metric-comparisons",
  boundaryStatement: "Cost-ratio is the unique deterministic multi-metric dominant destabilizing axis in both normalized stress families. This is not a probability, prior, measured operational priority, utility result, recommended axis, recommended allocation, detector product, or science-promotion claim.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v533",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v532Jackknife: "qualified-preserved",
    v533AxisSummaries: "qualified-8-of-8",
    v533DirectedMultiMetricComparisons: "qualified-24-of-24",
    v533StochasticDominantGridAxis: "cost-ratio-deterministic-grid-sensitivity-only",
    v533DeterministicDominantGridAxis: "cost-ratio-deterministic-grid-sensitivity-only",
    v533OperationalAxisImportance: "unavailable",
    v533AxisPrior: "unavailable",
    v533RecommendedAxis: "unavailable",
    v533RecommendedAllocation: "unavailable",
    v533ScientificGeometry: "qualified-46-identical-science-cinematic",
    v533SharedDetailCatalog: "qualified-35-of-35-one-new-lazy-import",
    v533MeasuredFileContract: "incomplete-0-of-6",
    v533ScienceRecovery: "blocked",
    v533ScienceRaster: "unavailable",
    v533RuntimeRequestPolicy: "qualified-auto-0-explicit-1-single-flight-2-consumers",
    v533Lifecycle: "qualified-baseline",
    v533BrowserQualification: "not-run",
    v533VisualMatrixQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    operationalAxisImportancePromotionAllowed: false,
    recommendedAxisAllowed: false,
    recommendedAllocationAllowed: false,
    scienceRecoveryAllowed: false,
    scienceRasterPayloadAllowed: false,
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

console.log(JSON.stringify({
  status,
  axisInfluenceArtifactSha256: artifact.artifactSha256,
  runtimeArtifactSha256: runtime.artifactSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  axisSummaries: 8,
  directedComparisons: 24,
  scientificGeometryInputs: 46,
  detailCatalog: "35/35",
  recommendedAxis: "unavailable",
  measuredCalibration: "0/6",
  denseCampaign: "0/49",
  browserQualification: "not-run",
  formalProductPointer: "v263",
}, null, 2));
