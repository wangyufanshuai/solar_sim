import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v385-evidence.json",
  previousPointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v385.json",
  sensitivity:
    "dist/science/measured-visible-photon-sensitivity-v386/sensitivity.json",
  csv: "dist/science/measured-visible-photon-sensitivity-v386/sensitivity.csv",
  oracle:
    "dist/science/measured-visible-photon-sensitivity-v386/python-oracle.json",
  sourceDossier: "dist/staging/measured-authority-v382-visible/manifest.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v386-evidence.json",
  pointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v386.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path));
const fileSha = (path) =>
  createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(
              ([key]) =>
                ![
                  "generatedAt",
                  "artifactSha256",
                  "evidenceSha256",
                  "pointerSha256",
                ].includes(key),
            )
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const sensitivity = read(paths.sensitivity);
const oracle = read(paths.oracle);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !==
    previousEvidence.evidenceSha256 ||
  previousPointer.capabilities?.v385ComputationalBudget !==
    "qualified-four-components-linear-upper-bound" ||
  sensitivity.version !== "v386-visible-photon-sensitivity-v1" ||
  sensitivity.status !==
    "local-linear-sensitivity-qualified-calibration-covariance-unavailable" ||
  sha(sensitivity) !== sensitivity.artifactSha256 ||
  sensitivity.export?.csvFileSha256 !== fileSha(paths.csv) ||
  sensitivity.rows?.length !== 4 ||
  sensitivity.rows.some(
    (row) =>
      row.bins?.length !== 12 ||
      row.projectedScientificUncertaintyRelative !== "unavailable",
  ) ||
  sensitivity.counts?.responseCoefficientCount !== 56 ||
  sensitivity.maxima?.throughputWeightSumAbsoluteResidual >= 5e-13 ||
  sensitivity.maxima?.finiteDifferenceRelativeDifference >= 1e-7 ||
  sensitivity.maxima?.pythonOracleRelativeDifference >= 2e-7 ||
  sensitivity.model?.sourceJacobianRank !== 1 ||
  sensitivity.model?.sourceIdentifiableCombination !== "ln-g-plus-ln-T" ||
  sensitivity.model?.temperatureRedshiftSeparatelyIdentifiable !== false ||
  sensitivity.calibrationContract?.suppliedCovarianceAvailable !== false ||
  sensitivity.calibrationContract?.numericalPlaceholderUsed !== false ||
  sensitivity.calibrationContract?.rssApplied !== false ||
  sensitivity.calibrationContract?.uncertaintyProjectionAvailable !== false ||
  sensitivity.qualification?.sensitivityKernelQualified !== true ||
  sensitivity.qualification?.absoluteScientificUncertaintyQualified !== false ||
  sensitivity.qualification?.measuredAuthorityGranted !== false ||
  sensitivity.qualification?.observedCountsAvailable !== false ||
  sensitivity.qualification?.scienceImageAvailable !== false ||
  oracle.status !== "qualified-independent-frequency-domain-sensitivity-oracle" ||
  oracle.sourceJacobianRank !== 1 ||
  oracle.suppliedCovarianceAvailable !== false ||
  oracle.uncertaintyProjectionAvailable !== false ||
  oracle.absoluteScientificUncertaintyQualified !== false ||
  existsSync(resolve(root, paths.sourceDossier)) ||
  existsSync(resolve(root, paths.envelope)) ||
  existsSync(resolve(root, paths.imageJson)) ||
  existsSync(resolve(root, paths.imageCsv)) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" ||
  formalEvidence.contracts?.eihOnePnMutation !== "not-applied" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v386-boundary");
}

