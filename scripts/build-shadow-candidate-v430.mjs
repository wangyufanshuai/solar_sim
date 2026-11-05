import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v429-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v429.json",
  v429Artifact: "dist/science/kerr-high-energy-response-uncertainty-v429/response-uncertainty.json",
  artifact: "dist/science/kerr-high-energy-count-likelihood-v430/count-likelihood.json",
  oracle: "dist/science/kerr-high-energy-count-likelihood-v430/count-likelihood-oracle.json",
  contract: "dist/science/kerr-high-energy-count-likelihood-v430/likelihood-contract.json",
  exportManifest: "dist/science/kerr-high-energy-count-likelihood-v430/export-manifest.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v430-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v430.json",
};
const expected = Object.freeze({
  previousEvidenceCanonical: "b0444dfa94b2fe0539b3ed71e408a2b434147c5aa5385e79d645e45d82a54d44",
  previousEvidenceFile: "aaff03c4612a86cc15921835603fd7fae4782f84cd8526fa985a22b25b3b1d00",
  previousPointerCanonical: "f18264b20622db20cbbff8fc46256d99f5d4ce450c246a07b708b6787a8ea9b7",
  previousPointerFile: "874f68654e8a80d06423255ad58e2c882fc131c2080e03b7ed54671cd5f1695c",
  v429ArtifactCanonical: "aa176b9546928c880b9ab72ef49f8223a552fc08025cec2ccedc1add49d15e8d",
  v429ArtifactFile: "fbf01ca284af3a8eaaa561b66c73d090202206f9635428330450616ab31ddfde",
  oracleCanonical: "8c687b293a3b8792767e4ff515932bd31d8e520b28207663e0601ec36b336294",
  artifactCanonical: "e666aa7c7d7f65dcc65e91e3e1075b60752f1996aa5d7deba6878c6b26bd7405",
});
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const v429Artifact = read(paths.v429Artifact);
const artifact = read(paths.artifact);
const oracle = read(paths.oracle);
const contract = read(paths.contract);
const exports = read(paths.exportManifest);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const view = artifact.view;
if (
  previousEvidence.evidenceSha256 !== expected.previousEvidenceCanonical
  || fileSha(paths.previousEvidence) !== expected.previousEvidenceFile
  || previousPointer.pointerSha256 !== expected.previousPointerCanonical
  || fileSha(paths.previousPointer) !== expected.previousPointerFile
  || v429Artifact.artifactSha256 !== expected.v429ArtifactCanonical
  || fileSha(paths.v429Artifact) !== expected.v429ArtifactFile
  || artifact.version !== "v430-kerr-high-energy-count-likelihood-artifact-v1"
  || sha(artifact) !== artifact.artifactSha256
  || artifact.artifactSha256 !== expected.artifactCanonical
  || oracle.artifactSha256 !== expected.oracleCanonical
  || oracle.status !== "qualified-simulated-count-likelihood-and-residual-engine-fixture-only-no-measured-validation"
  || oracle.fixture?.measuredObservedCounts !== null
  || oracle.fixture?.measuredHoldoutDataset !== null
  || oracle.counts?.simulatedCountCount !== 24
  || oracle.counts.measuredObservedCountCount !== 0
  || oracle.counts.measuredResidualMetricCount !== 0
  || oracle.counts.measuredValidationRunCount !== 0
  || oracle.qualification?.poissonLikelihoodEngineQualified !== true
  || oracle.qualification.devianceResidualEngineQualified !== true
  || oracle.qualification.pearsonResidualEngineQualified !== true
  || oracle.qualification.predictiveCovarianceWhiteningQualified !== true
  || oracle.qualification.angleAndChannelClosureQualified !== true
  || oracle.qualification.measuredLikelihoodQualified !== false
  || oracle.measuredResponseAuthorityGranted !== false
  || contract.status !== "contract-ready-awaiting-measured-count-likelihood-declaration"
  || contract.admission?.currentStatus !== "not-run-no-measured-holdout"
  || contract.admission.measuredAuthorityGranted !== false
  || contract.inferencePolicy?.postHocLikelihoodSwitchForbidden !== true
  || view?.fixture?.maximumPythonRelativeDifference >= 1e-8
  || view.fixture.metrics.maximumMahalanobisIdentityDifference >= 1e-8
  || view.fixture.metrics.minimumPredictiveCovarianceEigenvalue <= 0
  || view.fixture.metrics.effectiveCovarianceRank !== 24
  || view.counts?.fixtureSimulatedCountCount !== 24
  || view.counts.measuredObservedCountCount !== 0
  || view.counts.measuredHoldoutDatasetCount !== 0
  || view.counts.measuredResidualMetricCount !== 0
  || view.counts.measuredValidationRunCount !== 0
  || view.counts.measuredResponseAuthorityCount !== 0
  || view.counts.scienceResponseApplicationCount !== 0
  || view.authorityBoundary?.likelihoodMathAuthorityGranted !== true
  || view.authorityBoundary.residualMathAuthorityGranted !== true
  || view.authorityBoundary.whiteningMathAuthorityGranted !== true
  || view.authorityBoundary.fixtureGoodnessOfFitAuthorityGranted !== false
  || view.authorityBoundary.measuredLikelihoodAuthorityGranted !== false
  || view.authorityBoundary.measuredResidualClosureAuthorityGranted !== false
  || view.authorityBoundary.measuredResponseAuthorityGranted !== false
  || view.authorityBoundary.scienceProjectionAuthorityGranted !== false
  || exports.version !== "v430-kerr-high-energy-count-likelihood-export-manifest-v1"
  || exports.artifactSha256 !== artifact.artifactSha256
  || exports.predictedCountCount !== 24
  || exports.simulatedCountCount !== 24
  || exports.measuredObservedCountCount !== 0
  || exports.measuredHoldoutDatasetCount !== 0
  || exports.measuredResidualMetricCount !== 0
  || exports.measuredValidationRunCount !== 0
  || exports.measuredResponseAuthority !== "unavailable"
  || exports.scienceResponseApplicationCount !== 0
  || exports.denseShardExecuted !== false
  || Object.values(exports.exports ?? {}).some((entry) => entry.sha256 !== fileSha(`dist/science/kerr-high-energy-count-likelihood-v430/${entry.path}`))
  || state.status !== "incomplete-0-of-49"
  || state.completedShardCount !== 0
  || state.attemptConsumed !== false
  || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v430-boundary");

const sourcePaths = [
  "app/lib/kerrHighEnergyCountLikelihoodV430.ts",
  "app/lib/kerrHighEnergyCountLikelihoodV430.test.ts",
  "app/lib/kerrHighEnergyCountLikelihoodServerV430.ts",
  "app/lib/kerrHighEnergyCountLikelihoodServerV430.test.ts",
  "app/lib/kerrHighEnergyCountLikelihoodClientV430.ts",
  "app/lib/kerrHighEnergyCountLikelihoodClientV430.test.ts",
  "app/lib/atlasShadowCapabilityPointerV430.ts",
  "app/lib/atlasShadowCapabilityPointerV430.test.ts",
  "app/api/atlas/relativity-evidence/v430/high-energy-count-likelihood/route.ts",
  "app/api/atlas/relativity-evidence/v430/high-energy-count-likelihood/route.test.ts",
  "app/components/KerrHighEnergyCountLikelihoodV430.tsx",
  "app/components/KerrHighEnergyCountLikelihoodV430.test.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "scripts/run-kerr-high-energy-count-likelihood-oracle-v430.py",
  "scripts/test-kerr-high-energy-count-likelihood-v430.py",
  "scripts/build-kerr-high-energy-count-likelihood-v430.ts",
  "scripts/export-kerr-high-energy-count-likelihood-v430.py",
  "scripts/build-kerr-high-energy-count-likelihood-chain-v430.mjs",
  "scripts/build-shadow-candidate-v430.mjs",
  "scripts/reseal-shadow-evidence-chain-v430.mjs",
  "scripts/verify-shadow-v430-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v430-evidence-v1",
  generatedAt: artifact.generatedAt,
  status: "count-likelihood-residual-whitening-and-closure-math-qualified-simulated-fixture-only-measured-validation-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v429EvidenceSha256: previousEvidence.evidenceSha256,
    v429PointerSha256: previousPointer.pointerSha256,
    v429EvidenceFileSha256: fileSha(paths.previousEvidence),
    v429PointerFileSha256: fileSha(paths.previousPointer),
    v429ArtifactSha256: v429Artifact.artifactSha256,
    v429ArtifactFileSha256: fileSha(paths.v429Artifact),
    v430ArtifactSha256: artifact.artifactSha256,
    v430ArtifactFileSha256: fileSha(paths.artifact),
    pythonOracleArtifactSha256: oracle.artifactSha256,
    pythonOracleFileSha256: fileSha(paths.oracle),
    likelihoodContractFileSha256: fileSha(paths.contract),
    exportManifestFileSha256: fileSha(paths.exportManifest),
  },
  countLikelihood: {
    status: view.status,
    likelihood: view.likelihood,
    fixture: view.fixture,
    contract: view.contract,
    counts: view.counts,
    products: view.products,
    authorityBoundary: view.authorityBoundary,
    exports: Object.fromEntries(Object.entries(exports.exports).map(([id, entry]) => [id, { fileSha256: entry.sha256, semantic: entry.semantic }])),
  },
  qualification: {
    poissonLikelihoodMathQualified: true,
    devianceResidualMathQualified: true,
    pearsonResidualMathQualified: true,
    predictiveCovarianceWhiteningQualified: true,
    angleAndChannelClosureMathQualified: true,
    deterministicReplayQualified: true,
    fixtureGoodnessOfFitAuthorityQualified: false,
    measuredObservedCountCount: 0,
    measuredHoldoutDatasetCount: 0,
    measuredResidualMetricCount: 0,
    measuredValidationRunCount: 0,
    measuredResponseAuthorityQualified: false,
    scienceResponseApplicationCount: 0,
    denseAuthorityQualified: false,
    browserQualification: "not-run",
    visualMatrixQualification: "not-run",
    soakQualification: "not-run",
    rtxWebGpuQualification: "not-run",
  },
  runtimeIntegration: {
    v13EvidenceObservatory: true,
    summaryOnlyInReactState: true,
    countVectorsInReactState: false,
    covarianceInReactState: false,
    eigenvectorsInReactState: false,
    fullOracleDownloadAvailable: true,
    canvasCreated: false,
    fixtureGoodnessOfFitClaim: false,
    fixtureValueUseInScience: false,
    responseValueFabrication: false,
    measurementClaim: false,
  },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: 0, plannedShardCount: state.plannedShardCount, attemptConsumed: false, aggregateAvailable: false, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, ordinaryStandaloneProfile: "legacy-v9", liteProfile: "legacy-v9", localShadowDefaultProfile: "legacy-v9", localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  releaseBoundary: "v430-simulated-count-likelihood-residual-whitening-and-closure-mathematics-only-no-measured-observations-holdout-goodness-of-fit-response-authority-science-projection-dense-browser-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v430",
  generatedAt: artifact.generatedAt,
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v429ResponseUncertainty: "qualified-preserved",
    v430PoissonLikelihoodMath: "qualified-fixture-only",
    v430DevianceResidualMath: "qualified-fixture-only",
    v430PearsonResidualMath: "qualified-fixture-only",
    v430PredictiveCovarianceWhitening: "qualified-fixture-only",
    v430AngleChannelClosure: "qualified-fixture-only",
    v430FixtureGoodnessOfFitAuthority: "not-granted",
    v430MeasuredObservedCounts: "zero",
    v430MeasuredHoldoutDatasets: "zero",
    v430MeasuredResidualMetrics: "zero",
    v430MeasuredValidationRuns: "zero",
    v430MeasuredResponseAuthority: "unavailable",
    v430ScienceResponseApplications: "zero",
    v430BrowserQualification: "not-run",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, counts: view.counts, metrics: view.fixture.metrics, measuredAuthority: pointer.capabilities.v430MeasuredResponseAuthority, browser: pointer.capabilities.v430BrowserQualification, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
