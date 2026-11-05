import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { parseKerrCovarianceSourceAdmissionArtifactV393 } from "../app/lib/kerrCovarianceSourceDossierV393";
import {
  createKerrGlobalCovarianceAdversarialFixturesV394,
  createKerrGlobalCovarianceControlFixtureV394,
  parseKerrGlobalCovariancePropagationArtifactV394,
  propagateKerrGlobalCovarianceV394,
  validateKerrGlobalCovarianceModelV394,
  V394_ORACLE_RELATIVE_LIMIT,
} from "../app/lib/kerrGlobalCovariancePropagationV394";
import { parseKerrPhysicalCovarianceAdmissionArtifactV392 } from "../app/lib/kerrPhysicalCovarianceAdmissionV392";
import { parseKerrTemperatureSystematicsTransferArtifactV390 } from "../app/lib/kerrTemperatureSystematicsTransferV390";

const root = process.cwd();
const paths = {
  transfer:
    "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json",
  admission:
    "dist/science/kerr-physical-covariance-admission-v392/covariance-admission.json",
  dossier:
    "dist/science/kerr-covariance-source-admission-v393/source-admission.json",
  oracle:
    "dist/science/kerr-global-covariance-propagation-v394/python-oracle.json",
  artifact:
    "dist/science/kerr-global-covariance-propagation-v394/global-propagation.json",
} as const;
const shaBytes = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");
const SHA256 = /^[a-f0-9]{64}$/;
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const canonicalSha = (value: unknown) =>
  shaBytes(JSON.stringify(canonicalize(value)));
const bounded = (path: string, maximumBytes: number) => {
  const target = resolve(root, path);
  const metadata = statSync(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > maximumBytes) {
    throw new Error(`v394-input-size:${path}`);
  }
  return readFileSync(target);
};
const atomicText = (path: string, value: string) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, value);
  renameSync(temporary, target);
};
const relativeDifference = (left: number, right: number) =>
  Math.abs(left - right) /
  Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));

const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(
  JSON.parse(bounded(paths.transfer, 128 * 1024).toString("utf8")),
);
const admission = parseKerrPhysicalCovarianceAdmissionArtifactV392(
  JSON.parse(bounded(paths.admission, 128 * 1024).toString("utf8")),
);
const dossier = parseKerrCovarianceSourceAdmissionArtifactV393(
  JSON.parse(bounded(paths.dossier, 128 * 1024).toString("utf8")),
);
if (
  admission.source.v390TransferArtifactSha256 !== transfer.artifactSha256 ||
  dossier.source.v392AdmissionArtifactSha256 !== admission.artifactSha256
) {
  throw new Error("v394-source-identity");
}
const oracle = JSON.parse(bounded(paths.oracle, 512 * 1024).toString("utf8"));
if (
  oracle.version !== "v394-kerr-global-covariance-python-oracle-v1" ||
  oracle.status !==
    "qualified-synthetic-global-propagation-oracle-not-physical-covariance" ||
  oracle.source?.v390TransferArtifactSha256 !== transfer.artifactSha256 ||
  oracle.source?.v392AdmissionArtifactSha256 !== admission.artifactSha256 ||
  oracle.source?.v393SourceAdmissionArtifactSha256 !== dossier.artifactSha256 ||
  oracle.fixtureClass !== "synthetic-validation-fixture" ||
  oracle.publishable !== false ||
  oracle.inputDimension !== 36 ||
  oracle.outputDimension !== 24 ||
  oracle.nuisanceModeCount !== 3 ||
  oracle.inputCovariance?.length !== 36 ||
  oracle.outputCovariance?.length !== 24 ||
  oracle.physicalGlobalCovarianceAvailable !== false ||
  oracle.productionPropagationExecuted !== false ||
  oracle.blockIndependenceAssumed !== false ||
  oracle.probabilityContentAssigned !== false ||
  oracle.networkAttempted !== false ||
  !SHA256.test(oracle.artifactSha256 ?? "")
) {
  throw new Error("v394-oracle-identity");
}

