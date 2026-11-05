import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v415-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v415.json",
  likelihood: "dist/science/kerr-polarimeter-detector-likelihood-v415/noise-likelihood.json",
  artifact: "dist/science/kerr-polarimeter-stokes-ensemble-v416/stokes-ensemble.json",
  oracle: "dist/science/kerr-polarimeter-stokes-ensemble-v416/python-oracle.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v416-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v416.json",
};
const previous = {
  evidenceCanonical: "3f9435f4d7ced51e272123ca0bc780456a2f85b275edd4d8cb0a1d156ec2fec3",
  pointerCanonical: "2709261dea2701234541c67ea75298ee9653b5bcd7253c31535e59a9913b792a",
  evidenceFile: "a2addc1a8204460a25b9f07d4ac9e2e048df5bec7f48e313692e9f8cb9b93338",
  pointerFile: "13e5167881b4b6d43caa322b85e3f8406c75844f56fca99e1b132a392c4a24d5",
};
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const likelihood = read(paths.likelihood);
const artifact = read(paths.artifact);
const oracle = read(paths.oracle);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const view = artifact.view;
const metrics = view?.metrics;
if (
  previousEvidence.evidenceSha256 !== previous.evidenceCanonical ||
  previousPointer.pointerSha256 !== previous.pointerCanonical ||
  fileSha(paths.previousEvidence) !== previous.evidenceFile ||
  fileSha(paths.previousPointer) !== previous.pointerFile ||
  previousPointer.evidence?.fileSha256 !== previous.evidenceFile ||
  previousPointer.evidence?.canonicalSha256 !== previous.evidenceCanonical ||
  likelihood.artifactSha256 !== "026df02475951260080eb33623a2328b6d6ec47a47691ebae4b879a46dd9e676" ||
  artifact.version !== "v416-kerr-polarimeter-stokes-ensemble-artifact-v1" ||
  artifact.status !== "qualified-streaming-stokes-coverage-fixture-only-measured-authority-unavailable" ||
  sha(artifact) !== artifact.artifactSha256 ||
  artifact.source?.v415LikelihoodArtifactSha256 !== likelihood.artifactSha256 ||
  oracle.artifactSha256 !== artifact.source?.pythonOracleArtifactSha256 ||
  view?.trialCountPerRay !== 4096 ||
  view.totalTrialCount !== 16384 ||
  view.retainedTrialCount !== 4 ||
  view.rays?.length !== 4 ||
  metrics?.maximumSourceExpectationClosureRelative >= 1e-12 ||
  metrics?.maximumNoiselessStokesRecoveryAbsolute >= 1e-12 ||
  metrics?.maximumResponseConditionNumber >= 1e4 ||
  metrics?.maximumCountingPullMeanAbsolute >= 0.06 ||
  metrics?.maximumCountingPullStandardDeviationError >= 0.06 ||
  metrics?.maximumCountingCoverageOneSigmaError >= 0.025 ||
  metrics?.maximumCountingCoverageTwoSigmaError >= 0.015 ||
  metrics?.maximumCalibrationPullMeanAbsolute >= 0.06 ||
  metrics?.maximumCalibrationPullStandardDeviationError >= 0.06 ||
  metrics?.maximumCalibrationCoverageOneSigmaError >= 0.025 ||
  metrics?.maximumCalibrationCoverageTwoSigmaError >= 0.015 ||
  metrics?.maximumCovarianceSymmetryRelative >= 1e-12 ||
  Math.max(...Object.values(artifact.oracleComparison ?? {})) >= 1e-10 ||
  view.observedCounts !== "unavailable-synthetic-ensemble-is-not-observed-detector-data" ||
  view.measuredDetectorAuthority !== "unavailable-v368-authority-artifacts-missing" ||
  view.publishableMeasurement !== false ||
  artifact.measuredDetectorAuthorityGranted !== false ||
  artifact.observedCountsAvailable !== false ||
  artifact.networkAttempted !== false ||
  artifact.denseShardExecuted !== false ||
  artifact.browserQualification !== "not-run" ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v416-boundary");
}

