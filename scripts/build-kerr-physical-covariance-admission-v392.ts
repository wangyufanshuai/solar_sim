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
  createKerrCovarianceAdversarialFixturesV392,
  createKerrCovarianceControlFixtureV392,
  parseKerrPhysicalCovarianceAdmissionArtifactV392,
  projectKerrPhysicalCovarianceV392,
  validateKerrPhysicalCovariancePackV392,
  V392_ORACLE_RELATIVE_LIMIT,
  V392_PSD_RELATIVE_TOLERANCE,
  V392_SYMMETRY_RELATIVE_TOLERANCE,
} from "../app/lib/kerrPhysicalCovarianceAdmissionV392";
import {
  parseKerrTemperatureSystematicsTransferArtifactV390,
  V390_INPUT_ORDER,
  V390_OUTPUT_ORDER,
} from "../app/lib/kerrTemperatureSystematicsTransferV390";
import { parseKerrTemperatureTrustRegionArtifactV391 } from "../app/lib/kerrTemperatureTrustRegionV391";

const root = process.cwd();
const paths = {
  transfer:
    "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json",
  trust:
    "dist/science/kerr-temperature-trust-region-v391/trust-region.json",
  oracle:
    "dist/science/kerr-physical-covariance-admission-v392/python-oracle.json",
  artifact:
    "dist/science/kerr-physical-covariance-admission-v392/covariance-admission.json",
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
    throw new Error(`v392-input-size:${path}`);
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
const trust = parseKerrTemperatureTrustRegionArtifactV391(
  JSON.parse(bounded(paths.trust, 256 * 1024).toString("utf8")),
);
if (trust.source.v390TransferArtifactSha256 !== transfer.artifactSha256) {
  throw new Error("v392-transfer-trust-identity");
}
const oracle = JSON.parse(bounded(paths.oracle, 128 * 1024).toString("utf8"));
if (
  oracle.version !== "v392-kerr-physical-covariance-python-oracle-v1" ||
  oracle.status !==
    "qualified-synthetic-projection-oracle-not-physical-covariance" ||
  oracle.source?.v390TransferArtifactSha256 !== transfer.artifactSha256 ||
  oracle.fixtureClass !== "synthetic-validation-fixture" ||
  oracle.publishable !== false ||
  oracle.rows?.length !== 12 ||
  oracle.rowCount !== 12 ||
  !(oracle.minimumEigenvalue >= 0) ||
  oracle.physicalCovariancePackAvailable !== false ||
  oracle.productionProjectionExecuted !== false ||
  oracle.probabilityContentAssigned !== false ||
  oracle.absoluteScientificIntervalQualified !== false ||
  oracle.networkAttempted !== false ||
  !SHA256.test(oracle.artifactSha256 ?? "")
) {
  throw new Error("v392-oracle-identity");
}

const control = createKerrCovarianceControlFixtureV392(transfer);
const controlAdmission = validateKerrPhysicalCovariancePackV392(
  control,
  transfer,
);
if (
  controlAdmission.status !== "admitted-validation-only" ||
  controlAdmission.projectionAllowed !== true ||
  controlAdmission.publishablePhysicalCovariance !== false ||
  controlAdmission.minimumEigenvalue === null ||
  controlAdmission.minimumEigenvalue < -V392_PSD_RELATIVE_TOLERANCE ||
  controlAdmission.maximumSymmetryRelativeError === null ||
  controlAdmission.maximumSymmetryRelativeError >
    V392_SYMMETRY_RELATIVE_TOLERANCE
) {
  throw new Error("v392-control-admission");
}
const controlProjection = projectKerrPhysicalCovarianceV392(control, transfer);
if (
  controlProjection.admissionStatus !== "admitted-validation-only" ||
  controlProjection.publicationAllowed !== false ||
  controlProjection.rows.length !== 12
) {
  throw new Error("v392-control-projection");
}

let maximumPythonOracleRelativeDifference = 0;
for (const row of controlProjection.rows) {
  const oracleRow = oracle.rows.find(
    (candidate: { rayIndex?: unknown; rayId?: unknown; bandId?: unknown }) =>
      candidate.rayIndex === row.rayIndex &&
      candidate.rayId === row.rayId &&
      candidate.bandId === row.bandId,
  );
  if (!oracleRow) throw new Error("v392-oracle-row");
  const differences: number[] = [];
  for (let left = 0; left < 2; left += 1) {
    for (let right = 0; right < 2; right += 1) {
      differences.push(
        relativeDifference(
          row.projectedCovariance[left][right],
          Number(oracleRow.projectedCovariance?.[left]?.[right]),
        ),
      );
    }
  }
  const rowDifference = Math.max(...differences);
  if (!Number.isFinite(rowDifference) || rowDifference >= V392_ORACLE_RELATIVE_LIMIT) {
    throw new Error(
      `v392-oracle-projection-difference:${row.rayIndex}:${row.bandId}:${rowDifference}`,
    );
  }
  maximumPythonOracleRelativeDifference = Math.max(
    maximumPythonOracleRelativeDifference,
    rowDifference,
  );
}

const adversarialFixtures = createKerrCovarianceAdversarialFixturesV392(
  transfer,
).map((fixture) => {
  const admission = validateKerrPhysicalCovariancePackV392(
    fixture.value,
    transfer,
  );
  if (
    admission.status !== "rejected" ||
    admission.projectionAllowed !== false ||
    !admission.rejectionReasons.includes(fixture.expectedReason)
  ) {
    throw new Error(`v392-adversarial-fixture:${fixture.id}`);
  }
  return Object.freeze({
    id: fixture.id,
    expectedReason: fixture.expectedReason,
    observedReason: fixture.expectedReason,
    rejected: true as const,
  });
});
if (adversarialFixtures.length !== 6) {
  throw new Error("v392-adversarial-count");
}

const unsigned = {
  version: "v392-kerr-physical-covariance-admission-v1" as const,
  generatedAt: new Date().toISOString(),
  status:
    "covariance-admission-validator-qualified-physical-input-unavailable-projection-not-run" as const,
  source: Object.freeze({
    v390TransferArtifactSha256: transfer.artifactSha256,
    v391TrustRegionArtifactSha256: trust.artifactSha256,
    fullShortAuthoritySha256: transfer.source.fullShortAuthoritySha256,
  }),
  schema: Object.freeze({
    packVersion: "v392-kerr-physical-covariance-pack-v1" as const,
    parameterOrder: V390_INPUT_ORDER,
    outputOrder: V390_OUTPUT_ORDER,
    covarianceSemantics:
      "natural-log-input-perturbation-covariance" as const,
    requiredRowCount: 12 as const,
    crossCovarianceRequired: true as const,
    independenceEvidenceRequiredForZeroCrossBlock: true as const,
  }),
  validator: Object.freeze({
    qualified: true as const,
    finiteCheck: true as const,
    symmetricCheck: true as const,
    positiveSemidefiniteCheck: true as const,
    sourceIdentityCheck: true as const,
    parameterOrderCheck: true as const,
    crossCovarianceCheck: true as const,
    acceptedControlFixtureCount: 1 as const,
    rejectedAdversarialFixtureCount: 6 as const,
    adversarialFixtures: Object.freeze(adversarialFixtures),
  }),
  selfTest: Object.freeze({
    fixtureClass: "synthetic-validation-fixture" as const,
    publishable: false as const,
    projectionExecuted: true as const,
    projectedRowCount: 12 as const,
    minimumEigenvalue: controlAdmission.minimumEigenvalue,
    maximumSymmetryRelativeError:
      controlAdmission.maximumSymmetryRelativeError,
    maximumPythonOracleRelativeDifference,
  }),
  productionAdmission: Object.freeze({
    physicalCovariancePackAvailable: false as const,
    physicalCovariancePackAdmitted: false as const,
    covarianceProjectionExecuted: false as const,
    projectedRows: null,
    unknownSystematicsTreatedAsZero: false as const,
    missingCrossCovarianceImputedAsIndependent: false as const,
    rssApplied: false as const,
    confidenceInterval: false as const,
    probabilityContentAssigned: false as const,
    absoluteScientificInterval: null,
  }),
  qualification: Object.freeze({
    covarianceAdmissionInfrastructureQualified: true as const,
    numericalProjectionPrimitiveQualified: true as const,
    physicalCovarianceQualified: false as const,
    absoluteScientificIntervalQualified: false as const,
    absoluteTemperatureAuthorityGranted: false as const,
    measuredAuthorityGranted: false as const,
    observedCountsAvailable: false as const,
    scienceImageAvailable: false as const,
  }),
  networkAttempted: false as const,
  sciencePayloadMutationAllowed: false as const,
  cinematicConsumerAllowed: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseKerrPhysicalCovarianceAdmissionArtifactV392({
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
      selfTestProjectedRowCount: artifact.selfTest.projectedRowCount,
      maximumPythonOracleRelativeDifference:
        artifact.selfTest.maximumPythonOracleRelativeDifference,
      physicalCovariancePackAvailable:
        artifact.productionAdmission.physicalCovariancePackAvailable,
      productionProjectionExecuted:
        artifact.productionAdmission.covarianceProjectionExecuted,
    },
    null,
    2,
  ),
);
