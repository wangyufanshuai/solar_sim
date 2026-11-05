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
  previousEvidence: "dist/science/orbit-atlas-shadow-v393-evidence.json",
  previousPointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v393.json",
  artifact:
    "dist/science/kerr-global-covariance-propagation-v394/global-propagation.json",
  oracle:
    "dist/science/kerr-global-covariance-propagation-v394/python-oracle.json",
  sourceDossier: "dist/staging/measured-authority-v382-visible/manifest.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v394-evidence.json",
  pointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v394.json",
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
  previousPointer.capabilities?.v393DossierValidator !==
    "qualified-9-of-9-adversarial-rejections" ||
  previousPointer.capabilities?.v393ProductionPack !== "not-built" ||
  artifact.version !== "v394-kerr-global-covariance-propagation-v1" ||
  artifact.status !==
    "global-covariance-propagation-qualified-physical-cross-row-model-unavailable" ||
  sha(artifact) !== artifact.artifactSha256 ||
  artifact.source?.v393SourceAdmissionArtifactSha256 !==
    previousEvidence.dependency?.sourceAdmissionArtifactSha256 ||
  artifact.dimensions?.inputDimension !== 36 ||
  artifact.dimensions?.outputDimension !== 24 ||
  artifact.dimensions?.inputCovarianceCoefficientCount !== 1296 ||
  artifact.dimensions?.outputCovarianceCoefficientCount !== 576 ||
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
  artifact.selfTest?.nuisanceModeCount !== 3 ||
  artifact.selfTest?.propagationExecuted !== true ||
  !(artifact.selfTest?.maximumCrossRowAbsoluteCovariance > 0) ||
  artifact.selfTest?.maximumPythonOracleRelativeDifference >= 2e-12 ||
  artifact.productionAdmission?.globalCovarianceModelAvailable !== false ||
  artifact.productionAdmission?.crossRowEvidenceAvailable !== false ||
  artifact.productionAdmission?.nuisanceModesAvailable !== 0 ||
  artifact.productionAdmission?.globalCovarianceAdmitted !== false ||
  artifact.productionAdmission?.covariancePropagationExecuted !== false ||
  artifact.productionAdmission?.blockIndependenceAssumed !== false ||
  artifact.productionAdmission?.missingCrossRowTermsTreatedAsZero !== false ||
  artifact.productionAdmission?.probabilityContentAssigned !== false ||
  artifact.qualification?.globalCovarianceInfrastructureQualified !== true ||
  artifact.qualification?.blockJacobianPropagationQualified !== true ||
  artifact.qualification?.crossRowModeAssemblyQualified !== true ||
  artifact.qualification?.physicalGlobalCovarianceQualified !== false ||
  oracle.status !==
    "qualified-synthetic-global-propagation-oracle-not-physical-covariance" ||
  oracle.fixtureClass !== "synthetic-validation-fixture" ||
  oracle.publishable !== false ||
  oracle.inputDimension !== 36 ||
  oracle.outputDimension !== 24 ||
  oracle.nuisanceModeCount !== 3 ||
  oracle.physicalGlobalCovarianceAvailable !== false ||
  oracle.productionPropagationExecuted !== false ||
  oracle.blockIndependenceAssumed !== false ||
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
  throw new Error("v394-boundary");
}

