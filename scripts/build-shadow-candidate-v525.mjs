import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v524-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v524.json",
  artifact: "dist/science/kerr-calibration-excitation-design-v525/design.json",
  runtime: "dist/science/kerr-calibration-excitation-design-v525/runtime-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v525-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v525.json",
};
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
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
  previousEvidence.version !== "orbit-atlas-shadow-v524-evidence-v1"
  || sha(previousEvidence) !== previousEvidence.evidenceSha256
  || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v524"
  || sha(previousPointer) !== previousPointer.pointerSha256
  || artifact.version !== "v525-kerr-calibration-excitation-design-v1"
  || sha(artifact) !== artifact.artifactSha256
  || runtime.version !== "v525-kerr-calibration-excitation-design-runtime-audit-v1"
  || sha(runtime) !== runtime.artifactSha256
  || runtime.source.designArtifactSha256 !== artifact.artifactSha256
  || artifact.baseDesign.rank !== 4
  || artifact.baseDesign.nullity !== 2
  || artifact.counts.candidateConstraintCount !== 8
  || artifact.counts.candidatePairCount !== 28
  || artifact.counts.fullRankPairCount !== 9
  || artifact.counts.uniqueDOptimalPairCount !== 1
  || artifact.selectedDesign.constraintIds.join("|") !== "delta-q-pair|delta-u-pair"
  || artifact.selectedDesign.minimumConstraintCount !== 2
  || artifact.selectedDesign.rank !== 6
  || artifact.selectedDesign.nullity !== 0
  || artifact.selectedDesign.nullspaceCouplingRank !== 2
  || artifact.selectedDesign.uniqueDOptimalWithinCandidateSet !== true
  || artifact.selectedDesign.constraintValuesAvailable !== false
  || artifact.selectedDesign.scienceRecoveryExecutable !== false
  || artifact.acquisitionBoundary.algebraicConstraintCount !== 2
  || artifact.acquisitionBoundary.measuredFileContractCount !== 6
  || artifact.acquisitionBoundary.countsAreDistinctContracts !== true
  || artifact.acquisitionBoundary.designReplacesMeasuredAcquisition !== false
  || artifact.acquisitionBoundary.readyMeasuredFileCount !== 0
  || maxima.some((value) => value >= Number(artifact.limits.multiprecisionResidual))
  || artifact.qualification.calibrationDesignQualified !== true
  || artifact.qualification.measuredCalibrationQualified !== false
  || artifact.qualification.measuredInstrumentQualified !== false
  || artifact.qualification.scienceAuthorityPromotionAllowed !== false
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
) throw new Error("v525-evidence-boundary");

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.artifact,
  paths.runtime,
  paths.detector,
  paths.intake,
  paths.dense,
  paths.formal,
  "app/lib/kerrCalibrationExcitationDesignV525.ts",
  "app/lib/kerrCalibrationExcitationDesignV525.test.ts",
  "app/lib/kerrCalibrationExcitationDesignServerV525.ts",
  "app/lib/kerrCalibrationExcitationDesignServerV525.test.ts",
  "app/lib/kerrCalibrationExcitationDesignClientV525.ts",
  "app/lib/kerrCalibrationExcitationDesignClientV525.test.ts",
  "app/api/atlas/relativity-evidence/v525/calibration-excitation-design/route.ts",
  "app/api/atlas/relativity-evidence/v525/calibration-excitation-design/route.test.ts",
  "app/components/KerrCalibrationExcitationDesignV525.tsx",
  "app/components/KerrCalibrationExcitationDesignV525.test.tsx",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV525.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV525.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV525.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV525.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/run-kerr-calibration-excitation-design-v525.py",
  "scripts/test-kerr-calibration-excitation-design-v525.py",
  "scripts/build-kerr-calibration-excitation-design-runtime-v525.ts",
  "scripts/build-shadow-candidate-v525.mjs",
  "scripts/build-shadow-v525.mjs",
  "scripts/verify-shadow-v525-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths
  .map((path) => ({ path, sha256: fileSha(path) }))
  .sort((a, b) => a.path.localeCompare(b.path));
const status = "v525-minimum-calibration-design-qualified-measured-values-and-instrument-authority-unavailable-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v525-evidence-v1",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  dependency: {
    v524EvidenceSha256: previousEvidence.evidenceSha256,
    v524PointerSha256: previousPointer.pointerSha256,
    v525DesignArtifactSha256: artifact.artifactSha256,
    v525RuntimeArtifactSha256: runtime.artifactSha256,
    v511InstrumentMatrixSha256: detector.artifactSha256,
    v458IntakeArtifactSha256: intake.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  oracle: artifact.oracle,
  baseDesign: artifact.baseDesign,
  selectedDesign: artifact.selectedDesign,
  acquisitionBoundary: artifact.acquisitionBoundary,
  counts: artifact.counts,
  maxima: artifact.maxima,
  limits: artifact.limits,
  qualification: artifact.qualification,
  runtime: runtime.runtime,
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
  qualificationStatement: "v525-proves-a-two-scalar-row-lower-bound-and-selects-the-unique-d-optimal-delta-q-delta-u-pair-within-eight-candidate-constraints",
  boundaryStatement: "Algebraic design sufficiency does not supply measured constraint values and does not replace the six-file measured detector intake contract; science recovery, electrons, counts, images, and product promotion remain unavailable.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v525",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v524AnalyzerIdentifiability: "qualified-preserved",
    v525CandidateConstraints: "qualified-8-of-8",
    v525CandidatePairs: "qualified-28-of-28",
    v525FullRankPairs: "identified-9-of-28",
    v525MinimumConstraintLowerBound: "qualified-2-scalar-rows",
    v525SelectedDesign: "qualified-delta-q-delta-u-rank-6-nullity-0",
    v525DOptimality: "qualified-unique-within-candidate-set",
    v525ConstraintValues: "unavailable",
    v525ScienceRecovery: "blocked-no-measured-constraint-values",
    v525MeasuredFileContract: "incomplete-0-of-6",
    v525ExpectedElectronCounts: "unavailable-0-rows",
    v525ObservedCounts: "unavailable-0-rows",
    v525ScienceRaster: "unavailable",
    v525V7R4ScientificRows: "qualified-identical-science-cinematic",
    v525V7R4StyleIsolation: "qualified-zero-numeric-scientific-style-inputs",
    v525RuntimeRequestPolicy: "qualified-auto-0-explicit-1-single-flight-2-consumers",
    v525Lifecycle: "qualified-baseline",
    v525BrowserQualification: "not-run",
    v525VisualMatrixQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    measuredInstrumentPromotionAllowed: false,
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
console.log(JSON.stringify({
  status,
  designArtifactSha256: artifact.artifactSha256,
  runtimeArtifactSha256: runtime.artifactSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  candidatePairs: artifact.counts.candidatePairCount,
  fullRankPairs: artifact.counts.fullRankPairCount,
  selectedConstraints: artifact.selectedDesign.constraintIds,
  measuredCalibration: "0/6",
  denseCampaign: "0/49",
  browserQualification: "not-run",
  formalProductPointer: "v263",
}, null, 2));
