export const GAIA_SCIENCE_SUBSET_VERSION = "v259-gaia-science-subset-v8" as const;
export const GAIA_SCIENCE_MONTE_CARLO_SAMPLES = 4_096;
export const GAIA_SCIENCE_MONTE_CARLO_SEED = 2_590_004_096;
export const GAIA_TANGENTIAL_VELOCITY_FACTOR = 4.74047;

export type GaiaScienceQualityTierV8 = "gold" | "silver" | "limited";

export type GaiaScienceRecordV8 = {
  sourceId: string;
  raDeg: number;
  decDeg: number;
  raErrorMas: number;
  decErrorMas: number;
  parallaxMas: number;
  parallaxErrorMas: number;
  pmRaMasYr: number;
  pmRaErrorMasYr: number;
  pmDecMasYr: number;
  pmDecErrorMasYr: number;
  correlations: readonly [number, number, number, number, number, number, number, number, number, number];
  radialVelocityKmS: number | null;
  radialVelocityErrorKmS: number | null;
  photGMeanFlux: number;
  photGMeanFluxError: number;
  photBpMeanFlux: number;
  photBpMeanFluxError: number;
  photRpMeanFlux: number;
  photRpMeanFluxError: number;
  photGMeanMag: number;
  bpRp: number;
  ruwe: number;
  visibilityPeriodsUsed: number;
  astrometricParamsSolved: number;
  duplicatedSource: boolean;
  photBpRpExcessFactor: number;
  healpixOrder5: number;
  qualityTier: GaiaScienceQualityTierV8;
  solutionType: string;
};

export type GaiaAstrometricCovarianceV1 = {
  version: "gaia-astrometric-covariance-v1";
  parameters: readonly ["ra", "dec", "parallax", "pmra", "pmdec"];
  units: readonly ["mas", "mas", "mas", "mas/yr", "mas/yr"];
  matrix: readonly (readonly number[])[];
  symmetric: true;
  positiveSemidefinite: boolean;
};

export type GaiaUncertaintyIntervalV8 = {
  median: number;
  lower: number;
  upper: number;
  unit: string;
};

export type GaiaScienceAnalysisResultV8 = {
  version: "v259-gaia-analysis-v8";
  sourceId: string;
  qualityTier: GaiaScienceQualityTierV8;
  covariance: GaiaAstrometricCovarianceV1;
  dimension: 5 | 6;
  distanceReliable: boolean;
  firstOrder: {
    distancePc: GaiaUncertaintyIntervalV8 | null;
    tangentialRaKmS: GaiaUncertaintyIntervalV8 | null;
    tangentialDecKmS: GaiaUncertaintyIntervalV8 | null;
    absoluteGMag: GaiaUncertaintyIntervalV8 | null;
  };
  monteCarlo: {
    seed: number;
    samples: 4_096;
    acceptedPositiveParallaxSamples: number;
    distancePc: GaiaUncertaintyIntervalV8 | null;
    tangentialSpeedKmS: GaiaUncertaintyIntervalV8 | null;
    absoluteGMag: GaiaUncertaintyIntervalV8 | null;
  };
  radialVelocity: { valueKmS: number; errorKmS: number } | null;
  canonical: true;
  boundary: "gaia-subset-uncertainty-not-orbit-physics-or-survey-completeness";
};

export type AtlasSelectionFunctionSummary = {
  version: "v259-atlas-subset-selection-v1";
  selectedRows: 200_000;
  motherRows: 1_224_219;
  dimensions: readonly ["healpix-order5", "g", "bp-rp"];
  bins: readonly { healpixOrder5: number; magnitudeBin: number; colorBin: number; selected: number; mother: number; inclusionFraction: number }[];
  canonical: true;
  boundary: "atlas-subset-inclusion-not-gaia-survey-completeness";
};

export type GaiaSurveyCompletenessSummaryV1 = {
  version: "v259-gaiaunlimited-dr3-selection-tcg-v1";
  model: "GaiaUnlimited.DR3SelectionFunctionTCG";
  modelVersion: string;
  validMagnitudeRange: readonly [number, number];
  valuesByHealpixAndMagnitude: Readonly<Record<string, number>>;
  canonical: true;
  boundary: "empirical-gaia-survey-model-valid-only-in-published-domain";
};

function nullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function requiredNumber(row: Record<string, unknown>, key: string): number {
  const value = Number(row[key]);
  if (!Number.isFinite(value)) throw new Error(`Gaia science field ${key} is not finite`);
  return value;
}

