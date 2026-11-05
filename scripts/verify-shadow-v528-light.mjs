import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-calibration-cost-sensitivity-v528/sensitivity.json",
  runtime: "dist/science/kerr-calibration-cost-sensitivity-v528/runtime-audit.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v527-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v527.json",
  evidence: "dist/science/orbit-atlas-shadow-v528-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v528.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
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
const text = (path) => bytes(path).toString("utf8");
const read = (path) => JSON.parse(text(path));
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

const artifact = read(paths.artifact);
const runtime = read(paths.runtime);
const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const evidence = read(paths.evidence);
const pointer = read(paths.pointer);
const detector = read(paths.detector);
const intake = read(paths.intake);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const maxima = Object.values(artifact.maxima).map(Number);
if (
  artifact.version !== "v528-kerr-calibration-cost-sensitivity-v1" ||
  runtime.version !== "v528-kerr-calibration-cost-sensitivity-runtime-audit-v1" ||
  previousEvidence.version !== "orbit-atlas-shadow-v527-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v527" ||
  evidence.version !== "orbit-atlas-shadow-v528-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v528" ||
  sha(artifact) !== artifact.artifactSha256 ||
  sha(runtime) !== runtime.artifactSha256 ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  runtime.source.sensitivityArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v528SensitivityArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v528RuntimeArtifactSha256 !== runtime.artifactSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(paths.evidence)
) {
  throw new Error("v528-canonical-chain");
}
if (
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
  artifact.assumedCostLaw.stressModelOnlyNotOperationalCost !== true ||
  artifact.assumedCostLaw.inverseSquareLawValidatedForInstrument !== false ||
  artifact.selectionBoundary.calibrationToScienceCostRatioAvailable !== false ||
  artifact.selectionBoundary.recommendedAllocationAvailable !== false ||
  artifact.selectionBoundary.operationalSchedulingAllowed !== false ||
  artifact.acquisitionBoundary.readyMeasuredFileCount !== 0 ||
  artifact.acquisitionBoundary.numericalScienceErrorBarsAvailable !== false ||
  maxima.some((value) => value >= Number(artifact.limits.multiprecisionResidual)) ||
  artifact.qualification.parametricCostSensitivityQualified !== true ||
  artifact.qualification.operationalCostModelQualified !== false ||
  runtime.runtime.serverFileBytes > 128 * 1024 ||
  runtime.runtime.summaryResponseBytes > 128 * 1024 ||
  runtime.runtime.automaticRequestCount !== 0 ||
  runtime.runtime.explicitRequestCount !== 1 ||
  runtime.runtime.singleFlightConsumerCount !== 2 ||
  runtime.runtime.finalResourceStatus !== "baseline" ||
  runtime.detailCatalog.detailCount !== 30 ||
  runtime.detailCatalog.uniqueDetailCount !== 30 ||
  runtime.detailCatalog.concurrentDetailSurfaceBudget !== 1 ||
  runtime.detailCatalog.automaticDetailRequestCount !== 0 ||
  runtime.visualProfile.scientificGeometryStable !== true ||
  runtime.visualProfile.scientificGeometryInputCount !== 34 ||
  runtime.visualProfile.numericScientificStyleInputCount !== 0 ||
  detector.counts.measuredCalibrationFiles !== 0 ||
  detector.counts.requiredMeasuredCalibrationFiles !== 6 ||
  intake.inspect.readyFileCount !== 0 ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84 ||
  pointer.formalProductPointer !== "v263" ||
  pointer.localShadowDefaultApplied !== false ||
  pointer.capabilities.v528ScientificGeometry !==
    "qualified-34-identical-science-cinematic" ||
  pointer.capabilities.v528SharedDetailCatalog !==
    "qualified-30-of-30-single-active-surface" ||
  pointer.capabilities.v528CostLaw !== "unvalidated-stress-model-only" ||
  pointer.capabilities.v528CalibrationToScienceCostRatio !== "unavailable" ||
  pointer.capabilities.v528RecommendedAllocation !== "unavailable" ||
  pointer.capabilities.v528OperationalSchedule !== "unavailable" ||
  pointer.capabilities.v528MeasuredFileContract !== "incomplete-0-of-6" ||
  pointer.capabilities.v528BrowserQualification !== "not-run" ||
  pointer.capabilities.v314DenseCampaign !== "incomplete-0-of-49"
) {
  throw new Error("v528-science-boundary");
}

const component = text("app/components/KerrCalibrationCostSensitivityV528.tsx");
const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV528.tsx");
const catalog = text("app/components/kerrPhotonMetrologyDetailCatalogV528.ts");
const route = text(
  "app/api/atlas/relativity-evidence/v528/calibration-cost-sensitivity/route.ts",
);
const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
if (
  !component.includes("scientificGeometry.stochastic") ||
  !component.includes("成本比改变解析最优点") ||
  !component.includes("Assumption firewall") ||
  component.includes("Math.random") ||
  component.includes("<canvas") ||
  component.includes("锟") ||
  !wrapper.includes("KERR_PHOTON_METROLOGY_DETAILS_V528[detail]") ||
  wrapper.includes("fetch(") ||
  wrapper.includes("锟") ||
  (catalog.match(/lazy\(/g) ?? []).length !== 30 ||
  catalog.includes("fetch(") ||
  !route.includes('delivery!=="local-shadow"') ||
  !route.includes('download!=="sensitivity"') ||
  !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV528"') ||
  workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV527"')
) {
  throw new Error("v528-source-boundary");
}

for (const [label, source] of [
  ["artifact", artifact],
  ["runtime", runtime],
  ["evidence", evidence],
]) {
  if (!Array.isArray(source.sourceManifest) || source.sourceManifest.length === 0) {
    throw new Error(`v528-${label}-manifest-empty`);
  }
  for (const entry of source.sourceManifest) {
    if (fileSha(entry.path) !== entry.sha256) throw new Error(`v528-${label}-manifest:${entry.path}`);
  }
  if (sha(source.sourceManifest) !== source.sourceSha256) {
    throw new Error(`v528-${label}-manifest-canonical`);
  }
}
for (const path of Object.values(paths)) {
  if (statSync(resolve(root, path)).size <= 0) throw new Error(`v528-empty:${path}`);
}
console.log(
  JSON.stringify(
    {
      status: "passed-v528-low-memory-cost-sensitivity-shared-catalog-and-v7r7-runtime",
      artifactSha256: artifact.artifactSha256,
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