const sourcePaths = [
  "app/lib/kerrGlobalCovariancePropagationV394.ts",
  "app/lib/kerrGlobalCovariancePropagationV394.test.ts",
  "scripts/run-kerr-global-covariance-oracle-v394.py",
  "scripts/build-kerr-global-covariance-propagation-v394.ts",
  "app/lib/kerrGlobalCovariancePropagationServerV394.ts",
  "app/lib/kerrGlobalCovariancePropagationServerV394.test.ts",
  "app/api/atlas/relativity-evidence/v394/global-covariance/route.ts",
  "app/api/atlas/relativity-evidence/v394/global-covariance/route.test.ts",
  "app/components/KerrCovarianceLatticeV394.tsx",
  "app/components/KerrCovarianceLatticeV394.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV394.ts",
  "app/lib/atlasShadowCapabilityPointerV394.test.ts",
  "scripts/build-shadow-candidate-v394.mjs",
  "scripts/reseal-shadow-evidence-chain-v394.mjs",
  "scripts/verify-shadow-v394-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({
  path,
  sha256: fileSha(path),
}));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v394-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "global-covariance-v394-qualified-physical-cross-row-model-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v393EvidenceSha256: previousEvidence.evidenceSha256,
    v393PointerSha256: previousPointer.pointerSha256,
    globalPropagationArtifactSha256: artifact.artifactSha256,
    globalPropagationFileSha256: fileSha(paths.artifact),
    pythonOracleArtifactSha256: oracle.artifactSha256,
    pythonOracleFileSha256: fileSha(paths.oracle),
    v390TransferArtifactSha256: artifact.source.v390TransferArtifactSha256,
    v392AdmissionArtifactSha256: artifact.source.v392AdmissionArtifactSha256,
    v393SourceAdmissionArtifactSha256:
      artifact.source.v393SourceAdmissionArtifactSha256,
    fullShortAuthoritySha256: artifact.source.fullShortAuthoritySha256,
  },
  globalCovariance: {
    inputDimension: artifact.dimensions.inputDimension,
    outputDimension: artifact.dimensions.outputDimension,
    inputCovarianceCoefficientCount:
      artifact.dimensions.inputCovarianceCoefficientCount,
    outputCovarianceCoefficientCount:
      artifact.dimensions.outputCovarianceCoefficientCount,
    nuisanceModeCount: artifact.selfTest.nuisanceModeCount,
    rejectedAdversarialFixtureCount:
      artifact.validator.rejectedAdversarialFixtureCount,
    adversarialFixtures: artifact.validator.adversarialFixtures,
    maximumCrossRowAbsoluteCovariance:
      artifact.selfTest.maximumCrossRowAbsoluteCovariance,
    maximumPythonOracleRelativeDifference:
      artifact.selfTest.maximumPythonOracleRelativeDifference,
  },
  authorityBoundary: {
    globalCovarianceInfrastructureQualified: true,
    blockJacobianPropagationQualified: true,
    crossRowModeAssemblyQualified: true,
    selfTestFixtureClass: "synthetic-validation-fixture",
    selfTestFixturePublishable: false,
    physicalGlobalCovarianceAvailable: false,
    crossRowEvidenceAvailable: false,
    physicalNuisanceModesAvailable: 0,
    productionGlobalCovarianceAdmitted: false,
    productionCovariancePropagationExecuted: false,
    blockIndependenceAssumed: false,
    missingCrossRowTermsTreatedAsZero: false,
    probabilityContentAssigned: false,
    confidenceInterval: false,
    absoluteScientificIntervalQualified: false,
    absoluteTemperatureAuthorityGranted: false,
    measuredAuthorityGranted: false,
    scienceImageAvailable: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
  },
  runtime: {
    profile: "science-cinematic-v11-v377",
    consumer: "KerrCovarianceLatticeV394",
    endpoint: "/api/atlas/relativity-evidence/v394/global-covariance",
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
    "global-covariance-infrastructure-only-never-block-independence-by-default-missing-cross-row-zero-synthetic-as-physical-production-propagation-probability-or-product-promotion",
};
const evidence = {
  ...evidenceUnsigned,
  evidenceSha256: sha(evidenceUnsigned),
};
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v394",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v393SourceDossier: "qualified-infrastructure-physical-sources-unavailable",
    v394InputCovariance: "qualified-36x36-1296-coefficients",
    v394OutputCovariance: "qualified-24x24-576-coefficients",
    v394BlockJacobian: "qualified-24x36",
    v394CrossRowModes: "qualified-3-synthetic-control-modes-only",
    v394Validator: "qualified-9-of-9-adversarial-rejections",
    v394PhysicalGlobalCovariance: "unavailable",
    v394ProductionPropagation: "not-run",
    v394RuntimeConsumer: "v11-covariance-lattice-wired",
    v394PromotionBoundary:
      "global-propagation-infrastructure-only-zero-physical-modes-zero-production-output-zero-probability",
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
      input: pointer.capabilities.v394InputCovariance,
      output: pointer.capabilities.v394OutputCovariance,
      modes: pointer.capabilities.v394CrossRowModes,
      physical: pointer.capabilities.v394PhysicalGlobalCovariance,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: pointer.capabilities.browserQualification,
    },
    null,
    2,
  ),
);
