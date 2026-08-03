import { KERR_THIN_DISK_FIXED_BANDS_V320, type KerrThinDiskBandIdV320 } from "./kerrThinDiskBandImagingV320";
import type { KerrScienceInstrumentResponseV332 } from "./kerrScienceInstrumentResponseV332";
import type { KerrScienceBandContrastArtifactV348, KerrScienceBandContrastRowV348 } from "./kerrScienceBandContrastV348";
import type { KerrScienceImagePixelProbeArtifactV346 } from "./kerrScienceImagePixelProbeV346";

export const KERR_SCIENCE_BAND_OBSERVATION_VERSION_V350 = "v350-kerr-science-band-observation-v1" as const;
export type KerrScienceBandObservationAvailabilityV350 = Readonly<{
  energyRadiance: "available-detector-independent";
  syntheticPhotonExpectation: "available-deterministic-audit";
  measuredDetectorCounts: "unavailable-synthetic-model-only";
  calibratedBandpass: "unavailable-not-calibrated-observatory";
  spectralTemperature: "unavailable-no-physical-fit";
  celestialWcs: "unavailable-sparse-index-grid";
  solidAngleIntegratedFlux: "unavailable-no-celestial-wcs";
}>;

export type KerrScienceBandDefinitionV350 = Readonly<{
  id: KerrThinDiskBandIdV320;
  label: "Visible" | "EUV" | "Soft X-ray";
  physicalRangeLabel: "400–700 nm" | "12.4–121 nm" | "0.1–2.0 keV";
  lowerFrequencyHz: number;
  upperFrequencyHz: number;
  energyRadianceUnit: "W m^-2 sr^-1";
  photonRadianceUnit: "photons s^-1 m^-2 sr^-1";
  syntheticExpectationUnit: "photons pixel^-1 exposure^-1";
}>;

