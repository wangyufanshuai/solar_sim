import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-allocation-regret-v530/atlas.json",
  runtime: "dist/science/kerr-allocation-regret-v530/runtime-audit.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v529-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v529.json",
  evidence: "dist/science/orbit-atlas-shadow-v530-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v530.json",
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
  artifact.version !== "v530-kerr-allocation-regret-fragility-atlas-v1" ||
  runtime.version !== "v530-kerr-allocation-regret-runtime-audit-v1" ||
  previousEvidence.version !== "orbit-atlas-shadow-v529-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v529" ||
  evidence.version !== "orbit-atlas-shadow-v530-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v530" ||
  sha(artifact) !== artifact.artifactSha256 ||
  sha(runtime) !== runtime.artifactSha256 ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  runtime.source.regretArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v530RegretArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v530RuntimeArtifactSha256 !== runtime.artifactSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(paths.evidence)
) {
  throw new Error("v530-canonical-chain");
}
if (
  artifact.counts.regretEvaluationCount !== 49000 ||
  artifact.counts.overheadAbsoluteRegretInvarianceComparisonCount !== 36750 ||
  artifact.counts.relativeRegretOverheadMonotonicityComparisonCount !== 36750 ||
  artifact.counts.scientificGeometryInputCount !== 148 ||
  artifact.displayGeometry.scientificGeometryInputCount !== 148 ||
  artifact.regretDefinition.absoluteRegretIndependentOfAdditiveOverhead !== true ||
  artifact.regretDefinition.relativeRegretDependsOnAdditiveOverheadNormalization !== true ||
  artifact.regretDefinition.gridCoverageIsProbability !== false ||
  artifact.regretDefinition.priorUsed !== false ||
  artifact.regretAudits.absoluteRegretOverheadInvariant !== true ||
  artifact.regretAudits.relativeRegretNonIncreasingWithOverhead !== true ||
  artifact.regretAudits.descriptiveMinimaxPromotedToRecommendation !== false ||
  artifact.selectionBoundary.modelPriorAvailable !== false ||
  artifact.selectionBoundary.recommendedAllocationAvailable !== false ||
  artifact.acquisitionBoundary.readyMeasuredFileCount !== 0 ||
  maxima.some((value) => value >= Number(artifact.limits.multiprecisionResidual)) ||
  artifact.qualification.allocationRegretAtlasQualified !== true ||
  artifact.qualification.operationalDecisionModelQualified !== false ||
  runtime.runtime.serverFileBytes > 512 * 1024 ||
  runtime.runtime.summaryResponseBytes > 128 * 1024 ||
  runtime.runtime.automaticRequestCount !== 0 ||
  runtime.runtime.explicitRequestCount !== 1 ||
  runtime.runtime.singleFlightConsumerCount !== 2 ||
  runtime.runtime.finalResourceStatus !== "baseline" ||
  runtime.detailCatalog.detailCount !== 32 ||
  runtime.detailCatalog.inheritedDetailCount !== 31 ||
  runtime.detailCatalog.newLazyImportCount !== 1 ||
  runtime.visualProfile.scientificGeometryStable !== true ||
  runtime.visualProfile.scientificGeometryInputCount !== 148 ||
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
  pointer.capabilities.v530RegretEvaluations !== "qualified-49000-of-49000" ||
  pointer.capabilities.v530ScientificGeometry !==
    "qualified-148-identical-science-cinematic" ||
  pointer.capabilities.v530SharedDetailCatalog !==
    "qualified-32-of-32-one-new-lazy-import" ||
  pointer.capabilities.v530RecommendedAllocation !== "unavailable" ||
  pointer.capabilities.v530MeasuredFileContract !== "incomplete-0-of-6" ||
  pointer.capabilities.v530BrowserQualification !== "not-run" ||
  pointer.capabilities.v314DenseCampaign !== "incomplete-0-of-49"
) {
  throw new Error("v530-science-boundary");
}

const component = text("app/components/KerrAllocationRegretV530.tsx");
const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV530.tsx");
const catalog = text("app/components/kerrPhotonMetrologyDetailCatalogV530.ts");
const route = text("app/api/atlas/relativity-evidence/v530/allocation-regret/route.ts");
const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
if (
  !component.includes("stochasticCandidateEnvelope") ||
  !component.includes("数学 minimax") ||
  !component.includes("网格覆盖率不是概率") ||
  component.includes("Math.random") ||
  component.includes("<canvas") ||
  component.includes("锟") ||
  !wrapper.includes("KERR_PHOTON_METROLOGY_DETAILS_V530[detail]") ||
  wrapper.includes("fetch(") ||
  wrapper.includes("锟") ||
  (catalog.match(/lazy\(/g) ?? []).length !== 1 ||
  !catalog.includes("...KERR_PHOTON_METROLOGY_DETAILS_V529") ||
  catalog.includes("fetch(") ||
  !route.includes('delivery !== "local-shadow"') ||
  !route.includes('download !== "atlas"') ||
  !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV530"') ||
  workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV529"')
) {
  throw new Error("v530-source-boundary");
}

for (const [label, source] of [
  ["artifact", artifact],
  ["runtime", runtime],
  ["evidence", evidence],
]) {
  if (!Array.isArray(source.sourceManifest) || source.sourceManifest.length === 0) {
    throw new Error(`v530-${label}-manifest-empty`);
  }
  for (const entry of source.sourceManifest) {
    if (fileSha(entry.path) !== entry.sha256) throw new Error(`v530-${label}-manifest:${entry.path}`);
  }
  if (sha(source.sourceManifest) !== source.sourceSha256) {
    throw new Error(`v530-${label}-manifest-canonical`);
  }
}
for (const path of Object.values(paths)) {
  if (statSync(resolve(root, path)).size <= 0) throw new Error(`v530-empty:${path}`);
}
console.log(
  JSON.stringify(
    {
      status: "passed-v530-low-memory-allocation-regret-and-v7r9-runtime",
      artifactSha256: artifact.artifactSha256,
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
