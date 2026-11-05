import { planckRadianceV278 } from "./strongGravityRenderingV278";
import {
  KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320,
  parseKerrThinDiskBandImagingViewV320,
  type KerrThinDiskBandDefinitionV320,
  type KerrThinDiskBandIdV320,
  type KerrThinDiskBandImagingViewV320,
  type KerrThinDiskBandSampleV320,
} from "./kerrThinDiskBandImagingV320";

export const KERR_SCIENCE_PHOTON_BANDS_VERSION_V328 = "v328-kerr-fixed-band-photon-radiance-v1" as const;
export const KERR_PLANCK_CONSTANT_J_S_V328 = 6.62607015e-34 as const;
export const KERR_SCIENCE_PHOTON_QUADRATURE_LIMIT_V328 = 2e-6;
export const KERR_SCIENCE_PHOTON_BANDS_ARTIFACT_SHA256_V328 = "16a8d7ff382203a24ee4565101b8fb5580e046af99f47612269f66655bb8a91e" as const;

export type KerrSciencePhotonBandMeasurementV328 = Readonly<{
  rayIndex: number;
  bandId: KerrThinDiskBandIdV320;
  observedEnergyRadianceWM2Sr: number;
  observedPhotonRadiancePerSM2Sr: number;
  coarsePhotonRadiancePerSM2Sr: number;
  quadratureRelativeDifference: number;
  meanObservedPhotonEnergyJ: number;
  meanObservedFrequencyHz: number;
  bandLowerFrequencyHz: number;
  bandUpperFrequencyHz: number;
}>;

export type KerrSciencePhotonBandRayV328 = Readonly<{
  rayIndex: number;
  spinA: number;
  redshiftFactor: number;
  effectiveTemperatureK: number;
  measurements: readonly KerrSciencePhotonBandMeasurementV328[];
}>;

export type KerrSciencePhotonBandViewV328 = Readonly<{
  version: typeof KERR_SCIENCE_PHOTON_BANDS_VERSION_V328;
  status: "qualified-fixed-band-photon-radiance";
  source: Readonly<{
    bandArtifactSha256: typeof KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320;
    fullShortAuthoritySha256: string;
    denseAggregateSha256: null;
  }>;
  rays: readonly KerrSciencePhotonBandRayV328[];
  counts: Readonly<{ applicableDiskRayCount: 4; bandMeasurementCount: 12; unavailableRayCount: 12 }>;
  maxima: Readonly<{ photonQuadratureRelativeDifference: number; photonRadiancePerSM2Sr: number }>;
  minima: Readonly<{ photonRadiancePerSM2Sr: number }>;
  constants: Readonly<{ planckConstantJS: typeof KERR_PLANCK_CONSTANT_J_S_V328 }>;
  units: Readonly<{
    energyRadiance: "W m^-2 sr^-1";
    photonRadiance: "photons s^-1 m^-2 sr^-1";
    photonEnergy: "J";
    frequency: "Hz";
  }>;
  integration: "fixed-simpson-512-with-256-componentwise-audit";
  detectorAssumption: "per-unit-area-per-unit-solid-angle-no-throughput-no-collecting-area-no-exposure-time";
  scienceCinematicBoundary: "photon-observables-read-only-not-cinematic-color-input";
  boundary: "four-authority-disk-rays-fixed-band-photon-product-not-detector-count-rate";
}>;

function relativeDifference(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1e-300, Math.abs(left), Math.abs(right));
}

