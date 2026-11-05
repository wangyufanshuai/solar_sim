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
  previousEvidence: "dist/science/orbit-atlas-shadow-v392-evidence.json",
  previousPointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v392.json",
  artifact:
    "dist/science/kerr-covariance-source-admission-v393/source-admission.json",
  oracle:
    "dist/science/kerr-covariance-source-admission-v393/python-oracle.json",
  sourceDossier: "dist/staging/measured-authority-v382-visible/manifest.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v393-evidence.json",
  pointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v393.json",
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
  previousPointer.capabilities?.v392AdmissionValidator !==
    "qualified-6-of-6-adversarial-rejections" ||
  previousPointer.capabilities?.v392PhysicalCovariance !== "unavailable" ||
  artifact.version !== "v393-kerr-covariance-source-admission-v1" ||
  artifact.status !==
    "covariance-source-dossier-validator-qualified-physical-sources-unavailable-pack-not-built" ||
  sha(artifact) !== artifact.artifactSha256 ||
  artifact.source?.v392AdmissionArtifactSha256 !==
    previousEvidence.dependency?.covarianceAdmissionArtifactSha256 ||
  artifact.schema?.componentSourceCount !== 3 ||
  artifact.schema?.crossSourceCount !== 3 ||
  artifact.schema?.rowCountPerSource !== 12 ||
  artifact.schema?.jointEstimatorOrIndependenceEvidenceRequired !== true ||
  artifact.validator?.qualified !== true ||
  artifact.validator?.acceptedControlFixtureCount !== 1 ||
  artifact.validator?.rejectedAdversarialFixtureCount !== 9 ||
  artifact.validator?.adversarialFixtures?.length !== 9 ||
  artifact.validator.adversarialFixtures.some(
    (fixture) =>
      fixture.rejected !== true ||
      fixture.expectedReason !== fixture.observedReason,
  ) ||
  artifact.selfTest?.fixtureClass !== "synthetic-validation-fixture" ||
  artifact.selfTest?.publishable !== false ||
  artifact.selfTest?.assembledPackStatus !== "admitted-validation-only" ||
  artifact.selfTest?.assembledRowCount !== 12 ||
  artifact.selfTest?.componentSourceCount !== 3 ||
  artifact.selfTest?.crossSourceCount !== 3 ||
  artifact.selfTest?.maximumPythonOracleRelativeDifference >= 2e-12 ||
  artifact.productionAdmission?.dossierAvailable !== false ||
  artifact.productionAdmission?.componentSourcesAvailable !== 0 ||
  artifact.productionAdmission?.crossSourcesAvailable !== 0 ||
  artifact.productionAdmission?.covariancePackBuilt !== false ||
  artifact.productionAdmission?.covariancePackAdmitted !== false ||
  artifact.productionAdmission?.covarianceProjectionExecuted !== false ||
  artifact.productionAdmission?.unknownSystematicsTreatedAsZero !== false ||
  artifact.productionAdmission?.missingCorrelationTreatedAsIndependent !== false ||
  artifact.productionAdmission?.probabilityContentAssigned !== false ||
  artifact.qualification?.covarianceSourceDossierInfrastructureQualified !== true ||
  artifact.qualification?.correlatedPackAssemblyPrimitiveQualified !== true ||
  artifact.qualification?.physicalSourceDossierQualified !== false ||
  artifact.qualification?.physicalCovarianceQualified !== false ||
  artifact.qualification?.absoluteScientificIntervalQualified !== false ||
  oracle.status !==
    "qualified-synthetic-dossier-assembly-oracle-not-physical-source" ||
  oracle.fixtureClass !== "synthetic-validation-fixture" ||
  oracle.publishable !== false ||
  oracle.componentSourceCount !== 3 ||
  oracle.crossSourceCount !== 3 ||
  oracle.rowCount !== 12 ||
  oracle.physicalDossierAvailable !== false ||
  oracle.productionPackBuilt !== false ||
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
  throw new Error("v393-boundary");
}