export function gaiaScienceRecordFromDatabaseRowV8(row: Record<string, unknown>): GaiaScienceRecordV8 {
  const correlations = [
    "ra_dec_corr", "ra_parallax_corr", "ra_pmra_corr", "ra_pmdec_corr",
    "dec_parallax_corr", "dec_pmra_corr", "dec_pmdec_corr",
    "parallax_pmra_corr", "parallax_pmdec_corr", "pmra_pmdec_corr",
  ].map((key) => requiredNumber(row, key)) as unknown as GaiaScienceRecordV8["correlations"];
  const radialVelocityKmS = nullableNumber(row.radial_velocity);
  const radialVelocityErrorKmS = nullableNumber(row.radial_velocity_error);
  return {
    sourceId: String(row.source_id),
    raDeg: requiredNumber(row, "ra"),
    decDeg: requiredNumber(row, "dec"),
    raErrorMas: requiredNumber(row, "ra_error"),
    decErrorMas: requiredNumber(row, "dec_error"),
    parallaxMas: requiredNumber(row, "parallax"),
    parallaxErrorMas: requiredNumber(row, "parallax_error"),
    pmRaMasYr: requiredNumber(row, "pmra"),
    pmRaErrorMasYr: requiredNumber(row, "pmra_error"),
    pmDecMasYr: requiredNumber(row, "pmdec"),
    pmDecErrorMasYr: requiredNumber(row, "pmdec_error"),
    correlations,
    radialVelocityKmS: radialVelocityKmS !== null && Number.isFinite(radialVelocityKmS) ? radialVelocityKmS : null,
    radialVelocityErrorKmS: radialVelocityErrorKmS !== null && Number.isFinite(radialVelocityErrorKmS) ? radialVelocityErrorKmS : null,
    photGMeanFlux: requiredNumber(row, "phot_g_mean_flux"),
    photGMeanFluxError: requiredNumber(row, "phot_g_mean_flux_error"),
    photBpMeanFlux: requiredNumber(row, "phot_bp_mean_flux"),
    photBpMeanFluxError: requiredNumber(row, "phot_bp_mean_flux_error"),
    photRpMeanFlux: requiredNumber(row, "phot_rp_mean_flux"),
    photRpMeanFluxError: requiredNumber(row, "phot_rp_mean_flux_error"),
    photGMeanMag: requiredNumber(row, "phot_g_mean_mag"),
    bpRp: requiredNumber(row, "bp_rp"),
    ruwe: requiredNumber(row, "ruwe"),
    visibilityPeriodsUsed: requiredNumber(row, "visibility_periods_used"),
    astrometricParamsSolved: requiredNumber(row, "astrometric_params_solved"),
    duplicatedSource: Boolean(row.duplicated_source),
    photBpRpExcessFactor: requiredNumber(row, "phot_bp_rp_excess_factor"),
    healpixOrder5: requiredNumber(row, "healpix_order5"),
    qualityTier: String(row.quality_tier) as GaiaScienceQualityTierV8,
    solutionType: String(row.solution_type),
  };
}

const PARAMETER_COUNT = 5;
const CORRELATION_PAIRS = [
  [0, 1], [0, 2], [0, 3], [0, 4], [1, 2],
  [1, 3], [1, 4], [2, 3], [2, 4], [3, 4],
] as const;

function finite(value: number): boolean {
  return Number.isFinite(value);
}

export function reconstructGaiaAstrometricCovarianceV1(
  record: GaiaScienceRecordV8,
): GaiaAstrometricCovarianceV1 {
  const errors = [
    record.raErrorMas,
    record.decErrorMas,
    record.parallaxErrorMas,
    record.pmRaErrorMasYr,
    record.pmDecErrorMasYr,
  ];
  if (errors.some((value) => !finite(value) || value <= 0) || record.correlations.some((value) => !finite(value) || Math.abs(value) > 1)) {
    throw new Error("Gaia covariance inputs are invalid");
  }
  const correlation: number[][] = Array.from({ length: PARAMETER_COUNT }, (_, row) =>
    Array.from({ length: PARAMETER_COUNT }, (_, column) => row === column ? 1 : 0),
  );
  CORRELATION_PAIRS.forEach(([left, right], index) => {
    correlation[left]![right] = record.correlations[index]!;
    correlation[right]![left] = record.correlations[index]!;
  });
  const matrix = correlation.map((row, rowIndex) =>
    row.map((value, columnIndex) => value * errors[rowIndex]! * errors[columnIndex]!),
  );
  return {
    version: "gaia-astrometric-covariance-v1",
    parameters: ["ra", "dec", "parallax", "pmra", "pmdec"],
    units: ["mas", "mas", "mas", "mas/yr", "mas/yr"],
    matrix,
    symmetric: true,
    positiveSemidefinite: choleskySemidefinite(matrix) !== null,
  };
}

