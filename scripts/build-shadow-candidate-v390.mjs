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
  previousEvidence: "dist/science/orbit-atlas-shadow-v389-evidence.json",
  previousPointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v389.json",
  artifact:
    "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json",
  csv: "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.csv",
  oracle:
    "dist/science/kerr-temperature-systematics-transfer-v390/python-oracle.json",
  sourceDossier: "dist/staging/measured-authority-v382-visible/manifest.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v390-evidence.json",
  pointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v390.json",
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
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const oracle = read(paths.oracle);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 ||
  previousPointer.capabilities?.v389ExactNonlinearInterval !==
    "qualified-12-exact-endpoint-intervals" ||
  artifact.version !== "v390-kerr-temperature-systematics-transfer-v1" ||
  artifact.status !==
    "systematics-transfer-operator-qualified-physical-covariance-unavailable" ||
  sha(artifact) !== artifact.artifactSha256 ||
  artifact.export?.csvFileSha256 !== fileSha(paths.csv) ||
  artifact.rows?.length !== 12 ||
  artifact.counts?.transferCount !== 12 ||
  artifact.counts?.coefficientCount !== 72 ||
  artifact.counts?.rowRank !== 2 ||
  artifact.maxima?.finiteDifferenceRelativeDifference >= 2e-7 ||
  artifact.maxima?.pythonOracleRelativeDifference >= 2e-7 ||
  artifact.maxima?.conditionNumber >= 16 ||
  artifact.operator?.semantics !== "local-first-order-log-space-transfer" ||
  artifact.operator?.photonTransfer !== "inverse-planck-log-sensitivity" ||
  artifact.operator?.redshiftTransfer !==
    "exact-minus-one-from-T-equals-gT-over-g" ||
  artifact.operator?.pageThorneTransfer !==
    "exact-one-quarter-from-T-proportional-F-one-quarter" ||
  artifact.operator?.derivativeValidationOnlyNotPhysicalUncertainty !== true ||
  artifact.admission?.photonDetectorCovarianceAvailable !== false ||
  artifact.admission?.geometryRedshiftPhysicalSystematicAvailable !== false ||
  artifact.admission?.pageThorneFluxPhysicalSystematicAvailable !== false ||
  artifact.admission?.nonPlanckSpectralSystematicAvailable !== false ||
  artifact.admission?.crossCovarianceAvailable !== false ||
  artifact.admission?.physicalSystematicVectorAdmitted !== false ||
  artifact.admission?.covarianceProjectionExecuted !== false ||
  artifact.admission?.syntheticFixturePublishable !== false ||
  artifact.admission?.unknownSystematicsTreatedAsZero !== false ||
  artifact.admission?.rssApplied !== false ||
  artifact.admission?.confidenceInterval !== false ||
  artifact.admission?.probabilityContentAssigned !== false ||
  artifact.qualification?.systematicsTransferOperatorQualified !== true ||
  artifact.qualification?.absoluteScientificIntervalQualified !== false ||
  artifact.qualification?.absoluteTemperatureAuthorityGranted !== false ||
  artifact.qualification?.measuredAuthorityGranted !== false ||
  artifact.qualification?.observedCountsAvailable !== false ||
  artifact.qualification?.scienceImageAvailable !== false ||
  oracle.status !== "qualified-independent-systematics-transfer-oracle" ||
  oracle.rows?.length !== 12 ||
  oracle.physicalSystematicVectorAdmitted !== false ||
  oracle.covarianceProjectionExecuted !== false ||
  oracle.absoluteScientificIntervalQualified !== false ||
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
  throw new Error("v390-boundary");
}

