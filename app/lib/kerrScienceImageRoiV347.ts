import type { KerrScienceImageBandV346, KerrScienceImagePixelProbeArtifactV346, KerrScienceImageProbeCellV346 } from "./kerrScienceImagePixelProbeV346";

export const KERR_SCIENCE_IMAGE_ROI_VERSION_V347 = "v347-kerr-science-image-index-roi-v1" as const;
export type KerrScienceImageRoiSummaryV347 = Readonly<{
  version: typeof KERR_SCIENCE_IMAGE_ROI_VERSION_V347;
  roiId: `${KerrScienceImageBandV346}:r${12 | 13 | 14 | 15}-r${12 | 13 | 14 | 15}`;
  bandId: KerrScienceImageBandV346;
  rayStart: 12 | 13 | 14 | 15;
  rayEnd: 12 | 13 | 14 | 15;
  rayIndices: readonly (12 | 13 | 14 | 15)[];
  sampleCount: number;
  radianceSumWM2Sr: number;
  radianceLowerSumWM2Sr: number;
  radianceUpperSumWM2Sr: number;
  radianceMeanWM2Sr: number;
  radianceLowerMeanWM2Sr: number;
  radianceUpperMeanWM2Sr: number;
  conservativeLinearRelativeEnvelope: number;
  radianceWeightedRedshift: number;
  redshiftRange: readonly [number, number];
  maximumEvpaDifferenceDeg: number;
  meanScienceLinearDisplay01: number;
  summation: "neumaier-float64";
  uncertaintyCombination: "componentwise-linear-interval-no-independence-assumed";
  celestialWcs: "unavailable";
  sampleSolidAngleSr: null;
  apertureFlux: "unavailable-no-solid-angle-or-celestial-wcs";
  boundary: "single-band-contiguous-index-roi-not-aperture-photometry-not-dense-image";
}>;

export type KerrScienceImageRoiArtifactV347 = Readonly<{
  version: "v347-kerr-science-image-roi-artifact-v1";
  generatedAt: string;
  status: "qualified-deterministic-single-band-index-roi";
  source: Readonly<{ probePath: "dist/science/kerr-image-probe-v346/probe.json"; probeFileSha256: string; probeArtifactSha256: string; imageManifestSha256: string; fullShortAuthoritySha256: string }>;
  method: Readonly<{ summation: "neumaier-float64"; uncertaintyCombination: "componentwise-linear-interval-no-independence-assumed"; selection: "single-band-contiguous-ray-index"; celestialWcs: "unavailable"; sampleSolidAngleSr: null; apertureFlux: "unavailable-no-solid-angle-or-celestial-wcs" }>;
  counts: Readonly<{ bandCount: 3; rayCount: 4; roiCount: 30; maximumSamplesPerRoi: 4 }>;
  summaries: readonly KerrScienceImageRoiSummaryV347[];
  canonicalExport: Readonly<{ roiId: "visible:r12-r15"; jsonSha256: string; jsonBytes: number; csvSha256: string; csvBytes: number }>;
  maximumRelativeEnvelope: number;
  denseCampaignStatus: "incomplete-0-of-49";
  denseAggregateSha256: null;
  browserQualification: "not-run";
  boundary: "v346-twelve-cell-probe-to-thirty-index-rois-no-flux-claim-no-dense-authority";
  artifactSha256: string;
}>;

const BANDS = ["visible", "euv", "soft-x-ray"] as const;
const RAYS = [12, 13, 14, 15] as const;
const SHA = /^[a-f0-9]{64}$/;

function neumaier(values: readonly number[]): number {
  let sum = 0; let compensation = 0;
  for (const value of values) { const next = sum + value; compensation += Math.abs(sum) >= Math.abs(value) ? (sum - next) + value : (value - next) + sum; sum = next; }
  return sum + compensation;
}
function selectedCells(artifact: KerrScienceImagePixelProbeArtifactV346, bandId: KerrScienceImageBandV346, start: 12 | 13 | 14 | 15, end: 12 | 13 | 14 | 15): readonly KerrScienceImageProbeCellV346[] {
  const startIndex = RAYS.indexOf(start); const endIndex = RAYS.indexOf(end);
  if (!BANDS.includes(bandId) || startIndex < 0 || endIndex < startIndex) throw new Error("v347-roi-selection-invalid");
  const selectedRays = RAYS.slice(startIndex, endIndex + 1);
  const cells = selectedRays.map((ray) => artifact.cells.find((cell) => cell.bandId === bandId && cell.rayIndex === ray));
  if (cells.some((cell) => cell == null)) throw new Error("v347-roi-cell-missing");
  return cells as readonly KerrScienceImageProbeCellV346[];
}