function integratePhotonRadiance(
  sample: KerrThinDiskBandSampleV320,
  definition: KerrThinDiskBandDefinitionV320,
  steps: number,
): number {
  if (!sample.applicable || sample.effectiveTemperatureK == null || sample.redshiftFactor == null || steps < 2 || steps % 2 !== 0) {
    throw new Error("v328-photon-integration-boundary");
  }
  const width = (definition.upperFrequencyHz - definition.lowerFrequencyHz) / steps;
  let sum = 0;
  for (let index = 0; index <= steps; index += 1) {
    const observedFrequencyHz = definition.lowerFrequencyHz + index * width;
    const emittedFrequencyHz = observedFrequencyHz / sample.redshiftFactor;
    const observedSpectralRadiance = sample.redshiftFactor ** 3
      * planckRadianceV278(sample.effectiveTemperatureK, emittedFrequencyHz);
    const photonSpectralRadiance = observedSpectralRadiance / (KERR_PLANCK_CONSTANT_J_S_V328 * observedFrequencyHz);
    const weight = index === 0 || index === steps ? 1 : index % 2 === 0 ? 2 : 4;
    sum += weight * photonSpectralRadiance;
  }
  const integrated = sum * width / 3;
  if (!Number.isFinite(integrated) || integrated <= 0) throw new Error("v328-photon-radiance-nonphysical");
  return integrated;
}

export function createKerrSciencePhotonBandViewV328(
  value: KerrThinDiskBandImagingViewV320,
): KerrSciencePhotonBandViewV328 {
  const source = parseKerrThinDiskBandImagingViewV320(value);
  const definitions = new Map(source.definitions.map((definition) => [definition.id, definition]));
  let maximumQuadrature = 0;
  let maximumPhotonRadiance = 0;
  let minimumPhotonRadiance = Number.POSITIVE_INFINITY;
  const rays = source.samples.filter((sample) => sample.applicable).map((sample): KerrSciencePhotonBandRayV328 => {
    if (sample.classification !== "disk-hit" || sample.bands == null || sample.redshiftFactor == null || sample.effectiveTemperatureK == null) {
      throw new Error("v328-disk-ray-identity");
    }
    const measurements = sample.bands.map((band): KerrSciencePhotonBandMeasurementV328 => {
      const definition = definitions.get(band.id);
      if (!definition) throw new Error("v328-band-definition-unavailable");
      const observedPhotonRadiancePerSM2Sr = integratePhotonRadiance(sample, definition, 512);
      const coarsePhotonRadiancePerSM2Sr = integratePhotonRadiance(sample, definition, 256);
      const quadratureRelativeDifference = relativeDifference(observedPhotonRadiancePerSM2Sr, coarsePhotonRadiancePerSM2Sr);
      const meanObservedPhotonEnergyJ = band.observedBandRadianceWM2Sr / observedPhotonRadiancePerSM2Sr;
      const meanObservedFrequencyHz = meanObservedPhotonEnergyJ / KERR_PLANCK_CONSTANT_J_S_V328;
      if (quadratureRelativeDifference >= KERR_SCIENCE_PHOTON_QUADRATURE_LIMIT_V328
        || !Number.isFinite(meanObservedFrequencyHz)
        || meanObservedFrequencyHz < definition.lowerFrequencyHz
        || meanObservedFrequencyHz > definition.upperFrequencyHz) {
        throw new Error(`v328-photon-measurement:${sample.rayIndex}:${band.id}:${quadratureRelativeDifference}:${meanObservedFrequencyHz}`);
      }
      maximumQuadrature = Math.max(maximumQuadrature, quadratureRelativeDifference);
      maximumPhotonRadiance = Math.max(maximumPhotonRadiance, observedPhotonRadiancePerSM2Sr);
      minimumPhotonRadiance = Math.min(minimumPhotonRadiance, observedPhotonRadiancePerSM2Sr);
      return Object.freeze({
        rayIndex: sample.rayIndex,
        bandId: band.id,
        observedEnergyRadianceWM2Sr: band.observedBandRadianceWM2Sr,
        observedPhotonRadiancePerSM2Sr,
        coarsePhotonRadiancePerSM2Sr,
        quadratureRelativeDifference,
        meanObservedPhotonEnergyJ,
        meanObservedFrequencyHz,
        bandLowerFrequencyHz: definition.lowerFrequencyHz,
        bandUpperFrequencyHz: definition.upperFrequencyHz,
      });
    });
    return Object.freeze({
      rayIndex: sample.rayIndex,
      spinA: sample.spinA,
      redshiftFactor: sample.redshiftFactor,
      effectiveTemperatureK: sample.effectiveTemperatureK,
      measurements: Object.freeze(measurements),
    });
  });
  if (rays.length !== 4 || rays.reduce((count, ray) => count + ray.measurements.length, 0) !== 12 || !Number.isFinite(minimumPhotonRadiance)) {
    throw new Error("v328-photon-counts");
  }
  return Object.freeze({
    version: KERR_SCIENCE_PHOTON_BANDS_VERSION_V328,
    status: "qualified-fixed-band-photon-radiance",
    source: Object.freeze({ bandArtifactSha256: KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320, fullShortAuthoritySha256: source.source.fullShortAuthoritySha256, denseAggregateSha256: null }),
    rays: Object.freeze(rays),
    counts: Object.freeze({ applicableDiskRayCount: 4, bandMeasurementCount: 12, unavailableRayCount: 12 }),
    maxima: Object.freeze({ photonQuadratureRelativeDifference: maximumQuadrature, photonRadiancePerSM2Sr: maximumPhotonRadiance }),
    minima: Object.freeze({ photonRadiancePerSM2Sr: minimumPhotonRadiance }),
    constants: Object.freeze({ planckConstantJS: KERR_PLANCK_CONSTANT_J_S_V328 }),
    units: Object.freeze({ energyRadiance: "W m^-2 sr^-1", photonRadiance: "photons s^-1 m^-2 sr^-1", photonEnergy: "J", frequency: "Hz" }),
    integration: "fixed-simpson-512-with-256-componentwise-audit",
    detectorAssumption: "per-unit-area-per-unit-solid-angle-no-throughput-no-collecting-area-no-exposure-time",
    scienceCinematicBoundary: "photon-observables-read-only-not-cinematic-color-input",
    boundary: "four-authority-disk-rays-fixed-band-photon-product-not-detector-count-rate",
  });
}

