import {
  KERR_PLANCK_CONSTANT_J_S_V328,
  parseKerrSciencePhotonBandViewV328,
  type KerrSciencePhotonBandViewV328,
} from "./kerrSciencePhotonBandsV328";
import type { KerrThinDiskBandIdV320 } from "./kerrThinDiskBandImagingV320";
import {
  V384_BOLTZMANN_CONSTANT_J_K,
  V384_SPEED_OF_LIGHT_M_S,
} from "./measuredVisiblePhotonObservableV384";

export const KERR_PHOTON_SOURCE_IDENTIFIABILITY_VERSION_V387 =
  "v387-kerr-photon-source-identifiability-v1" as const;
export const V387_INTEGRATION_STEPS = 2_048 as const;
export const V387_FINITE_DIFFERENCE_STEP = 1e-4 as const;
export const V387_SOURCE_RECONSTRUCTION_LIMIT = 2e-6;
export const V387_FINITE_DIFFERENCE_RELATIVE_LIMIT = 2e-7;
export const V387_ORACLE_RELATIVE_LIMIT = 2e-7;
export const V387_DEGENERACY_ABSOLUTE_LIMIT = 1e-9;
export const V387_COVARIANCE_SYMMETRY_TOLERANCE = 1e-12;
export const V387_COVARIANCE_PSD_TOLERANCE = 1e-12;

const SHA256 = /^[a-f0-9]{64}$/;
const SOURCE_PARAMETER_ORDER = Object.freeze([
  "ln-effective-temperature",
  "ln-redshift-factor",
] as const);
export const V387_COVARIANCE_PARAMETER_ORDER = Object.freeze([
  ...Array.from({ length: 12 }, (_, index) => `ln-throughput-bin-${index}`),
  ...SOURCE_PARAMETER_ORDER,
]);

export type KerrPhotonIdentifiabilityRowV387 = Readonly<{
  rayIndex: number;
  bandId: KerrThinDiskBandIdV320;
  bandLowerFrequencyHz: number;
  bandUpperFrequencyHz: number;
  sourcePhotonRadiancePerSM2Sr: number;
  reconstructedPhotonRadiancePerSM2Sr: number;
  sourceReconstructionRelativeDifference: number;
  logTemperatureSensitivity: number;
  logRedshiftSensitivity: number;
  temperatureFiniteDifferenceLogSensitivity: number;
  redshiftFiniteDifferenceLogSensitivity: number;
  temperatureFiniteDifferenceRelativeDifference: number;
  redshiftFiniteDifferenceRelativeDifference: number;
  sourceSensitivityDegeneracyAbsoluteDifference: number;
  pythonOracleMaximumRelativeDifference: number;
}>;

export type KerrPhotonIdentifiabilityComputationV387 = Readonly<{
  rows: readonly Omit<
    KerrPhotonIdentifiabilityRowV387,
    "pythonOracleMaximumRelativeDifference"
  >[];
  rayAudits: readonly Readonly<{
    rayIndex: number;
    bandCount: 3;
    jacobianRows: readonly (readonly [number, number])[];
    singularValues: readonly [number, 0];
    rank: 1;
  }>[];
  global: Readonly<{
    jacobianRows: readonly (readonly [number, number])[];
    singularValues: readonly [number, 0];
    rank: 1;
  }>;
  maxima: Readonly<{
    sourceReconstructionRelativeDifference: number;
    finiteDifferenceRelativeDifference: number;
    sourceSensitivityDegeneracyAbsoluteDifference: number;
  }>;
}>;

