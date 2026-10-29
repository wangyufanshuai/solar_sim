import { planckRadianceV278 } from "./strongGravityRenderingV278";
import {
  KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320,
  parseKerrThinDiskBandImagingViewV320,
  type KerrThinDiskBandDefinitionV320,
  type KerrThinDiskBandIdV320,
  type KerrThinDiskBandImagingViewV320,
  type KerrThinDiskBandSampleV320,
} from "./kerrThinDiskBandImagingV320";

export const KERR_SCIENCE_BAND_UNCERTAINTY_VERSION_V325 = "v325-kerr-science-band-componentwise-audit-envelope-v1" as const;
export const KERR_SCIENCE_BAND_UNCERTAINTY_LIMIT_V325 = 5e-6;
export const KERR_SCIENCE_BAND_UNCERTAINTY_ARTIFACT_SHA256_V325 = "b48bb7fe1f71b5cf6735a0bba4062acd5acedc1e5aad509be3e227415ec90bcb" as const;

export type KerrScienceBandUncertaintyMeasurementV325 = Readonly<{
  rayIndex: number;
  bandId: KerrThinDiskBandIdV320;
  observedBandRadianceWM2Sr: number;
  lowerAuditEnvelopeWM2Sr: number;
  upperAuditEnvelopeWM2Sr: number;
  conservativeLinearRelativeEnvelope: number;
  components: Readonly<{
    bandQuadratureRelative: number;
    diskQuadratureRelative: number;
    carterKerrSchildSpectralRelative: number;
    redshiftPerturbationRelative: number;
    geometryRedshiftDifference: number;
    geometryRadiusDifferenceM: number;
  }>;
  combinationPolicy: "linear-sum-without-independence-claim-no-rss";
}>;

export type KerrScienceBandUncertaintyRayV325 = Readonly<{
  rayIndex: number;
  spinA: number;
  emissionRadiusM: number;
  redshiftFactor: number;
  measurements: readonly KerrScienceBandUncertaintyMeasurementV325[];
}>;

export type KerrScienceBandUncertaintyViewV325 = Readonly<{
  version: typeof KERR_SCIENCE_BAND_UNCERTAINTY_VERSION_V325;
  status: "qualified-componentwise-audit-envelope";
  source: Readonly<{
    bandArtifactSha256: typeof KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320;
    fullShortAuthoritySha256: string;
    denseAggregateSha256: null;
  }>;
  rays: readonly KerrScienceBandUncertaintyRayV325[];
  counts: Readonly<{
    applicableDiskRayCount: 4;
    bandMeasurementCount: 12;
    unavailableRayCount: 12;
  }>;
  maxima: Readonly<{
    conservativeLinearRelativeEnvelope: number;
    bandQuadratureRelative: number;
    diskQuadratureRelative: number;
    carterKerrSchildSpectralRelative: number;
    redshiftPerturbationRelative: number;
    geometryRadiusDifferenceM: number;
  }>;
  combinationPolicy: "linear-sum-without-independence-claim-no-rss";
  interpretation: "deterministic-reproducibility-audit-envelope-not-statistical-confidence-interval";
  scienceCinematicBoundary: "science-envelope-read-only-cinematic-cannot-consume-or-mutate";
  boundary: "four-authority-disk-rays-componentwise-envelope-dense-incomplete";
}>;

function relativeDifference(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1e-300, Math.abs(left), Math.abs(right));
}

function integrateAtRedshift(
  sample: KerrThinDiskBandSampleV320,
  definition: KerrThinDiskBandDefinitionV320,
  redshiftFactor: number,
): number {
  if (!sample.applicable || sample.effectiveTemperatureK == null || !Number.isFinite(redshiftFactor) || redshiftFactor <= 0) {
    throw new Error("v325-redshift-perturbation-not-applicable");
  }
  const steps = 256;
  const width = (definition.upperFrequencyHz - definition.lowerFrequencyHz) / steps;
  let sum = 0;
  for (let index = 0; index <= steps; index += 1) {
    const observedFrequencyHz = definition.lowerFrequencyHz + index * width;
    const emittedFrequencyHz = observedFrequencyHz / redshiftFactor;
    const observedSpectralRadiance = redshiftFactor ** 3
      * planckRadianceV278(sample.effectiveTemperatureK, emittedFrequencyHz);
    const weight = index === 0 || index === steps ? 1 : index % 2 === 0 ? 2 : 4;
    sum += weight * observedSpectralRadiance;
  }
  const integrated = sum * width / 3;
  if (!Number.isFinite(integrated) || integrated < 0) throw new Error("v325-redshift-perturbation-non-finite");
  return integrated;
}

