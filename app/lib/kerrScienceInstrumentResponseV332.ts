import {
  KERR_PLANCK_CONSTANT_J_S_V328,
  parseKerrSciencePhotonBandViewV328,
  type KerrSciencePhotonBandViewV328,
} from "./kerrSciencePhotonBandsV328";
import {
  KERR_SCIENCE_PHOTON_PROVENANCE_ARTIFACT_SHA256_V331,
  KERR_SCIENCE_PHOTON_PROVENANCE_CANONICAL_SHA256_V331,
} from "./kerrSciencePhotonProvenanceV331";
import { planckRadianceV278 } from "./strongGravityRenderingV278";
import type { KerrThinDiskBandIdV320 } from "./kerrThinDiskBandImagingV320";

export const KERR_SCIENCE_INSTRUMENT_RESPONSE_VERSION_V332 = "v332-kerr-synthetic-reference-instrument-response-v1" as const;
export const KERR_SCIENCE_INSTRUMENT_RESPONSE_QUADRATURE_LIMIT_V332 = 5e-6;
export const SQUARE_ARCSECOND_STERADIANS_V332 = (Math.PI / (180 * 3_600)) ** 2;

export type KerrInstrumentThroughputKnotV332 = Readonly<{
  normalizedFrequency: number;
  efficiency: number;
}>;

export type KerrPhotonInstrumentModelV332 = Readonly<{
  modelId: "synthetic-reference-photon-counter-v332";
  status: "synthetic-audit-fixture-not-calibrated-observatory";
  collectingAreaM2: number;
  exposureTimeS: number;
  pixelSolidAngleSr: number;
  throughputByBand: Readonly<Record<KerrThinDiskBandIdV320, readonly KerrInstrumentThroughputKnotV332[]>>;
  stochasticNoise: "disabled";
  detectorEffects: "no-read-noise-dark-current-dead-time-psf-or-pileup";
}>;

export type KerrInstrumentResponseRowV332 = Readonly<{
  rayIndex: number;
  spinA: number;
  bandId: KerrThinDiskBandIdV320;
  detectorIndependentPhotonRadiancePerSM2Sr: number;
  throughputWeightedPhotonRadiancePerSM2Sr: number;
  coarseThroughputWeightedPhotonRadiancePerSM2Sr: number;
  effectiveBandThroughput: number;
  quadratureRelativeDifference: number;
  expectedPhotonRatePerPixelS: number;
  expectedPhotonsPerPixelExposure: number;
}>;

export type KerrScienceInstrumentResponseV332 = Readonly<{
  version: typeof KERR_SCIENCE_INSTRUMENT_RESPONSE_VERSION_V332;
  status: "qualified-synthetic-reference-instrument-operator";
  mode: "science";
  source: Readonly<{
    photonProvenanceArtifactSha256: typeof KERR_SCIENCE_PHOTON_PROVENANCE_ARTIFACT_SHA256_V331;
    photonProvenanceCanonicalSha256: typeof KERR_SCIENCE_PHOTON_PROVENANCE_CANONICAL_SHA256_V331;
    fullShortAuthoritySha256: string;
    denseAggregateSha256: null;
  }>;
  model: KerrPhotonInstrumentModelV332;
  counts: Readonly<{ rayCount: 4; bandMeasurementCount: 12 }>;
  rows: readonly KerrInstrumentResponseRowV332[];
  maxima: Readonly<{ quadratureRelativeDifference: number; expectedPhotonsPerPixelExposure: number }>;
  units: Readonly<{
    detectorIndependentPhotonRadiance: "photons s^-1 m^-2 sr^-1";
    photonRate: "photons s^-1 pixel^-1";
    exposureExpectation: "photons pixel^-1 exposure^-1";
  }>;
  interpretation: "deterministic-expectation-under-explicit-synthetic-instrument-not-measured-counts";
  scienceCinematicBoundary: "instrument-response-never-cinematic-color-input";
  browserQualification: "not-run";
  boundary: "detector-independent-v331-preserved-explicit-area-solid-angle-exposure-throughput-layer";
}>;

const THROUGHPUT = Object.freeze([
  Object.freeze({ normalizedFrequency: 0, efficiency: 0 }),
  Object.freeze({ normalizedFrequency: 0.25, efficiency: 0.8 }),
  Object.freeze({ normalizedFrequency: 0.5, efficiency: 0.9 }),
  Object.freeze({ normalizedFrequency: 0.75, efficiency: 0.8 }),
  Object.freeze({ normalizedFrequency: 1, efficiency: 0 }),
]);

export const KERR_SYNTHETIC_REFERENCE_INSTRUMENT_V332: KerrPhotonInstrumentModelV332 = Object.freeze({
  modelId: "synthetic-reference-photon-counter-v332",
  status: "synthetic-audit-fixture-not-calibrated-observatory",
  collectingAreaM2: 0.75,
  exposureTimeS: 120,
  pixelSolidAngleSr: SQUARE_ARCSECOND_STERADIANS_V332,
  throughputByBand: Object.freeze({ visible: THROUGHPUT, euv: THROUGHPUT, "soft-x-ray": THROUGHPUT }),
  stochasticNoise: "disabled",
  detectorEffects: "no-read-noise-dark-current-dead-time-psf-or-pileup",
});