export function summarizeKerrScienceImageRoiV347(artifact: KerrScienceImagePixelProbeArtifactV346, bandId: KerrScienceImageBandV346, start: 12 | 13 | 14 | 15, end: 12 | 13 | 14 | 15): KerrScienceImageRoiSummaryV347 {
  const cells = selectedCells(artifact, bandId, start, end); const count = cells.length;
  const sum = neumaier(cells.map((cell) => cell.observedEnergyRadianceWM2Sr)); const lower = neumaier(cells.map((cell) => cell.lowerAuditEnvelopeWM2Sr)); const upper = neumaier(cells.map((cell) => cell.upperAuditEnvelopeWM2Sr));
  const weightedRedshiftNumerator = neumaier(cells.map((cell) => cell.observedEnergyRadianceWM2Sr * cell.redshiftFactor)); const redshifts = cells.map((cell) => cell.redshiftFactor);
  if (![sum, lower, upper, weightedRedshiftNumerator].every(Number.isFinite) || sum <= 0 || lower > sum || sum > upper) throw new Error("v347-roi-conservation");
  return Object.freeze({ version: KERR_SCIENCE_IMAGE_ROI_VERSION_V347, roiId: `${bandId}:r${start}-r${end}`, bandId, rayStart: start, rayEnd: end, rayIndices: Object.freeze(cells.map((cell) => cell.rayIndex)), sampleCount: count, radianceSumWM2Sr: sum, radianceLowerSumWM2Sr: lower, radianceUpperSumWM2Sr: upper, radianceMeanWM2Sr: sum / count, radianceLowerMeanWM2Sr: lower / count, radianceUpperMeanWM2Sr: upper / count, conservativeLinearRelativeEnvelope: Math.max(sum - lower, upper - sum) / sum, radianceWeightedRedshift: weightedRedshiftNumerator / sum, redshiftRange: [Math.min(...redshifts), Math.max(...redshifts)] as const, maximumEvpaDifferenceDeg: Math.max(...cells.map((cell) => cell.evpaDifferenceDeg)), meanScienceLinearDisplay01: neumaier(cells.map((cell) => cell.scienceLinearDisplay01)) / count, summation: "neumaier-float64", uncertaintyCombination: "componentwise-linear-interval-no-independence-assumed", celestialWcs: "unavailable", sampleSolidAngleSr: null, apertureFlux: "unavailable-no-solid-angle-or-celestial-wcs", boundary: "single-band-contiguous-index-roi-not-aperture-photometry-not-dense-image" });
}

export function buildAllKerrScienceImageRoisV347(artifact: KerrScienceImagePixelProbeArtifactV346): readonly KerrScienceImageRoiSummaryV347[] {
  return Object.freeze(BANDS.flatMap((band) => RAYS.flatMap((start, startIndex) => RAYS.slice(startIndex).map((end) => summarizeKerrScienceImageRoiV347(artifact, band, start, end)))));
}

