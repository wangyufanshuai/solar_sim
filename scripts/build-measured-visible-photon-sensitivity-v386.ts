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
  createMeasuredVisiblePhotonSensitivityV386,
  parseMeasuredVisiblePhotonSensitivityArtifactV386,
  V386_CROSS_IMPLEMENTATION_RELATIVE_LIMIT,
  V386_WAVELENGTH_BIN_COUNT,
} from "../app/lib/measuredVisiblePhotonSensitivityV386";
import { parseMeasuredVisiblePhotonErrorBudgetArtifactV385 } from "../app/lib/measuredVisiblePhotonErrorBudgetV385";
import { parseMeasuredVisiblePhotonObservableArtifactV384 } from "../app/lib/measuredVisiblePhotonObservableV384";
import { parseMeasuredVisibleThroughputArtifactV383 } from "../app/lib/measuredVisibleThroughputV383";

const root = process.cwd();
const paths = {
  budget:
    "dist/science/measured-visible-photon-error-budget-v385/error-budget.json",
  observable:
    "dist/science/measured-visible-photon-observable-v384/observable.json",
  throughput: "dist/science/measured-visible-throughput-v383/manifest.json",
  profile: "dist/science/measured-visible-throughput-v383/profile.csv",
  oracle:
    "dist/science/measured-visible-photon-sensitivity-v386/python-oracle.json",
  csv: "dist/science/measured-visible-photon-sensitivity-v386/sensitivity.csv" as const,
  artifact:
    "dist/science/measured-visible-photon-sensitivity-v386/sensitivity.json",
} as const;
const shaBytes = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");
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
    throw new Error(`v386-input-size:${path}`);
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