function relativeDifference(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1e-300, Math.abs(left), Math.abs(right));
}

function throughputAt(knots: readonly KerrInstrumentThroughputKnotV332[], normalizedFrequency: number): number {
  if (knots.length < 2 || normalizedFrequency <= knots[0].normalizedFrequency) return knots[0]?.efficiency ?? 0;
  for (let index = 1; index < knots.length; index += 1) {
    const right = knots[index];
    const left = knots[index - 1];
    if (normalizedFrequency > right.normalizedFrequency) continue;
    const fraction = (normalizedFrequency - left.normalizedFrequency) / (right.normalizedFrequency - left.normalizedFrequency);
    return left.efficiency + fraction * (right.efficiency - left.efficiency);
  }
  return knots.at(-1)?.efficiency ?? 0;
}

function validateModel(model: KerrPhotonInstrumentModelV332): void {
  const finitePositive = [model.collectingAreaM2, model.exposureTimeS, model.pixelSolidAngleSr].every((value) => Number.isFinite(value) && value > 0);
  const validCurves = (["visible", "euv", "soft-x-ray"] as const).every((bandId) => {
    const knots = model.throughputByBand[bandId];
    return knots.length >= 2 && knots[0].normalizedFrequency === 0 && knots.at(-1)?.normalizedFrequency === 1
      && knots.every((knot, index) => Number.isFinite(knot.normalizedFrequency) && knot.normalizedFrequency >= 0 && knot.normalizedFrequency <= 1
        && Number.isFinite(knot.efficiency) && knot.efficiency >= 0 && knot.efficiency <= 1
        && (index === 0 || knot.normalizedFrequency > knots[index - 1].normalizedFrequency));
  });
  if (!finitePositive || !validCurves || model.stochasticNoise !== "disabled" || model.status !== "synthetic-audit-fixture-not-calibrated-observatory") throw new Error("v332-instrument-model-invalid");
}

function integrateWeightedPhotonRadiance(
  row: KerrSciencePhotonBandViewV328["rays"][number]["measurements"][number],
  redshiftFactor: number,
  effectiveTemperatureK: number,
  knots: readonly KerrInstrumentThroughputKnotV332[],
  steps: number,
): number {
  const frequencyWidth = row.bandUpperFrequencyHz - row.bandLowerFrequencyHz;
  const stepWidth = frequencyWidth / steps;
  let sum = 0;
  for (let index = 0; index <= steps; index += 1) {
    const normalizedFrequency = index / steps;
    const observedFrequencyHz = row.bandLowerFrequencyHz + normalizedFrequency * frequencyWidth;
    const emittedFrequencyHz = observedFrequencyHz / redshiftFactor;
    const observedSpectralRadiance = redshiftFactor ** 3 * planckRadianceV278(effectiveTemperatureK, emittedFrequencyHz);
    const photonSpectralRadiance = observedSpectralRadiance / (KERR_PLANCK_CONSTANT_J_S_V328 * observedFrequencyHz);
    const weight = index === 0 || index === steps ? 1 : index % 2 === 0 ? 2 : 4;
    sum += weight * photonSpectralRadiance * throughputAt(knots, normalizedFrequency);
  }
  const integrated = sum * stepWidth / 3;
  if (!Number.isFinite(integrated) || integrated <= 0) throw new Error("v332-instrument-response-nonphysical");
  return integrated;
}