function finiteSummary(summary: KerrScienceImageRoiSummaryV347): boolean { return [summary.sampleCount, summary.radianceSumWM2Sr, summary.radianceLowerSumWM2Sr, summary.radianceUpperSumWM2Sr, summary.radianceMeanWM2Sr, summary.radianceLowerMeanWM2Sr, summary.radianceUpperMeanWM2Sr, summary.conservativeLinearRelativeEnvelope, summary.radianceWeightedRedshift, ...summary.redshiftRange, summary.maximumEvpaDifferenceDeg, summary.meanScienceLinearDisplay01].every(Number.isFinite); }
export function parseKerrScienceImageRoiArtifactV347(value: unknown): KerrScienceImageRoiArtifactV347 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrScienceImageRoiArtifactV347> : null; const summaries = source?.summaries ?? [];
  if (!source || source.version !== "v347-kerr-science-image-roi-artifact-v1" || source.status !== "qualified-deterministic-single-band-index-roi"
    || source.source?.probePath !== "dist/science/kerr-image-probe-v346/probe.json" || !SHA.test(source.source.probeFileSha256) || !SHA.test(source.source.probeArtifactSha256) || !SHA.test(source.source.imageManifestSha256) || !SHA.test(source.source.fullShortAuthoritySha256)
    || source.method?.summation !== "neumaier-float64" || source.method.uncertaintyCombination !== "componentwise-linear-interval-no-independence-assumed" || source.method.selection !== "single-band-contiguous-ray-index" || source.method.celestialWcs !== "unavailable" || source.method.sampleSolidAngleSr !== null || source.method.apertureFlux !== "unavailable-no-solid-angle-or-celestial-wcs"
    || source.counts?.bandCount !== 3 || source.counts.rayCount !== 4 || source.counts.roiCount !== 30 || source.counts.maximumSamplesPerRoi !== 4 || summaries.length !== 30 || new Set(summaries.map((summary) => summary.roiId)).size !== 30
    || summaries.some((summary) => !finiteSummary(summary) || summary.radianceLowerSumWM2Sr > summary.radianceSumWM2Sr || summary.radianceSumWM2Sr > summary.radianceUpperSumWM2Sr || summary.sampleCount !== summary.rayIndices.length || summary.celestialWcs !== "unavailable" || summary.apertureFlux !== "unavailable-no-solid-angle-or-celestial-wcs" || summary.uncertaintyCombination !== "componentwise-linear-interval-no-independence-assumed")
    || source.canonicalExport?.roiId !== "visible:r12-r15" || !SHA.test(source.canonicalExport.jsonSha256) || source.canonicalExport.jsonBytes <= 0 || !SHA.test(source.canonicalExport.csvSha256) || source.canonicalExport.csvBytes <= 0
    || !Number.isFinite(source.maximumRelativeEnvelope) || source.maximumRelativeEnvelope! <= 0 || source.denseCampaignStatus !== "incomplete-0-of-49" || source.denseAggregateSha256 !== null || source.browserQualification !== "not-run" || source.boundary !== "v346-twelve-cell-probe-to-thirty-index-rois-no-flux-claim-no-dense-authority" || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v347-roi-artifact-identity");
  return value as KerrScienceImageRoiArtifactV347;
}

export function serializeKerrScienceImageRoiJsonV347(summary: KerrScienceImageRoiSummaryV347, probeArtifactSha256: string): string {
  if (!SHA.test(probeArtifactSha256)) throw new Error("v347-roi-export-probe-sha");
  return `${JSON.stringify({ version: "v347-kerr-science-image-roi-export-v1", probeArtifactSha256, summary, provenance: { authority: "v312-geometry+v313-polarization", denseCampaignStatus: "incomplete-0-of-49", celestialWcs: "unavailable", apertureFlux: "unavailable-no-solid-angle-or-celestial-wcs" }, boundary: "sanitized-single-roi-portable-provenance-only" }, null, 2)}\n`;
}
export function serializeKerrScienceImageRoiCsvV347(summary: KerrScienceImageRoiSummaryV347, probeArtifactSha256: string): string {
  if (!SHA.test(probeArtifactSha256)) throw new Error("v347-roi-export-probe-sha");
  const headers = ["version", "probe_artifact_sha256", "roi_id", "band_id", "ray_start", "ray_end", "sample_count", "radiance_sum_w_m-2_sr-1", "radiance_lower_sum_w_m-2_sr-1", "radiance_upper_sum_w_m-2_sr-1", "radiance_mean_w_m-2_sr-1", "relative_envelope", "radiance_weighted_redshift", "redshift_min", "redshift_max", "maximum_evpa_difference_deg", "summation", "uncertainty_combination", "celestial_wcs", "aperture_flux", "dense_campaign_status"];
  const values: readonly (string | number)[] = [KERR_SCIENCE_IMAGE_ROI_VERSION_V347, probeArtifactSha256, summary.roiId, summary.bandId, summary.rayStart, summary.rayEnd, summary.sampleCount, summary.radianceSumWM2Sr, summary.radianceLowerSumWM2Sr, summary.radianceUpperSumWM2Sr, summary.radianceMeanWM2Sr, summary.conservativeLinearRelativeEnvelope, summary.radianceWeightedRedshift, summary.redshiftRange[0], summary.redshiftRange[1], summary.maximumEvpaDifferenceDeg, summary.summation, summary.uncertaintyCombination, summary.celestialWcs, summary.apertureFlux, "incomplete-0-of-49"];
  return `${headers.join(",")}\n${values.map((entry) => typeof entry === "number" ? String(entry) : JSON.stringify(entry)).join(",")}\n`;
}
