import {
  parseMeasuredVisiblePhotonErrorBudgetArtifactV385,
  type MeasuredVisiblePhotonErrorBudgetArtifactV385,
} from "./measuredVisiblePhotonErrorBudgetV385";
import {
  parseMeasuredVisiblePhotonObservableArtifactV384,
  type MeasuredVisiblePhotonObservableArtifactV384,
  V384_BOLTZMANN_CONSTANT_J_K,
  V384_SPEED_OF_LIGHT_M_S,
} from "./measuredVisiblePhotonObservableV384";
import {
  parseMeasuredVisibleThroughputArtifactV383,
  type MeasuredVisibleThroughputArtifactV383,
} from "./measuredVisibleThroughputV383";
import { KERR_PLANCK_CONSTANT_J_S_V328 } from "./kerrSciencePhotonBandsV328";

export const MEASURED_VISIBLE_PHOTON_SENSITIVITY_VERSION_V386 =
  "v386-visible-photon-sensitivity-v1" as const;
export const V386_WAVELENGTH_BIN_COUNT = 12 as const;
export const V386_FINITE_DIFFERENCE_STEP = 1e-4 as const;
export const V386_WEIGHT_SUM_RESIDUAL_LIMIT = 5e-13;
export const V386_FINITE_DIFFERENCE_RELATIVE_LIMIT = 1e-7;
export const V386_CROSS_IMPLEMENTATION_RELATIVE_LIMIT = 2e-7;
export const V386_SOURCE_DEGENERACY_ABSOLUTE_LIMIT = 1e-10;

const LOWER_WAVELENGTH_M = 4e-7;
const UPPER_WAVELENGTH_M = 7e-7;
const BIN_WIDTH_M =
  (UPPER_WAVELENGTH_M - LOWER_WAVELENGTH_M) /
  V386_WAVELENGTH_BIN_COUNT;
const SHA256 = /^[a-f0-9]{64}$/;

type ThroughputPointV386 = Readonly<{
  wavelengthM: number;
  throughput: number;
}>;

export type VisiblePhotonSensitivityBinV386 = Readonly<{
  index: number;
  lowerWavelengthM: number;
  upperWavelengthM: number;
  fractionalThroughputResponseWeight: number;
}>;

export type VisiblePhotonSensitivityRowV386 = Readonly<{
  rayIndex: number;
  photonObservablePerSM2Sr: number;
  bins: readonly VisiblePhotonSensitivityBinV386[];
  throughputWeightSum: number;
  throughputWeightSumAbsoluteResidual: number;
  globalThroughputScaleLogSensitivity: 1;
  logTemperatureSensitivity: number;
  logRedshiftSensitivity: number;
  sourceSensitivityDegeneracyAbsoluteDifference: number;
  temperatureFiniteDifferenceLogSensitivity: number;
  redshiftFiniteDifferenceLogSensitivity: number;
  temperatureFiniteDifferenceRelativeDifference: number;
  redshiftFiniteDifferenceRelativeDifference: number;
  pythonOracleMaximumRelativeDifference: number;
  projectedScientificUncertaintyRelative: "unavailable";
}>;

export type VisiblePhotonSensitivityComputationV386 = Readonly<{
  rows: readonly Omit<
    VisiblePhotonSensitivityRowV386,
    "pythonOracleMaximumRelativeDifference"
  >[];
  maxima: Readonly<{
    throughputWeightSumAbsoluteResidual: number;
    sourceSensitivityDegeneracyAbsoluteDifference: number;
    finiteDifferenceRelativeDifference: number;
  }>;
}>;

