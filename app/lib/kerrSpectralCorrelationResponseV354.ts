import { planckRadianceV278 } from "./strongGravityRenderingV278";
import {
  KERR_PLANCK_CONSTANT_J_S_V328,
  type KerrSciencePhotonBandViewV328,
} from "./kerrSciencePhotonBandsV328";
import type { KerrScienceInstrumentResponseV332 } from "./kerrScienceInstrumentResponseV332";
import type { KerrSpectralShapeResponseArtifactV353 } from "./kerrSpectralShapeResponseV353";

export const KERR_SPECTRAL_CORRELATION_RESPONSE_VERSION_V354 =
  "v354-kerr-correlated-spectral-shape-response-v1" as const;

export const KERR_SPECTRAL_BANDS_V354 = Object.freeze(["visible", "euv", "soft-x-ray"] as const);
export const KERR_SPECTRAL_MODES_V354 = Object.freeze(["tilt", "curvature", "edge-wave"] as const);

export type KerrSpectralBandV354 = (typeof KERR_SPECTRAL_BANDS_V354)[number];
export type KerrSpectralModeV354 = (typeof KERR_SPECTRAL_MODES_V354)[number];

export type KerrSpectralCorrelationRayV354 = Readonly<{
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  photonLogResponseJacobian: readonly (readonly number[])[];
  responseRelativeCovariance: readonly (readonly number[])[];
  responseRelativeCorrelation: readonly (readonly number[])[];
  responseRelativeSigmaByBand: Readonly<Record<KerrSpectralBandV354, number>>;
  expectedPhotonSigmaByBand: Readonly<Record<KerrSpectralBandV354, number>>;
  energyConservationRelativeDifference: number;
  centralDifferenceNonlinearity: number;
  provenance: Readonly<{
    spectralShapeArtifactSha256: string;
    photonBandsArtifactSha256: string;
    instrumentArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
}>;

export type KerrSpectralCorrelationResponseArtifactV354 = Readonly<{
  version: typeof KERR_SPECTRAL_CORRELATION_RESPONSE_VERSION_V354;
  generatedAt: string;
  status: "qualified-synthetic-correlated-spectral-response-audit";
  source: Readonly<{
    spectralShapePath: "dist/science/kerr-spectral-shape-response-v353/audit.json";
    spectralShapeFileSha256: string;
    spectralShapeArtifactSha256: string;
    photonBandsPath: "dist/science/kerr-science-photon-bands-v328/photon-radiance.json";
    photonBandsFileSha256: string;
    photonBandsArtifactSha256: string;
    instrumentPath: "dist/science/kerr-science-instrument-response-v332/response-reference.json";
    instrumentFileSha256: string;
    instrumentArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  counts: Readonly<{
    rayCount: 4;
    bandCount: 3;
    modeCount: 3;
    coefficientCount: 9;
    perturbationExecutions: 72;
  }>;
  model: Readonly<{
    kind: "synthetic-frequency-shape-basis-not-observatory-calibration";
    normalization: "band-integrated-energy-held-fixed-for-each-basis-perturbation";
    basisOrder: readonly KerrSpectralModeV354[];
    bandOrder: readonly KerrSpectralBandV354[];
    coefficientOrder: readonly string[];
    halfWidthsByBand: Readonly<Record<KerrSpectralBandV354, Readonly<Record<KerrSpectralModeV354, number>>>>;
    modeCorrelation: readonly (readonly number[])[];
    bandCorrelation: readonly (readonly number[])[];
    coefficientCovariance: readonly (readonly number[])[];
    covariancePolicy: "explicit-synthetic-correlation-quadratic-form-not-rss-independence-claim";
  }>;
  rays: readonly KerrSpectralCorrelationRayV354[];
  maxima: Readonly<{
    energyConservationRelativeDifference: number;
    centralDifferenceNonlinearity: number;
    photonLogResponseJacobianAbsolute: number;
    responseRelativeSigma: number;
    responseCorrelationAbsoluteOffDiagonal: number;
  }>;
  positiveDefiniteness: Readonly<{
    modeCorrelationMinimumCholeskyPivot: number;
    bandCorrelationMinimumCholeskyPivot: number;
    coefficientCovarianceMinimumCholeskyPivot: number;
  }>;
  fullMeasuredResponseEnvelope: "unavailable-synthetic-correlation-model-not-measured-spectral-covariance";
  scienceCinematicBoundary: "correlated-spectral-response-audit-never-cinematic-color-input";
  denseCampaignStatus: "incomplete-0-of-49";
  denseAggregateSha256: null;
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const RAYS = Object.freeze([12, 13, 14, 15] as const);
const SHA = /^[a-f0-9]{64}$/;
const MODE_CORRELATION = Object.freeze([
  Object.freeze([1, 0.35, -0.2]),
  Object.freeze([0.35, 1, 0.25]),
  Object.freeze([-0.2, 0.25, 1]),
]);
const BAND_CORRELATION = Object.freeze([
  Object.freeze([1, 0.45, 0.2]),
  Object.freeze([0.45, 1, 0.4]),
  Object.freeze([0.2, 0.4, 1]),
]);
const HALF_WIDTHS = Object.freeze({
  visible: Object.freeze({ tilt: 0.02, curvature: 0.015, "edge-wave": 0.01 }),
  euv: Object.freeze({ tilt: 0.03, curvature: 0.02, "edge-wave": 0.015 }),
  "soft-x-ray": Object.freeze({ tilt: 0.04, curvature: 0.03, "edge-wave": 0.02 }),
});

function key(rayIndex: number, bandId: string): string {
  return `${rayIndex}:${bandId}`;
}

function relativeDifference(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1e-300, Math.abs(left), Math.abs(right));
}

function basisValue(mode: KerrSpectralModeV354, normalizedFrequency: number): number {
  if (mode === "tilt") return 2 * normalizedFrequency - 1;
  if (mode === "curvature") return 6 * normalizedFrequency * (1 - normalizedFrequency) - 1;
  return Math.sin(2 * Math.PI * normalizedFrequency);
}

function throughputAt(
  knots: readonly { normalizedFrequency: number; efficiency: number }[],
  normalizedFrequency: number,
): number {
  if (normalizedFrequency <= knots[0].normalizedFrequency) return knots[0].efficiency;
  for (let index = 1; index < knots.length; index += 1) {
    const left = knots[index - 1];
    const right = knots[index];
    if (normalizedFrequency <= right.normalizedFrequency) {
      const fraction =
        (normalizedFrequency - left.normalizedFrequency) /
        (right.normalizedFrequency - left.normalizedFrequency);
      return left.efficiency + fraction * (right.efficiency - left.efficiency);
    }
  }
  return knots.at(-1)?.efficiency ?? 0;
}

function integratePerturbation(
  ray: KerrSciencePhotonBandViewV328["rays"][number],
  measurement: KerrSciencePhotonBandViewV328["rays"][number]["measurements"][number],
  knots: readonly { normalizedFrequency: number; efficiency: number }[],
  mode: KerrSpectralModeV354,
  coefficient: number,
): Readonly<{ energy: number; photons: number }> {
  const steps = 512;
  const width = (measurement.bandUpperFrequencyHz - measurement.bandLowerFrequencyHz) / steps;
  let energySum = 0;
  let photonSum = 0;
  for (let index = 0; index <= steps; index += 1) {
    const normalized = index / steps;
    const observedFrequency =
      measurement.bandLowerFrequencyHz +
      normalized * (measurement.bandUpperFrequencyHz - measurement.bandLowerFrequencyHz);
    const emittedFrequency = observedFrequency / ray.redshiftFactor;
    const radiance =
      ray.redshiftFactor ** 3 * planckRadianceV278(ray.effectiveTemperatureK, emittedFrequency);
    const shape = 1 + coefficient * basisValue(mode, normalized);
    if (shape <= 0) throw new Error("v354-nonphysical-shape-fixture");
    const weight = index === 0 || index === steps ? 1 : index % 2 === 0 ? 2 : 4;
    energySum += weight * radiance * shape;
    photonSum +=
      weight *
      radiance *
      shape /
      (KERR_PLANCK_CONSTANT_J_S_V328 * observedFrequency) *
      throughputAt(knots, normalized);
  }
  return Object.freeze({ energy: energySum * width / 3, photons: photonSum * width / 3 });
}

function choleskyMinimumPivot(matrix: readonly (readonly number[])[]): number {
  const size = matrix.length;
  const lower = Array.from({ length: size }, () => Array<number>(size).fill(0));
  let minimumPivot = Number.POSITIVE_INFINITY;
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      let value = matrix[row][column];
      for (let inner = 0; inner < column; inner += 1) value -= lower[row][inner] * lower[column][inner];
      if (row === column) {
        if (!(value > 0) || !Number.isFinite(value)) throw new Error("v354-covariance-not-positive-definite");
        lower[row][column] = Math.sqrt(value);
        minimumPivot = Math.min(minimumPivot, lower[row][column]);
      } else {
        lower[row][column] = value / lower[column][column];
      }
    }
  }
  return minimumPivot;
}

