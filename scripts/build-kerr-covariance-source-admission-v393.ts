import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import {
  assembleKerrCovariancePackFromDossierV393,
  createKerrCovarianceDossierAdversarialFixturesV393,
  createKerrCovarianceDossierControlFixtureV393,
  parseKerrCovarianceSourceAdmissionArtifactV393,
  validateKerrCovarianceSourceDossierV393,
  V393_ORACLE_RELATIVE_LIMIT,
} from "../app/lib/kerrCovarianceSourceDossierV393";
import { parseKerrPhysicalCovarianceAdmissionArtifactV392 } from "../app/lib/kerrPhysicalCovarianceAdmissionV392";
import {
  parseKerrTemperatureSystematicsTransferArtifactV390,
  V390_INPUT_ORDER,
} from "../app/lib/kerrTemperatureSystematicsTransferV390";

const root = process.cwd();
const paths = {
  transfer:
    "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json",
  admission:
    "dist/science/kerr-physical-covariance-admission-v392/covariance-admission.json",
  oracle:
    "dist/science/kerr-covariance-source-admission-v393/python-oracle.json",
  artifact:
    "dist/science/kerr-covariance-source-admission-v393/source-admission.json",
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
    throw new Error(`v393-input-size:${path}`);
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
if (admission.source.v390TransferArtifactSha256 !== transfer.artifactSha256) {
  throw new Error("v393-admission-transfer-identity");
}
const oracle = JSON.parse(bounded(paths.oracle, 128 * 1024).toString("utf8"));
if (
  oracle.version !== "v393-kerr-covariance-source-python-oracle-v1" ||
  oracle.status !==
    "qualified-synthetic-dossier-assembly-oracle-not-physical-source" ||
  oracle.source?.v390TransferArtifactSha256 !== transfer.artifactSha256 ||
  oracle.source?.v392AdmissionArtifactSha256 !== admission.artifactSha256 ||
  oracle.fixtureClass !== "synthetic-validation-fixture" ||
  oracle.publishable !== false ||
  oracle.componentSourceCount !== 3 ||
  oracle.crossSourceCount !== 3 ||
  oracle.rows?.length !== 12 ||
  oracle.rowCount !== 12 ||
  oracle.physicalDossierAvailable !== false ||
  oracle.productionPackBuilt !== false ||
  oracle.productionProjectionExecuted !== false ||
  oracle.probabilityContentAssigned !== false ||
  oracle.networkAttempted !== false ||
  !SHA256.test(oracle.artifactSha256 ?? "")
) {
  throw new Error("v393-oracle-identity");
}

const control = createKerrCovarianceDossierControlFixtureV393(
  transfer,
  admission,
);
const controlAdmission = validateKerrCovarianceSourceDossierV393(
  control,
  transfer,
  admission,
);
if (
  controlAdmission.status !== "admitted-validation-only" ||
  controlAdmission.packAssemblyAllowed !== true ||
  controlAdmission.publicationAllowed !== false ||
  controlAdmission.componentSourceCount !== 3 ||
  controlAdmission.crossSourceCount !== 3 ||
  controlAdmission.checkedComponentRowCount !== 36 ||
  controlAdmission.checkedCrossRowCount !== 36
) {
  throw new Error("v393-control-admission");
}
const pack = assembleKerrCovariancePackFromDossierV393(
  control,
  transfer,
  admission,
);
if (
  pack.contentClass !== "synthetic-validation-fixture" ||
  pack.publicationIntent !== "validation-only" ||
  pack.rows.length !== 12
) {
  throw new Error("v393-control-pack");
}
let maximumPythonOracleRelativeDifference = 0;
for (const row of pack.rows) {
  const oracleRow = oracle.rows.find(
    (candidate: { rayIndex?: unknown; rayId?: unknown; bandId?: unknown }) =>
      candidate.rayIndex === row.rayIndex &&
      candidate.rayId === row.rayId &&
      candidate.bandId === row.bandId,
  );
  if (!oracleRow) throw new Error("v393-oracle-row");
  for (let left = 0; left < 3; left += 1) {
    for (let right = 0; right < 3; right += 1) {
      const difference = relativeDifference(
        row.covariance[left][right],
        Number(oracleRow.covariance?.[left]?.[right]),
      );
      if (!Number.isFinite(difference) || difference >= V393_ORACLE_RELATIVE_LIMIT) {
        throw new Error(
          `v393-oracle-difference:${row.rayIndex}:${row.bandId}:${difference}`,
        );
      }
      maximumPythonOracleRelativeDifference = Math.max(
        maximumPythonOracleRelativeDifference,
        difference,
      );
    }
  }
}
const adversarialFixtures = createKerrCovarianceDossierAdversarialFixturesV393(
  transfer,
  admission,
).map((fixture) => {
  const result = validateKerrCovarianceSourceDossierV393(
    fixture.value,
    transfer,
    admission,
  );
  if (
    result.status !== "rejected" ||
    result.packAssemblyAllowed !== false ||
    !result.rejectionReasons.includes(fixture.expectedReason)
  ) {
    throw new Error(`v393-adversarial-fixture:${fixture.id}`);
  }
  return Object.freeze({
    id: fixture.id,
    expectedReason: fixture.expectedReason,
    observedReason: fixture.expectedReason,
    rejected: true as const,
  });
});
if (adversarialFixtures.length !== 9) {
  throw new Error("v393-adversarial-count");
}

const unsigned = {
  version: "v393-kerr-covariance-source-admission-v1" as const,
  generatedAt: new Date().toISOString(),
  status:
    "covariance-source-dossier-validator-qualified-physical-sources-unavailable-pack-not-built" as const,
  source: Object.freeze({
    v390TransferArtifactSha256: transfer.artifactSha256,
    v392AdmissionArtifactSha256: admission.artifactSha256,
    fullShortAuthoritySha256: transfer.source.fullShortAuthoritySha256,
  }),
  schema: Object.freeze({
    parameterOrder: V390_INPUT_ORDER,
    componentSourceCount: 3 as const,
    crossSourceCount: 3 as const,
    rowCountPerSource: 12 as const,
    covarianceSemantics:
      "natural-log-input-perturbation-covariance" as const,
    jointEstimatorOrIndependenceEvidenceRequired: true as const,
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
    assembledPackStatus: "admitted-validation-only" as const,
    assembledRowCount: 12 as const,
    componentSourceCount: 3 as const,
    crossSourceCount: 3 as const,
    maximumPythonOracleRelativeDifference,
  }),
  productionAdmission: Object.freeze({
    dossierAvailable: false as const,
    componentSourcesAvailable: 0 as const,
    requiredComponentSources: 3 as const,
    crossSourcesAvailable: 0 as const,
    requiredCrossSources: 3 as const,
    covariancePackBuilt: false as const,
    covariancePackAdmitted: false as const,
    covarianceProjectionExecuted: false as const,
    unknownSystematicsTreatedAsZero: false as const,
    missingCorrelationTreatedAsIndependent: false as const,
    syntheticFixturePublishable: false as const,
    confidenceInterval: false as const,
    probabilityContentAssigned: false as const,
    absoluteScientificInterval: null,
  }),
  qualification: Object.freeze({
    covarianceSourceDossierInfrastructureQualified: true as const,
    correlatedPackAssemblyPrimitiveQualified: true as const,
    physicalSourceDossierQualified: false as const,
    physicalCovarianceQualified: false as const,
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
const artifact = parseKerrCovarianceSourceAdmissionArtifactV393({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
});
atomicText(paths.artifact, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      acceptedControlFixtureCount:
        artifact.validator.acceptedControlFixtureCount,
      rejectedAdversarialFixtureCount:
        artifact.validator.rejectedAdversarialFixtureCount,
      componentSourceCount: artifact.selfTest.componentSourceCount,
      crossSourceCount: artifact.selfTest.crossSourceCount,
      maximumPythonOracleRelativeDifference:
        artifact.selfTest.maximumPythonOracleRelativeDifference,
      physicalDossierAvailable:
        artifact.productionAdmission.dossierAvailable,
      productionPackBuilt:
        artifact.productionAdmission.covariancePackBuilt,
    },
    null,
    2,
  ),
);