function choleskySemidefinite(matrix: readonly (readonly number[])[]): number[][] | null {
  const lower = Array.from({ length: PARAMETER_COUNT }, () => Array(PARAMETER_COUNT).fill(0) as number[]);
  const scale = Math.max(1, ...matrix.map((row, index) => Math.abs(row[index] ?? 0)));
  const tolerance = scale * 1e-10;
  for (let row = 0; row < PARAMETER_COUNT; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      let sum = matrix[row]![column]!;
      for (let inner = 0; inner < column; inner += 1) sum -= lower[row]![inner]! * lower[column]![inner]!;
      if (row === column) {
        if (sum < -tolerance) return null;
        lower[row]![column] = Math.sqrt(Math.max(0, sum));
      } else {
        const denominator = lower[column]![column]!;
        lower[row]![column] = denominator > tolerance ? sum / denominator : 0;
      }
    }
  }
  return lower;
}

function interval(value: number, sigma: number, unit: string): GaiaUncertaintyIntervalV8 {
  return { median: value, lower: value - sigma, upper: value + sigma, unit };
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  };
}

function normalGenerator(seed: number): () => number {
  const random = mulberry32(seed);
  let spare: number | null = null;
  return () => {
    if (spare !== null) {
      const result = spare;
      spare = null;
      return result;
    }
    const u = Math.max(Number.EPSILON, random());
    const v = random();
    const radius = Math.sqrt(-2 * Math.log(u));
    spare = radius * Math.sin(2 * Math.PI * v);
    return radius * Math.cos(2 * Math.PI * v);
  };
}

function quantile(sorted: readonly number[], fraction: number): number {
  if (!sorted.length) return Number.NaN;
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const t = position - lower;
  return sorted[lower]! * (1 - t) + sorted[upper]! * t;
}

function percentileInterval(values: number[], unit: string): GaiaUncertaintyIntervalV8 | null {
  if (!values.length) return null;
  values.sort((left, right) => left - right);
  return {
    median: quantile(values, 0.5),
    lower: quantile(values, 0.158655),
    upper: quantile(values, 0.841345),
    unit,
  };
}