function matrixMultiply(
  left: readonly (readonly number[])[],
  right: readonly (readonly number[])[],
): number[][] {
  return left.map((row) =>
    right[0].map((_, column) =>
      row.reduce((sum, value, inner) => sum + value * right[inner][column], 0),
    ),
  );
}

function transpose(matrix: readonly (readonly number[])[]): number[][] {
  return matrix[0].map((_, column) => matrix.map((row) => row[column]));
}

function coefficientCovariance(): number[][] {
  const result = Array.from({ length: 9 }, () => Array<number>(9).fill(0));
  for (let leftBand = 0; leftBand < 3; leftBand += 1) {
    for (let leftMode = 0; leftMode < 3; leftMode += 1) {
      for (let rightBand = 0; rightBand < 3; rightBand += 1) {
        for (let rightMode = 0; rightMode < 3; rightMode += 1) {
          const leftWidth = HALF_WIDTHS[KERR_SPECTRAL_BANDS_V354[leftBand]][KERR_SPECTRAL_MODES_V354[leftMode]];
          const rightWidth = HALF_WIDTHS[KERR_SPECTRAL_BANDS_V354[rightBand]][KERR_SPECTRAL_MODES_V354[rightMode]];
          result[leftBand * 3 + leftMode][rightBand * 3 + rightMode] =
            leftWidth *
            rightWidth *
            BAND_CORRELATION[leftBand][rightBand] *
            MODE_CORRELATION[leftMode][rightMode];
        }
      }
    }
  }
  return result;
}

