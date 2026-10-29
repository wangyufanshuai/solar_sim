import { planckRadianceV278 } from "./strongGravityRenderingV278";
import {
  KERR_FULL_SHORT_AUTHORITY_SHA256_V314,
} from "./kerrCampaignV314";
import {
  KERR_THIN_DISK_SPECTRAL_VERSION_V319,
  parseKerrThinDiskSpectralViewV319,
  type KerrThinDiskSpectralSampleV319,
  type KerrThinDiskSpectralViewV319,
} from "./kerrThinDiskSpectralV319";

export const KERR_THIN_DISK_BAND_IMAGING_VERSION_V320 = "v320-kerr-fixed-band-science-imaging-v1" as const;
export const KERR_THIN_DISK_SOURCE_ARTIFACT_SHA256_V319 = "2ac07e869b609dcb086906508bbd4e23ef1756caefd4e503a4d428021d62cf45" as const;
export const KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320 = "e2bd5957a1dd53a0942d5f7cd519d7b1dd84af1db7f476eb0f9dda0a65c5a460" as const;
export const KERR_THIN_DISK_BAND_QUADRATURE_LIMIT_V320 = 2e-6;

export type KerrThinDiskBandIdV320 = "visible" | "euv" | "soft-x-ray";

export type KerrThinDiskBandDefinitionV320 = Readonly<{
  id: KerrThinDiskBandIdV320;
  label: string;
  lowerFrequencyHz: number;
  upperFrequencyHz: number;
  referenceRadianceWM2Sr: number;
  falseColorChannel: "red" | "green" | "blue";
  physicalRangeLabel: string;
}>;

export const KERR_THIN_DISK_FIXED_BANDS_V320: readonly KerrThinDiskBandDefinitionV320[] = Object.freeze([
  Object.freeze({
    id: "visible",
    label: "Visible",
    lowerFrequencyHz: 4.2827494e14,
    upperFrequencyHz: 7.49481145e14,
    referenceRadianceWM2Sr: 4e10,
    falseColorChannel: "red",
    physicalRangeLabel: "400–700 nm",
  }),
  Object.freeze({
    id: "euv",
    label: "EUV",
    lowerFrequencyHz: 2.4776236e15,
    upperFrequencyHz: 2.41798924e16,
    referenceRadianceWM2Sr: 1e15,
    falseColorChannel: "green",
    physicalRangeLabel: "12.4–121 nm",
  }),
  Object.freeze({
    id: "soft-x-ray",
    label: "Soft X-ray",
    lowerFrequencyHz: 2.41798924e16,
    upperFrequencyHz: 4.83597848e17,
    referenceRadianceWM2Sr: 1.5e16,
    falseColorChannel: "blue",
    physicalRangeLabel: "0.1–2.0 keV",
  }),
]);

export type KerrThinDiskBandMeasurementV320 = Readonly<{
  id: KerrThinDiskBandIdV320;
  observedBandRadianceWM2Sr: number;
  coarseObservedBandRadianceWM2Sr: number;
  quadratureRelativeDifference: number;
  fixedReferenceRadianceWM2Sr: number;
  normalizedLinearUnclipped: number;
  normalizedLinearClipped: number;
  saturated: boolean;
}>;

export type KerrThinDiskBandSampleV320 = Readonly<{
  rayIndex: number;
  classification: "capture" | "escape" | "disk-hit";
  applicable: boolean;
  spinA: number;
  emissionRadiusM: number | null;
  redshiftFactor: number | null;
  effectiveTemperatureK: number | null;
  observedBolometricIntensityWM2Sr: number | null;
  bands: readonly KerrThinDiskBandMeasurementV320[] | null;
  coveredBolometricFraction: number | null;
  falseColor: Readonly<{
    linearRgbUnclipped: readonly [number, number, number];
    linearRgbClipped: readonly [number, number, number];
    saturatedChannels: readonly ("red" | "green" | "blue")[];
  }> | null;
  sourceErrorBudget: Readonly<{
    pageThorneQuadratureRelative: number | null;
    carterKerrSchildSpectralRelative: number | null;
    geometryRadiusDifferenceM: number | null;
    geometryRedshiftDifference: number | null;
  }>;
}>;

