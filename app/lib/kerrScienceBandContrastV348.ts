import type { KerrInstrumentResponseRowV332, KerrScienceInstrumentResponseV332 } from "./kerrScienceInstrumentResponseV332";
import type { KerrScienceImageBandV346, KerrScienceImagePixelProbeArtifactV346, KerrScienceImageProbeCellV346 } from "./kerrScienceImagePixelProbeV346";

export const KERR_SCIENCE_BAND_CONTRAST_VERSION_V348 = "v348-kerr-science-band-contrast-v1" as const;
export type KerrScienceBandRatioIdV348 = "euv/visible" | "soft-x-ray/euv" | "soft-x-ray/visible";
export type KerrScienceBandContrastRowV348 = Readonly<{
  version: typeof KERR_SCIENCE_BAND_CONTRAST_VERSION_V348;
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  ratioId: KerrScienceBandRatioIdV348;
  numeratorBand: KerrScienceImageBandV346;
  denominatorBand: KerrScienceImageBandV346;
  energyRadianceRatio: number;
  energyRadianceRatioLower: number;
  energyRadianceRatioUpper: number;
  conservativeRelativeHalfEnvelope: number;
  log10EnergyRadianceRatio: number;
  syntheticExpectedPhotonRatio: number;
  syntheticEffectiveThroughputRatio: number;
  syntheticResponseContrast: number;
  maximumInstrumentQuadratureRelativeDifference: number;
  energyRatioMethod: "positive-interval-division-no-independence-assumed";
  instrumentModel: "synthetic-reference-photon-counter-v332";
  instrumentStatus: "synthetic-audit-fixture-not-calibrated-observatory";
  stochasticNoise: "disabled";
  spectralInference: "unavailable-no-calibrated-bandpass-or-physical-fit";
  scienceCinematicBoundary: "science-diagnostic-never-cinematic-color-input";
}>;

