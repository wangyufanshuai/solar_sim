import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v492-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v492.json",
  artifact: "dist/science/kerr-redshift-edge-redundancy-v493/edge-redundancy.json",
  svg: "dist/science/kerr-redshift-edge-redundancy-v493/edge-redundancy.svg",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v493-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v493.json",
};
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "stageChainSha256", "evidenceSha256", "pointerSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`); renameSync(part, target); };

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const payload = { edgeLeverages: artifact.edgeLeverages, deletionCases: artifact.deletionCases };

if (
  previousEvidence.version !== "orbit-atlas-shadow-v492-evidence-v1" || sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v492" || sha(previousPointer) !== previousPointer.pointerSha256 ||
  artifact.version !== "v493-kerr-redshift-edge-redundancy-artifact-v1" || sha(artifact) !== artifact.artifactSha256 || sha(payload) !== artifact.payloadSha256 ||
  fileSha(paths.svg) !== artifact.vectorDiagnostic.fileSha256 || artifact.edgeLeverages.length !== 6 || artifact.deletionCases.length !== 6 ||
  artifact.audit.maximumLeverageResidual > 1e-15 || artifact.audit.maximumDeletionEigenvalueResidual > 5e-15 ||
  artifact.audit.maximumDeletionNodeResidual > 1e-15 || artifact.audit.maximumRetainedEdgeResidual > 1e-15 || artifact.audit.maximumRemovedEdgePredictionResidual > 1e-15 || artifact.audit.maximumDeletionPenroseResidual > 1e-15 ||
  artifact.contract.statisticalJackknifeAuthorityGranted !== false || artifact.contract.noiseRobustnessAuthorityGranted !== false || artifact.contract.rssAllowed !== false ||
  artifact.boundary.scienceRasterAuthorityGranted !== false || dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v493-evidence-boundary");

const sourcePaths = [
  paths.previousEvidence, paths.previousPointer, paths.artifact, paths.svg, paths.dense, paths.formal,
  "app/lib/kerrRedshiftEdgeRedundancyV493.ts", "app/lib/kerrRedshiftEdgeRedundancyV493.test.ts",
  "app/lib/kerrRedshiftEdgeRedundancyServerV493.ts", "app/lib/kerrRedshiftEdgeRedundancyServerV493.test.ts",
  "app/lib/kerrRedshiftEdgeRedundancyClientV493.ts", "app/lib/kerrRedshiftEdgeRedundancyClientV493.test.ts",
  "app/components/KerrRedshiftEdgeRedundancyV493.tsx", "app/components/KerrRedshiftEdgeRedundancyV493.test.tsx",
  "app/api/atlas/relativity-evidence/v493/redshift-edge-redundancy/route.ts", "app/api/atlas/relativity-evidence/v493/redshift-edge-redundancy/route.test.ts",
  "app/local-shadow-v493/page.tsx", "scripts/build-kerr-redshift-edge-redundancy-v493.mjs",
  "scripts/build-shadow-candidate-v493.mjs", "scripts/build-shadow-v493.mjs", "scripts/verify-shadow-v493-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v493-k4-edge-deletion-redundancy-qualified-statistical-robustness-blocked-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v493-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v492EvidenceSha256: previousEvidence.evidenceSha256,
    v492EvidenceFileSha256: fileSha(paths.previousEvidence),
    v492PointerSha256: previousPointer.pointerSha256,
    v492PointerFileSha256: fileSha(paths.previousPointer),
    v493ArtifactSha256: artifact.artifactSha256,
    v493ArtifactFileSha256: fileSha(paths.artifact),
    v493PayloadSha256: artifact.payloadSha256,
    v493SvgSha256: artifact.vectorDiagnostic.fileSha256,
    v314StateSha256: dense.stateSha256,
  },
  graph: {
    nodeCount: 4, fullEdgeCount: 6, deletionCaseCount: 6, retainedEdgeCountPerCase: 5,
    fullGraphRank: 3, fullGraphGaugeNullity: 1, fullGraphCycleSpaceDimension: 3,
    deletionLaplacianSpectrum: [0, 2, 4, 4], deletionRank: 3, deletionGaugeNullity: 1,
    deletionNonzeroConditionNumber: 2, expectedEdgeLeverage: 0.5, leverageSum: 3, bridgeCount: 0,
  },
  invariants: {
    maximumLeverageResidual: artifact.audit.maximumLeverageResidual,
    maximumDeletionEigenvalueResidual: artifact.audit.maximumDeletionEigenvalueResidual,
    maximumDeletionNodeResidual: artifact.audit.maximumDeletionNodeResidual,
    maximumRetainedEdgeResidual: artifact.audit.maximumRetainedEdgeResidual,
    maximumRemovedEdgePredictionResidual: artifact.audit.maximumRemovedEdgePredictionResidual,
    maximumDeletionPenroseResidual: artifact.audit.maximumDeletionPenroseResidual,
    maximumDeletionConditionNumber: artifact.audit.maximumDeletionConditionNumber,
  },
  uncertainty: {
    policy: artifact.contract.uncertaintyCombinationPolicy,
    rssAllowed: false,
    crossEdgeCorrelation: "unknown",
    statisticalJackknifeAuthorityGranted: false,
    noiseRobustnessAuthorityGranted: false,
  },
  runtime: {
    localShadowEntry: "app/local-shadow-v493/page.tsx",
    endpoint: "/api/atlas/relativity-evidence/v493/redshift-edge-redundancy",
    explicitIntentRequired: true,
    requestCountBeforeIntent: 0,
    clientSingleFlight: true,
    maximumResponseBytes: 128 * 1024,
    summaryMatrixElementCount: 0,
    standaloneVisible: false,
    liteVisible: false,
  },
  scienceCinematicBoundary: {
    sharedPayloadSha256: artifact.payloadSha256,
    sharedSvgSha256: artifact.vectorDiagnostic.fileSha256,
    scienceLinearDisplay: true,
    scienceBloomIntensity: 0,
    scienceColorGradeIntensity: 0,
    cinematicShellMayChange: true,
    reconstructionMutationAllowed: false,
    uncertaintyMutationAllowed: false,
    scienceWritebackAllowed: false,
  },
  audit: artifact.audit,
  lifecycle: artifact.lifecycle,
  boundary: artifact.boundary,
  qualification: {
    edgeLeverage: "qualified-0.5-each-sum-3",
    deletionConnectivity: "qualified-6-of-6",
    deletionSpectrum: "qualified-analytic-and-numerical-audited",
    heldEdgePrediction: "qualified-deterministic-algebraic-only",
    graphGauge: "unresolved-nullity-1",
    linearUncertaintyUpperBound: "qualified-correlation-unknown",
    statisticalJackknife: "blocked-not-claimed",
    noiseRobustness: "blocked-not-claimed",
    physicalBandpass: "blocked",
    observedIntensity: "blocked",
    statisticalLikelihood: "blocked",
    scienceRaster: "blocked",
    browser: "not-run",
    visualMatrix: "not-run",
    soak: "not-run",
    rtxWebGpu: "not-run",
  },
  denseCampaign: { namespace: "v314", status: dense.status, completedShardCount: dense.completedShardCount, plannedShardCount: dense.plannedShardCount, attemptConsumed: dense.attemptConsumed, aggregateAvailable: dense.aggregateAvailable },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerAdvanced: false, ordinaryStandaloneProfile: "legacy-v9", liteProfile: "legacy-v9", localShadowDefaultProfile: "legacy-v9", localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundaryStatement: "v493-six-k4-leave-one-edge-out-deterministic-reconstructions-only-not-a-statistical-jackknife-no-noise-robustness-calibration-intensity-raster-dense-authority-or-promotion",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v493",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v491GaugeReconstruction: "qualified-relative-only",
    v492FiveLevelIntent: "source-qualified-browser-not-run",
    v493EdgeLeverage: "qualified-0.5-each-sum-3",
    v493DeletionConnectivity: "qualified-6-of-6",
    v493DeletionSpectrum: "qualified-analytic-and-numerical-audited",
    v493HeldEdgePrediction: "qualified-deterministic-algebraic-only",
    v493StatisticalJackknife: "blocked-not-claimed",
    v493NoiseRobustness: "blocked-not-claimed",
    v493PhysicalObservables: "blocked",
    v493ScienceRaster: "blocked",
    v493BrowserQualification: "not-run",
    v493VisualMatrixQualification: "not-run",
    v493SoakQualification: "not-run",
    v493RtxWebGpuQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: { promotionAllowed: false, scienceRasterPayloadAllowed: false, fitsWriteAllowed: false, pngWriteAllowed: false, localShadowDefaultApplied: false },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status, artifactSha256: artifact.artifactSha256, payloadSha256: artifact.payloadSha256, svgSha256: artifact.vectorDiagnostic.fileSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, deletionCases: 6, maximumDeletionEigenvalueResidual: artifact.audit.maximumDeletionEigenvalueResidual, maximumRemovedEdgePredictionResidual: artifact.audit.maximumRemovedEdgePredictionResidual, statisticalJackknife: "blocked-not-claimed", sciencePixels: 0, denseCampaign: "0/49" }, null, 2));
