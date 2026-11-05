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
  createKerrTemperatureSystematicsTransferV390,
  parseKerrTemperatureSystematicsTransferArtifactV390,
  V390_FINITE_DIFFERENCE_STEP,
  V390_INPUT_ORDER,
  V390_ORACLE_RELATIVE_LIMIT,
  V390_OUTPUT_ORDER,
} from "../app/lib/kerrTemperatureSystematicsTransferV390";
import { parseKerrConditionalTemperatureIntervalArtifactV389 } from "../app/lib/kerrConditionalTemperatureIntervalV389";
import { parseKerrPhotonSourceIdentifiabilityArtifactV387 } from "../app/lib/kerrPhotonSourceIdentifiabilityV387";

const root = process.cwd();
const paths = {
  interval:
    "dist/science/kerr-conditional-temperature-interval-v389/temperature-interval.json",
  identifiability:
    "dist/science/kerr-photon-source-identifiability-v387/identifiability.json",
  oracle:
    "dist/science/kerr-temperature-systematics-transfer-v390/python-oracle.json",
  csv: "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.csv" as const,
  artifact:
    "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json",
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
    throw new Error(`v390-input-size:${path}`);
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

const interval = parseKerrConditionalTemperatureIntervalArtifactV389(
  JSON.parse(bounded(paths.interval, 128 * 1024).toString("utf8")),
);
const identifiability = parseKerrPhotonSourceIdentifiabilityArtifactV387(
  JSON.parse(bounded(paths.identifiability, 128 * 1024).toString("utf8")),
);
const oracle = JSON.parse(bounded(paths.oracle, 128 * 1024).toString("utf8"));
if (
  oracle.version !==
    "v390-kerr-temperature-systematics-transfer-python-oracle-v1" ||
  oracle.status !== "qualified-independent-systematics-transfer-oracle" ||
  oracle.source?.v389IntervalArtifactSha256 !== interval.artifactSha256 ||
  oracle.source?.v387IdentifiabilityArtifactSha256 !==
    identifiability.artifactSha256 ||
  oracle.source?.v386SensitivityArtifactSha256 !==
    identifiability.source.v386SensitivityArtifactSha256 ||
  oracle.finiteDifferenceStep !== V390_FINITE_DIFFERENCE_STEP ||
  oracle.rows?.length !== 12 ||
  oracle.physicalSystematicVectorAdmitted !== false ||
  oracle.covarianceProjectionExecuted !== false ||
  oracle.absoluteScientificIntervalQualified !== false ||
  oracle.networkAttempted !== false ||
  !SHA256.test(oracle.artifactSha256 ?? "")
) {
  throw new Error("v390-oracle-identity");
}

const computation = createKerrTemperatureSystematicsTransferV390(
  interval,
  identifiability,
);
let maximumOracleDifference = 0;
const rows = Object.freeze(
  computation.rows.map((row) => {
    const oracleRow = oracle.rows.find(
      (entry: { rayIndex?: unknown; bandId?: unknown }) =>
        entry.rayIndex === row.rayIndex && entry.bandId === row.bandId,
    );
    if (!oracleRow) {
      throw new Error(`v390-oracle-row:${row.rayIndex}:${row.bandId}`);
    }
    if (
      oracleRow.rank !== 2 ||
      oracleRow.transferMatrix?.[0]?.[1] !== -1 ||
      oracleRow.transferMatrix?.[0]?.[2] !== 0 ||
      oracleRow.transferMatrix?.[1]?.[0] !== 0 ||
      oracleRow.transferMatrix?.[1]?.[1] !== 0 ||
      oracleRow.transferMatrix?.[1]?.[2] !== 0.25
    ) {
      throw new Error(`v390-oracle-matrix:${row.rayIndex}:${row.bandId}`);
    }
    const differences = [
      relativeDifference(
        row.planckLogPhotonSensitivity,
        Number(oracleRow.planckLogPhotonSensitivity),
      ),
      relativeDifference(
        row.transferMatrix[0][0],
        Number(oracleRow.transferMatrix[0][0]),
      ),
      relativeDifference(
        row.singularValues[0],
        Number(oracleRow.singularValues[0]),
      ),
      relativeDifference(row.conditionNumber, Number(oracleRow.conditionNumber)),
      relativeDifference(
        row.finiteDifference.photonRadianceToConditionedTemperature,
        Number(
          oracleRow.finiteDifference
            ?.photonRadianceToConditionedTemperature,
        ),
      ),
      relativeDifference(
        row.finiteDifference.redshiftToConditionedTemperature,
        Number(oracleRow.finiteDifference?.redshiftToConditionedTemperature),
      ),
      relativeDifference(
        row.finiteDifference.pageThorneFluxToSourceTemperature,
        Number(
          oracleRow.finiteDifference?.pageThorneFluxToSourceTemperature,
        ),
      ),
    ];
    const pythonOracleMaximumRelativeDifference = Math.max(...differences);
    if (
      !Number.isFinite(pythonOracleMaximumRelativeDifference) ||
      pythonOracleMaximumRelativeDifference >= V390_ORACLE_RELATIVE_LIMIT
    ) {
      throw new Error(
        `v390-oracle-difference:${row.rayIndex}:${row.bandId}:${pythonOracleMaximumRelativeDifference}`,
      );
    }
    maximumOracleDifference = Math.max(
      maximumOracleDifference,
      pythonOracleMaximumRelativeDifference,
    );
    return Object.freeze({ ...row, pythonOracleMaximumRelativeDifference });
  }),
);

const csv = [
  "ray_index,ray_id,band_id,planck_log_photon_sensitivity,dln_conditioned_temperature_dln_photon,dln_conditioned_temperature_dln_redshift,dln_conditioned_temperature_dln_page_thorne_flux,dln_source_temperature_dln_photon,dln_source_temperature_dln_redshift,dln_source_temperature_dln_page_thorne_flux,singular_value_0,singular_value_1,rank,condition_number,photon_finite_difference,redshift_finite_difference,page_thorne_flux_finite_difference,finite_difference_maximum_relative_difference,python_oracle_maximum_relative_difference,physical_systematic_vector_admitted,projected_physical_covariance,absolute_scientific_interval\n",
  ...rows.map(
    (row) =>
      `${row.rayIndex},${row.rayId},${row.bandId},${row.planckLogPhotonSensitivity.toExponential(16)},${row.transferMatrix[0][0].toExponential(16)},-1,0,0,0,0.25,${row.singularValues[0].toExponential(16)},0.25,2,${row.conditionNumber.toExponential(16)},${row.finiteDifference.photonRadianceToConditionedTemperature.toExponential(16)},${row.finiteDifference.redshiftToConditionedTemperature.toExponential(16)},${row.finiteDifference.pageThorneFluxToSourceTemperature.toExponential(16)},${row.finiteDifference.maximumRelativeDifference.toExponential(16)},${row.pythonOracleMaximumRelativeDifference.toExponential(16)},false,unavailable,unavailable\n`,
  ),
].join("");
atomicText(paths.csv, csv);
const csvFileSha256 = shaBytes(bounded(paths.csv, 128 * 1024));
const unsigned = {
  version: "v390-kerr-temperature-systematics-transfer-v1" as const,
  generatedAt: new Date().toISOString(),
  status:
    "systematics-transfer-operator-qualified-physical-covariance-unavailable" as const,
  source: Object.freeze({
    v389IntervalArtifactSha256: interval.artifactSha256,
    v387IdentifiabilityArtifactSha256: identifiability.artifactSha256,
    v386SensitivityArtifactSha256:
      identifiability.source.v386SensitivityArtifactSha256,
    fullShortAuthoritySha256: interval.source.fullShortAuthoritySha256,
  }),
  rows,
  counts: Object.freeze({
    rayCount: 4 as const,
    bandCount: 3 as const,
    transferCount: 12 as const,
    inputCount: 3 as const,
    outputCount: 2 as const,
    coefficientCount: 72 as const,
    rowRank: 2 as const,
  }),
  maxima: Object.freeze({
    ...computation.maxima,
    pythonOracleRelativeDifference: maximumOracleDifference,
  }),
  operator: Object.freeze({
    inputOrder: V390_INPUT_ORDER,
    outputOrder: V390_OUTPUT_ORDER,
    semantics: "local-first-order-log-space-transfer" as const,
    photonTransfer: "inverse-planck-log-sensitivity" as const,
    redshiftTransfer: "exact-minus-one-from-T-equals-gT-over-g" as const,
    pageThorneTransfer:
      "exact-one-quarter-from-T-proportional-F-one-quarter" as const,
    nonlinearNumericalIntervalSource:
      "v389-exact-endpoint-propagation" as const,
    derivativeValidationStep: V390_FINITE_DIFFERENCE_STEP,
    derivativeValidationOnlyNotPhysicalUncertainty: true as const,
  }),
  admission: Object.freeze({
    photonDetectorCovarianceAvailable: false as const,
    geometryRedshiftPhysicalSystematicAvailable: false as const,
    pageThorneFluxPhysicalSystematicAvailable: false as const,
    nonPlanckSpectralSystematicAvailable: false as const,
    crossCovarianceAvailable: false as const,
    physicalSystematicVectorAdmitted: false as const,
    covarianceProjectionExecuted: false as const,
    syntheticFixturePublishable: false as const,
    unknownSystematicsTreatedAsZero: false as const,
    rssApplied: false as const,
    confidenceInterval: false as const,
    probabilityContentAssigned: false as const,
  }),
  qualification: Object.freeze({
    systematicsTransferOperatorQualified: true as const,
    exactNonlinearNumericalIntervalQualified: true as const,
    absoluteScientificIntervalQualified: false as const,
    absoluteTemperatureAuthorityGranted: false as const,
    measuredAuthorityGranted: false as const,
    observedCountsAvailable: false as const,
    scienceImageAvailable: false as const,
  }),
  export: Object.freeze({
    csvPath: paths.csv,
    csvFileSha256,
    rowCount: 12 as const,
  }),
  networkAttempted: false as const,
  sciencePayloadMutationAllowed: false as const,
  cinematicConsumerAllowed: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseKerrTemperatureSystematicsTransferArtifactV390({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
});
atomicText(paths.artifact, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      csvFileSha256: artifact.export.csvFileSha256,
      transfers: artifact.counts.transferCount,
      coefficients: artifact.counts.coefficientCount,
      rank: artifact.counts.rowRank,
      maximumFiniteDifferenceRelativeDifference:
        artifact.maxima.finiteDifferenceRelativeDifference,
      maximumPythonOracleRelativeDifference:
        artifact.maxima.pythonOracleRelativeDifference,
      maximumConditionNumber: artifact.maxima.conditionNumber,
      physicalSystematicVectorAdmitted:
        artifact.admission.physicalSystematicVectorAdmitted,
      absoluteScientificIntervalQualified:
        artifact.qualification.absoluteScientificIntervalQualified,
    },
    null,
    2,
  ),
);