export type KerrThinDiskBandImagingViewV320 = Readonly<{
  version: typeof KERR_THIN_DISK_BAND_IMAGING_VERSION_V320;
  status: "qualified-fixed-band-sparse-science-imaging";
  source: Readonly<{
    spectrumVersion: typeof KERR_THIN_DISK_SPECTRAL_VERSION_V319;
    spectrumArtifactSha256: typeof KERR_THIN_DISK_SOURCE_ARTIFACT_SHA256_V319;
    fullShortAuthoritySha256: string;
    denseAggregateSha256: null;
  }>;
  definitions: readonly KerrThinDiskBandDefinitionV320[];
  samples: readonly KerrThinDiskBandSampleV320[];
  counts: Readonly<{
    sampleCount: 16;
    applicableDiskRayCount: 4;
    unavailableRayCount: 12;
    explicitSaturationFlagCount: 12;
    saturatedChannelCount: number;
  }>;
  maxima: Readonly<{
    bandQuadratureRelativeDifference: number;
    coveredBolometricFraction: number;
  }>;
  units: Readonly<{
    frequency: "Hz";
    bandRadiance: "W m^-2 sr^-1";
    temperature: "K";
  }>;
  integration: "fixed-simpson-256-with-128-componentwise-audit";
  normalizationPolicy: "fixed-physical-reference-no-data-adaptive-rescale";
  transferFunction: "linear-rgb-clamp-per-channel-explicit-saturation";
  uncertaintyCombination: "componentwise-no-rss-no-scalar-total";
  scienceCinematicBoundary: "physical-band-radiance-immutable-presentation-copy-only";
  boundary: "four-authority-disk-rays-fixed-band-product-not-dense-image";
}>;

export type KerrThinDiskCinematicBandPreviewV320 = Readonly<{
  rayIndex: number;
  seed: number;
  presentationLinearRgb: readonly [number, number, number];
  sourcePhysicalValuesIncluded: false;
  boundary: "seeded-copy-of-display-encoding-never-science-measurements";
}>;

