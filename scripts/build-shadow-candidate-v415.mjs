import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v414-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v414.json",
  detector: "dist/science/kerr-polarimeter-detector-count-v414/detector-count.json",
  artifact: "dist/science/kerr-polarimeter-detector-likelihood-v415/noise-likelihood.json",
  oracle: "dist/science/kerr-polarimeter-detector-likelihood-v415/python-oracle.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v415-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v415.json",
};
const previous = {
  evidenceCanonical: "66a807e1cf3140e76fa948ffc3972ffd591cbc50f6096d6c20c5c24a3566b4f7",
  pointerCanonical: "5df74a8dedb272fa5777535fd712c55e39e76122f44c92eee65fcd2843de2e6d",
  evidenceFile: "b789944ef9e3fd4cffd3c29c17f693e89a6161e9a59b0d0f5944b2406cc66761",
  pointerFile: "842b6295279a0be9b5a264eec6515fa7cffbab25b1bf57b0c3b6a507c33ee3aa",
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
const detector = read(paths.detector);
const artifact = read(paths.artifact);
const oracle = read(paths.oracle);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const view = artifact.view;
const maxima = view?.maxima;
if (
  previousEvidence.evidenceSha256 !== previous.evidenceCanonical ||
  previousPointer.pointerSha256 !== previous.pointerCanonical ||
  fileSha(paths.previousEvidence) !== previous.evidenceFile ||
  fileSha(paths.previousPointer) !== previous.pointerFile ||
  previousPointer.evidence?.fileSha256 !== previous.evidenceFile ||
  previousPointer.evidence?.canonicalSha256 !== previous.evidenceCanonical ||
  detector.artifactSha256 !== "515bc2bf9e0100b9474edecafbc2676fb8b066bd08fb406e011da87590305ab5" ||
  artifact.version !== "v415-kerr-polarimeter-detector-noise-likelihood-artifact-v1" ||
  artifact.status !==
    "qualified-deterministic-high-count-noise-likelihood-fixture-only-measured-authority-unavailable" ||
  sha(artifact) !== artifact.artifactSha256 ||
  artifact.source?.v414DetectorArtifactSha256 !== detector.artifactSha256 ||
  oracle.artifactSha256 !== artifact.source?.pythonOracleArtifactSha256 ||
  view?.counts.likelihoodRowCount !== 16 ||
  view.rays?.length !== 4 ||
  view.rays.some((ray) => ray.rows.length !== 4) ||
  maxima?.sourceHighCountApproximationIndicator >= 2e-9 ||
  maxima?.countingComponentClosureRelative > 1e-15 ||
  maxima?.absoluteAdditionLossRelativeToResidual >= 1e-6 ||
  maxima?.calibrationCholeskyReconstructionRelative >= 1e-12 ||
  Math.max(...Object.values(artifact.oracleComparison ?? {})) >= 1e-10 ||
  view.observedCounts !== "unavailable-synthetic-fixture-is-not-observed-detector-data" ||
  view.measuredDetectorAuthority !== "unavailable-v368-authority-artifacts-missing" ||
  view.syntheticFixtureAvailable !== true ||
  view.exactSourcePoissonIntegerAvailable !== false ||
  artifact.measuredDetectorAuthorityGranted !== false ||
  artifact.observedCountsAvailable !== false ||
  artifact.exactSourcePoissonIntegerAvailable !== false ||
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
  throw new Error("v415-boundary");
}

const sourcePaths = [
  "app/lib/kerrPolarimeterDetectorLikelihoodV415.ts",
  "app/lib/kerrPolarimeterDetectorLikelihoodV415.test.ts",
  "app/lib/kerrPolarimeterDetectorLikelihoodServerV415.ts",
  "app/lib/kerrPolarimeterDetectorLikelihoodServerV415.test.ts",
  "app/lib/kerrPolarimeterDetectorLikelihoodClientV415.ts",
  "app/lib/kerrPolarimeterDetectorLikelihoodClientV415.test.ts",
  "app/api/atlas/relativity-evidence/v415/polarimeter-detector-likelihood/route.ts",
  "app/api/atlas/relativity-evidence/v415/polarimeter-detector-likelihood/route.test.ts",
  "app/components/KerrPolarimeterDetectorLikelihoodSurfaceV415.tsx",
  "app/components/KerrPolarimeterDetectorLikelihoodSurfaceV415.test.tsx",
  "app/components/KerrPolarimeterDetectorSurfaceV414.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "app/lib/atlasShadowCapabilityPointerV415.ts",
  "app/lib/atlasShadowCapabilityPointerV415.test.ts",
  "scripts/run-kerr-polarimeter-detector-likelihood-oracle-v415.py",
  "scripts/build-kerr-polarimeter-detector-likelihood-v415.ts",
  "scripts/build-kerr-polarimeter-detector-likelihood-chain-v415.mjs",
  "scripts/build-shadow-candidate-v415.mjs",
  "scripts/reseal-shadow-evidence-chain-v415.mjs",
  "scripts/verify-shadow-v415-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v415-evidence-v1",
  generatedAt: artifact.generatedAt,
  status:
    "detector-noise-likelihood-fixture-qualified-measured-detector-unavailable-v13-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v414EvidenceSha256: previous.evidenceCanonical,
    v414PointerSha256: previous.pointerCanonical,
    v414EvidenceFileSha256: previous.evidenceFile,
    v414PointerFileSha256: previous.pointerFile,
    v414DetectorArtifactSha256: detector.artifactSha256,
    v414DetectorArtifactFileSha256: fileSha(paths.detector),
    likelihoodArtifactSha256: artifact.artifactSha256,
    likelihoodArtifactFileSha256: fileSha(paths.artifact),
    pythonOracleArtifactSha256: oracle.artifactSha256,
    pythonOracleFileSha256: fileSha(paths.oracle),
  },
  detectorLikelihood: {
    status: view.status,
    rayCount: 4,
    analyzerChannelCount: 4,
    likelihoodRowCount: 16,
    seedNamespace: view.seedNamespace,
    sourceCountingModel: view.sourceCountingModel,
    darkBackgroundModel: view.darkBackgroundModel,
    readNoiseModel: view.readNoiseModel,
    calibrationModel: view.calibrationModel,
    likelihoodCombinationPolicy: view.likelihoodCombinationPolicy,
    precisionBoundary: view.precisionBoundary,
    maxima,
    oracleComparison: artifact.oracleComparison,
    observedCounts: view.observedCounts,
    measuredDetectorAuthority: view.measuredDetectorAuthority,
    syntheticFixtureAvailable: true,
    exactSourcePoissonIntegerAvailable: false,
    measuredAuthorityGranted: false,
  },
  runtimeIntegration: {
    v13EvidenceObservatory: true,
    summaryOnlyInReactState: true,
    likelihoodRowsInReactState: false,
    calibrationVectorsInReactState: false,
    fullArtifactDownloadAvailable: true,
    canvasCreated: false,
    scienceBufferMutation: false,
    cinematicBufferMutation: false,
  },
  qualification: {
    deterministicReplayQualified: true,
    highCountApproximationBoundaryQualified: true,
    smallLambdaPoissonQualified: true,
    readNoiseFixtureQualified: true,
    calibrationCholeskyFixtureQualified: true,
    independentPythonOracleQualified: true,
    measuredDetectorAuthorityQualified: false,
    observedCountsAvailable: false,
    exactSourcePoissonIntegerAvailable: false,
    saturationQualified: false,
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
    "v415-deterministic-likelihood-fixture-local-shadow-v13-measured-detector-unavailable-browser-pending-no-observed-count-dense-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v415",
  generatedAt: artifact.generatedAt,
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v414DetectorForwardModel: "qualified-sixteen-expectation-rows-fixture-only",
    v415DeterministicReplay: "qualified-sha-derived-fifty-three-bit-streams",
    v415SourceCountingModel: "qualified-explicit-high-count-normal-approximation-not-exact-integer-poisson",
    v415DarkBackgroundModel: "qualified-small-lambda-poisson-inverse-cdf",
    v415ReadNoiseModel: "qualified-independent-gaussian-fixture",
    v415CalibrationLikelihood: "qualified-separate-cholesky-gaussian-fixture",
    v415LikelihoodCombination: "counting-within-row-only-calibration-separate",
    v415PrecisionBoundary: "qualified-base-plus-residual-safe-integer-boundary",
    v415ObservedCounts: "unavailable",
    v415ExactSourcePoissonInteger: "unavailable-count-exceeds-safe-integer",
    v415MeasuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing",
    v415IndependentPythonOracle: "qualified",
    v415Workbench: "summary-only-full-artifact-download",
    v415BrowserQualification: "not-run",
    v415VisualMatrix: "not-run",
    v415Soak: "not-run",
    v415RtxWebGpu: "not-run",
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
      rows: 16,
      maxima,
      oracleMaximumDifference: Math.max(...Object.values(artifact.oracleComparison)),
      observedCounts: pointer.capabilities.v415ObservedCounts,
      exactSourcePoissonInteger: pointer.capabilities.v415ExactSourcePoissonInteger,
      browser: pointer.capabilities.v415BrowserQualification,
      dense: pointer.capabilities.v314CorrectedDense,
    },
    null,
    2,
  ),
);
