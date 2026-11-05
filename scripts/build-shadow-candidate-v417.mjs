import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v416-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v416.json",
  ensemble: "dist/science/kerr-polarimeter-stokes-ensemble-v416/stokes-ensemble.json",
  artifact: "dist/science/kerr-polarimeter-nonlinear-observables-v417/nonlinear-observables.json",
  oracle: "dist/science/kerr-polarimeter-nonlinear-observables-v417/python-oracle.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v417-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v417.json",
};
const previous = {
  evidenceCanonical: "2e1fd13df65d011b68c767410806a9abd75e2ee97bf80ee652a31dbd08a1fa9f",
  pointerCanonical: "b41b08b39d5488e9b9b06fbcf8d8971f9baa03c46d4aa508e6062423619f078b",
  evidenceFile: "20b25efe6701d2a0883a547a83ceb791bae3339b4644711eaf2621524d1e5e49",
  pointerFile: "4af5b04c1b1ffb116836a8c1c979376f331655fce314c113e2fbe6bb7284ddfd",
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
const ensemble = read(paths.ensemble);
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
  ensemble.artifactSha256 !== "859f754ace836a18ba5671bee5d53504aa2987ac2d469c6bde8230d640e88e81" ||
  artifact.version !== "v417-kerr-polarimeter-nonlinear-observables-artifact-v1" ||
  artifact.status !== "qualified-nonlinear-polarization-coverage-fixture-only-measured-authority-unavailable" ||
  sha(artifact) !== artifact.artifactSha256 ||
  artifact.source?.v416StokesEnsembleArtifactSha256 !== ensemble.artifactSha256 ||
  oracle.artifactSha256 !== artifact.source?.pythonOracleArtifactSha256 ||
  view?.trialCountPerRay !== 8192 ||
  view.totalTrialCount !== 32768 ||
  view.retainedTrialCount !== 4 ||
  view.rays?.length !== 4 ||
  metrics?.maximumStandardizedBiasAbsolute >= 0.05 ||
  metrics?.maximumStandardDeviationRatioError >= 0.05 ||
  metrics?.maximumCoverageOneSigmaError >= 0.02 ||
  metrics?.maximumCoverageTwoSigmaError >= 0.01 ||
  metrics?.maximumEvpaAxialMeanSigmaAbsolute >= 0.05 ||
  metrics?.minimumEvpaAxialResultantLength <= 0.999 ||
  metrics?.maximumPLRawBiasSigmaAbsolute >= 0.05 ||
  metrics?.maximumPLDebiasedBiasSigmaAbsolute >= 0.05 ||
  metrics?.pLDebiasClampCount !== 0 ||
  metrics?.physicalConeViolationCount !== 0 ||
  metrics?.invalidObservableCount !== 0 ||
  metrics?.maximumObservableCovarianceSymmetryRelative >= 1e-12 ||
  Math.max(...Object.values(artifact.oracleComparison ?? {})) >= 1e-10 ||
  view.observedPolarization !== "unavailable-synthetic-nonlinear-ensemble-is-not-observed-polarization" ||
  view.measuredDetectorAuthority !== "unavailable-v368-authority-artifacts-missing" ||
  view.publishableMeasurement !== false ||
  artifact.measuredDetectorAuthorityGranted !== false ||
  artifact.observedPolarizationAvailable !== false ||
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
  throw new Error("v417-boundary");
}