export type KerrPhotonSourceIdentifiabilityArtifactV387 = Readonly<{
  version: typeof KERR_PHOTON_SOURCE_IDENTIFIABILITY_VERSION_V387;
  generatedAt: string;
  status:
    "three-band-identifiability-audit-qualified-source-degeneracy-persists-covariance-unavailable";
  source: Readonly<{
    v328PhotonArtifactSha256: string;
    v328FullShortAuthoritySha256: string;
    v386SensitivityArtifactSha256: string;
  }>;
  rows: readonly KerrPhotonIdentifiabilityRowV387[];
  rayAudits: KerrPhotonIdentifiabilityComputationV387["rayAudits"];
  global: KerrPhotonIdentifiabilityComputationV387["global"];
  counts: Readonly<{
    rayCount: 4;
    bandCount: 3;
    measurementCount: 12;
    sourceParameterCount: 2;
  }>;
  maxima: Readonly<{
    sourceReconstructionRelativeDifference: number;
    finiteDifferenceRelativeDifference: number;
    sourceSensitivityDegeneracyAbsoluteDifference: number;
    pythonOracleRelativeDifference: number;
  }>;
  theorem: Readonly<{
    model: "liouville-invariant-redshifted-planck-radiance";
    identity: "g-cubed-times-Bnu-nu-over-g-T-equals-Bnu-nu-gT";
    identifiableCombination: "ln-g-plus-ln-T";
    nullDirection: readonly [number, number];
    additionalContinuumBandsBreakDegeneracy: false;
    requiredDegeneracyBreaker: readonly [
      "independent-redshift-prior",
      "independent-temperature-prior",
      "rest-frame-spectral-feature-or-non-planck-model",
    ];
  }>;
  covarianceAdmission: Readonly<{
    validatorImplemented: true;
    jointDimension: 14;
    throughputShape: readonly [12, 12];
    sourceShape: readonly [2, 2];
    crossShape: readonly [12, 2];
    identityShaRequired: true;
    finiteSymmetricPsdRequired: true;
    crossBlockRequiredUnlessIndependenceDocumented: true;
    covariancePackAvailable: false;
    admissionStatus: "not-run-input-unavailable";
    syntheticFixturePublishable: false;
    uncertaintyProjectionAvailable: false;
  }>;
  qualification: Readonly<{
    identifiabilityAuditQualified: true;
    temperatureRedshiftSeparatelyIdentifiable: false;
    absoluteScientificUncertaintyQualified: false;
    measuredAuthorityGranted: false;
    observedCountsAvailable: false;
    scienceImageAvailable: false;
  }>;
  export: Readonly<{
    csvPath:
      "dist/science/kerr-photon-source-identifiability-v387/identifiability.csv";
    csvFileSha256: string;
    rowCount: 12;
  }>;
  networkAttempted: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

export type PhotonCovariancePackV387 = Readonly<{
  version: "v387-photon-covariance-pack-v1";
  identity: Readonly<{
    v386SensitivityArtifactSha256: string;
    parameterOrder: readonly string[];
  }>;
  throughputFractionalCovariance: readonly (readonly number[])[];
  sourceLogCovariance: readonly (readonly number[])[];
  throughputSourceCrossCovariance: readonly (readonly number[])[] | null;
  crossCovarianceIndependenceEvidence: Readonly<{
    documented: true;
    evidenceSha256: string;
  }> | null;
  fixtureOnly: boolean;
}>;

export type PhotonCovarianceAdmissionV387 = Readonly<{
  jointDimension: 14;
  maximumSymmetryResidual: number;
  minimumEigenvalue: number;
  maximumEigenvalue: number;
  crossBlockMode: "supplied" | "documented-independent-zero";
  fixtureOnly: boolean;
  publishableAsMeasuredCovariance: boolean;
}>;

function photonAndSensitivity(
  observedFrequencyHz: number,
  temperatureK: number,
  redshiftFactor: number,
) {
  const emittedFrequencyHz = observedFrequencyHz / redshiftFactor;
  const exponent =
    (KERR_PLANCK_CONSTANT_J_S_V328 * emittedFrequencyHz) /
    (V384_BOLTZMANN_CONSTANT_J_K * temperatureK);
  const emittedEnergyRadiance =
    (2 * KERR_PLANCK_CONSTANT_J_S_V328 * emittedFrequencyHz ** 3) /
    (V384_SPEED_OF_LIGHT_M_S ** 2 * Math.expm1(exponent));
  const observedEnergyRadiance = redshiftFactor ** 3 * emittedEnergyRadiance;
  const photonRadiance =
    observedEnergyRadiance /
    (KERR_PLANCK_CONSTANT_J_S_V328 * observedFrequencyHz);
  const logProductSensitivity = exponent / -Math.expm1(-exponent);
  if (
    !Number.isFinite(photonRadiance) ||
    photonRadiance <= 0 ||
    !Number.isFinite(logProductSensitivity) ||
    logProductSensitivity <= 0
  ) {
    throw new Error("v387-spectral-response");
  }
  return Object.freeze({ photonRadiance, logProductSensitivity });
}

function integrateBand(
  lowerFrequencyHz: number,
  upperFrequencyHz: number,
  temperatureK: number,
  redshiftFactor: number,
) {
  const width =
    (upperFrequencyHz - lowerFrequencyHz) / V387_INTEGRATION_STEPS;
  let total = 0;
  let derivative = 0;
  for (let index = 0; index <= V387_INTEGRATION_STEPS; index += 1) {
    const frequencyHz = lowerFrequencyHz + index * width;
    const value = photonAndSensitivity(
      frequencyHz,
      temperatureK,
      redshiftFactor,
    );
    const coefficient =
      index === 0 || index === V387_INTEGRATION_STEPS
        ? 1
        : index % 2 === 0
          ? 2
          : 4;
    total += coefficient * value.photonRadiance;
    derivative +=
      coefficient * value.photonRadiance * value.logProductSensitivity;
  }
  total *= width / 3;
  derivative *= width / 3;
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("v387-band-integral");
  }
  return Object.freeze({ total, logProductSensitivity: derivative / total });
}