function responseCorrelation(covariance: readonly (readonly number[])[]): number[][] {
  return covariance.map((row, rowIndex) =>
    row.map((value, columnIndex) =>
      value / Math.sqrt(covariance[rowIndex][rowIndex] * covariance[columnIndex][columnIndex]),
    ),
  );
}

export function createKerrSpectralCorrelationResponseV354(
  photonBands: KerrSciencePhotonBandViewV328,
  instrument: KerrScienceInstrumentResponseV332,
  spectralShape: KerrSpectralShapeResponseArtifactV353,
  source: KerrSpectralCorrelationResponseArtifactV354["source"],
  artifactSha256 = "pending",
): KerrSpectralCorrelationResponseArtifactV354 {
  if (
    photonBands.status !== "qualified-fixed-band-photon-radiance" ||
    instrument.status !== "qualified-synthetic-reference-instrument-operator" ||
    spectralShape.status !== "qualified-synthetic-frequency-tilt-response-audit" ||
    spectralShape.denseAggregateSha256 !== null
  ) {
    throw new Error("v354-source-boundary");
  }
  if (spectralShape.artifactSha256 !== source.spectralShapeArtifactSha256) {
    throw new Error("v354-spectral-shape-sha-lock");
  }

  const photonRows = new Map(
    photonBands.rays.flatMap((ray) =>
      ray.measurements.map((measurement) => [key(ray.rayIndex, measurement.bandId), { ray, measurement }] as const),
    ),
  );
  const instrumentRows = new Map(instrument.rows.map((row) => [key(row.rayIndex, row.bandId), row]));
  const covariance = coefficientCovariance();
  const coefficientOrder = KERR_SPECTRAL_BANDS_V354.flatMap((band) =>
    KERR_SPECTRAL_MODES_V354.map((mode) => `${band}:${mode}`),
  );
  let maxEnergy = 0;
  let maxNonlinearity = 0;
  let maxJacobian = 0;
  let maxSigma = 0;
  let maxCorrelation = 0;

  const rays = RAYS.map((rayIndex): KerrSpectralCorrelationRayV354 => {
    const jacobian = Array.from({ length: 3 }, () => Array<number>(9).fill(0));
    let rayEnergy = 0;
    let rayNonlinearity = 0;
    const expectedNominal = Array<number>(3).fill(0);
    for (let bandIndex = 0; bandIndex < 3; bandIndex += 1) {
      const bandId = KERR_SPECTRAL_BANDS_V354[bandIndex];
      const entry = photonRows.get(key(rayIndex, bandId));
      const instrumentRow = instrumentRows.get(key(rayIndex, bandId));
      if (!entry || !instrumentRow) throw new Error(`v354-row-missing:${rayIndex}:${bandId}`);
      expectedNominal[bandIndex] = instrumentRow.expectedPhotonsPerPixelExposure;
      for (let modeIndex = 0; modeIndex < 3; modeIndex += 1) {
        const mode = KERR_SPECTRAL_MODES_V354[modeIndex];
        const halfWidth = HALF_WIDTHS[bandId][mode];
        const nominal = integratePerturbation(entry.ray, entry.measurement, instrument.model.throughputByBand[bandId], mode, 0);
        const negative = integratePerturbation(entry.ray, entry.measurement, instrument.model.throughputByBand[bandId], mode, -halfWidth);
        const positive = integratePerturbation(entry.ray, entry.measurement, instrument.model.throughputByBand[bandId], mode, halfWidth);
        const targetEnergy = entry.measurement.observedEnergyRadianceWM2Sr;
        const nominalPhoton = nominal.photons * targetEnergy / nominal.energy;
        const negativePhoton = negative.photons * targetEnergy / negative.energy;
        const positivePhoton = positive.photons * targetEnergy / positive.energy;
        const energyDifference = Math.max(
          relativeDifference(negative.energy * targetEnergy / negative.energy, targetEnergy),
          relativeDifference(positive.energy * targetEnergy / positive.energy, targetEnergy),
        );
        const nonlinearity = Math.abs((negativePhoton + positivePhoton) / (2 * nominalPhoton) - 1);
        const derivative = (Math.log(positivePhoton) - Math.log(negativePhoton)) / (2 * halfWidth);
        if (![nominalPhoton, negativePhoton, positivePhoton, derivative].every(Number.isFinite) || nominalPhoton <= 0) {
          throw new Error(`v354-nonfinite-response:${rayIndex}:${bandId}:${mode}`);
        }
        jacobian[bandIndex][bandIndex * 3 + modeIndex] = derivative;
        rayEnergy = Math.max(rayEnergy, energyDifference);
        rayNonlinearity = Math.max(rayNonlinearity, nonlinearity);
        maxJacobian = Math.max(maxJacobian, Math.abs(derivative));
      }
    }
    const responseCovariance = matrixMultiply(matrixMultiply(jacobian, covariance), transpose(jacobian));
    const correlation = responseCorrelation(responseCovariance);
    const sigma = responseCovariance.map((row, index) => Math.sqrt(row[index]));
    for (let row = 0; row < 3; row += 1) {
      if (!(sigma[row] > 0) || !Number.isFinite(sigma[row])) throw new Error("v354-response-sigma");
      maxSigma = Math.max(maxSigma, sigma[row]);
      for (let column = 0; column < 3; column += 1) {
        if (!Number.isFinite(correlation[row][column])) throw new Error("v354-response-correlation");
        if (row !== column) maxCorrelation = Math.max(maxCorrelation, Math.abs(correlation[row][column]));
      }
    }
    maxEnergy = Math.max(maxEnergy, rayEnergy);
    maxNonlinearity = Math.max(maxNonlinearity, rayNonlinearity);
    return Object.freeze({
      rayIndex,
      spinA: photonBands.rays.find((ray) => ray.rayIndex === rayIndex)?.spinA ?? 0,
      photonLogResponseJacobian: Object.freeze(jacobian.map((row) => Object.freeze(row))),
      responseRelativeCovariance: Object.freeze(responseCovariance.map((row) => Object.freeze(row))),
      responseRelativeCorrelation: Object.freeze(correlation.map((row) => Object.freeze(row))),
      responseRelativeSigmaByBand: Object.freeze({
        visible: sigma[0],
        euv: sigma[1],
        "soft-x-ray": sigma[2],
      }),
      expectedPhotonSigmaByBand: Object.freeze({
        visible: expectedNominal[0] * sigma[0],
        euv: expectedNominal[1] * sigma[1],
        "soft-x-ray": expectedNominal[2] * sigma[2],
      }),
      energyConservationRelativeDifference: rayEnergy,
      centralDifferenceNonlinearity: rayNonlinearity,
      provenance: Object.freeze({
        spectralShapeArtifactSha256: source.spectralShapeArtifactSha256,
        photonBandsArtifactSha256: source.photonBandsArtifactSha256,
        instrumentArtifactSha256: source.instrumentArtifactSha256,
        fullShortAuthoritySha256: source.fullShortAuthoritySha256,
      }),
    });
  });

  const modePivot = choleskyMinimumPivot(MODE_CORRELATION);
  const bandPivot = choleskyMinimumPivot(BAND_CORRELATION);
  const covariancePivot = choleskyMinimumPivot(covariance);
  if (maxEnergy > 1e-12 || maxNonlinearity > 1e-3) throw new Error("v354-numerical-gate");

  return Object.freeze({
    version: KERR_SPECTRAL_CORRELATION_RESPONSE_VERSION_V354,
    generatedAt: new Date().toISOString(),
    status: "qualified-synthetic-correlated-spectral-response-audit",
    source,
    counts: Object.freeze({ rayCount: 4, bandCount: 3, modeCount: 3, coefficientCount: 9, perturbationExecutions: 72 } as const),
    model: Object.freeze({
      kind: "synthetic-frequency-shape-basis-not-observatory-calibration",
      normalization: "band-integrated-energy-held-fixed-for-each-basis-perturbation",
      basisOrder: KERR_SPECTRAL_MODES_V354,
      bandOrder: KERR_SPECTRAL_BANDS_V354,
      coefficientOrder: Object.freeze(coefficientOrder),
      halfWidthsByBand: HALF_WIDTHS,
      modeCorrelation: MODE_CORRELATION,
      bandCorrelation: BAND_CORRELATION,
      coefficientCovariance: Object.freeze(covariance.map((row) => Object.freeze(row))),
      covariancePolicy: "explicit-synthetic-correlation-quadratic-form-not-rss-independence-claim",
    }),
    rays: Object.freeze(rays),
    maxima: Object.freeze({
      energyConservationRelativeDifference: maxEnergy,
      centralDifferenceNonlinearity: maxNonlinearity,
      photonLogResponseJacobianAbsolute: maxJacobian,
      responseRelativeSigma: maxSigma,
      responseCorrelationAbsoluteOffDiagonal: maxCorrelation,
    }),
    positiveDefiniteness: Object.freeze({
      modeCorrelationMinimumCholeskyPivot: modePivot,
      bandCorrelationMinimumCholeskyPivot: bandPivot,
      coefficientCovarianceMinimumCholeskyPivot: covariancePivot,
    }),
    fullMeasuredResponseEnvelope: "unavailable-synthetic-correlation-model-not-measured-spectral-covariance",
    scienceCinematicBoundary: "correlated-spectral-response-audit-never-cinematic-color-input",
    denseCampaignStatus: "incomplete-0-of-49",
    denseAggregateSha256: null,
    browserQualification: "not-run",
    artifactSha256,
  });
}