const control = createKerrGlobalCovarianceControlFixtureV394(
  transfer,
  admission,
  dossier,
);
const controlAdmission = validateKerrGlobalCovarianceModelV394(
  control,
  transfer,
  admission,
  dossier,
);
if (
  controlAdmission.status !== "admitted-validation-only" ||
  controlAdmission.propagationAllowed !== true ||
  controlAdmission.publicationAllowed !== false ||
  controlAdmission.baseBlockCount !== 12 ||
  controlAdmission.nuisanceModeCount !== 3 ||
  controlAdmission.checkedLoadingCount !== 108
) {
  throw new Error("v394-control-admission");
}
const projection = propagateKerrGlobalCovarianceV394(
  control,
  transfer,
  admission,
  dossier,
);
let maximumPythonOracleRelativeDifference = 0;
for (let left = 0; left < 36; left += 1) {
  for (let right = 0; right < 36; right += 1) {
    const difference = relativeDifference(
      projection.inputCovariance[left][right],
      Number(oracle.inputCovariance?.[left]?.[right]),
    );
    if (!Number.isFinite(difference) || difference >= V394_ORACLE_RELATIVE_LIMIT) {
      throw new Error(`v394-input-oracle-difference:${left}:${right}:${difference}`);
    }
    maximumPythonOracleRelativeDifference = Math.max(
      maximumPythonOracleRelativeDifference,
      difference,
    );
  }
}
for (let left = 0; left < 24; left += 1) {
  for (let right = 0; right < 24; right += 1) {
    const difference = relativeDifference(
      projection.outputCovariance[left][right],
      Number(oracle.outputCovariance?.[left]?.[right]),
    );
    if (!Number.isFinite(difference) || difference >= V394_ORACLE_RELATIVE_LIMIT) {
      throw new Error(`v394-output-oracle-difference:${left}:${right}:${difference}`);
    }
    maximumPythonOracleRelativeDifference = Math.max(
      maximumPythonOracleRelativeDifference,
      difference,
    );
  }
}
const adversarialFixtures = createKerrGlobalCovarianceAdversarialFixturesV394(
  transfer,
  admission,
  dossier,
).map((fixture) => {
  const result = validateKerrGlobalCovarianceModelV394(
    fixture.value,
    transfer,
    admission,
    dossier,
  );
  if (
    result.status !== "rejected" ||
    result.propagationAllowed !== false ||
    !result.rejectionReasons.includes(fixture.expectedReason)
  ) {
    throw new Error(`v394-adversarial-fixture:${fixture.id}`);
  }
  return Object.freeze({
    id: fixture.id,
    expectedReason: fixture.expectedReason,
    observedReason: fixture.expectedReason,
    rejected: true as const,
  });
});
if (adversarialFixtures.length !== 9) throw new Error("v394-adversarial-count");

const unsigned = {
  version: "v394-kerr-global-covariance-propagation-v1" as const,
  generatedAt: new Date().toISOString(),
  status:
    "global-covariance-propagation-qualified-physical-cross-row-model-unavailable" as const,
  source: Object.freeze({
    v390TransferArtifactSha256: transfer.artifactSha256,
    v392AdmissionArtifactSha256: admission.artifactSha256,
    v393SourceAdmissionArtifactSha256: dossier.artifactSha256,
    fullShortAuthoritySha256: transfer.source.fullShortAuthoritySha256,
  }),
  dimensions: Object.freeze({
    rowCount: 12 as const,
    inputPerRow: 3 as const,
    outputPerRow: 2 as const,
    inputDimension: 36 as const,
    outputDimension: 24 as const,
    inputCovarianceCoefficientCount: 1296 as const,
    outputCovarianceCoefficientCount: 576 as const,
  }),
  validator: Object.freeze({
    qualified: true as const,
    acceptedControlFixtureCount: 1 as const,
    rejectedAdversarialFixtureCount: 9 as const,
    adversarialFixtures: Object.freeze(adversarialFixtures),
  }),
  selfTest: Object.freeze({
    fixtureClass: "synthetic-validation-fixture" as const,
    publishable: false as const,
    nuisanceModeCount: 3 as const,
    propagationExecuted: true as const,
    maximumCrossRowAbsoluteCovariance:
      projection.metrics.maximumCrossRowAbsoluteCovariance,
    minimumInputDiagonal: projection.metrics.minimumInputDiagonal,
    minimumOutputDiagonal: projection.metrics.minimumOutputDiagonal,
    maximumPythonOracleRelativeDifference,
  }),
  productionAdmission: Object.freeze({
    globalCovarianceModelAvailable: false as const,
    crossRowEvidenceAvailable: false as const,
    nuisanceModesAvailable: 0 as const,
    globalCovarianceAdmitted: false as const,
    covariancePropagationExecuted: false as const,
    blockIndependenceAssumed: false as const,
    missingCrossRowTermsTreatedAsZero: false as const,
    probabilityContentAssigned: false as const,
    confidenceInterval: false as const,
    outputCovariance: null,
    absoluteScientificInterval: null,
  }),
  qualification: Object.freeze({
    globalCovarianceInfrastructureQualified: true as const,
    blockJacobianPropagationQualified: true as const,
    crossRowModeAssemblyQualified: true as const,
    physicalGlobalCovarianceQualified: false as const,
    absoluteScientificIntervalQualified: false as const,
    absoluteTemperatureAuthorityGranted: false as const,
    measuredAuthorityGranted: false as const,
    scienceImageAvailable: false as const,
  }),
  networkAttempted: false as const,
  sciencePayloadMutationAllowed: false as const,
  cinematicConsumerAllowed: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseKerrGlobalCovariancePropagationArtifactV394({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
});
atomicText(paths.artifact, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      inputDimension: artifact.dimensions.inputDimension,
      outputDimension: artifact.dimensions.outputDimension,
      nuisanceModeCount: artifact.selfTest.nuisanceModeCount,
      rejectedAdversarialFixtureCount:
        artifact.validator.rejectedAdversarialFixtureCount,
      maximumCrossRowAbsoluteCovariance:
        artifact.selfTest.maximumCrossRowAbsoluteCovariance,
      maximumPythonOracleRelativeDifference:
        artifact.selfTest.maximumPythonOracleRelativeDifference,
      physicalGlobalCovarianceAvailable:
        artifact.productionAdmission.globalCovarianceModelAvailable,
      productionPropagationExecuted:
        artifact.productionAdmission.covariancePropagationExecuted,
    },
    null,
    2,
  ),
);