const relativeDifference = (left: number, right: number) =>
  Math.abs(left - right) /
  Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));

function centralLogSensitivity(
  lowerFrequencyHz: number,
  upperFrequencyHz: number,
  temperatureK: number,
  redshiftFactor: number,
  parameter: "temperature" | "redshift",
) {
  const step = V387_FINITE_DIFFERENCE_STEP;
  const plus = integrateBand(
    lowerFrequencyHz,
    upperFrequencyHz,
    parameter === "temperature" ? temperatureK * (1 + step) : temperatureK,
    parameter === "redshift"
      ? redshiftFactor * (1 + step)
      : redshiftFactor,
  ).total;
  const minus = integrateBand(
    lowerFrequencyHz,
    upperFrequencyHz,
    parameter === "temperature" ? temperatureK * (1 - step) : temperatureK,
    parameter === "redshift"
      ? redshiftFactor * (1 - step)
      : redshiftFactor,
  ).total;
  return Math.log(plus / minus) / Math.log((1 + step) / (1 - step));
}

function singularValuesForEqualColumns(values: readonly number[]) {
  const leading = Math.sqrt(
    2 * values.reduce((sum, value) => sum + value * value, 0),
  );
  return Object.freeze([leading, 0] as const);
}

export function createKerrPhotonSourceIdentifiabilityV387(
  photonViewValue: KerrSciencePhotonBandViewV328,
): KerrPhotonIdentifiabilityComputationV387 {
  const photonView = parseKerrSciencePhotonBandViewV328(photonViewValue);
  let maximumReconstruction = 0;
  let maximumFiniteDifference = 0;
  let maximumDegeneracy = 0;
  const rows = photonView.rays.flatMap((ray) =>
    ray.measurements.map((measurement) => {
      const response = integrateBand(
        measurement.bandLowerFrequencyHz,
        measurement.bandUpperFrequencyHz,
        ray.effectiveTemperatureK,
        ray.redshiftFactor,
      );
      const sourceReconstructionRelativeDifference = relativeDifference(
        response.total,
        measurement.observedPhotonRadiancePerSM2Sr,
      );
      const temperatureFiniteDifferenceLogSensitivity = centralLogSensitivity(
        measurement.bandLowerFrequencyHz,
        measurement.bandUpperFrequencyHz,
        ray.effectiveTemperatureK,
        ray.redshiftFactor,
        "temperature",
      );
      const redshiftFiniteDifferenceLogSensitivity = centralLogSensitivity(
        measurement.bandLowerFrequencyHz,
        measurement.bandUpperFrequencyHz,
        ray.effectiveTemperatureK,
        ray.redshiftFactor,
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
        sourceReconstructionRelativeDifference >=
          V387_SOURCE_RECONSTRUCTION_LIMIT ||
        temperatureFiniteDifferenceRelativeDifference >=
          V387_FINITE_DIFFERENCE_RELATIVE_LIMIT ||
        redshiftFiniteDifferenceRelativeDifference >=
          V387_FINITE_DIFFERENCE_RELATIVE_LIMIT ||
        sourceSensitivityDegeneracyAbsoluteDifference >=
          V387_DEGENERACY_ABSOLUTE_LIMIT
      ) {
        throw new Error(
          `v387-identifiability-gate:${ray.rayIndex}:${measurement.bandId}`,
        );
      }
      maximumReconstruction = Math.max(
        maximumReconstruction,
        sourceReconstructionRelativeDifference,
      );
      maximumFiniteDifference = Math.max(
        maximumFiniteDifference,
        temperatureFiniteDifferenceRelativeDifference,
        redshiftFiniteDifferenceRelativeDifference,
      );
      maximumDegeneracy = Math.max(
        maximumDegeneracy,
        sourceSensitivityDegeneracyAbsoluteDifference,
      );
      return Object.freeze({
        rayIndex: ray.rayIndex,
        bandId: measurement.bandId,
        bandLowerFrequencyHz: measurement.bandLowerFrequencyHz,
        bandUpperFrequencyHz: measurement.bandUpperFrequencyHz,
        sourcePhotonRadiancePerSM2Sr:
          measurement.observedPhotonRadiancePerSM2Sr,
        reconstructedPhotonRadiancePerSM2Sr: response.total,
        sourceReconstructionRelativeDifference,
        logTemperatureSensitivity: response.logProductSensitivity,
        logRedshiftSensitivity: response.logProductSensitivity,
        temperatureFiniteDifferenceLogSensitivity,
        redshiftFiniteDifferenceLogSensitivity,
        temperatureFiniteDifferenceRelativeDifference,
        redshiftFiniteDifferenceRelativeDifference,
        sourceSensitivityDegeneracyAbsoluteDifference,
      });
    }),
  );
  if (rows.length !== 12) throw new Error("v387-row-count");
  const rayAudits = Object.freeze(
    photonView.rays.map((ray) => {
      const values = rows
        .filter((row) => row.rayIndex === ray.rayIndex)
        .map((row) => row.logTemperatureSensitivity);
      if (values.length !== 3) throw new Error("v387-ray-band-count");
      return Object.freeze({
        rayIndex: ray.rayIndex,
        bandCount: 3 as const,
        jacobianRows: Object.freeze(
          values.map((value) => Object.freeze([value, value] as const)),
        ),
        singularValues: singularValuesForEqualColumns(values),
        rank: 1 as const,
      });
    }),
  );
  const globalValues = rows.map((row) => row.logTemperatureSensitivity);
  return Object.freeze({
    rows: Object.freeze(rows),
    rayAudits,
    global: Object.freeze({
      jacobianRows: Object.freeze(
        globalValues.map((value) => Object.freeze([value, value] as const)),
      ),
      singularValues: singularValuesForEqualColumns(globalValues),
      rank: 1 as const,
    }),
    maxima: Object.freeze({
      sourceReconstructionRelativeDifference: maximumReconstruction,
      finiteDifferenceRelativeDifference: maximumFiniteDifference,
      sourceSensitivityDegeneracyAbsoluteDifference: maximumDegeneracy,
    }),
  });
}