const sourcePaths = [
  "app/lib/kerrPolarimeterNonlinearObservablesV417.ts",
  "app/lib/kerrPolarimeterNonlinearObservablesV417.test.ts",
  "app/lib/kerrPolarimeterNonlinearObservablesServerV417.ts",
  "app/lib/kerrPolarimeterNonlinearObservablesServerV417.test.ts",
  "app/lib/kerrPolarimeterNonlinearObservablesClientV417.ts",
  "app/lib/kerrPolarimeterNonlinearObservablesClientV417.test.ts",
  "app/api/atlas/relativity-evidence/v417/polarimeter-nonlinear-observables/route.ts",
  "app/api/atlas/relativity-evidence/v417/polarimeter-nonlinear-observables/route.test.ts",
  "app/components/KerrPolarimeterNonlinearCompassV417.tsx",
  "app/components/KerrPolarimeterNonlinearCompassV417.test.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "app/lib/atlasShadowCapabilityPointerV417.ts",
  "app/lib/atlasShadowCapabilityPointerV417.test.ts",
  "scripts/run-kerr-polarimeter-nonlinear-oracle-v417.py",
  "scripts/build-kerr-polarimeter-nonlinear-v417.ts",
  "scripts/build-kerr-polarimeter-nonlinear-chain-v417.mjs",
  "scripts/build-shadow-candidate-v417.mjs",
  "scripts/reseal-shadow-evidence-chain-v417.mjs",
  "scripts/verify-shadow-v417-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v417-evidence-v1",
  generatedAt: artifact.generatedAt,
  status:
    "nonlinear-polarization-coverage-fixture-qualified-measured-authority-unavailable-v13-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v416EvidenceSha256: previous.evidenceCanonical,
    v416PointerSha256: previous.pointerCanonical,
    v416EvidenceFileSha256: previous.evidenceFile,
    v416PointerFileSha256: previous.pointerFile,
    v416StokesEnsembleArtifactSha256: ensemble.artifactSha256,
    v416StokesEnsembleFileSha256: fileSha(paths.ensemble),
    nonlinearArtifactSha256: artifact.artifactSha256,
    nonlinearArtifactFileSha256: fileSha(paths.artifact),
    pythonOracleArtifactSha256: oracle.artifactSha256,
    pythonOracleFileSha256: fileSha(paths.oracle),
  },
  nonlinearPolarization: {
    status: view.status,
    rayCount: 4,
    trialCountPerRay: 8192,
    totalTrialCount: 32768,
    retainedTrialCount: 4,
    truth: view.truth,
    observableDefinitions: view.observableDefinitions,
    evpaResidual: view.evpaResidual,
    uncertaintyMethod: view.uncertaintyMethod,
    pLDebiasModel: view.pLDebiasModel,
    ensembleMethod: view.ensembleMethod,
    covarianceCombinationPolicy: view.covarianceCombinationPolicy,
    metrics,
    oracleComparison: artifact.oracleComparison,
    observedPolarization: view.observedPolarization,
    measuredDetectorAuthority: view.measuredDetectorAuthority,
    publishableMeasurement: false,
  },
  runtimeIntegration: {
    v13EvidenceObservatory: true,
    summaryOnlyInReactState: true,
    rayCovariancesInReactState: false,
    trialObservablesInReactState: false,
    fullArtifactDownloadAvailable: true,
    canvasCreated: false,
    scienceBufferMutation: false,
    cinematicBufferMutation: false,
  },
  qualification: {
    linearPolarizationFractionQualified: true,
    signedCircularPolarizationFractionQualified: true,
    axialEvpaQualified: true,
    deltaMethodCoverageQualified: true,
    highSnrPLDebiasFixtureQualified: true,
    physicalStokesConeQualified: true,
    independentPythonOracleQualified: true,
    measuredDetectorAuthorityQualified: false,
    observedPolarizationAvailable: false,
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
    "v417-nonlinear-polarization-fixture-local-shadow-v13-measured-authority-unavailable-browser-pending-no-observed-polarization-dense-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v417",
  generatedAt: artifact.generatedAt,
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v416StokesEnsemble: "qualified-streaming-fixture-only",
    v417LinearPolarizationFraction: "qualified-nonlinear-coverage-fixture-only",
    v417CircularPolarizationFraction: "qualified-signed-coverage-fixture-only",
    v417Evpa: "qualified-axial-pi-period-coverage-fixture-only",
    v417DeltaMethod: "qualified-against-nonlinear-ensemble",
    v417PLDebias: "qualified-high-snr-fixture-not-general-authority",
    v417PhysicalStokesCone: "qualified-zero-violations",
    v417CovarianceCombination: "prohibited-counting-and-calibration-remain-independent",
    v417ObservedPolarization: "unavailable",
    v417MeasuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing",
    v417IndependentPythonOracle: "qualified",
    v417Workbench: "summary-only-full-artifact-download",
    v417BrowserQualification: "not-run",
    v417VisualMatrix: "not-run",
    v417Soak: "not-run",
    v417RtxWebGpu: "not-run",
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
      totalTrialCount: 32768,
      retainedTrialCount: 4,
      truth: view.truth,
      metrics,
      oracleMaximumDifference: Math.max(...Object.values(artifact.oracleComparison)),
      observedPolarization: pointer.capabilities.v417ObservedPolarization,
      browser: pointer.capabilities.v417BrowserQualification,
      dense: pointer.capabilities.v314CorrectedDense,
    },
    null,
    2,
  ),
);
