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
  previousEvidence: "dist/science/orbit-atlas-shadow-v391-evidence.json",
  previousPointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v391.json",
  artifact:
    "dist/science/kerr-physical-covariance-admission-v392/covariance-admission.json",
  oracle:
    "dist/science/kerr-physical-covariance-admission-v392/python-oracle.json",
  sourceDossier: "dist/staging/measured-authority-v382-visible/manifest.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v392-evidence.json",
  pointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v392.json",
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
const artifact = read(paths.artifact);
const oracle = read(paths.oracle);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 ||
  previousPointer.capabilities?.v391AnalyticCurvature !==
    "qualified-12-hessians" ||
  previousPointer.capabilities?.v391PhysicalCovariance !== "unavailable" ||
  artifact.version !== "v392-kerr-physical-covariance-admission-v1" ||
  artifact.status !==
    "covariance-admission-validator-qualified-physical-input-unavailable-projection-not-run" ||
  sha(artifact) !== artifact.artifactSha256 ||
  artifact.source?.v390TransferArtifactSha256 !==
    previousEvidence.dependency?.v390TransferArtifactSha256 ||
  artifact.source?.v391TrustRegionArtifactSha256 !==
    previousEvidence.dependency?.trustArtifactSha256 ||
  artifact.schema?.requiredRowCount !== 12 ||
  artifact.schema?.crossCovarianceRequired !== true ||
  artifact.schema?.independenceEvidenceRequiredForZeroCrossBlock !== true ||
  artifact.validator?.qualified !== true ||
  artifact.validator?.acceptedControlFixtureCount !== 1 ||
  artifact.validator?.rejectedAdversarialFixtureCount !== 6 ||
  artifact.validator?.adversarialFixtures?.length !== 6 ||
  artifact.validator.adversarialFixtures.some(
    (fixture) =>
      fixture.rejected !== true ||
      fixture.expectedReason !== fixture.observedReason,
  ) ||
  artifact.selfTest?.fixtureClass !== "synthetic-validation-fixture" ||
  artifact.selfTest?.publishable !== false ||
  artifact.selfTest?.projectionExecuted !== true ||
  artifact.selfTest?.projectedRowCount !== 12 ||
  artifact.selfTest?.maximumPythonOracleRelativeDifference >= 2e-12 ||
  artifact.productionAdmission?.physicalCovariancePackAvailable !== false ||
  artifact.productionAdmission?.physicalCovariancePackAdmitted !== false ||
  artifact.productionAdmission?.covarianceProjectionExecuted !== false ||
  artifact.productionAdmission?.unknownSystematicsTreatedAsZero !== false ||
  artifact.productionAdmission
    ?.missingCrossCovarianceImputedAsIndependent !== false ||
  artifact.productionAdmission?.probabilityContentAssigned !== false ||
  artifact.productionAdmission?.absoluteScientificInterval !== null ||
  artifact.qualification?.covarianceAdmissionInfrastructureQualified !== true ||
  artifact.qualification?.numericalProjectionPrimitiveQualified !== true ||
  artifact.qualification?.physicalCovarianceQualified !== false ||
  artifact.qualification?.absoluteScientificIntervalQualified !== false ||
  artifact.qualification?.absoluteTemperatureAuthorityGranted !== false ||
  oracle.status !==
    "qualified-synthetic-projection-oracle-not-physical-covariance" ||
  oracle.fixtureClass !== "synthetic-validation-fixture" ||
  oracle.publishable !== false ||
  oracle.rowCount !== 12 ||
  oracle.physicalCovariancePackAvailable !== false ||
  oracle.productionProjectionExecuted !== false ||
  oracle.probabilityContentAssigned !== false ||
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
  throw new Error("v392-boundary");
}