function assertMatrix(
  matrix: readonly (readonly number[])[],
  rows: number,
  columns: number,
  id: string,
) {
  if (
    matrix.length !== rows ||
    matrix.some(
      (row) =>
        row.length !== columns ||
        row.some((value) => !Number.isFinite(value)),
    )
  ) {
    throw new Error(`v387-covariance-shape:${id}`);
  }
}

function jacobiEigenvalues(matrix: readonly (readonly number[])[]) {
  const values = matrix.map((row) => [...row]);
  const dimension = values.length;
  for (let sweep = 0; sweep < dimension * dimension * 32; sweep += 1) {
    let p = 0;
    let q = 1;
    let maximum = 0;
    for (let row = 0; row < dimension; row += 1) {
      for (let column = row + 1; column < dimension; column += 1) {
        const candidate = Math.abs(values[row][column]);
        if (candidate > maximum) {
          maximum = candidate;
          p = row;
          q = column;
        }
      }
    }
    if (maximum < 1e-15) break;
    const angle = 0.5 * Math.atan2(
      2 * values[p][q],
      values[q][q] - values[p][p],
    );
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const pp = values[p][p];
    const qq = values[q][q];
    const pq = values[p][q];
    values[p][p] =
      cosine * cosine * pp - 2 * sine * cosine * pq + sine * sine * qq;
    values[q][q] =
      sine * sine * pp + 2 * sine * cosine * pq + cosine * cosine * qq;
    values[p][q] = 0;
    values[q][p] = 0;
    for (let index = 0; index < dimension; index += 1) {
      if (index === p || index === q) continue;
      const ip = values[index][p];
      const iq = values[index][q];
      values[index][p] = cosine * ip - sine * iq;
      values[p][index] = values[index][p];
      values[index][q] = sine * ip + cosine * iq;
      values[q][index] = values[index][q];
    }
  }
  return values.map((row, index) => row[index]);
}