function relativeDifference(first: number, second: number): number {
  return Math.abs(first - second) / Math.max(1e-300, Math.abs(first), Math.abs(second));
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function integrateObservedBand(
  sample: KerrThinDiskSpectralSampleV319,
  definition: KerrThinDiskBandDefinitionV320,
  steps: number,
): number {
  if (!sample.applicable || sample.effectiveTemperatureK == null || sample.redshiftFactor == null) {
    throw new Error("v320-band-integration-not-applicable");
  }
  if (steps < 2 || steps % 2 !== 0) throw new Error("v320-band-integration-grid");
  const width = (definition.upperFrequencyHz - definition.lowerFrequencyHz) / steps;
  let sum = 0;
  for (let index = 0; index <= steps; index += 1) {
    const observedFrequencyHz = definition.lowerFrequencyHz + index * width;
    const emittedFrequencyHz = observedFrequencyHz / sample.redshiftFactor;
    const observedSpectralRadiance = sample.redshiftFactor ** 3
      * planckRadianceV278(sample.effectiveTemperatureK, emittedFrequencyHz);
    const weight = index === 0 || index === steps ? 1 : index % 2 === 0 ? 2 : 4;
    sum += weight * observedSpectralRadiance;
  }
  const integrated = sum * width / 3;
  if (!Number.isFinite(integrated) || integrated < 0) throw new Error("v320-band-radiance-non-finite");
  return integrated;
}

function createMeasurement(
  sample: KerrThinDiskSpectralSampleV319,
  definition: KerrThinDiskBandDefinitionV320,
): KerrThinDiskBandMeasurementV320 {
  const observedBandRadianceWM2Sr = integrateObservedBand(sample, definition, 256);
  const coarseObservedBandRadianceWM2Sr = integrateObservedBand(sample, definition, 128);
  const normalizedLinearUnclipped = observedBandRadianceWM2Sr / definition.referenceRadianceWM2Sr;
  return Object.freeze({
    id: definition.id,
    observedBandRadianceWM2Sr,
    coarseObservedBandRadianceWM2Sr,
    quadratureRelativeDifference: relativeDifference(observedBandRadianceWM2Sr, coarseObservedBandRadianceWM2Sr),
    fixedReferenceRadianceWM2Sr: definition.referenceRadianceWM2Sr,
    normalizedLinearUnclipped,
    normalizedLinearClipped: clampUnit(normalizedLinearUnclipped),
    saturated: normalizedLinearUnclipped > 1,
  });
}

function unavailableSample(sample: KerrThinDiskSpectralSampleV319): KerrThinDiskBandSampleV320 {
  return Object.freeze({
    rayIndex: sample.rayIndex,
    classification: sample.classification,
    applicable: false,
    spinA: sample.spinA,
    emissionRadiusM: null,
    redshiftFactor: null,
    effectiveTemperatureK: null,
    observedBolometricIntensityWM2Sr: null,
    bands: null,
    coveredBolometricFraction: null,
    falseColor: null,
    sourceErrorBudget: Object.freeze({
      pageThorneQuadratureRelative: null,
      carterKerrSchildSpectralRelative: null,
      geometryRadiusDifferenceM: null,
      geometryRedshiftDifference: null,
    }),
  });
}

export function createKerrThinDiskBandImagingViewV320(
  source: KerrThinDiskSpectralViewV319,
): KerrThinDiskBandImagingViewV320 {
  const spectrum = parseKerrThinDiskSpectralViewV319(source);
  let maximumQuadrature = 0;
  let maximumCoveredFraction = 0;
  let saturatedChannelCount = 0;
  const samples = spectrum.samples.map((sample): KerrThinDiskBandSampleV320 => {
    if (!sample.applicable) return unavailableSample(sample);
    if (sample.observedBolometricIntensity == null || sample.observedBolometricIntensity <= 0) {
      throw new Error("v320-bolometric-intensity-unavailable");
    }
    const bands = KERR_THIN_DISK_FIXED_BANDS_V320.map((definition) => createMeasurement(sample, definition));
    const bandMap = new Map(bands.map((band) => [band.id, band]));
    const red = bandMap.get("visible");
    const green = bandMap.get("euv");
    const blue = bandMap.get("soft-x-ray");
    if (!red || !green || !blue) throw new Error("v320-false-color-band-map");
    const linearRgbUnclipped = Object.freeze([
      red.normalizedLinearUnclipped,
      green.normalizedLinearUnclipped,
      blue.normalizedLinearUnclipped,
    ]) as readonly [number, number, number];
    const linearRgbClipped = Object.freeze([
      red.normalizedLinearClipped,
      green.normalizedLinearClipped,
      blue.normalizedLinearClipped,
    ]) as readonly [number, number, number];
    const saturatedChannels = Object.freeze([
      ...(red.saturated ? ["red" as const] : []),
      ...(green.saturated ? ["green" as const] : []),
      ...(blue.saturated ? ["blue" as const] : []),
    ]);
    saturatedChannelCount += saturatedChannels.length;
    const coveredBolometricFraction = bands.reduce((total, band) => total + band.observedBandRadianceWM2Sr, 0)
      / sample.observedBolometricIntensity;
    maximumCoveredFraction = Math.max(maximumCoveredFraction, coveredBolometricFraction);
    for (const band of bands) maximumQuadrature = Math.max(maximumQuadrature, band.quadratureRelativeDifference);
    return Object.freeze({
      rayIndex: sample.rayIndex,
      classification: sample.classification,
      applicable: true,
      spinA: sample.spinA,
      emissionRadiusM: sample.emissionRadiusM,
      redshiftFactor: sample.redshiftFactor,
      effectiveTemperatureK: sample.effectiveTemperatureK,
      observedBolometricIntensityWM2Sr: sample.observedBolometricIntensity,
      bands: Object.freeze(bands),
      coveredBolometricFraction,
      falseColor: Object.freeze({ linearRgbUnclipped, linearRgbClipped, saturatedChannels }),
      sourceErrorBudget: Object.freeze({
        pageThorneQuadratureRelative: sample.errorBudget.diskQuadratureRelative,
        carterKerrSchildSpectralRelative: sample.errorBudget.formulaSpectralRelative,
        geometryRadiusDifferenceM: sample.errorBudget.geometryRadiusDifferenceM,
        geometryRedshiftDifference: sample.errorBudget.geometryRedshiftDifference,
      }),
    });
  });
  if (maximumQuadrature >= KERR_THIN_DISK_BAND_QUADRATURE_LIMIT_V320
    || maximumCoveredFraction <= 0 || maximumCoveredFraction > 1 + 1e-6) {
    throw new Error(`v320-band-qualification:${maximumQuadrature}:${maximumCoveredFraction}`);
  }
  return Object.freeze({
    version: KERR_THIN_DISK_BAND_IMAGING_VERSION_V320,
    status: "qualified-fixed-band-sparse-science-imaging",
    source: Object.freeze({
      spectrumVersion: spectrum.version,
      spectrumArtifactSha256: KERR_THIN_DISK_SOURCE_ARTIFACT_SHA256_V319,
      fullShortAuthoritySha256: spectrum.authority.fullShortAuthoritySha256,
      denseAggregateSha256: null,
    }),
    definitions: KERR_THIN_DISK_FIXED_BANDS_V320,
    samples: Object.freeze(samples),
    counts: Object.freeze({
      sampleCount: 16,
      applicableDiskRayCount: 4,
      unavailableRayCount: 12,
      explicitSaturationFlagCount: 12,
      saturatedChannelCount,
    }),
    maxima: Object.freeze({
      bandQuadratureRelativeDifference: maximumQuadrature,
      coveredBolometricFraction: maximumCoveredFraction,
    }),
    units: Object.freeze({ frequency: "Hz", bandRadiance: "W m^-2 sr^-1", temperature: "K" }),
    integration: "fixed-simpson-256-with-128-componentwise-audit",
    normalizationPolicy: "fixed-physical-reference-no-data-adaptive-rescale",
    transferFunction: "linear-rgb-clamp-per-channel-explicit-saturation",
    uncertaintyCombination: "componentwise-no-rss-no-scalar-total",
    scienceCinematicBoundary: "physical-band-radiance-immutable-presentation-copy-only",
    boundary: "four-authority-disk-rays-fixed-band-product-not-dense-image",
  });
}

export function createKerrThinDiskCinematicBandPreviewV320(
  sample: KerrThinDiskBandSampleV320,
  seed: number,
): KerrThinDiskCinematicBandPreviewV320 {
  if (!sample.applicable || !sample.falseColor || !Number.isSafeInteger(seed)) {
    throw new Error("v320-cinematic-preview-boundary");
  }
  const sourceCopy = [...sample.falseColor.linearRgbClipped] as [number, number, number];
  const mixed = Math.imul((seed ^ (sample.rayIndex + 1)) >>> 0, 0x9e3779b1) >>> 0;
  const signedDetail = mixed / 0xffffffff * 2 - 1;
  const presentationLinearRgb = Object.freeze(sourceCopy.map((channel, index) => (
    clampUnit(channel * (1 + signedDetail * (0.035 + index * 0.01)))
  ))) as readonly [number, number, number];
  return Object.freeze({
    rayIndex: sample.rayIndex,
    seed,
    presentationLinearRgb,
    sourcePhysicalValuesIncluded: false,
    boundary: "seeded-copy-of-display-encoding-never-science-measurements",
  });
}

export function parseKerrThinDiskBandImagingViewV320(value: unknown): KerrThinDiskBandImagingViewV320 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrThinDiskBandImagingViewV320>
    : null;
  if (!source || source.version !== KERR_THIN_DISK_BAND_IMAGING_VERSION_V320
    || source.status !== "qualified-fixed-band-sparse-science-imaging"
    || source.source?.spectrumVersion !== KERR_THIN_DISK_SPECTRAL_VERSION_V319
    || source.source.spectrumArtifactSha256 !== KERR_THIN_DISK_SOURCE_ARTIFACT_SHA256_V319
    || source.source.fullShortAuthoritySha256 !== KERR_FULL_SHORT_AUTHORITY_SHA256_V314
    || source.source.denseAggregateSha256 !== null
    || source.counts?.sampleCount !== 16 || source.counts.applicableDiskRayCount !== 4
    || source.counts.unavailableRayCount !== 12 || source.counts.explicitSaturationFlagCount !== 12
    || source.integration !== "fixed-simpson-256-with-128-componentwise-audit"
    || source.normalizationPolicy !== "fixed-physical-reference-no-data-adaptive-rescale"
    || source.transferFunction !== "linear-rgb-clamp-per-channel-explicit-saturation"
    || source.uncertaintyCombination !== "componentwise-no-rss-no-scalar-total"
    || source.scienceCinematicBoundary !== "physical-band-radiance-immutable-presentation-copy-only"
    || source.boundary !== "four-authority-disk-rays-fixed-band-product-not-dense-image"
    || !Array.isArray(source.definitions) || source.definitions.length !== 3
    || !Array.isArray(source.samples) || source.samples.length !== 16) {
    throw new Error("v320-band-view-identity");
  }
  const definitionsMatch = source.definitions.every((definition, index) => {
    const expected = KERR_THIN_DISK_FIXED_BANDS_V320[index];
    return definition.id === expected.id && definition.lowerFrequencyHz === expected.lowerFrequencyHz
      && definition.upperFrequencyHz === expected.upperFrequencyHz
      && definition.referenceRadianceWM2Sr === expected.referenceRadianceWM2Sr
      && definition.falseColorChannel === expected.falseColorChannel;
  });
  if (!definitionsMatch || typeof source.maxima?.bandQuadratureRelativeDifference !== "number"
    || source.maxima.bandQuadratureRelativeDifference >= KERR_THIN_DISK_BAND_QUADRATURE_LIMIT_V320
    || typeof source.maxima.coveredBolometricFraction !== "number"
    || source.maxima.coveredBolometricFraction <= 0 || source.maxima.coveredBolometricFraction > 1 + 1e-6) {
    throw new Error("v320-band-view-conservation");
  }
  let applicableCount = 0;
  let saturationCount = 0;
  source.samples.forEach((sample, index) => {
    if (sample.rayIndex !== index || !Number.isFinite(sample.spinA)) throw new Error("v320-band-sample-identity");
    if (!sample.applicable) {
      if (sample.classification === "disk-hit" || sample.bands !== null || sample.falseColor !== null
        || sample.coveredBolometricFraction !== null || sample.observedBolometricIntensityWM2Sr !== null) {
        throw new Error("v320-band-unavailable-boundary");
      }
      return;
    }
    applicableCount += 1;
    if (sample.classification !== "disk-hit" || !Array.isArray(sample.bands) || sample.bands.length !== 3
      || !sample.falseColor || !Array.isArray(sample.falseColor.linearRgbUnclipped)
      || sample.falseColor.linearRgbUnclipped.length !== 3 || sample.falseColor.linearRgbClipped.length !== 3
      || typeof sample.coveredBolometricFraction !== "number" || sample.coveredBolometricFraction <= 0
      || sample.coveredBolometricFraction > 1 + 1e-6) throw new Error("v320-band-applicable-boundary");
    (sample.bands as readonly KerrThinDiskBandMeasurementV320[]).forEach((band, bandIndex) => {
      const expected = KERR_THIN_DISK_FIXED_BANDS_V320[bandIndex];
      if (band.id !== expected.id || band.fixedReferenceRadianceWM2Sr !== expected.referenceRadianceWM2Sr
        || ![band.observedBandRadianceWM2Sr, band.coarseObservedBandRadianceWM2Sr,
          band.quadratureRelativeDifference, band.normalizedLinearUnclipped, band.normalizedLinearClipped].every(Number.isFinite)
        || band.observedBandRadianceWM2Sr < 0 || band.quadratureRelativeDifference >= KERR_THIN_DISK_BAND_QUADRATURE_LIMIT_V320
        || band.normalizedLinearClipped < 0 || band.normalizedLinearClipped > 1
        || band.saturated !== (band.normalizedLinearUnclipped > 1)) throw new Error("v320-band-measurement");
      if (band.saturated) saturationCount += 1;
    });
  });
  if (applicableCount !== 4 || saturationCount !== source.counts.saturatedChannelCount) {
    throw new Error("v320-band-counts");
  }
  return value as KerrThinDiskBandImagingViewV320;
}
