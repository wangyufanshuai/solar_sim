import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v523-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v523.json",
  artifact: "dist/science/kerr-analyzer-identifiability-v524/identifiability.json",
  runtime: "dist/science/kerr-analyzer-identifiability-v524/runtime-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v524-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v524.json",
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
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const maxima = Object.values(artifact.maxima).map(Number);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v523-evidence-v1"
  || sha(previousEvidence) !== previousEvidence.evidenceSha256
  || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v523"
  || sha(previousPointer) !== previousPointer.pointerSha256
  || artifact.version !== "v524-kerr-analyzer-identifiability-and-nullspace-v1"
  || sha(artifact) !== artifact.artifactSha256
  || runtime.version !== "v524-kerr-analyzer-identifiability-runtime-audit-v1"
  || sha(runtime) !== runtime.artifactSha256
  || runtime.source.identifiabilityArtifactSha256 !== artifact.artifactSha256
  || artifact.counts.matrixCount !== 3
  || artifact.counts.svdCount !== 3
  || artifact.counts.singularValueCount !== 9
  || artifact.counts.nullspaceDimension !== 2
  || artifact.counts.measuredCalibrationFileCount !== 0
  || maxima.some((value) => value >= Number(artifact.limits.multiprecisionResidual))
  || artifact.diagnostics.idealDualBeam8x3.rank !== 3
  || artifact.diagnostics.normalizedDifference4x2.rank !== 2
  || artifact.diagnostics.uncalibratedBiasAugmented4x6.rank !== 4
  || artifact.diagnostics.uncalibratedBiasAugmented4x6.nullity !== 2
  || artifact.qualification.calibrationNullspaceExposed !== true
  || artifact.qualification.jointScienceCalibrationIdentifiabilityQualified !== false
  || artifact.qualification.measuredInstrumentQualified !== false
  || artifact.qualification.scienceAuthorityPromotionAllowed !== false
  || runtime.runtime.automaticRequestCount !== 0
  || runtime.runtime.explicitRequestCount !== 1
  || runtime.runtime.singleFlightConsumerCount !== 2
  || runtime.runtime.finalResourceStatus !== "baseline"
  || runtime.visualProfile.scientificPayloadStable !== true
  || runtime.visualProfile.scientificRowsStable !== true
  || runtime.visualProfile.numericScientificStyleInputCount !== 0
  || runtime.visualProfile.rankDrivesStyle !== false
  || runtime.visualProfile.conditionNumberDrivesStyle !== false
  || runtime.visualProfile.nullityDrivesStyle !== false
  || detector.counts.measuredCalibrationFiles !== 0
  || detector.counts.requiredMeasuredCalibrationFiles !== 6
  || dense.status !== "incomplete-0-of-49"
  || dense.completedShardCount !== 0
  || dense.attemptConsumed !== false
  || dense.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v524-evidence-boundary");

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.artifact,
  paths.runtime,
  paths.detector,
  paths.dense,
  paths.formal,
  "app/lib/kerrAnalyzerIdentifiabilityV524.ts",
  "app/lib/kerrAnalyzerIdentifiabilityV524.test.ts",
  "app/lib/kerrAnalyzerIdentifiabilityServerV524.ts",
  "app/lib/kerrAnalyzerIdentifiabilityServerV524.test.ts",
  "app/lib/kerrAnalyzerIdentifiabilityClientV524.ts",
  "app/lib/kerrAnalyzerIdentifiabilityClientV524.test.ts",
  "app/api/atlas/relativity-evidence/v524/analyzer-identifiability/route.ts",
  "app/api/atlas/relativity-evidence/v524/analyzer-identifiability/route.test.ts",
  "app/components/KerrAnalyzerIdentifiabilityV524.tsx",
  "app/components/KerrAnalyzerIdentifiabilityV524.test.tsx",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV524.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV524.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV524.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV524.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/run-kerr-analyzer-identifiability-v524.py",
  "scripts/test-kerr-analyzer-identifiability-v524.py",
  "scripts/build-kerr-analyzer-identifiability-runtime-v524.ts",
  "scripts/build-shadow-candidate-v524.mjs",
  "scripts/build-shadow-v524.mjs",
  "scripts/verify-shadow-v524-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths
  .map((path) => ({ path, sha256: fileSha(path) }))
  .sort((a, b) => a.path.localeCompare(b.path));
const status = "v524-ideal-analyzer-identifiability-qualified-calibration-nullspace-exposed-no-measured-authority-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v524-evidence-v1",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  dependency: {
    v523EvidenceSha256: previousEvidence.evidenceSha256,
    v523PointerSha256: previousPointer.pointerSha256,
    v524IdentifiabilityArtifactSha256: artifact.artifactSha256,
    v524RuntimeArtifactSha256: runtime.artifactSha256,
    v511InstrumentMatrixSha256: detector.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  oracle: artifact.oracle,
  diagnostics: artifact.diagnostics,
  nullspace: artifact.nullspace,
  counts: artifact.counts,
  maxima: artifact.maxima,
  limits: artifact.limits,
  qualification: artifact.qualification,
  runtime: runtime.runtime,
  visualProfile: runtime.visualProfile,
  detectorBoundary: {
    measuredCalibrationFiles: detector.counts.measuredCalibrationFiles,
    requiredMeasuredCalibrationFiles: detector.counts.requiredMeasuredCalibrationFiles,
    detectorAuthorityAvailable: detector.boundary.detectorResponseAvailable,
    scienceRasterAvailable: detector.boundary.scienceRasterAvailable,
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
  qualificationStatement: "v524-three-analyzer-operators-nine-singular-values-and-two-dimensional-calibration-nullspace-qualified-with-80-digit-svd",
  boundaryStatement: "The result qualifies ideal operator rank, conditioning, pseudoinverse, and a reduced linearized calibration nullspace only. It supplies no measured Mueller calibration, expected electrons, observed counts, dense image, or product promotion.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v524",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v523IdealAnalyzer: "qualified-preserved",
    v524MatrixOperators: "qualified-3-of-3",
    v524SvdExecutions: "qualified-3-of-3",
    v524SingularValues: "qualified-9-of-9",
    v524IdealBeamRank: "qualified-rank-3-nullity-0",
    v524NormalizedDifferenceRank: "qualified-rank-2-nullity-0",
    v524CalibrationNullspace: "exposed-rank-4-nullity-2",
    v524JointScienceCalibrationIdentifiability: "blocked-nullity-2",
    v524MeasuredCalibration: "incomplete-0-of-6",
    v524ExpectedElectronCounts: "unavailable-0-rows",
    v524ObservedCounts: "unavailable-0-rows",
    v524ScienceRaster: "unavailable",
    v524V7R3ScientificRows: "qualified-identical-science-cinematic",
    v524V7R3StyleIsolation: "qualified-zero-numeric-scientific-style-inputs",
    v524RuntimeRequestPolicy: "qualified-auto-0-explicit-1-single-flight-2-consumers",
    v524Lifecycle: "qualified-baseline",
    v524BrowserQualification: "not-run",
    v524VisualMatrixQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    measuredInstrumentPromotionAllowed: false,
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
  identifiabilityArtifactSha256: artifact.artifactSha256,
  runtimeArtifactSha256: runtime.artifactSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  matrices: artifact.counts.matrixCount,
  singularValues: artifact.counts.singularValueCount,
  nullspaceDimension: artifact.counts.nullspaceDimension,
  measuredCalibration: "0/6",
  denseCampaign: "0/49",
  browserQualification: "not-run",
  formalProductPointer: "v263",
}, null, 2));