const sourcePaths = [
  "app/lib/kerrCovarianceSourceDossierV393.ts",
  "app/lib/kerrCovarianceSourceDossierV393.test.ts",
  "scripts/run-kerr-covariance-source-oracle-v393.py",
  "scripts/build-kerr-covariance-source-admission-v393.ts",
  "app/lib/kerrCovarianceSourceDossierServerV393.ts",
  "app/lib/kerrCovarianceSourceDossierServerV393.test.ts",
  "app/api/atlas/relativity-evidence/v393/covariance-sources/route.ts",
  "app/api/atlas/relativity-evidence/v393/covariance-sources/route.test.ts",
  "app/components/KerrCorrelationPatchbayV393.tsx",
  "app/components/KerrCorrelationPatchbayV393.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV393.ts",
  "app/lib/atlasShadowCapabilityPointerV393.test.ts",
  "scripts/build-shadow-candidate-v393.mjs",
  "scripts/reseal-shadow-evidence-chain-v393.mjs",
  "scripts/verify-shadow-v393-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({
  path,
  sha256: fileSha(path),
}));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v393-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "covariance-source-dossier-v393-qualified-physical-sources-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v392EvidenceSha256: previousEvidence.evidenceSha256,
    v392PointerSha256: previousPointer.pointerSha256,
    sourceAdmissionArtifactSha256: artifact.artifactSha256,
    sourceAdmissionFileSha256: fileSha(paths.artifact),
    pythonOracleArtifactSha256: oracle.artifactSha256,
    pythonOracleFileSha256: fileSha(paths.oracle),
    v390TransferArtifactSha256: artifact.source.v390TransferArtifactSha256,
    v392AdmissionArtifactSha256: artifact.source.v392AdmissionArtifactSha256,
    fullShortAuthoritySha256: artifact.source.fullShortAuthoritySha256,
  },
  sourceDossier: {
    requiredComponentSourceCount: artifact.schema.componentSourceCount,
    requiredCrossSourceCount: artifact.schema.crossSourceCount,
    requiredRowsPerSource: artifact.schema.rowCountPerSource,
    acceptedControlFixtureCount:
      artifact.validator.acceptedControlFixtureCount,
    rejectedAdversarialFixtureCount:
      artifact.validator.rejectedAdversarialFixtureCount,
    adversarialFixtures: artifact.validator.adversarialFixtures,
    assembledSelfTestRowCount: artifact.selfTest.assembledRowCount,
    maximumPythonOracleRelativeDifference:
      artifact.selfTest.maximumPythonOracleRelativeDifference,
  },
  authorityBoundary: {
    sourceDossierInfrastructureQualified: true,
    correlatedPackAssemblyPrimitiveQualified: true,
    selfTestFixtureClass: "synthetic-validation-fixture",
    selfTestFixturePublishable: false,
    physicalDossierAvailable: false,
    componentSourcesAvailable: 0,
    crossSourcesAvailable: 0,
    productionCovariancePackBuilt: false,
    productionCovariancePackAdmitted: false,
    productionCovarianceProjectionExecuted: false,
    unknownSystematicsTreatedAsZero: false,
    missingCorrelationTreatedAsIndependent: false,
    confidenceInterval: false,
    probabilityContentAssigned: false,
    absoluteScientificIntervalQualified: false,
    absoluteTemperatureAuthorityGranted: false,
    measuredAuthorityGranted: false,
    scienceImageAvailable: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
  },
  runtime: {
    profile: "science-cinematic-v11-v377",
    consumer: "KerrCorrelationPatchbayV393",
    endpoint: "/api/atlas/relativity-evidence/v393/covariance-sources",
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
    "source-dossier-infrastructure-only-never-missing-as-zero-or-independent-synthetic-as-physical-production-pack-projection-probability-or-product-promotion",
};
const evidence = {
  ...evidenceUnsigned,
  evidenceSha256: sha(evidenceUnsigned),
};
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v393",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v392CovarianceAdmission: "qualified-validator-projection-primitive-only",
    v393SourceDossierSchema: "qualified-3-components-3-cross-sources",
    v393DossierValidator: "qualified-9-of-9-adversarial-rejections",
    v393CorrelatedPackAssembly: "qualified-synthetic-control-only",
    v393PhysicalSourceDossier:
      "unavailable-0-of-3-components-0-of-3-cross-sources",
    v393ProductionPack: "not-built",
    v393ProductionProjection: "not-run",
    v393AbsoluteScientificInterval: "not-qualified",
    v393RuntimeConsumer: "v11-correlation-patchbay-wired",
    v393PromotionBoundary:
      "dossier-infrastructure-only-zero-physical-sources-zero-pack-zero-projection-zero-probability",
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
      schema: pointer.capabilities.v393SourceDossierSchema,
      validator: pointer.capabilities.v393DossierValidator,
      physicalSources: pointer.capabilities.v393PhysicalSourceDossier,
      pack: pointer.capabilities.v393ProductionPack,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: pointer.capabilities.browserQualification,
    },
    null,
    2,
  ),
);