const budget = parseMeasuredVisiblePhotonErrorBudgetArtifactV385(
  JSON.parse(bounded(paths.budget, 128 * 1024).toString("utf8")),
);
const observable = parseMeasuredVisiblePhotonObservableArtifactV384(
  JSON.parse(bounded(paths.observable, 128 * 1024).toString("utf8")),
);
const throughput = parseMeasuredVisibleThroughputArtifactV383(
  JSON.parse(bounded(paths.throughput, 128 * 1024).toString("utf8")),
);
const profile = bounded(paths.profile, 512 * 1024).toString("utf8");
const oracle = JSON.parse(bounded(paths.oracle, 128 * 1024).toString("utf8"));
if (
  oracle.version !== "v386-visible-photon-sensitivity-python-oracle-v1" ||
  oracle.status !== "qualified-independent-frequency-domain-sensitivity-oracle" ||
  oracle.source?.v384ObservableArtifactSha256 !== observable.artifactSha256 ||
  oracle.source?.v383ThroughputArtifactSha256 !== throughput.artifactSha256 ||
  oracle.rows?.length !== 4 ||
  oracle.sourceJacobianRank !== 1 ||
  oracle.sourceIdentifiableCombination !== "ln-g-plus-ln-T" ||
  oracle.suppliedCovarianceAvailable !== false ||
  oracle.uncertaintyProjectionAvailable !== false ||
  oracle.networkAttempted !== false ||
  oracle.absoluteScientificUncertaintyQualified !== false
) {
  throw new Error("v386-oracle-identity");
}
const computation = createMeasuredVisiblePhotonSensitivityV386(
  budget,
  observable,
  throughput,
  profile,
);
let maximumOracleDifference = 0;
const rows = Object.freeze(
  computation.rows.map((row) => {
    const oracleRow = oracle.rows.find(
      (entry: { rayIndex?: unknown }) => entry.rayIndex === row.rayIndex,
    );
    if (!oracleRow || oracleRow.throughputBinWeights?.length !== 12) {
      throw new Error(`v386-oracle-row:${row.rayIndex}`);
    }
    const differences = [
      ...row.bins.map((bin) =>
        relativeDifference(
          bin.fractionalThroughputResponseWeight,
          Number(oracleRow.throughputBinWeights[bin.index]),
        ),
      ),
      relativeDifference(
        row.logTemperatureSensitivity,
        Number(oracleRow.logTemperatureSensitivity),
      ),
      relativeDifference(
        row.logRedshiftSensitivity,
        Number(oracleRow.logRedshiftSensitivity),
      ),
      relativeDifference(
        row.temperatureFiniteDifferenceLogSensitivity,
        Number(oracleRow.temperatureFiniteDifferenceLogSensitivity),
      ),
      relativeDifference(
        row.redshiftFiniteDifferenceLogSensitivity,
        Number(oracleRow.redshiftFiniteDifferenceLogSensitivity),
      ),
    ];
    const pythonOracleMaximumRelativeDifference = Math.max(...differences);
    if (
      pythonOracleMaximumRelativeDifference >=
      V386_CROSS_IMPLEMENTATION_RELATIVE_LIMIT
    ) {
      throw new Error(
        `v386-oracle-difference:${row.rayIndex}:${pythonOracleMaximumRelativeDifference}`,
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
  "ray_index,bin_index,lower_wavelength_m,upper_wavelength_m,fractional_throughput_response_weight,log_temperature_sensitivity,log_redshift_sensitivity,temperature_fd_sensitivity,redshift_fd_sensitivity,projected_scientific_uncertainty_relative\n",
  ...rows.flatMap((row) =>
    row.bins.map(
      (bin) =>
        `${row.rayIndex},${bin.index},${bin.lowerWavelengthM.toExponential(16)},${bin.upperWavelengthM.toExponential(16)},${bin.fractionalThroughputResponseWeight.toExponential(16)},${row.logTemperatureSensitivity.toExponential(16)},${row.logRedshiftSensitivity.toExponential(16)},${row.temperatureFiniteDifferenceLogSensitivity.toExponential(16)},${row.redshiftFiniteDifferenceLogSensitivity.toExponential(16)},unavailable\n`,
    ),
  ),
].join("");
atomicText(paths.csv, csv);
const csvFileSha256 = shaBytes(bounded(paths.csv, 256 * 1024));
const unsigned = {
  version: "v386-visible-photon-sensitivity-v1" as const,
  generatedAt: new Date().toISOString(),
  status:
    "local-linear-sensitivity-qualified-calibration-covariance-unavailable" as const,
  source: Object.freeze({
    v385ErrorBudgetArtifactSha256: budget.artifactSha256,
    v384ObservableArtifactSha256: observable.artifactSha256,
    v383ThroughputArtifactSha256: throughput.artifactSha256,
    v383ProfileFileSha256: throughput.normalizedProfile.fileSha256,
  }),
  rows,
  counts: Object.freeze({
    rayCount: 4 as const,
    wavelengthBinCount: V386_WAVELENGTH_BIN_COUNT,
    responseCoefficientCount: 56 as const,
  }),
  maxima: Object.freeze({
    ...computation.maxima,
    pythonOracleRelativeDifference: maximumOracleDifference,
  }),
  model: Object.freeze({
    throughputResponse:
      "fractional-bin-jacobian-dlnN-dln-throughput" as const,
    sourceResponse:
      "analytic-planck-jacobian-plus-central-log-finite-difference" as const,
    parameterOrder: Object.freeze([
      "ln-effective-temperature",
      "ln-redshift-factor",
    ] as const),
    sourceJacobianRank: 1 as const,
    sourceIdentifiableCombination: "ln-g-plus-ln-T" as const,
    temperatureRedshiftSeparatelyIdentifiable: false as const,
    localLinearizationOnly: true as const,
  }),
  calibrationContract: Object.freeze({
    throughputFractionalCovarianceShape: Object.freeze([12, 12] as const),
    sourceLogCovarianceShape: Object.freeze([2, 2] as const),
    throughputSourceCrossCovarianceShape: Object.freeze([12, 2] as const),
    crossCovarianceMayBeOmittedOnlyWithDocumentedIndependence: true as const,
    suppliedCovarianceAvailable: false as const,
    numericalPlaceholderUsed: false as const,
    rssApplied: false as const,
    uncertaintyProjectionAvailable: false as const,
  }),
  qualification: Object.freeze({
    sensitivityKernelQualified: true as const,
    sourceDegeneracyDetected: true as const,
    absoluteScientificUncertaintyQualified: false as const,
    measuredAuthorityGranted: false as const,
    observedCountsAvailable: false as const,
    scienceImageAvailable: false as const,
  }),
  export: Object.freeze({
    csvPath: paths.csv,
    csvFileSha256,
    rowCount: 48 as const,
  }),
  networkAttempted: false as const,
  sciencePayloadMutationAllowed: false as const,
  cinematicConsumerAllowed: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseMeasuredVisiblePhotonSensitivityArtifactV386({
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
      rays: artifact.counts.rayCount,
      binsPerRay: artifact.counts.wavelengthBinCount,
      maximumWeightResidual:
        artifact.maxima.throughputWeightSumAbsoluteResidual,
      maximumFiniteDifferenceRelativeDifference:
        artifact.maxima.finiteDifferenceRelativeDifference,
      maximumPythonOracleRelativeDifference:
        artifact.maxima.pythonOracleRelativeDifference,
      sourceJacobianRank: artifact.model.sourceJacobianRank,
      uncertaintyProjectionAvailable:
        artifact.calibrationContract.uncertaintyProjectionAvailable,
    },
    null,
    2,
  ),
);