const sourcePaths = [
  "app/lib/kerrPhysicalCovarianceAdmissionV392.ts",
  "app/lib/kerrPhysicalCovarianceAdmissionV392.test.ts",
  "scripts/run-kerr-physical-covariance-oracle-v392.py",
  "scripts/build-kerr-physical-covariance-admission-v392.ts",
  "app/lib/kerrPhysicalCovarianceAdmissionServerV392.ts",
  "app/lib/kerrPhysicalCovarianceAdmissionServerV392.test.ts",
  "app/api/atlas/relativity-evidence/v392/covariance-admission/route.ts",
  "app/api/atlas/relativity-evidence/v392/covariance-admission/route.test.ts",
  "app/components/KerrCovarianceInterlockV392.tsx",
  "app/components/KerrCovarianceInterlockV392.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV392.ts",
  "app/lib/atlasShadowCapabilityPointerV392.test.ts",
  "scripts/build-shadow-candidate-v392.mjs",
  "scripts/verify-shadow-v392-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({
  path,
  sha256: fileSha(path),
}));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v392-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "covariance-admission-v392-qualified-physical-input-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v391EvidenceSha256: previousEvidence.evidenceSha256,
    v391PointerSha256: previousPointer.pointerSha256,
    covarianceAdmissionArtifactSha256: artifact.artifactSha256,
    covarianceAdmissionFileSha256: fileSha(paths.artifact),
    pythonOracleArtifactSha256: oracle.artifactSha256,
    pythonOracleFileSha256: fileSha(paths.oracle),
    v390TransferArtifactSha256: artifact.source.v390TransferArtifactSha256,
    v391TrustRegionArtifactSha256:
      artifact.source.v391TrustRegionArtifactSha256,
    fullShortAuthoritySha256: artifact.source.fullShortAuthoritySha256,
  },
  covarianceAdmission: {
    parameterCount: 3,
    outputCount: 2,
    requiredRowCount: artifact.schema.requiredRowCount,
    acceptedControlFixtureCount:
      artifact.validator.acceptedControlFixtureCount,
    rejectedAdversarialFixtureCount:
      artifact.validator.rejectedAdversarialFixtureCount,
    adversarialFixtures: artifact.validator.adversarialFixtures,
    selfTestProjectedRowCount: artifact.selfTest.projectedRowCount,
    selfTestMinimumEigenvalue: artifact.selfTest.minimumEigenvalue,
    maximumPythonOracleRelativeDifference:
      artifact.selfTest.maximumPythonOracleRelativeDifference,
  },
  authorityBoundary: {
    covarianceAdmissionInfrastructureQualified: true,
    numericalProjectionPrimitiveQualified: true,
    selfTestFixtureClass: "synthetic-validation-fixture",
    selfTestFixturePublishable: false,
    physicalCovariancePackAvailable: false,
    physicalCovariancePackAdmitted: false,
    productionCovarianceProjectionExecuted: false,
    unknownSystematicsTreatedAsZero: false,
    missingCrossCovarianceImputedAsIndependent: false,
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
    consumer: "KerrCovarianceInterlockV392",
    endpoint:
      "/api/atlas/relativity-evidence/v392/covariance-admission",
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
    "covariance-validator-only-never-synthetic-as-physical-production-projection-probability-confidence-absolute-temperature-measured-authority-image-counts-or-product-promotion",
};
const evidence = {
  ...evidenceUnsigned,
  evidenceSha256: sha(evidenceUnsigned),
};
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v392",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v390TransferOperator: "qualified-12-rank-2-72-coefficients",
    v391TrustRegion: "qualified-linear-0.003-quadratic-0.01",
    v392CovarianceSchema: "qualified-3-input-2-output-12-row",
    v392AdmissionValidator: "qualified-6-of-6-adversarial-rejections",
    v392ProjectionPrimitive: "qualified-synthetic-control-only",
    v392PhysicalCovariance: "unavailable",
    v392ProductionProjection: "not-run",
    v392AbsoluteScientificInterval: "not-qualified",
    v392RuntimeConsumer: "v11-covariance-interlock-wired",
    v392PromotionBoundary:
      "validator-only-zero-physical-pack-zero-production-projection-zero-probability-zero-absolute-authority",
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
      schema: pointer.capabilities.v392CovarianceSchema,
      validator: pointer.capabilities.v392AdmissionValidator,
      projection: pointer.capabilities.v392ProductionProjection,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: pointer.capabilities.browserQualification,
    },
    null,
    2,
  ),
);