export function parseKerrSciencePhotonBandViewV328(value: unknown): KerrSciencePhotonBandViewV328 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrSciencePhotonBandViewV328> : null;
  if (!source || source.version !== KERR_SCIENCE_PHOTON_BANDS_VERSION_V328
    || source.status !== "qualified-fixed-band-photon-radiance"
    || source.source?.bandArtifactSha256 !== KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320 || source.source.denseAggregateSha256 !== null
    || source.counts?.applicableDiskRayCount !== 4 || source.counts.bandMeasurementCount !== 12 || source.counts.unavailableRayCount !== 12
    || source.constants?.planckConstantJS !== KERR_PLANCK_CONSTANT_J_S_V328
    || source.integration !== "fixed-simpson-512-with-256-componentwise-audit"
    || source.detectorAssumption !== "per-unit-area-per-unit-solid-angle-no-throughput-no-collecting-area-no-exposure-time"
    || source.scienceCinematicBoundary !== "photon-observables-read-only-not-cinematic-color-input"
    || source.boundary !== "four-authority-disk-rays-fixed-band-photon-product-not-detector-count-rate"
    || !Array.isArray(source.rays) || source.rays.length !== 4
    || typeof source.maxima?.photonQuadratureRelativeDifference !== "number"
    || source.maxima.photonQuadratureRelativeDifference >= KERR_SCIENCE_PHOTON_QUADRATURE_LIMIT_V328) throw new Error("v328-photon-view-identity");
  const measurements = source.rays.flatMap((ray) => ray.measurements ?? []);
  if (measurements.length !== 12 || measurements.some((measurement) => !Number.isFinite(measurement.observedPhotonRadiancePerSM2Sr)
    || measurement.observedPhotonRadiancePerSM2Sr <= 0
    || measurement.meanObservedFrequencyHz < measurement.bandLowerFrequencyHz
    || measurement.meanObservedFrequencyHz > measurement.bandUpperFrequencyHz)) throw new Error("v328-photon-measurement-identity");
  return value as KerrSciencePhotonBandViewV328;
}