export type MeasuredVisiblePhotonSensitivityArtifactV386 = Readonly<{
  version: typeof MEASURED_VISIBLE_PHOTON_SENSITIVITY_VERSION_V386;
  generatedAt: string;
  status:
    "local-linear-sensitivity-qualified-calibration-covariance-unavailable";
  source: Readonly<{
    v385ErrorBudgetArtifactSha256: string;
    v384ObservableArtifactSha256: string;
    v383ThroughputArtifactSha256: string;
    v383ProfileFileSha256: string;
  }>;
  rows: readonly VisiblePhotonSensitivityRowV386[];
  counts: Readonly<{
    rayCount: 4;
    wavelengthBinCount: 12;
    responseCoefficientCount: 56;
  }>;
  maxima: Readonly<{
    throughputWeightSumAbsoluteResidual: number;
    sourceSensitivityDegeneracyAbsoluteDifference: number;
    finiteDifferenceRelativeDifference: number;
    pythonOracleRelativeDifference: number;
  }>;
  model: Readonly<{
    throughputResponse:
      "fractional-bin-jacobian-dlnN-dln-throughput";
    sourceResponse:
      "analytic-planck-jacobian-plus-central-log-finite-difference";
    parameterOrder: readonly ["ln-effective-temperature", "ln-redshift-factor"];
    sourceJacobianRank: 1;
    sourceIdentifiableCombination: "ln-g-plus-ln-T";
    temperatureRedshiftSeparatelyIdentifiable: false;
    localLinearizationOnly: true;
  }>;
  calibrationContract: Readonly<{
    throughputFractionalCovarianceShape: readonly [12, 12];
    sourceLogCovarianceShape: readonly [2, 2];
    throughputSourceCrossCovarianceShape: readonly [12, 2];
    crossCovarianceMayBeOmittedOnlyWithDocumentedIndependence: true;
    suppliedCovarianceAvailable: false;
    numericalPlaceholderUsed: false;
    rssApplied: false;
    uncertaintyProjectionAvailable: false;
  }>;
  qualification: Readonly<{
    sensitivityKernelQualified: true;
    sourceDegeneracyDetected: true;
    absoluteScientificUncertaintyQualified: false;
    measuredAuthorityGranted: false;
    observedCountsAvailable: false;
    scienceImageAvailable: false;
  }>;
  export: Readonly<{
    csvPath:
      "dist/science/measured-visible-photon-sensitivity-v386/sensitivity.csv";
    csvFileSha256: string;
    rowCount: 48;
  }>;
  networkAttempted: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

function parseProfile(profileCsv: string): readonly ThroughputPointV386[] {
  if (
    Buffer.byteLength(profileCsv, "utf8") <= 0 ||
    Buffer.byteLength(profileCsv, "utf8") > 512 * 1024 ||
    profileCsv.includes("\0")
  ) {
    throw new Error("v386-profile-size");
  }
  const lines = profileCsv.replaceAll("\r\n", "\n").trimEnd().split("\n");
  if (lines[0] !== "wavelength_m,throughput" || lines.length !== 3302) {
    throw new Error("v386-profile-schema");
  }
  const points = lines.slice(1).map((line) => {
    const fields = line.split(",");
    const wavelengthM = Number(fields[0]);
    const throughput = Number(fields[1]);
    if (
      fields.length !== 2 ||
      !Number.isFinite(wavelengthM) ||
      !Number.isFinite(throughput) ||
      wavelengthM <= 0 ||
      throughput < 0 ||
      throughput > 1
    ) {
      throw new Error("v386-profile-values");
    }
    return Object.freeze({ wavelengthM, throughput });
  });
  if (
    Math.abs(points[0].wavelengthM - LOWER_WAVELENGTH_M) /
        LOWER_WAVELENGTH_M >=
      1e-15 ||
    Math.abs(points.at(-1)!.wavelengthM - UPPER_WAVELENGTH_M) /
        UPPER_WAVELENGTH_M >=
      1e-15 ||
    points.some(
      (point, index) =>
        index > 0 && point.wavelengthM <= points[index - 1].wavelengthM,
    )
  ) {
    throw new Error("v386-profile-boundary");
  }
  return Object.freeze(points);
}

function spectralRadianceAndSensitivity(
  wavelengthM: number,
  temperatureK: number,
  redshiftFactor: number,
) {
  const observedFrequencyHz = V384_SPEED_OF_LIGHT_M_S / wavelengthM;
  const emittedFrequencyHz = observedFrequencyHz / redshiftFactor;
  const exponent =
    (KERR_PLANCK_CONSTANT_J_S_V328 * emittedFrequencyHz) /
    (V384_BOLTZMANN_CONSTANT_J_K * temperatureK);
  const emittedEnergySpectralRadiance =
    (2 * KERR_PLANCK_CONSTANT_J_S_V328 * emittedFrequencyHz ** 3) /
    (V384_SPEED_OF_LIGHT_M_S ** 2 * Math.expm1(exponent));
  const observedEnergySpectralRadiance =
    redshiftFactor ** 3 * emittedEnergySpectralRadiance;
  const photonSpectralRadiancePerHz =
    observedEnergySpectralRadiance /
    (KERR_PLANCK_CONSTANT_J_S_V328 * observedFrequencyHz);
  const radiance =
    photonSpectralRadiancePerHz *
    (V384_SPEED_OF_LIGHT_M_S / wavelengthM ** 2);
  const logProductSensitivity = exponent / -Math.expm1(-exponent);
  if (
    !Number.isFinite(radiance) ||
    radiance <= 0 ||
    !Number.isFinite(logProductSensitivity) ||
    logProductSensitivity <= 0
  ) {
    throw new Error("v386-spectral-response-nonphysical");
  }
  return Object.freeze({ radiance, logProductSensitivity });
}

function integrateResponse(
  points: readonly ThroughputPointV386[],
  temperatureK: number,
  redshiftFactor: number,
) {
  const binContributions = Array.from(
    { length: V386_WAVELENGTH_BIN_COUNT },
    () => 0,
  );
  let total = 0;
  let sensitivityIntegral = 0;
  for (let index = 1; index < points.length; index += 1) {
    const left = points[index - 1];
    const right = points[index];
    const leftValue = spectralRadianceAndSensitivity(
      left.wavelengthM,
      temperatureK,
      redshiftFactor,
    );
    const rightValue = spectralRadianceAndSensitivity(
      right.wavelengthM,
      temperatureK,
      redshiftFactor,
    );
    const width = right.wavelengthM - left.wavelengthM;
    const contribution =
      0.5 *
      width *
      (leftValue.radiance * left.throughput +
        rightValue.radiance * right.throughput);
    const sensitivityContribution =
      0.5 *
      width *
      (leftValue.radiance *
        left.throughput *
        leftValue.logProductSensitivity +
        rightValue.radiance *
          right.throughput *
          rightValue.logProductSensitivity);
    const midpoint = 0.5 * (left.wavelengthM + right.wavelengthM);
    const binIndex = Math.min(
      V386_WAVELENGTH_BIN_COUNT - 1,
      Math.max(
        0,
        Math.floor((midpoint - LOWER_WAVELENGTH_M) / BIN_WIDTH_M),
      ),
    );
    binContributions[binIndex] += contribution;
    total += contribution;
    sensitivityIntegral += sensitivityContribution;
  }
  if (
    !Number.isFinite(total) ||
    total <= 0 ||
    binContributions.some((entry) => !Number.isFinite(entry) || entry <= 0)
  ) {
    throw new Error("v386-response-integral");
  }
  return Object.freeze({
    total,
    logProductSensitivity: sensitivityIntegral / total,
    binContributions: Object.freeze(binContributions),
  });
}

const relativeDifference = (left: number, right: number) =>
  Math.abs(left - right) /
  Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));