export function createKerrScienceInstrumentResponseV332(
  value: KerrSciencePhotonBandViewV328,
  model: KerrPhotonInstrumentModelV332 = KERR_SYNTHETIC_REFERENCE_INSTRUMENT_V332,
): KerrScienceInstrumentResponseV332 {
  const view = parseKerrSciencePhotonBandViewV328(value);
  validateModel(model);
  let maximumQuadrature = 0;
  let maximumExpectedPhotons = 0;
  const rows = view.rays.flatMap((ray) => ray.measurements.map((measurement): KerrInstrumentResponseRowV332 => {
    const knots = model.throughputByBand[measurement.bandId];
    const weighted = integrateWeightedPhotonRadiance(measurement, ray.redshiftFactor, ray.effectiveTemperatureK, knots, 512);
    const coarse = integrateWeightedPhotonRadiance(measurement, ray.redshiftFactor, ray.effectiveTemperatureK, knots, 256);
    const quadratureRelativeDifference = relativeDifference(weighted, coarse);
    const effectiveBandThroughput = weighted / measurement.observedPhotonRadiancePerSM2Sr;
    const expectedPhotonRatePerPixelS = weighted * model.collectingAreaM2 * model.pixelSolidAngleSr;
    const expectedPhotonsPerPixelExposure = expectedPhotonRatePerPixelS * model.exposureTimeS;
    if (quadratureRelativeDifference >= KERR_SCIENCE_INSTRUMENT_RESPONSE_QUADRATURE_LIMIT_V332
      || !Number.isFinite(effectiveBandThroughput) || effectiveBandThroughput <= 0 || effectiveBandThroughput > 1
      || !Number.isFinite(expectedPhotonsPerPixelExposure) || expectedPhotonsPerPixelExposure <= 0) throw new Error(`v332-instrument-response:${ray.rayIndex}:${measurement.bandId}`);
    maximumQuadrature = Math.max(maximumQuadrature, quadratureRelativeDifference);
    maximumExpectedPhotons = Math.max(maximumExpectedPhotons, expectedPhotonsPerPixelExposure);
    return Object.freeze({
      rayIndex: ray.rayIndex,
      spinA: ray.spinA,
      bandId: measurement.bandId,
      detectorIndependentPhotonRadiancePerSM2Sr: measurement.observedPhotonRadiancePerSM2Sr,
      throughputWeightedPhotonRadiancePerSM2Sr: weighted,
      coarseThroughputWeightedPhotonRadiancePerSM2Sr: coarse,
      effectiveBandThroughput,
      quadratureRelativeDifference,
      expectedPhotonRatePerPixelS,
      expectedPhotonsPerPixelExposure,
    });
  }));
  if (rows.length !== 12) throw new Error("v332-instrument-response-count");
  return Object.freeze({
    version: KERR_SCIENCE_INSTRUMENT_RESPONSE_VERSION_V332,
    status: "qualified-synthetic-reference-instrument-operator",
    mode: "science",
    source: Object.freeze({
      photonProvenanceArtifactSha256: KERR_SCIENCE_PHOTON_PROVENANCE_ARTIFACT_SHA256_V331,
      photonProvenanceCanonicalSha256: KERR_SCIENCE_PHOTON_PROVENANCE_CANONICAL_SHA256_V331,
      fullShortAuthoritySha256: view.source.fullShortAuthoritySha256,
      denseAggregateSha256: null,
    }),
    model,
    counts: Object.freeze({ rayCount: 4, bandMeasurementCount: 12 }),
    rows: Object.freeze(rows),
    maxima: Object.freeze({ quadratureRelativeDifference: maximumQuadrature, expectedPhotonsPerPixelExposure: maximumExpectedPhotons }),
    units: Object.freeze({ detectorIndependentPhotonRadiance: "photons s^-1 m^-2 sr^-1", photonRate: "photons s^-1 pixel^-1", exposureExpectation: "photons pixel^-1 exposure^-1" }),
    interpretation: "deterministic-expectation-under-explicit-synthetic-instrument-not-measured-counts",
    scienceCinematicBoundary: "instrument-response-never-cinematic-color-input",
    browserQualification: "not-run",
    boundary: "detector-independent-v331-preserved-explicit-area-solid-angle-exposure-throughput-layer",
  });
}

export function parseKerrScienceInstrumentResponseV332(value: unknown): KerrScienceInstrumentResponseV332 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrScienceInstrumentResponseV332> : null;
  if (!source || source.version !== KERR_SCIENCE_INSTRUMENT_RESPONSE_VERSION_V332
    || source.status !== "qualified-synthetic-reference-instrument-operator" || source.mode !== "science"
    || source.source?.photonProvenanceArtifactSha256 !== KERR_SCIENCE_PHOTON_PROVENANCE_ARTIFACT_SHA256_V331
    || source.source.photonProvenanceCanonicalSha256 !== KERR_SCIENCE_PHOTON_PROVENANCE_CANONICAL_SHA256_V331
    || source.source.denseAggregateSha256 !== null
    || source.model?.status !== "synthetic-audit-fixture-not-calibrated-observatory" || source.model.stochasticNoise !== "disabled"
    || source.counts?.rayCount !== 4 || source.counts.bandMeasurementCount !== 12
    || !Array.isArray(source.rows) || source.rows.length !== 12
    || source.rows.some((row) => !Number.isFinite(row.expectedPhotonsPerPixelExposure) || row.expectedPhotonsPerPixelExposure <= 0
      || !Number.isFinite(row.effectiveBandThroughput) || row.effectiveBandThroughput <= 0 || row.effectiveBandThroughput > 1
      || !Number.isFinite(row.quadratureRelativeDifference) || row.quadratureRelativeDifference >= KERR_SCIENCE_INSTRUMENT_RESPONSE_QUADRATURE_LIMIT_V332)
    || source.interpretation !== "deterministic-expectation-under-explicit-synthetic-instrument-not-measured-counts"
    || source.scienceCinematicBoundary !== "instrument-response-never-cinematic-color-input"
    || source.boundary !== "detector-independent-v331-preserved-explicit-area-solid-angle-exposure-throughput-layer") throw new Error("v332-instrument-response-identity");
  return value as KerrScienceInstrumentResponseV332;
}
