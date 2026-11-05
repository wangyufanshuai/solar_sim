import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-calibration-excitation-design-v525/design.json",
  runtime: "dist/science/kerr-calibration-excitation-design-v525/runtime-audit.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v524-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v524.json",
  evidence: "dist/science/orbit-atlas-shadow-v525-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v525.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
};
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const text = (path) => bytes(path).toString("utf8");
const read = (path) => JSON.parse(text(path));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !transient.has(key))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

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
if (
  artifact.version !== "v525-kerr-calibration-excitation-design-v1"
  || runtime.version !== "v525-kerr-calibration-excitation-design-runtime-audit-v1"
  || previousEvidence.version !== "orbit-atlas-shadow-v524-evidence-v1"
  || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v524"
  || evidence.version !== "orbit-atlas-shadow-v525-evidence-v1"
  || pointer.version !== "orbit-atlas-current-local-shadow-candidate-v525"
  || sha(artifact) !== artifact.artifactSha256
  || sha(runtime) !== runtime.artifactSha256
  || sha(previousEvidence) !== previousEvidence.evidenceSha256
  || sha(previousPointer) !== previousPointer.pointerSha256
  || sha(evidence) !== evidence.evidenceSha256
  || sha(pointer) !== pointer.pointerSha256
  || runtime.source.designArtifactSha256 !== artifact.artifactSha256
  || evidence.dependency.v525DesignArtifactSha256 !== artifact.artifactSha256
  || evidence.dependency.v525RuntimeArtifactSha256 !== runtime.artifactSha256
  || pointer.evidence.canonicalSha256 !== evidence.evidenceSha256
  || pointer.evidence.fileSha256 !== fileSha(paths.evidence)
) throw new Error("v525-canonical-chain");

const maxima = Object.values(artifact.maxima).map(Number);
if (
  artifact.baseDesign.rank !== 4
  || artifact.baseDesign.nullity !== 2
  || artifact.candidateConstraints.length !== 8
  || artifact.pairEnumeration.length !== 28
  || artifact.pairEnumeration.filter((entry) => entry.fullRank).length !== 9
  || artifact.selectedDesign.constraintIds.join("|") !== "delta-q-pair|delta-u-pair"
  || artifact.selectedDesign.minimumConstraintCount !== 2
  || artifact.selectedDesign.rank !== 6
  || artifact.selectedDesign.nullity !== 0
  || artifact.selectedDesign.nullspaceCouplingRank !== 2
  || artifact.selectedDesign.uniqueDOptimalWithinCandidateSet !== true
  || artifact.selectedDesign.constraintValuesAvailable !== false
  || artifact.selectedDesign.scienceRecoveryExecutable !== false
  || Number(artifact.selectedDesign.conditionNumber) !== 1 + Math.sqrt(2)
  || Number(artifact.selectedDesign.gramDeterminant) !== 4
  || artifact.acquisitionBoundary.algebraicConstraintCount !== 2
  || artifact.acquisitionBoundary.measuredFileContractCount !== 6
  || artifact.acquisitionBoundary.countsAreDistinctContracts !== true
  || artifact.acquisitionBoundary.readyMeasuredFileCount !== 0
  || artifact.acquisitionBoundary.designReplacesMeasuredAcquisition !== false
  || maxima.some((value) => value >= Number(artifact.limits.multiprecisionResidual))
  || artifact.qualification.calibrationDesignQualified !== true
  || artifact.qualification.measuredCalibrationQualified !== false
  || artifact.qualification.measuredInstrumentQualified !== false
  || artifact.qualification.scienceAuthorityPromotionAllowed !== false
  || runtime.runtime.serverFileBytes > 128 * 1024
  || runtime.runtime.summaryResponseBytes > 128 * 1024
  || runtime.runtime.automaticRequestCount !== 0
  || runtime.runtime.explicitRequestCount !== 1
  || runtime.runtime.singleFlightConsumerCount !== 2
  || runtime.runtime.finalResourceStatus !== "baseline"
  || runtime.visualProfile.scientificPayloadStable !== true
  || runtime.visualProfile.scientificRowsStable !== true
  || runtime.visualProfile.numericScientificStyleInputCount !== 0
  || detector.counts.measuredCalibrationFiles !== 0
  || detector.counts.requiredMeasuredCalibrationFiles !== 6
  || intake.contract.requiredFileCount !== 6
  || intake.inspect.readyFileCount !== 0
  || intake.inspect.attemptConsumed !== false
  || dense.status !== "incomplete-0-of-49"
  || dense.completedShardCount !== 0
  || dense.attemptConsumed !== false
  || dense.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84
  || pointer.formalProductPointer !== "v263"
  || pointer.localShadowDefaultApplied !== false
  || pointer.capabilities.v525CandidatePairs !== "qualified-28-of-28"
  || pointer.capabilities.v525SelectedDesign !== "qualified-delta-q-delta-u-rank-6-nullity-0"
  || pointer.capabilities.v525MeasuredFileContract !== "incomplete-0-of-6"
  || pointer.capabilities.v525BrowserQualification !== "not-run"
  || pointer.capabilities.v314DenseCampaign !== "incomplete-0-of-49"
) throw new Error("v525-science-boundary");

const component = text("app/components/KerrCalibrationExcitationDesignV525.tsx");
const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV525.tsx");
const route = text("app/api/atlas/relativity-evidence/v525/calibration-excitation-design/route.ts");
const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
if (
  !component.includes("compareKerrCalibrationDesignHudEncodingsV525")
  || !component.includes("两者不是同一计数")
  || !component.includes("science recovery 仍不可执行")
  || component.includes("Math.random")
  || component.includes("<canvas")
  || component.includes("锟")
  || !wrapper.includes('import("./KerrCalibrationExcitationDesignV525")')
  || wrapper.includes("fetch(")
  || wrapper.includes("锟")
  || !route.includes('delivery !== "local-shadow"')
  || !route.includes('download !== "design"')
  || !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV525"')
  || !workbench.includes("<KerrPhotonMetrologyObservatoryIntentV525")
) throw new Error("v525-source-boundary");

for (const [label, source] of [["artifact", artifact], ["runtime", runtime], ["evidence", evidence]]) {
  if (!Array.isArray(source.sourceManifest) || source.sourceManifest.length === 0) {
    throw new Error(`v525-${label}-manifest-empty`);
  }
  for (const entry of source.sourceManifest) {
    if (fileSha(entry.path) !== entry.sha256) throw new Error(`v525-${label}-manifest:${entry.path}`);
  }
  if (sha(source.sourceManifest) !== source.sourceSha256) {
    throw new Error(`v525-${label}-manifest-canonical`);
  }
}
for (const path of Object.values(paths)) {
  if (statSync(resolve(root, path)).size <= 0) throw new Error(`v525-empty:${path}`);
}
console.log(JSON.stringify({
  status: "passed-v525-low-memory-calibration-excitation-design-and-v7r4-runtime",
  artifactSha256: artifact.artifactSha256,
  runtimeArtifactSha256: runtime.artifactSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  candidatePairs: artifact.counts.candidatePairCount,
  fullRankPairs: artifact.counts.fullRankPairCount,
  selectedConstraints: artifact.selectedDesign.constraintIds,
  selectedConditionNumber: Number(artifact.selectedDesign.conditionNumber),
  measuredCalibration: "0/6",
  denseCampaign: "0/49",
  browserQualification: "not-run",
  formalProductPointer: "v263",
}, null, 2));