export type KerrScienceBandObservationRowV350 = Readonly<{
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  bandId: KerrThinDiskBandIdV320;
  ratioId: KerrScienceBandContrastRowV348["ratioId"];
  energyRadianceWM2Sr: number;
  energyRadianceLowerWM2Sr: number;
  energyRadianceUpperWM2Sr: number;
  syntheticExpectedPhotonsPerPixelExposure: number;
  syntheticEffectiveThroughput: number;
  instrumentQuadratureRelativeDifference: number;
  energyRadianceAvailable: true;
  syntheticExpectationAvailable: true;
  measuredCountsAvailable: false;
  celestialWcs: "unavailable";
  solidAngleIntegratedFlux: "unavailable";
  spectralInference: "unavailable";
  provenance: Readonly<{
    bandObservationArtifactSha256: string | null;
    bandContrastArtifactSha256: string;
    probeArtifactSha256: string;
    instrumentArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
}>;

export type KerrScienceBandObservationArtifactV350 = Readonly<{
  version: typeof KERR_SCIENCE_BAND_OBSERVATION_VERSION_V350;
  generatedAt: string;
  status: "qualified-read-only-band-observation-provenance";
  source: Readonly<{
    bandContrastPath: "dist/science/kerr-band-contrast-v348/diagnostic.json";
    bandContrastFileSha256: string;
    bandContrastArtifactSha256: string;
    instrumentPath: "dist/science/kerr-science-instrument-response-v332/response-reference.json";
    instrumentFileSha256: string;
    instrumentArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  definitions: readonly KerrScienceBandDefinitionV350[];
  availability: KerrScienceBandObservationAvailabilityV350;
  units: Readonly<{
    energyRadiance: "W m^-2 sr^-1";
    photonRadiance: "photons s^-1 m^-2 sr^-1";
    syntheticExpectation: "photons pixel^-1 exposure^-1";
  }>;
  rows: readonly KerrScienceBandObservationRowV350[];
  counts: Readonly<{ bandCount: 3; rayCount: 4; rowCount: 12 }>;
  interpretation: "read-only-observation-layer-no-calibrated-counts-or-spectral-fit";
  scienceCinematicBoundary: "observation-layer-never-cinematic-color-input";
  denseCampaignStatus: "incomplete-0-of-49";
  denseAggregateSha256: null;
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const BAND_IDS = ["visible", "euv", "soft-x-ray"] as const;
const RAYS = [12, 13, 14, 15] as const;
const SHA = /^[a-f0-9]{64}$/;

export const KERR_SCIENCE_BAND_OBSERVATION_AVAILABILITY_V350: KerrScienceBandObservationAvailabilityV350 = Object.freeze({
  energyRadiance: "available-detector-independent",
  syntheticPhotonExpectation: "available-deterministic-audit",
  measuredDetectorCounts: "unavailable-synthetic-model-only",
  calibratedBandpass: "unavailable-not-calibrated-observatory",
  spectralTemperature: "unavailable-no-physical-fit",
  celestialWcs: "unavailable-sparse-index-grid",
  solidAngleIntegratedFlux: "unavailable-no-celestial-wcs",
});

export const KERR_SCIENCE_BAND_OBSERVATION_DEFINITIONS_V350: readonly KerrScienceBandDefinitionV350[] = Object.freeze(KERR_THIN_DISK_FIXED_BANDS_V320.map((band): KerrScienceBandDefinitionV350 => Object.freeze({
  id: band.id,
  label: band.id === "visible" ? "Visible" : band.id === "euv" ? "EUV" : "Soft X-ray",
  physicalRangeLabel: band.id === "visible" ? "400–700 nm" : band.id === "euv" ? "12.4–121 nm" : "0.1–2.0 keV",
  lowerFrequencyHz: band.lowerFrequencyHz,
  upperFrequencyHz: band.upperFrequencyHz,
  energyRadianceUnit: "W m^-2 sr^-1" as const,
  photonRadianceUnit: "photons s^-1 m^-2 sr^-1" as const,
  syntheticExpectationUnit: "photons pixel^-1 exposure^-1" as const,
})));

function finite(values: readonly number[]): boolean { return values.every(Number.isFinite); }
function rowFor(rows: readonly KerrScienceBandContrastRowV348[], probe: KerrScienceImagePixelProbeArtifactV346, instrument: KerrScienceInstrumentResponseV332, rayIndex: 12 | 13 | 14 | 15, bandId: KerrThinDiskBandIdV320): KerrScienceBandObservationRowV350 {
  const source = rows.find((row) => row.rayIndex === rayIndex && row.numeratorBand === bandId) ?? rows.find((row) => row.rayIndex === rayIndex && row.denominatorBand === bandId);
  const probeCell = probe.cells.find((cell) => cell.rayIndex === rayIndex && cell.bandId === bandId);
  const instrumentRow = instrument.rows.find((row) => row.rayIndex === rayIndex && row.bandId === bandId);
  if (!source || !probeCell || !instrumentRow) throw new Error(`v350-band-observation-row:${rayIndex}:${bandId}`);
  return Object.freeze({
    rayIndex,
    spinA: source.spinA,
    bandId,
    ratioId: source.ratioId,
    energyRadianceWM2Sr: probeCell.observedEnergyRadianceWM2Sr,
    energyRadianceLowerWM2Sr: probeCell.lowerAuditEnvelopeWM2Sr,
    energyRadianceUpperWM2Sr: probeCell.upperAuditEnvelopeWM2Sr,
    syntheticExpectedPhotonsPerPixelExposure: instrumentRow.expectedPhotonsPerPixelExposure,
    syntheticEffectiveThroughput: instrumentRow.effectiveBandThroughput,
    instrumentQuadratureRelativeDifference: instrumentRow.quadratureRelativeDifference,
    energyRadianceAvailable: true,
    syntheticExpectationAvailable: true,
    measuredCountsAvailable: false,
    celestialWcs: "unavailable",
    solidAngleIntegratedFlux: "unavailable",
    spectralInference: "unavailable",
    provenance: { bandObservationArtifactSha256: "pending", bandContrastArtifactSha256: "pending", probeArtifactSha256: "pending", instrumentArtifactSha256: "pending", fullShortAuthoritySha256: "pending" },
  });
}

export function createKerrScienceBandObservationV350(bandContrast: KerrScienceBandContrastArtifactV348, probe: KerrScienceImagePixelProbeArtifactV346, instrument: KerrScienceInstrumentResponseV332, source: KerrScienceBandObservationArtifactV350["source"], artifactSha256 = "pending"): KerrScienceBandObservationArtifactV350 {
  if (bandContrast.status !== "qualified-detector-independent-and-synthetic-response-separated" || instrument.status !== "qualified-synthetic-reference-instrument-operator" || instrument.source.denseAggregateSha256 !== null || bandContrast.denseAggregateSha256 !== null) throw new Error("v350-band-observation-source-boundary");
  const rows = RAYS.flatMap((ray) => BAND_IDS.map((band) => rowFor(bandContrast.rows, probe, instrument, ray, band)));
  const patchedRows = rows.map((row) => Object.freeze({ ...row, provenance: { bandObservationArtifactSha256: null, bandContrastArtifactSha256: source.bandContrastArtifactSha256, probeArtifactSha256: bandContrast.source.probeArtifactSha256, instrumentArtifactSha256: source.instrumentArtifactSha256, fullShortAuthoritySha256: source.fullShortAuthoritySha256 } }));
  return Object.freeze({ version: KERR_SCIENCE_BAND_OBSERVATION_VERSION_V350, generatedAt: new Date().toISOString(), status: "qualified-read-only-band-observation-provenance", source, definitions: KERR_SCIENCE_BAND_OBSERVATION_DEFINITIONS_V350, availability: KERR_SCIENCE_BAND_OBSERVATION_AVAILABILITY_V350, units: { energyRadiance: "W m^-2 sr^-1", photonRadiance: "photons s^-1 m^-2 sr^-1", syntheticExpectation: "photons pixel^-1 exposure^-1" } as const, rows: Object.freeze(patchedRows), counts: { bandCount: 3, rayCount: 4, rowCount: 12 } as const, interpretation: "read-only-observation-layer-no-calibrated-counts-or-spectral-fit", scienceCinematicBoundary: "observation-layer-never-cinematic-color-input", denseCampaignStatus: "incomplete-0-of-49", denseAggregateSha256: null, browserQualification: "not-run", artifactSha256 });
}

export function parseKerrScienceBandObservationArtifactV350(value: unknown): KerrScienceBandObservationArtifactV350 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrScienceBandObservationArtifactV350> : null; const rows = source?.rows ?? []; const availability = source?.availability;
  if (!source || source.version !== KERR_SCIENCE_BAND_OBSERVATION_VERSION_V350 || source.status !== "qualified-read-only-band-observation-provenance" || source.source?.bandContrastPath !== "dist/science/kerr-band-contrast-v348/diagnostic.json" || source.source.instrumentPath !== "dist/science/kerr-science-instrument-response-v332/response-reference.json" || !SHA.test(source.source.bandContrastFileSha256) || !SHA.test(source.source.bandContrastArtifactSha256) || !SHA.test(source.source.instrumentFileSha256) || !SHA.test(source.source.instrumentArtifactSha256) || !SHA.test(source.source.fullShortAuthoritySha256) || source.definitions?.length !== 3 || source.definitions.some((band) => !BAND_IDS.includes(band.id) || !finite([band.lowerFrequencyHz, band.upperFrequencyHz]) || band.lowerFrequencyHz <= 0 || band.upperFrequencyHz <= band.lowerFrequencyHz) || availability?.measuredDetectorCounts !== "unavailable-synthetic-model-only" || availability.celestialWcs !== "unavailable-sparse-index-grid" || availability.solidAngleIntegratedFlux !== "unavailable-no-celestial-wcs" || source.units?.energyRadiance !== "W m^-2 sr^-1" || source.units.photonRadiance !== "photons s^-1 m^-2 sr^-1" || source.units.syntheticExpectation !== "photons pixel^-1 exposure^-1" || source.counts?.bandCount !== 3 || source.counts.rayCount !== 4 || source.counts.rowCount !== 12 || rows.length !== 12 || new Set(rows.map((row) => `${row.rayIndex}:${row.bandId}`)).size !== 12 || rows.some((row) => !RAYS.includes(row.rayIndex) || !BAND_IDS.includes(row.bandId) || !finite([row.spinA, row.energyRadianceWM2Sr, row.energyRadianceLowerWM2Sr, row.energyRadianceUpperWM2Sr, row.syntheticExpectedPhotonsPerPixelExposure, row.syntheticEffectiveThroughput, row.instrumentQuadratureRelativeDifference]) || row.energyRadianceWM2Sr <= 0 || row.energyRadianceLowerWM2Sr <= 0 || row.energyRadianceUpperWM2Sr < row.energyRadianceWM2Sr || row.measuredCountsAvailable !== false || row.celestialWcs !== "unavailable" || row.solidAngleIntegratedFlux !== "unavailable" || row.spectralInference !== "unavailable" || !SHA.test(row.provenance?.bandContrastArtifactSha256 ?? "") || !SHA.test(row.provenance?.probeArtifactSha256 ?? "") || !SHA.test(row.provenance?.instrumentArtifactSha256 ?? "") || !SHA.test(row.provenance?.fullShortAuthoritySha256 ?? "")) || source.interpretation !== "read-only-observation-layer-no-calibrated-counts-or-spectral-fit" || source.scienceCinematicBoundary !== "observation-layer-never-cinematic-color-input" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.denseAggregateSha256 !== null || source.browserQualification !== "not-run" || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v350-band-observation-artifact-identity");
  return value as KerrScienceBandObservationArtifactV350;
}