export function analyzeGaiaScienceRecordV8(
  record: GaiaScienceRecordV8,
  seed = GAIA_SCIENCE_MONTE_CARLO_SEED,
): GaiaScienceAnalysisResultV8 {
  const covariance = reconstructGaiaAstrometricCovarianceV1(record);
  if (!covariance.positiveSemidefinite) throw new Error("Gaia covariance is not positive semidefinite");
  const parallaxSnr = Math.abs(record.parallaxMas / record.parallaxErrorMas);
  const distanceReliable = record.parallaxMas > 0 && parallaxSnr >= 5 && record.qualityTier !== "limited";
  const parallax = record.parallaxMas;
  const distance = distanceReliable ? 1_000 / parallax : null;
  const distanceSigma = distanceReliable ? (1_000 * record.parallaxErrorMas) / (parallax * parallax) : null;
  const tangentialRa = distanceReliable ? GAIA_TANGENTIAL_VELOCITY_FACTOR * record.pmRaMasYr / parallax : null;
  const tangentialDec = distanceReliable ? GAIA_TANGENTIAL_VELOCITY_FACTOR * record.pmDecMasYr / parallax : null;
  const tangentialRaSigma = distanceReliable ? GAIA_TANGENTIAL_VELOCITY_FACTOR * Math.sqrt(
    (record.pmRaErrorMasYr / parallax) ** 2 +
    (record.pmRaMasYr * record.parallaxErrorMas / (parallax * parallax)) ** 2 -
    2 * record.pmRaMasYr * record.correlations[7]! * record.pmRaErrorMasYr * record.parallaxErrorMas / (parallax ** 3),
  ) : null;
  const tangentialDecSigma = distanceReliable ? GAIA_TANGENTIAL_VELOCITY_FACTOR * Math.sqrt(
    (record.pmDecErrorMasYr / parallax) ** 2 +
    (record.pmDecMasYr * record.parallaxErrorMas / (parallax * parallax)) ** 2 -
    2 * record.pmDecMasYr * record.correlations[8]! * record.pmDecErrorMasYr * record.parallaxErrorMas / (parallax ** 3),
  ) : null;
  const absoluteG = distanceReliable ? record.photGMeanMag + 5 * Math.log10(parallax / 100) : null;
  const gError = 1.0857362047581296 * record.photGMeanFluxError / record.photGMeanFlux;
  const absoluteGSigma = distanceReliable ? Math.hypot(gError, 5 * record.parallaxErrorMas / (Math.LN10 * parallax)) : null;
  const lower = choleskySemidefinite(covariance.matrix)!;
  const normal = normalGenerator(seed);
  const means = [record.raDeg * 3_600_000, record.decDeg * 3_600_000, parallax, record.pmRaMasYr, record.pmDecMasYr];
  const distances: number[] = [];
  const tangentialSpeeds: number[] = [];
  const absoluteMagnitudes: number[] = [];
  for (let sample = 0; sample < GAIA_SCIENCE_MONTE_CARLO_SAMPLES; sample += 1) {
    const gaussian = Array.from({ length: PARAMETER_COUNT }, () => normal());
    const values = means.map((mean, row) => mean + lower[row]!.reduce((sum, coefficient, column) => sum + coefficient * gaussian[column]!, 0));
    const sampleParallax = values[2]!;
    if (sampleParallax <= 0) continue;
    const sampleDistance = 1_000 / sampleParallax;
    distances.push(sampleDistance);
    tangentialSpeeds.push(GAIA_TANGENTIAL_VELOCITY_FACTOR * Math.hypot(values[3]!, values[4]!) / sampleParallax);
    absoluteMagnitudes.push(record.photGMeanMag + 5 * Math.log10(sampleParallax / 100));
  }
  const monteCarloReliable = distanceReliable && distances.length >= GAIA_SCIENCE_MONTE_CARLO_SAMPLES * 0.95;
  return {
    version: "v259-gaia-analysis-v8",
    sourceId: record.sourceId,
    qualityTier: record.qualityTier,
    covariance,
    dimension: record.radialVelocityKmS === null ? 5 : 6,
    distanceReliable,
    firstOrder: {
      distancePc: distance !== null && distanceSigma !== null ? interval(distance, distanceSigma, "pc") : null,
      tangentialRaKmS: tangentialRa !== null && tangentialRaSigma !== null ? interval(tangentialRa, tangentialRaSigma, "km/s") : null,
      tangentialDecKmS: tangentialDec !== null && tangentialDecSigma !== null ? interval(tangentialDec, tangentialDecSigma, "km/s") : null,
      absoluteGMag: absoluteG !== null && absoluteGSigma !== null ? interval(absoluteG, absoluteGSigma, "mag") : null,
    },
    monteCarlo: {
      seed,
      samples: GAIA_SCIENCE_MONTE_CARLO_SAMPLES,
      acceptedPositiveParallaxSamples: distances.length,
      distancePc: monteCarloReliable ? percentileInterval(distances, "pc") : null,
      tangentialSpeedKmS: monteCarloReliable ? percentileInterval(tangentialSpeeds, "km/s") : null,
      absoluteGMag: monteCarloReliable ? percentileInterval(absoluteMagnitudes, "mag") : null,
    },
    radialVelocity: record.radialVelocityKmS !== null && record.radialVelocityErrorKmS !== null
      ? { valueKmS: record.radialVelocityKmS, errorKmS: record.radialVelocityErrorKmS }
      : null,
    canonical: true,
    boundary: "gaia-subset-uncertainty-not-orbit-physics-or-survey-completeness",
  };
}

export function atlasSubsetInclusionFractionV1(selected: number, mother: number): number {
  if (!(Number.isInteger(selected) && selected >= 0 && Number.isInteger(mother) && mother >= selected && mother > 0)) {
    throw new RangeError("Atlas subset counts are invalid");
  }
  return selected / mother;
}

export function evaluateGaiaSurveyCompletenessV1(
  summary: GaiaSurveyCompletenessSummaryV1,
  healpixCell: number,
  magnitude: number,
): { status: "available"; value: number } | { status: "unavailable"; reason: string } {
  if (magnitude < summary.validMagnitudeRange[0] || magnitude > summary.validMagnitudeRange[1]) {
    return { status: "unavailable", reason: "outside-model-magnitude-domain" };
  }
  const magnitudeBin = Math.floor(magnitude * 2) / 2;
  const value = summary.valuesByHealpixAndMagnitude[`${healpixCell}:${magnitudeBin.toFixed(1)}`];
  return value === undefined
    ? { status: "unavailable", reason: "outside-frozen-sky-grid" }
    : { status: "available", value };
}