export function validatePhotonCovariancePackV387(
  pack: PhotonCovariancePackV387,
  expectedV386SensitivityArtifactSha256: string,
): PhotonCovarianceAdmissionV387 {
  if (
    pack.version !== "v387-photon-covariance-pack-v1" ||
    !SHA256.test(expectedV386SensitivityArtifactSha256) ||
    pack.identity.v386SensitivityArtifactSha256 !==
      expectedV386SensitivityArtifactSha256 ||
    pack.identity.parameterOrder.length !==
      V387_COVARIANCE_PARAMETER_ORDER.length ||
    pack.identity.parameterOrder.some(
      (entry, index) => entry !== V387_COVARIANCE_PARAMETER_ORDER[index],
    )
  ) {
    throw new Error("v387-covariance-identity");
  }
  assertMatrix(pack.throughputFractionalCovariance, 12, 12, "throughput");
  assertMatrix(pack.sourceLogCovariance, 2, 2, "source");
  if (pack.throughputSourceCrossCovariance) {
    assertMatrix(pack.throughputSourceCrossCovariance, 12, 2, "cross");
  } else if (
    pack.crossCovarianceIndependenceEvidence?.documented !== true ||
    !SHA256.test(pack.crossCovarianceIndependenceEvidence.evidenceSha256)
  ) {
    throw new Error("v387-covariance-cross-block");
  }
  const joint = Array.from({ length: 14 }, () => Array(14).fill(0));
  for (let row = 0; row < 12; row += 1) {
    for (let column = 0; column < 12; column += 1) {
      joint[row][column] = pack.throughputFractionalCovariance[row][column];
    }
  }
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      joint[row + 12][column + 12] = pack.sourceLogCovariance[row][column];
    }
  }
  if (pack.throughputSourceCrossCovariance) {
    for (let row = 0; row < 12; row += 1) {
      for (let column = 0; column < 2; column += 1) {
        const value = pack.throughputSourceCrossCovariance[row][column];
        joint[row][column + 12] = value;
        joint[column + 12][row] = value;
      }
    }
  }
  let maximumSymmetryResidual = 0;
  let scale = 1;
  for (let row = 0; row < 14; row += 1) {
    if (joint[row][row] < 0) throw new Error("v387-covariance-diagonal");
    for (let column = 0; column < 14; column += 1) {
      scale = Math.max(scale, Math.abs(joint[row][column]));
      maximumSymmetryResidual = Math.max(
        maximumSymmetryResidual,
        Math.abs(joint[row][column] - joint[column][row]),
      );
    }
  }
  if (
    maximumSymmetryResidual > V387_COVARIANCE_SYMMETRY_TOLERANCE * scale
  ) {
    throw new Error("v387-covariance-symmetry");
  }
  const eigenvalues = jacobiEigenvalues(joint);
  const minimumEigenvalue = Math.min(...eigenvalues);
  const maximumEigenvalue = Math.max(...eigenvalues);
  if (
    minimumEigenvalue < -V387_COVARIANCE_PSD_TOLERANCE *
      Math.max(1, Math.abs(maximumEigenvalue))
  ) {
    throw new Error("v387-covariance-psd");
  }
  return Object.freeze({
    jointDimension: 14 as const,
    maximumSymmetryResidual,
    minimumEigenvalue,
    maximumEigenvalue,
    crossBlockMode: pack.throughputSourceCrossCovariance
      ? "supplied" as const
      : "documented-independent-zero" as const,
    fixtureOnly: pack.fixtureOnly,
    publishableAsMeasuredCovariance: !pack.fixtureOnly,
  });
}