function finiteNonNegative(value: number | null, label: string): number {
  if (value == null || !Number.isFinite(value) || value < 0) throw new Error(`v325-${label}-unavailable`);
  return value;
}

export function createKerrScienceBandUncertaintyViewV325(
  value: KerrThinDiskBandImagingViewV320,
): KerrScienceBandUncertaintyViewV325 {
  const source = parseKerrThinDiskBandImagingViewV320(value);
  const definitions = new Map(source.definitions.map((definition) => [definition.id, definition]));
  const maxima = {
    conservativeLinearRelativeEnvelope: 0,
    bandQuadratureRelative: 0,
    diskQuadratureRelative: 0,
    carterKerrSchildSpectralRelative: 0,
    redshiftPerturbationRelative: 0,
    geometryRadiusDifferenceM: 0,
  };
  const rays = source.samples.filter((sample) => sample.applicable).map((sample): KerrScienceBandUncertaintyRayV325 => {
    if (sample.classification !== "disk-hit" || sample.bands == null || sample.emissionRadiusM == null || sample.redshiftFactor == null) {
      throw new Error("v325-disk-ray-identity");
    }
    const emissionRadiusM = sample.emissionRadiusM;
    const redshiftFactor = sample.redshiftFactor;
    const diskQuadratureRelative = finiteNonNegative(sample.sourceErrorBudget.pageThorneQuadratureRelative, "disk-quadrature");
    const carterKerrSchildSpectralRelative = finiteNonNegative(sample.sourceErrorBudget.carterKerrSchildSpectralRelative, "formula-spectral");
    const geometryRadiusDifferenceM = finiteNonNegative(sample.sourceErrorBudget.geometryRadiusDifferenceM, "geometry-radius");
    const geometryRedshiftDifference = finiteNonNegative(sample.sourceErrorBudget.geometryRedshiftDifference, "geometry-redshift");
    const measurements = sample.bands.map((band): KerrScienceBandUncertaintyMeasurementV325 => {
      const definition = definitions.get(band.id);
      if (!definition) throw new Error("v325-band-definition-unavailable");
      const perturbed = integrateAtRedshift(sample, definition, redshiftFactor + geometryRedshiftDifference);
      const redshiftPerturbationRelative = relativeDifference(band.observedBandRadianceWM2Sr, perturbed);
      const conservativeLinearRelativeEnvelope = band.quadratureRelativeDifference
        + diskQuadratureRelative
        + carterKerrSchildSpectralRelative
        + redshiftPerturbationRelative;
      if (!Number.isFinite(conservativeLinearRelativeEnvelope)
        || conservativeLinearRelativeEnvelope < 0
        || conservativeLinearRelativeEnvelope >= KERR_SCIENCE_BAND_UNCERTAINTY_LIMIT_V325) {
        throw new Error(`v325-relative-envelope:${sample.rayIndex}:${band.id}:${conservativeLinearRelativeEnvelope}`);
      }
      maxima.conservativeLinearRelativeEnvelope = Math.max(maxima.conservativeLinearRelativeEnvelope, conservativeLinearRelativeEnvelope);
      maxima.bandQuadratureRelative = Math.max(maxima.bandQuadratureRelative, band.quadratureRelativeDifference);
      maxima.diskQuadratureRelative = Math.max(maxima.diskQuadratureRelative, diskQuadratureRelative);
      maxima.carterKerrSchildSpectralRelative = Math.max(maxima.carterKerrSchildSpectralRelative, carterKerrSchildSpectralRelative);
      maxima.redshiftPerturbationRelative = Math.max(maxima.redshiftPerturbationRelative, redshiftPerturbationRelative);
      maxima.geometryRadiusDifferenceM = Math.max(maxima.geometryRadiusDifferenceM, geometryRadiusDifferenceM);
      return Object.freeze({
        rayIndex: sample.rayIndex,
        bandId: band.id,
        observedBandRadianceWM2Sr: band.observedBandRadianceWM2Sr,
        lowerAuditEnvelopeWM2Sr: Math.max(0, band.observedBandRadianceWM2Sr * (1 - conservativeLinearRelativeEnvelope)),
        upperAuditEnvelopeWM2Sr: band.observedBandRadianceWM2Sr * (1 + conservativeLinearRelativeEnvelope),
        conservativeLinearRelativeEnvelope,
        components: Object.freeze({
          bandQuadratureRelative: band.quadratureRelativeDifference,
          diskQuadratureRelative,
          carterKerrSchildSpectralRelative,
          redshiftPerturbationRelative,
          geometryRedshiftDifference,
          geometryRadiusDifferenceM,
        }),
        combinationPolicy: "linear-sum-without-independence-claim-no-rss",
      });
    });
    return Object.freeze({
      rayIndex: sample.rayIndex,
      spinA: sample.spinA,
      emissionRadiusM,
      redshiftFactor,
      measurements: Object.freeze(measurements),
    });
  });
  if (rays.length !== 4 || rays.reduce((count, ray) => count + ray.measurements.length, 0) !== 12) {
    throw new Error("v325-measurement-count");
  }
  return Object.freeze({
    version: KERR_SCIENCE_BAND_UNCERTAINTY_VERSION_V325,
    status: "qualified-componentwise-audit-envelope",
    source: Object.freeze({
      bandArtifactSha256: KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320,
      fullShortAuthoritySha256: source.source.fullShortAuthoritySha256,
      denseAggregateSha256: null,
    }),
    rays: Object.freeze(rays),
    counts: Object.freeze({ applicableDiskRayCount: 4, bandMeasurementCount: 12, unavailableRayCount: 12 }),
    maxima: Object.freeze(maxima),
    combinationPolicy: "linear-sum-without-independence-claim-no-rss",
    interpretation: "deterministic-reproducibility-audit-envelope-not-statistical-confidence-interval",
    scienceCinematicBoundary: "science-envelope-read-only-cinematic-cannot-consume-or-mutate",
    boundary: "four-authority-disk-rays-componentwise-envelope-dense-incomplete",
  });
}