function centralLogSensitivity(
  points: readonly ThroughputPointV386[],
  temperatureK: number,
  redshiftFactor: number,
  parameter: "temperature" | "redshift",
) {
  const step = V386_FINITE_DIFFERENCE_STEP;
  const plus = integrateResponse(
    points,
    parameter === "temperature" ? temperatureK * (1 + step) : temperatureK,
    parameter === "redshift"
      ? redshiftFactor * (1 + step)
      : redshiftFactor,
  ).total;
  const minus = integrateResponse(
    points,
    parameter === "temperature" ? temperatureK * (1 - step) : temperatureK,
    parameter === "redshift"
      ? redshiftFactor * (1 - step)
      : redshiftFactor,
  ).total;
  return Math.log(plus / minus) / Math.log((1 + step) / (1 - step));
}

export function createMeasuredVisiblePhotonSensitivityV386(
  budgetValue: MeasuredVisiblePhotonErrorBudgetArtifactV385,
  observableValue: MeasuredVisiblePhotonObservableArtifactV384,
  throughputValue: MeasuredVisibleThroughputArtifactV383,
  profileCsv: string,
): VisiblePhotonSensitivityComputationV386 {
  const budget = parseMeasuredVisiblePhotonErrorBudgetArtifactV385(budgetValue);
  const observable = parseMeasuredVisiblePhotonObservableArtifactV384(
    observableValue,
  );
  const throughput = parseMeasuredVisibleThroughputArtifactV383(throughputValue);
  if (
    budget.source.v384ObservableArtifactSha256 !== observable.artifactSha256 ||
    observable.source.v383ThroughputArtifactSha256 !==
      throughput.artifactSha256 ||
    throughput.authorityBoundary.sourceDossierAvailable !== false ||
    budget.qualification.absoluteScientificBudgetQualified !== false
  ) {
    throw new Error("v386-source-identity");
  }
  const points = parseProfile(profileCsv);
  let maximumWeightResidual = 0;
  let maximumDegeneracy = 0;
  let maximumFiniteDifference = 0;
  const rows = observable.rows.map((sourceRow) => {
    const response = integrateResponse(
      points,
      sourceRow.effectiveTemperatureK,
      sourceRow.redshiftFactor,
    );
    const bins = Object.freeze(
      response.binContributions.map((contribution, index) =>
        Object.freeze({
          index,
          lowerWavelengthM: LOWER_WAVELENGTH_M + index * BIN_WIDTH_M,
          upperWavelengthM: LOWER_WAVELENGTH_M + (index + 1) * BIN_WIDTH_M,
          fractionalThroughputResponseWeight: contribution / response.total,
        }),
      ),
    );
    const throughputWeightSum = bins.reduce(
      (sum, bin) => sum + bin.fractionalThroughputResponseWeight,
      0,
    );
    const throughputWeightSumAbsoluteResidual = Math.abs(
      throughputWeightSum - 1,
    );
    const temperatureFiniteDifferenceLogSensitivity = centralLogSensitivity(
      points,
      sourceRow.effectiveTemperatureK,
      sourceRow.redshiftFactor,
      "temperature",
    );
    const redshiftFiniteDifferenceLogSensitivity = centralLogSensitivity(
      points,
      sourceRow.effectiveTemperatureK,
      sourceRow.redshiftFactor,
      "redshift",
    );
    const temperatureFiniteDifferenceRelativeDifference = relativeDifference(
      response.logProductSensitivity,
      temperatureFiniteDifferenceLogSensitivity,
    );
    const redshiftFiniteDifferenceRelativeDifference = relativeDifference(
      response.logProductSensitivity,
      redshiftFiniteDifferenceLogSensitivity,
    );
    const sourceSensitivityDegeneracyAbsoluteDifference = Math.abs(
      temperatureFiniteDifferenceLogSensitivity -
        redshiftFiniteDifferenceLogSensitivity,
    );
    if (
      bins.length !== V386_WAVELENGTH_BIN_COUNT ||
      throughputWeightSumAbsoluteResidual >= V386_WEIGHT_SUM_RESIDUAL_LIMIT ||
      temperatureFiniteDifferenceRelativeDifference >=
        V386_FINITE_DIFFERENCE_RELATIVE_LIMIT ||
      redshiftFiniteDifferenceRelativeDifference >=
        V386_FINITE_DIFFERENCE_RELATIVE_LIMIT ||
      sourceSensitivityDegeneracyAbsoluteDifference >=
        V386_SOURCE_DEGENERACY_ABSOLUTE_LIMIT
    ) {
      throw new Error(`v386-response-gate:${sourceRow.rayIndex}`);
    }
    maximumWeightResidual = Math.max(
      maximumWeightResidual,
      throughputWeightSumAbsoluteResidual,
    );
    maximumDegeneracy = Math.max(
      maximumDegeneracy,
      sourceSensitivityDegeneracyAbsoluteDifference,
    );
    maximumFiniteDifference = Math.max(
      maximumFiniteDifference,
      temperatureFiniteDifferenceRelativeDifference,
      redshiftFiniteDifferenceRelativeDifference,
    );
    return Object.freeze({
      rayIndex: sourceRow.rayIndex,
      photonObservablePerSM2Sr:
        sourceRow.throughputWeightedPhotonRadiancePerSM2Sr,
      bins,
      throughputWeightSum,
      throughputWeightSumAbsoluteResidual,
      globalThroughputScaleLogSensitivity: 1 as const,
      logTemperatureSensitivity: response.logProductSensitivity,
      logRedshiftSensitivity: response.logProductSensitivity,
      sourceSensitivityDegeneracyAbsoluteDifference,
      temperatureFiniteDifferenceLogSensitivity,
      redshiftFiniteDifferenceLogSensitivity,
      temperatureFiniteDifferenceRelativeDifference,
      redshiftFiniteDifferenceRelativeDifference,
      projectedScientificUncertaintyRelative: "unavailable" as const,
    });
  });
  if (rows.length !== 4) throw new Error("v386-row-count");
  return Object.freeze({
    rows: Object.freeze(rows),
    maxima: Object.freeze({
      throughputWeightSumAbsoluteResidual: maximumWeightResidual,
      sourceSensitivityDegeneracyAbsoluteDifference: maximumDegeneracy,
      finiteDifferenceRelativeDifference: maximumFiniteDifference,
    }),
  });
}