const sourcePaths = [
  "app/lib/kerrPolarimeterStokesEnsembleV416.ts",
  "app/lib/kerrPolarimeterStokesEnsembleV416.test.ts",
  "app/lib/kerrPolarimeterStokesEnsembleServerV416.ts",
  "app/lib/kerrPolarimeterStokesEnsembleServerV416.test.ts",
  "app/lib/kerrPolarimeterStokesEnsembleClientV416.ts",
  "app/lib/kerrPolarimeterStokesEnsembleClientV416.test.ts",
  "app/api/atlas/relativity-evidence/v416/polarimeter-stokes-ensemble/route.ts",
  "app/api/atlas/relativity-evidence/v416/polarimeter-stokes-ensemble/route.test.ts",
  "app/components/KerrPolarimeterStokesEnsembleSurfaceV416.tsx",
  "app/components/KerrPolarimeterStokesEnsembleSurfaceV416.test.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "app/lib/atlasShadowCapabilityPointerV416.ts",
  "app/lib/atlasShadowCapabilityPointerV416.test.ts",
  "scripts/run-kerr-polarimeter-stokes-ensemble-oracle-v416.py",
  "scripts/build-kerr-polarimeter-stokes-ensemble-v416.ts",
  "scripts/build-kerr-polarimeter-stokes-ensemble-chain-v416.mjs",
  "scripts/build-shadow-candidate-v416.mjs",
  "scripts/reseal-shadow-evidence-chain-v416.mjs",
  "scripts/verify-shadow-v416-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v416-evidence-v1",
  generatedAt: artifact.generatedAt,
  status:
    "stokes-ensemble-coverage-fixture-qualified-measured-detector-unavailable-v13-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v415EvidenceSha256: previous.evidenceCanonical,
    v415PointerSha256: previous.pointerCanonical,
    v415EvidenceFileSha256: previous.evidenceFile,
    v415PointerFileSha256: previous.pointerFile,
    v415LikelihoodArtifactSha256: likelihood.artifactSha256,
    v415LikelihoodArtifactFileSha256: fileSha(paths.likelihood),
    ensembleArtifactSha256: artifact.artifactSha256,
    ensembleArtifactFileSha256: fileSha(paths.artifact),
    pythonOracleArtifactSha256: oracle.artifactSha256,
    pythonOracleFileSha256: fileSha(paths.oracle),
  },
  stokesEnsemble: {
    status: view.status,
    rayCount: 4,
    trialCountPerRay: 4096,
    totalTrialCount: 16384,
    retainedTrialCount: 4,
    truthStokes: view.truthStokes,
    seedNamespace: view.seedNamespace,
    ensembleMethod: view.ensembleMethod,
    sourceCountingModel: view.sourceCountingModel,
    calibrationModel: view.calibrationModel,
    covarianceCombinationPolicy: view.covarianceCombinationPolicy,
    recoveryModel: view.recoveryModel,
    metrics,
    oracleComparison: artifact.oracleComparison,
    observedCounts: view.observedCounts,
    measuredDetectorAuthority: view.measuredDetectorAuthority,
    syntheticFixtureAvailable: true,
    publishableMeasurement: false,
  },
  runtimeIntegration: {
    v13EvidenceObservatory: true,
    summaryOnlyInReactState: true,
    rayMatricesInReactState: false,
    trialVectorsInReactState: false,
    fullArtifactDownloadAvailable: true,
    canvasCreated: false,
    scienceBufferMutation: false,
    cinematicBufferMutation: false,
  },
  qualification: {
    effectiveMuellerResponseQualified: true,
    noiselessStokesRecoveryQualified: true,
    streamingEnsembleQualified: true,
    countingPullCoverageQualified: true,
    calibrationPullCoverageQualified: true,
    independentPythonOracleQualified: true,
    measuredDetectorAuthorityQualified: false,
    observedCountsAvailable: false,
    publishableMeasurement: false,
    browserQualification: "not-run",
    visualMatrixQualification: "not-run",
    soakQualification: "not-run",
    rtxWebGpuQualification: "not-run",
  },
  correctedCampaign: {
    namespace: "v314",
    status: state.status,
    completedShardCount: 0,
    plannedShardCount: state.plannedShardCount,
    attemptConsumed: false,
    aggregateAvailable: false,
    stateSha256: state.stateSha256,
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerSha256: fileSha(paths.formal),
    formalProductPointerAdvanced: false,
    ordinaryStandaloneProfile: "legacy-v9",
    liteProfile: "legacy-v9",
    localShadowDefaultProfile: "legacy-v9",
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  releaseBoundary:
    "v416-stokes-ensemble-fixture-local-shadow-v13-measured-detector-unavailable-browser-pending-no-observed-count-dense-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v416",
  generatedAt: artifact.generatedAt,
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v415DetectorLikelihood: "qualified-deterministic-fixture-only",
    v416EffectiveMuellerResponse: "qualified-four-rays-spectrum-weighted-four-by-four",
    v416NoiselessStokesRecovery: "qualified",
    v416StreamingEnsemble: "qualified-four-thousand-ninety-six-trials-per-ray",
    v416CountingPullCoverage: "qualified-separate-high-count-small-poisson-read-noise",
    v416CalibrationPullCoverage: "qualified-separate-multivariate-gaussian",
    v416CovarianceCombination: "prohibited-counting-and-calibration-remain-independent",
    v416ObservedCounts: "unavailable",
    v416MeasuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing",
    v416IndependentPythonOracle: "qualified",
    v416Workbench: "summary-only-full-artifact-download",
    v416BrowserQualification: "not-run",
    v416VisualMatrix: "not-run",
    v416Soak: "not-run",
    v416RtxWebGpu: "not-run",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
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
      status: pointer.status,
      artifactSha256: artifact.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      totalTrialCount: 16384,
      retainedTrialCount: 4,
      metrics,
      oracleMaximumDifference: Math.max(...Object.values(artifact.oracleComparison)),
      observedCounts: pointer.capabilities.v416ObservedCounts,
      browser: pointer.capabilities.v416BrowserQualification,
      dense: pointer.capabilities.v314CorrectedDense,
    },
    null,
    2,
  ),
);