export function parseKerrScienceBandUncertaintyViewV325(value: unknown): KerrScienceBandUncertaintyViewV325 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrScienceBandUncertaintyViewV325>
    : null;
  if (!source || source.version !== KERR_SCIENCE_BAND_UNCERTAINTY_VERSION_V325
    || source.status !== "qualified-componentwise-audit-envelope"
    || source.source?.bandArtifactSha256 !== KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320
    || source.source.denseAggregateSha256 !== null
    || source.counts?.applicableDiskRayCount !== 4 || source.counts.bandMeasurementCount !== 12 || source.counts.unavailableRayCount !== 12
    || source.combinationPolicy !== "linear-sum-without-independence-claim-no-rss"
    || source.interpretation !== "deterministic-reproducibility-audit-envelope-not-statistical-confidence-interval"
    || source.scienceCinematicBoundary !== "science-envelope-read-only-cinematic-cannot-consume-or-mutate"
    || source.boundary !== "four-authority-disk-rays-componentwise-envelope-dense-incomplete"
    || !Array.isArray(source.rays) || source.rays.length !== 4
    || typeof source.maxima?.conservativeLinearRelativeEnvelope !== "number"
    || source.maxima.conservativeLinearRelativeEnvelope >= KERR_SCIENCE_BAND_UNCERTAINTY_LIMIT_V325) {
    throw new Error("v325-uncertainty-view-identity");
  }
  const measurements = source.rays.flatMap((ray) => ray.measurements ?? []);
  if (measurements.length !== 12 || measurements.some((measurement) => measurement.combinationPolicy !== "linear-sum-without-independence-claim-no-rss"
    || !Number.isFinite(measurement.conservativeLinearRelativeEnvelope)
    || measurement.conservativeLinearRelativeEnvelope < 0
    || measurement.conservativeLinearRelativeEnvelope >= KERR_SCIENCE_BAND_UNCERTAINTY_LIMIT_V325
    || measurement.lowerAuditEnvelopeWM2Sr > measurement.observedBandRadianceWM2Sr
    || measurement.upperAuditEnvelopeWM2Sr < measurement.observedBandRadianceWM2Sr)) {
    throw new Error("v325-uncertainty-measurement");
  }
  return value as KerrScienceBandUncertaintyViewV325;
}