export function parseMeasuredVisiblePhotonSensitivityArtifactV386(
  value: unknown,
): MeasuredVisiblePhotonSensitivityArtifactV386 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<MeasuredVisiblePhotonSensitivityArtifactV386>)
    : null;
  const rows = source?.rows ?? [];
  if (
    !source ||
    source.version !== MEASURED_VISIBLE_PHOTON_SENSITIVITY_VERSION_V386 ||
    source.status !==
      "local-linear-sensitivity-qualified-calibration-covariance-unavailable" ||
    !source.source ||
    !Object.values(source.source).every((entry) => SHA256.test(entry)) ||
    rows.length !== 4 ||
    rows.some(
      (row) =>
        row.bins.length !== V386_WAVELENGTH_BIN_COUNT ||
        row.bins.some(
          (bin, index) =>
            bin.index !== index ||
            !Number.isFinite(bin.fractionalThroughputResponseWeight) ||
            bin.fractionalThroughputResponseWeight <= 0,
        ) ||
        row.throughputWeightSumAbsoluteResidual >=
          V386_WEIGHT_SUM_RESIDUAL_LIMIT ||
        row.globalThroughputScaleLogSensitivity !== 1 ||
        row.sourceSensitivityDegeneracyAbsoluteDifference >=
          V386_SOURCE_DEGENERACY_ABSOLUTE_LIMIT ||
        row.temperatureFiniteDifferenceRelativeDifference >=
          V386_FINITE_DIFFERENCE_RELATIVE_LIMIT ||
        row.redshiftFiniteDifferenceRelativeDifference >=
          V386_FINITE_DIFFERENCE_RELATIVE_LIMIT ||
        row.pythonOracleMaximumRelativeDifference >=
          V386_CROSS_IMPLEMENTATION_RELATIVE_LIMIT ||
        row.projectedScientificUncertaintyRelative !== "unavailable",
    ) ||
    source.counts?.rayCount !== 4 ||
    source.counts.wavelengthBinCount !== 12 ||
    source.counts.responseCoefficientCount !== 56 ||
    !source.maxima ||
    source.maxima.throughputWeightSumAbsoluteResidual >=
      V386_WEIGHT_SUM_RESIDUAL_LIMIT ||
    source.maxima.sourceSensitivityDegeneracyAbsoluteDifference >=
      V386_SOURCE_DEGENERACY_ABSOLUTE_LIMIT ||
    source.maxima.finiteDifferenceRelativeDifference >=
      V386_FINITE_DIFFERENCE_RELATIVE_LIMIT ||
    source.maxima.pythonOracleRelativeDifference >=
      V386_CROSS_IMPLEMENTATION_RELATIVE_LIMIT ||
    source.model?.sourceJacobianRank !== 1 ||
    source.model.sourceIdentifiableCombination !== "ln-g-plus-ln-T" ||
    source.model.temperatureRedshiftSeparatelyIdentifiable !== false ||
    source.model.localLinearizationOnly !== true ||
    source.calibrationContract?.suppliedCovarianceAvailable !== false ||
    source.calibrationContract.numericalPlaceholderUsed !== false ||
    source.calibrationContract.rssApplied !== false ||
    source.calibrationContract.uncertaintyProjectionAvailable !== false ||
    source.qualification?.sensitivityKernelQualified !== true ||
    source.qualification.sourceDegeneracyDetected !== true ||
    source.qualification.absoluteScientificUncertaintyQualified !== false ||
    source.qualification.measuredAuthorityGranted !== false ||
    source.qualification.observedCountsAvailable !== false ||
    source.qualification.scienceImageAvailable !== false ||
    source.export?.csvPath !==
      "dist/science/measured-visible-photon-sensitivity-v386/sensitivity.csv" ||
    !SHA256.test(source.export?.csvFileSha256 ?? "") ||
    source.export?.rowCount !== 48 ||
    source.networkAttempted !== false ||
    source.sciencePayloadMutationAllowed !== false ||
    source.cinematicConsumerAllowed !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !SHA256.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v386-sensitivity-artifact-identity");
  }
  return value as MeasuredVisiblePhotonSensitivityArtifactV386;
}