const sourcePaths = [
  "app/lib/kerrTemperatureSystematicsTransferV390.ts",
  "app/lib/kerrTemperatureSystematicsTransferV390.test.ts",
  "scripts/run-kerr-temperature-systematics-transfer-oracle-v390.py",
  "scripts/build-kerr-temperature-systematics-transfer-v390.ts",
  "app/lib/kerrTemperatureSystematicsTransferServerV390.ts",
  "app/lib/kerrTemperatureSystematicsTransferServerV390.test.ts",
  "app/api/atlas/relativity-evidence/v390/systematics-transfer/route.ts",
  "app/api/atlas/relativity-evidence/v390/systematics-transfer/route.test.ts",
  "app/components/KerrTemperatureSystematicsSwitchyardV390.tsx",
  "app/components/KerrTemperatureSystematicsSwitchyardV390.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV390.ts",
  "app/lib/atlasShadowCapabilityPointerV390.test.ts",
  "scripts/build-shadow-candidate-v390.mjs",
  "scripts/verify-shadow-v390-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({
  path,
  sha256: fileSha(path),
}));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v390-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "temperature-systematics-transfer-v390-qualified-physical-covariance-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v389EvidenceSha256: previousEvidence.evidenceSha256,
    v389PointerSha256: previousPointer.pointerSha256,
    transferArtifactSha256: artifact.artifactSha256,
    transferFileSha256: fileSha(paths.artifact),
    transferCsvFileSha256: artifact.export.csvFileSha256,
    pythonOracleArtifactSha256: oracle.artifactSha256,
    v389IntervalArtifactSha256: artifact.source.v389IntervalArtifactSha256,
    v387IdentifiabilityArtifactSha256:
      artifact.source.v387IdentifiabilityArtifactSha256,
    fullShortAuthoritySha256: artifact.source.fullShortAuthoritySha256,
  },
  transferOperator: {
    transferCount: artifact.counts.transferCount,
    inputCount: artifact.counts.inputCount,
    outputCount: artifact.counts.outputCount,
    coefficientCount: artifact.counts.coefficientCount,
    rowRank: artifact.counts.rowRank,
    inputOrder: artifact.operator.inputOrder,
    outputOrder: artifact.operator.outputOrder,
    semantics: artifact.operator.semantics,
    maximumFiniteDifferenceRelativeDifference:
      artifact.maxima.finiteDifferenceRelativeDifference,
    maximumPythonOracleRelativeDifference:
      artifact.maxima.pythonOracleRelativeDifference,
    maximumConditionNumber: artifact.maxima.conditionNumber,
  },
  physicalAdmissionBoundary: {
    photonDetectorCovarianceAvailable: false,
    geometryRedshiftPhysicalSystematicAvailable: false,
    pageThorneFluxPhysicalSystematicAvailable: false,
    nonPlanckSpectralSystematicAvailable: false,
    crossCovarianceAvailable: false,
    physicalSystematicVectorAdmitted: false,
    covarianceProjectionExecuted: false,
    syntheticFixturePublishable: false,
    derivativeValidationOnlyNotPhysicalUncertainty: true,
    unknownSystematicsTreatedAsZero: false,
    rssApplied: false,
    confidenceInterval: false,
    probabilityContentAssigned: false,
    absoluteScientificIntervalQualified: false,
    absoluteTemperatureAuthorityGranted: false,
    measuredAuthorityGranted: false,
    observedCountsAvailable: false,
    scienceImageAvailable: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
  },
  runtime: {
    profile: "science-cinematic-v11-v377",
    consumer: "KerrTemperatureSystematicsSwitchyardV390",
    endpoint: "/api/atlas/relativity-evidence/v390/systematics-transfer",
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
    "systematics-transfer-only-never-physical-covariance-projection-confidence-probability-absolute-temperature-authority-measured-authority-image-counts-or-product-promotion",
};
const evidence = {
  ...evidenceUnsigned,
  evidenceSha256: sha(evidenceUnsigned),
};
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v390",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v389ExactNonlinearInterval: "qualified-12-exact-endpoint-intervals",
    v390TransferOperator: "qualified-12-rank-2-72-coefficients",
    v390FiniteDifference: "qualified-below-2e-7",
    v390PhysicalCovariance: "unavailable-five-input-classes",
    v390CovarianceProjection: "not-run-input-unavailable",
    v390AbsoluteScientificInterval: "not-qualified",
    v390MeasuredAuthority: "unavailable",
    v390RuntimeConsumer: "v11-systematics-switchyard-wired",
    v390PromotionBoundary:
      "transfer-only-zero-physical-vector-zero-absolute-authority-zero-image-zero-counts",
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
      transfer: pointer.capabilities.v390TransferOperator,
      covariance: pointer.capabilities.v390PhysicalCovariance,
      absoluteAuthority:
        pointer.capabilities.v390AbsoluteScientificInterval,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: pointer.capabilities.browserQualification,
    },
    null,
    2,
  ),
);