export function parseKerrPhotonSourceIdentifiabilityArtifactV387(
  value: unknown,
): KerrPhotonSourceIdentifiabilityArtifactV387 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<KerrPhotonSourceIdentifiabilityArtifactV387>)
    : null;
  const rows = source?.rows ?? [];
  if (
    !source ||
    source.version !== KERR_PHOTON_SOURCE_IDENTIFIABILITY_VERSION_V387 ||
    source.status !==
      "three-band-identifiability-audit-qualified-source-degeneracy-persists-covariance-unavailable" ||
    !source.source ||
    !Object.values(source.source).every((entry) => SHA256.test(entry)) ||
    rows.length !== 12 ||
    rows.some(
      (row) =>
        row.sourceReconstructionRelativeDifference >=
          V387_SOURCE_RECONSTRUCTION_LIMIT ||
        row.temperatureFiniteDifferenceRelativeDifference >=
          V387_FINITE_DIFFERENCE_RELATIVE_LIMIT ||
        row.redshiftFiniteDifferenceRelativeDifference >=
          V387_FINITE_DIFFERENCE_RELATIVE_LIMIT ||
        row.sourceSensitivityDegeneracyAbsoluteDifference >=
          V387_DEGENERACY_ABSOLUTE_LIMIT ||
        row.pythonOracleMaximumRelativeDifference >= V387_ORACLE_RELATIVE_LIMIT,
    ) ||
    source.rayAudits?.length !== 4 ||
    source.rayAudits.some(
      (entry) =>
        entry.bandCount !== 3 ||
        entry.jacobianRows.length !== 3 ||
        entry.rank !== 1 ||
        entry.singularValues[1] !== 0,
    ) ||
    source.global?.jacobianRows.length !== 12 ||
    source.global.rank !== 1 ||
    source.global.singularValues[1] !== 0 ||
    source.counts?.rayCount !== 4 ||
    source.counts.bandCount !== 3 ||
    source.counts.measurementCount !== 12 ||
    source.counts.sourceParameterCount !== 2 ||
    (source.maxima?.sourceReconstructionRelativeDifference ??
      Number.POSITIVE_INFINITY) >= V387_SOURCE_RECONSTRUCTION_LIMIT ||
    (source.maxima?.finiteDifferenceRelativeDifference ??
      Number.POSITIVE_INFINITY) >= V387_FINITE_DIFFERENCE_RELATIVE_LIMIT ||
    (source.maxima?.sourceSensitivityDegeneracyAbsoluteDifference ??
      Number.POSITIVE_INFINITY) >= V387_DEGENERACY_ABSOLUTE_LIMIT ||
    (source.maxima?.pythonOracleRelativeDifference ??
      Number.POSITIVE_INFINITY) >= V387_ORACLE_RELATIVE_LIMIT ||
    source.theorem?.additionalContinuumBandsBreakDegeneracy !== false ||
    source.theorem.identifiableCombination !== "ln-g-plus-ln-T" ||
    source.covarianceAdmission?.validatorImplemented !== true ||
    source.covarianceAdmission.jointDimension !== 14 ||
    source.covarianceAdmission.covariancePackAvailable !== false ||
    source.covarianceAdmission.admissionStatus !== "not-run-input-unavailable" ||
    source.covarianceAdmission.syntheticFixturePublishable !== false ||
    source.covarianceAdmission.uncertaintyProjectionAvailable !== false ||
    source.qualification?.identifiabilityAuditQualified !== true ||
    source.qualification.temperatureRedshiftSeparatelyIdentifiable !== false ||
    source.qualification.absoluteScientificUncertaintyQualified !== false ||
    source.qualification.measuredAuthorityGranted !== false ||
    source.qualification.observedCountsAvailable !== false ||
    source.qualification.scienceImageAvailable !== false ||
    source.export?.csvPath !==
      "dist/science/kerr-photon-source-identifiability-v387/identifiability.csv" ||
    !SHA256.test(source.export?.csvFileSha256 ?? "") ||
    source.export?.rowCount !== 12 ||
    source.networkAttempted !== false ||
    source.sciencePayloadMutationAllowed !== false ||
    source.cinematicConsumerAllowed !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !SHA256.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v387-identifiability-artifact-identity");
  }
  return value as KerrPhotonSourceIdentifiabilityArtifactV387;
}