export type KerrScienceBandContrastArtifactV348 = Readonly<{
  version: "v348-kerr-science-band-contrast-artifact-v1";
  generatedAt: string;
  status: "qualified-detector-independent-and-synthetic-response-separated";
  source: Readonly<{
    probePath: "dist/science/kerr-image-probe-v346/probe.json";
    probeFileSha256: string;
    probeArtifactSha256: string;
    instrumentPath: "dist/science/kerr-science-instrument-response-v332/response-reference.json";
    instrumentFileSha256: string;
    instrumentArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  counts: Readonly<{ rayCount: 4; ratioCountPerRay: 3; rowCount: 12 }>;
  ratioOrder: readonly ["euv/visible", "soft-x-ray/euv", "soft-x-ray/visible"];
  rows: readonly KerrScienceBandContrastRowV348[];
  maxima: Readonly<{ conservativeRelativeHalfEnvelope: number; instrumentQuadratureRelativeDifference: number; syntheticResponseContrast: number }>;
  canonicalExport: Readonly<{ rayIndex: 12; jsonSha256: string; jsonBytes: number; csvSha256: string; csvBytes: number }>;
  interpretation: Readonly<{ energyRadianceRatios: "detector-independent-band-integrated-energy-radiance"; syntheticCountRatios: "deterministic-v332-expectation-not-measured-counts"; spectralTemperature: "unavailable"; calibratedHardness: "unavailable" }>;
  denseCampaignStatus: "incomplete-0-of-49";
  denseAggregateSha256: null;
  browserQualification: "not-run";
  boundary: "twelve-bounded-band-contrast-rows-no-temperature-hardness-or-cinematic-grade-claim";
  artifactSha256: string;
}>;

const PAIRS = [
  ["euv", "visible", "euv/visible"],
  ["soft-x-ray", "euv", "soft-x-ray/euv"],
  ["soft-x-ray", "visible", "soft-x-ray/visible"],
] as const;
const RAYS = [12, 13, 14, 15] as const;
const SHA = /^[a-f0-9]{64}$/;

function probeCell(probe: KerrScienceImagePixelProbeArtifactV346, rayIndex: 12 | 13 | 14 | 15, bandId: KerrScienceImageBandV346): KerrScienceImageProbeCellV346 { const cell = probe.cells.find((entry) => entry.rayIndex === rayIndex && entry.bandId === bandId); if (!cell) throw new Error("v348-probe-cell-missing"); return cell; }
function instrumentRow(instrument: KerrScienceInstrumentResponseV332, rayIndex: 12 | 13 | 14 | 15, bandId: KerrScienceImageBandV346): KerrInstrumentResponseRowV332 { const row = instrument.rows.find((entry) => entry.rayIndex === rayIndex && entry.bandId === bandId); if (!row) throw new Error("v348-instrument-row-missing"); return row; }

export function createKerrScienceBandContrastRowsV348(probe: KerrScienceImagePixelProbeArtifactV346, instrument: KerrScienceInstrumentResponseV332): readonly KerrScienceBandContrastRowV348[] {
  if (instrument.model.modelId !== "synthetic-reference-photon-counter-v332" || instrument.model.status !== "synthetic-audit-fixture-not-calibrated-observatory" || instrument.model.stochasticNoise !== "disabled" || instrument.counts.bandMeasurementCount !== 12) throw new Error("v348-instrument-boundary");
  return Object.freeze(RAYS.flatMap((rayIndex) => PAIRS.map(([numeratorBand, denominatorBand, ratioId]) => {
    const numerator = probeCell(probe, rayIndex, numeratorBand); const denominator = probeCell(probe, rayIndex, denominatorBand); const numeratorInstrument = instrumentRow(instrument, rayIndex, numeratorBand); const denominatorInstrument = instrumentRow(instrument, rayIndex, denominatorBand);
    const ratio = numerator.observedEnergyRadianceWM2Sr / denominator.observedEnergyRadianceWM2Sr; const lower = numerator.lowerAuditEnvelopeWM2Sr / denominator.upperAuditEnvelopeWM2Sr; const upper = numerator.upperAuditEnvelopeWM2Sr / denominator.lowerAuditEnvelopeWM2Sr; const photonRatio = numeratorInstrument.expectedPhotonsPerPixelExposure / denominatorInstrument.expectedPhotonsPerPixelExposure; const throughputRatio = numeratorInstrument.effectiveBandThroughput / denominatorInstrument.effectiveBandThroughput; const responseContrast = photonRatio / ratio; const quadrature = Math.max(numeratorInstrument.quadratureRelativeDifference, denominatorInstrument.quadratureRelativeDifference);
    if (![ratio, lower, upper, photonRatio, throughputRatio, responseContrast, quadrature].every(Number.isFinite) || ratio <= 0 || lower <= 0 || upper <= 0 || lower > ratio || ratio > upper) throw new Error("v348-band-contrast-nonphysical");
    return Object.freeze({ version: KERR_SCIENCE_BAND_CONTRAST_VERSION_V348, rayIndex, spinA: numerator.spinA, ratioId, numeratorBand, denominatorBand, energyRadianceRatio: ratio, energyRadianceRatioLower: lower, energyRadianceRatioUpper: upper, conservativeRelativeHalfEnvelope: Math.max(ratio - lower, upper - ratio) / ratio, log10EnergyRadianceRatio: Math.log10(ratio), syntheticExpectedPhotonRatio: photonRatio, syntheticEffectiveThroughputRatio: throughputRatio, syntheticResponseContrast: responseContrast, maximumInstrumentQuadratureRelativeDifference: quadrature, energyRatioMethod: "positive-interval-division-no-independence-assumed", instrumentModel: "synthetic-reference-photon-counter-v332", instrumentStatus: "synthetic-audit-fixture-not-calibrated-observatory", stochasticNoise: "disabled", spectralInference: "unavailable-no-calibrated-bandpass-or-physical-fit", scienceCinematicBoundary: "science-diagnostic-never-cinematic-color-input" });
  })));
}

function finiteRow(row: KerrScienceBandContrastRowV348): boolean { return [row.rayIndex, row.spinA, row.energyRadianceRatio, row.energyRadianceRatioLower, row.energyRadianceRatioUpper, row.conservativeRelativeHalfEnvelope, row.log10EnergyRadianceRatio, row.syntheticExpectedPhotonRatio, row.syntheticEffectiveThroughputRatio, row.syntheticResponseContrast, row.maximumInstrumentQuadratureRelativeDifference].every(Number.isFinite); }
export function parseKerrScienceBandContrastArtifactV348(value: unknown): KerrScienceBandContrastArtifactV348 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrScienceBandContrastArtifactV348> : null; const rows = source?.rows ?? [];
  if (!source || source.version !== "v348-kerr-science-band-contrast-artifact-v1" || source.status !== "qualified-detector-independent-and-synthetic-response-separated"
    || source.source?.probePath !== "dist/science/kerr-image-probe-v346/probe.json" || !SHA.test(source.source.probeFileSha256) || !SHA.test(source.source.probeArtifactSha256) || source.source.instrumentPath !== "dist/science/kerr-science-instrument-response-v332/response-reference.json" || !SHA.test(source.source.instrumentFileSha256) || !SHA.test(source.source.instrumentArtifactSha256) || !SHA.test(source.source.fullShortAuthoritySha256)
    || source.counts?.rayCount !== 4 || source.counts.ratioCountPerRay !== 3 || source.counts.rowCount !== 12 || source.ratioOrder?.join(",") !== "euv/visible,soft-x-ray/euv,soft-x-ray/visible" || rows.length !== 12 || new Set(rows.map((row) => `${row.rayIndex}:${row.ratioId}`)).size !== 12
    || rows.some((row) => !finiteRow(row) || row.energyRadianceRatioLower > row.energyRadianceRatio || row.energyRadianceRatio > row.energyRadianceRatioUpper || row.energyRatioMethod !== "positive-interval-division-no-independence-assumed" || row.instrumentStatus !== "synthetic-audit-fixture-not-calibrated-observatory" || row.stochasticNoise !== "disabled" || row.spectralInference !== "unavailable-no-calibrated-bandpass-or-physical-fit" || row.scienceCinematicBoundary !== "science-diagnostic-never-cinematic-color-input")
    || !Number.isFinite(source.maxima?.conservativeRelativeHalfEnvelope) || !Number.isFinite(source.maxima?.instrumentQuadratureRelativeDifference) || !Number.isFinite(source.maxima?.syntheticResponseContrast)
    || source.canonicalExport?.rayIndex !== 12 || !SHA.test(source.canonicalExport.jsonSha256) || source.canonicalExport.jsonBytes <= 0 || !SHA.test(source.canonicalExport.csvSha256) || source.canonicalExport.csvBytes <= 0
    || source.interpretation?.energyRadianceRatios !== "detector-independent-band-integrated-energy-radiance" || source.interpretation.syntheticCountRatios !== "deterministic-v332-expectation-not-measured-counts" || source.interpretation.spectralTemperature !== "unavailable" || source.interpretation.calibratedHardness !== "unavailable"
    || source.denseCampaignStatus !== "incomplete-0-of-49" || source.denseAggregateSha256 !== null || source.browserQualification !== "not-run" || source.boundary !== "twelve-bounded-band-contrast-rows-no-temperature-hardness-or-cinematic-grade-claim" || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v348-band-contrast-artifact-identity");
  return value as KerrScienceBandContrastArtifactV348;
}

export function serializeKerrScienceBandContrastJsonV348(rows: readonly KerrScienceBandContrastRowV348[], artifactSha256: string): string { if (!SHA.test(artifactSha256) || rows.length !== 3 || new Set(rows.map((row) => row.rayIndex)).size !== 1) throw new Error("v348-band-export-identity"); return `${JSON.stringify({ version: "v348-kerr-science-band-contrast-export-v1", artifactSha256, rayIndex: rows[0].rayIndex, rows, interpretation: { detectorIndependent: true, syntheticInstrument: "not-calibrated-observatory", spectralTemperature: "unavailable", calibratedHardness: "unavailable" }, boundary: "sanitized-selected-ray-band-contrast-portable-provenance" }, null, 2)}\n`; }
export function serializeKerrScienceBandContrastCsvV348(rows: readonly KerrScienceBandContrastRowV348[], artifactSha256: string): string { if (!SHA.test(artifactSha256) || rows.length !== 3 || new Set(rows.map((row) => row.rayIndex)).size !== 1) throw new Error("v348-band-export-identity"); const headers = ["version", "artifact_sha256", "ray_index", "spin_a", "ratio_id", "numerator_band", "denominator_band", "energy_radiance_ratio", "energy_ratio_lower", "energy_ratio_upper", "relative_half_envelope", "log10_energy_ratio", "synthetic_expected_photon_ratio", "synthetic_throughput_ratio", "synthetic_response_contrast", "instrument_quadrature_relative", "instrument_status", "spectral_inference", "dense_campaign_status"]; const lines = rows.map((row) => [row.version, artifactSha256, row.rayIndex, row.spinA, row.ratioId, row.numeratorBand, row.denominatorBand, row.energyRadianceRatio, row.energyRadianceRatioLower, row.energyRadianceRatioUpper, row.conservativeRelativeHalfEnvelope, row.log10EnergyRadianceRatio, row.syntheticExpectedPhotonRatio, row.syntheticEffectiveThroughputRatio, row.syntheticResponseContrast, row.maximumInstrumentQuadratureRelativeDifference, row.instrumentStatus, row.spectralInference, "incomplete-0-of-49"].map((entry) => typeof entry === "number" ? String(entry) : JSON.stringify(entry)).join(",")); return `${headers.join(",")}\n${lines.join("\n")}\n`; }