const sourcePaths = [
  "app/lib/measuredVisiblePhotonSensitivityV386.ts",
  "app/lib/measuredVisiblePhotonSensitivityV386.test.ts",
  "scripts/run-measured-visible-photon-sensitivity-oracle-v386.py",
  "scripts/build-measured-visible-photon-sensitivity-v386.ts",
  "app/lib/measuredVisiblePhotonSensitivityServerV386.ts",
  "app/lib/measuredVisiblePhotonSensitivityServerV386.test.ts",
  "app/api/atlas/relativity-evidence/v386/visible-photon-sensitivity/route.ts",
  "app/api/atlas/relativity-evidence/v386/visible-photon-sensitivity/route.test.ts",
  "app/components/MeasuredVisiblePhotonSensitivitySurfaceV386.tsx",
  "app/components/MeasuredVisiblePhotonSensitivitySurfaceV386.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV386.ts",
  "app/lib/atlasShadowCapabilityPointerV386.test.ts",
  "scripts/build-shadow-candidate-v386.mjs",
  "scripts/verify-shadow-v386-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({
  path,
  sha256: fileSha(path),
}));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v386-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "photon-sensitivity-v386-qualified-covariance-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v385EvidenceSha256: previousEvidence.evidenceSha256,
    v385PointerSha256: previousPointer.pointerSha256,
    sensitivityArtifactSha256: sensitivity.artifactSha256,
    sensitivityFileSha256: fileSha(paths.sensitivity),
    sensitivityCsvFileSha256: sensitivity.export.csvFileSha256,
    pythonOracleArtifactSha256: oracle.artifactSha256,
    v385ErrorBudgetArtifactSha256:
      sensitivity.source.v385ErrorBudgetArtifactSha256,
  },
  sensitivity: {
    rayCount: sensitivity.counts.rayCount,
    wavelengthBinCount: sensitivity.counts.wavelengthBinCount,
    responseCoefficientCount: sensitivity.counts.responseCoefficientCount,
    maximumWeightSumAbsoluteResidual:
      sensitivity.maxima.throughputWeightSumAbsoluteResidual,
    maximumFiniteDifferenceRelativeDifference:
      sensitivity.maxima.finiteDifferenceRelativeDifference,
    maximumPythonOracleRelativeDifference:
      sensitivity.maxima.pythonOracleRelativeDifference,
    sourceJacobianRank: sensitivity.model.sourceJacobianRank,
    sourceIdentifiableCombination:
      sensitivity.model.sourceIdentifiableCombination,
    temperatureRedshiftSeparatelyIdentifiable:
      sensitivity.model.temperatureRedshiftSeparatelyIdentifiable,
  },
  calibrationBoundary: {
    throughputFractionalCovarianceShape:
      sensitivity.calibrationContract.throughputFractionalCovarianceShape,
    sourceLogCovarianceShape:
      sensitivity.calibrationContract.sourceLogCovarianceShape,
    throughputSourceCrossCovarianceShape:
      sensitivity.calibrationContract.throughputSourceCrossCovarianceShape,
    suppliedCovarianceAvailable: false,
    numericalPlaceholderUsed: false,
    rssApplied: false,
    uncertaintyProjectionAvailable: false,
    absoluteScientificUncertaintyQualified: false,
    measuredAuthorityGranted: false,
    observedCountsAvailable: false,
    scienceImageAvailable: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
  },
  runtime: {
    profile: "science-cinematic-v11-v377",
    consumer: "MeasuredVisiblePhotonSensitivitySurfaceV386",
    endpoint:
      "/api/atlas/relativity-evidence/v386/visible-photon-sensitivity",
    responseMaximumBytes: 128 * 1024,
    noStore: true,
    localShadowOnly: true,
    defaultApplied: false,
    legacyV9Default: true,
  },
  correctedCampaign: {
    namespace: "v314",
    status: state.status,
    completedShardCount: state.completedShardCount,
    plannedShardCount: state.plannedShardCount,
    attemptConsumed: state.attemptConsumed,
    aggregateAvailable: state.aggregateAvailable,
    stateSha256: state.stateSha256,
  },
  networkAttempted: false,
  automaticRetryApplied: false,
  browserQualification: "not-run",
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerSha256: fileSha(paths.formal),
    formalProductPointerAdvanced: false,
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  releaseBoundary:
    "local-linear-sensitivity-only-never-covariance-projection-absolute-scientific-uncertainty-measured-authority-image-counts-or-product-promotion",
};
const evidence = {
  ...evidenceUnsigned,
  evidenceSha256: sha(evidenceUnsigned),
};
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v386",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v385ComputationalBudget: "qualified-four-components-linear-upper-bound",
    v386SensitivityKernel: "qualified-4-rays-12-bins-56-coefficients",
    v386SourceIdentifiability: "rank-1-only-ln-g-plus-ln-T",
    v386CalibrationCovariance: "unavailable-12x12-2x2-12x2-required",
    v386UncertaintyProjection: "unavailable-no-covariance",
    v386AbsoluteScientificUncertainty: "not-qualified",
    v386MeasuredAuthority: "unavailable",
    v386RuntimeConsumer: "v11-spectral-breaker-bus-wired",
    v386PromotionBoundary:
      "sensitivity-only-zero-projection-zero-authority-zero-image-zero-counts",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: {
    path: paths.evidence,
    fileSha256: fileSha(paths.evidence),
    canonicalSha256: evidence.evidenceSha256,
  },
};
const pointer = {
  ...pointerUnsigned,
  pointerSha256: sha(pointerUnsigned),
};
atomic(paths.pointer, pointer);
console.log(
  JSON.stringify(
    {
      status: pointer.status,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      sensitivity: pointer.capabilities.v386SensitivityKernel,
      identifiability: pointer.capabilities.v386SourceIdentifiability,
      covariance: pointer.capabilities.v386CalibrationCovariance,
      projection: pointer.capabilities.v386UncertaintyProjection,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: pointer.capabilities.browserQualification,
    },
    null,
    2,
  ),
);