function validMatrix(matrix: readonly (readonly number[])[], size: number): boolean {
  return matrix.length === size && matrix.every((row) => row.length === size && row.every(Number.isFinite));
}

export function parseKerrSpectralCorrelationResponseArtifactV354(
  value: unknown,
): KerrSpectralCorrelationResponseArtifactV354 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrSpectralCorrelationResponseArtifactV354>
    : null;
  const rays = source?.rays ?? [];
  if (
    !source ||
    source.version !== KERR_SPECTRAL_CORRELATION_RESPONSE_VERSION_V354 ||
    source.status !== "qualified-synthetic-correlated-spectral-response-audit" ||
    !SHA.test(source.source?.spectralShapeFileSha256 ?? "") ||
    !SHA.test(source.source?.spectralShapeArtifactSha256 ?? "") ||
    !SHA.test(source.source?.photonBandsFileSha256 ?? "") ||
    !SHA.test(source.source?.instrumentFileSha256 ?? "") ||
    !SHA.test(source.source?.fullShortAuthoritySha256 ?? "") ||
    source.counts?.rayCount !== 4 ||
    source.counts.bandCount !== 3 ||
    source.counts.modeCount !== 3 ||
    source.counts.coefficientCount !== 9 ||
    source.counts.perturbationExecutions !== 72 ||
    source.model?.kind !== "synthetic-frequency-shape-basis-not-observatory-calibration" ||
    source.model.covariancePolicy !== "explicit-synthetic-correlation-quadratic-form-not-rss-independence-claim" ||
    !validMatrix(source.model.modeCorrelation, 3) ||
    !validMatrix(source.model.bandCorrelation, 3) ||
    !validMatrix(source.model.coefficientCovariance, 9) ||
    rays.length !== 4 ||
    rays.some((ray) =>
      !RAYS.includes(ray.rayIndex) ||
      !validMatrix(ray.responseRelativeCovariance, 3) ||
      !validMatrix(ray.responseRelativeCorrelation, 3) ||
      ray.photonLogResponseJacobian.length !== 3 ||
      ray.photonLogResponseJacobian.some((row) => row.length !== 9 || !row.every(Number.isFinite)) ||
      ray.energyConservationRelativeDifference > 1e-12 ||
      ray.centralDifferenceNonlinearity > 1e-3 ||
      !SHA.test(ray.provenance.spectralShapeArtifactSha256)
    ) ||
    (source.maxima?.energyConservationRelativeDifference ?? Number.POSITIVE_INFINITY) > 1e-12 ||
    (source.maxima?.centralDifferenceNonlinearity ?? Number.POSITIVE_INFINITY) > 1e-3 ||
    !((source.positiveDefiniteness?.coefficientCovarianceMinimumCholeskyPivot ?? 0) > 0) ||
    source.fullMeasuredResponseEnvelope !== "unavailable-synthetic-correlation-model-not-measured-spectral-covariance" ||
    source.scienceCinematicBoundary !== "correlated-spectral-response-audit-never-cinematic-color-input" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.denseAggregateSha256 !== null ||
    source.browserQualification !== "not-run" ||
    !SHA.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v354-spectral-correlation-response-identity");
  }
  return value as KerrSpectralCorrelationResponseArtifactV354;
}
