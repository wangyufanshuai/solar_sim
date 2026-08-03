import { createHash } from "node:crypto";
import { parseDetectorCalibrationManifestV361, type DetectorCalibrationManifestV361 } from "./detectorCalibrationAdmissionV361";
import { analyzeKerrCalibrationConditionV364, validateKerrCalibrationTablesV364, type KerrCalibrationConditionAnalysisV364, type KerrCalibrationNoiseRowV364, type KerrCalibrationThroughputRowV364 } from "./kerrDetectorCalibrationPackV364";

export const DETECTOR_CALIBRATION_COMPILER_VERSION_V365 = "v365-measured-detector-calibration-compiler-v1" as const;

export type DetectorCalibrationIdentityV365 = Readonly<{
  version: "v365-detector-calibration-identity-v1";
  measuredAcquisition: true;
  instrument: Readonly<{ manufacturer: string; model: string; serialOrCampaignId: string }>;
  calibration: Readonly<{ performedAtUtc: string; laboratoryOrArchive: string; detectorTemperatureK: number; exposureTimeS: number }>;
  attestation: Readonly<{ statement: "real-measured-detector-acquisition-not-synthetic-or-example"; operatorOrArchive: string; signedAtUtc: string }>;
}>;

export type DetectorCalibrationProvenanceV365 = Readonly<{
  version: "v365-detector-calibration-provenance-v1";
  sourceUrl: string;
  licenseOrTerms: string;
  identityFileSha256: string;
  throughputFileSha256: string;
  noiseFileSha256: string;
  processingParametersSha256: string;
}>;

export type DetectorCalibrationCompilationResultV365 = Readonly<{
  version: typeof DETECTOR_CALIBRATION_COMPILER_VERSION_V365;
  status: "compiled-test-fixture-nonpublishable" | "compiled-measured-manifest-awaiting-independent-validation";
  sourceKind: "test-fixture" | "measured-import";
  manifest: DetectorCalibrationManifestV361;
  manifestCanonicalSha256: string;
  derived: Readonly<{ gainElectronPerAdu: number; readNoiseRmsElectronPerPixelRead: number; darkCurrentElectronPerPixelSecond: number; backgroundElectronPerPixelExposure: number; operatingTemperatureK: number }>;
  throughput: Readonly<{ bandCount: 3; wavelengthNodeCount: 27; repeatCountPerNode: 3; covarianceBandOrder: readonly ["visible", "euv", "soft-x-ray"]; bandMeanCovariance: readonly (readonly number[])[] }>;
  tableValidation: ReturnType<typeof validateKerrCalibrationTablesV364>;
  conditioning: KerrCalibrationConditionAnalysisV364 | "unavailable-no-measured-jacobian-or-covariance";
  manifestPublishable: boolean;
  measuredAuthorityGranted: false;
  independentScientificValidation: "pending";
  boundary: "compiler-does-not-grant-measured-authority-or-science-qualification";
}>;

const SHA = /^[a-f0-9]{64}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const BANDS = ["visible", "euv", "soft-x-ray"] as const;
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));

function parseCsv(source: string, expectedHeader: readonly string[]): string[][] {
  if (Buffer.byteLength(source, "utf8") > 2 * 1024 * 1024 || source.includes("\0")) throw new Error("v365-csv-size-or-nul");
  const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"' && field.length === 0) quoted = true;
    else if (character === ",") { row.push(field); field = ""; }
    else if (character === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += character;
  }
  if (quoted) throw new Error("v365-csv-quote");
  if (field.length > 0 || row.length > 0) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  while (rows.length > 0 && rows[rows.length - 1].every((entry) => entry.length === 0)) rows.pop();
  if (rows.length < 2 || rows.length > 4097 || rows[0].length !== expectedHeader.length || rows[0].some((entry, index) => entry !== expectedHeader[index]) || rows.slice(1).some((entry) => entry.length !== expectedHeader.length)) throw new Error("v365-csv-shape");
  return rows.slice(1);
}

function number(value: string, label: string): number {
  if (value.trim() === "" || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim())) throw new Error(`v365-number:${label}`);
  const parsed = Number(value); if (!Number.isFinite(parsed)) throw new Error(`v365-number:${label}`); return parsed;
}

export function parseDetectorCalibrationThroughputCsvV365(source: string): KerrCalibrationThroughputRowV364[] {
  return parseCsv(source, ["bandId", "wavelengthM", "throughput", "repeatIndex", "detectorTemperatureK", "rawArtifactSha256"]).map((row) => ({ bandId: row[0] as KerrCalibrationThroughputRowV364["bandId"], wavelengthM: number(row[1], "wavelength"), throughput: number(row[2], "throughput"), repeatIndex: number(row[3], "repeat") as 1 | 2 | 3, detectorTemperatureK: number(row[4], "temperature"), rawArtifactSha256: row[5] }));
}

export function parseDetectorCalibrationNoiseCsvV365(source: string): KerrCalibrationNoiseRowV364[] {
  return parseCsv(source, ["acquisitionId", "kind", "bandId", "exposureTimeS", "detectorTemperatureK", "meanAdu", "varianceAduSquared", "referenceElectrons", "rawArtifactSha256"]).map((row) => ({ acquisitionId: row[0], kind: row[1] as KerrCalibrationNoiseRowV364["kind"], bandId: row[2] as KerrCalibrationNoiseRowV364["bandId"], exposureTimeS: number(row[3], "exposure"), detectorTemperatureK: number(row[4], "temperature"), meanAdu: number(row[5], "mean-adu"), varianceAduSquared: number(row[6], "variance-adu"), referenceElectrons: row[7] === "" ? null : number(row[7], "reference-electrons"), rawArtifactSha256: row[8] }));
}

function object(value: unknown): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v365-object"); return value as Record<string, unknown>; }
function text(value: unknown, label: string): string { if (typeof value !== "string" || value.trim().length < 1) throw new Error(`v365-text:${label}`); return value.trim(); }

export function parseDetectorCalibrationIdentityV365(value: unknown): DetectorCalibrationIdentityV365 {
  const source = object(value); const instrument = object(source.instrument); const calibration = object(source.calibration); const attestation = object(source.attestation);
  if (source.version !== "v365-detector-calibration-identity-v1" || source.measuredAcquisition !== true || attestation.statement !== "real-measured-detector-acquisition-not-synthetic-or-example") throw new Error("v365-identity-boundary");
  if (!ISO.test(String(calibration.performedAtUtc ?? "")) || !ISO.test(String(attestation.signedAtUtc ?? "")) || !(Number(calibration.detectorTemperatureK) > 0) || !(Number(calibration.exposureTimeS) > 0)) throw new Error("v365-identity-time-units");
  text(instrument.manufacturer, "manufacturer"); text(instrument.model, "model"); text(instrument.serialOrCampaignId, "serial"); text(calibration.laboratoryOrArchive, "lab"); text(attestation.operatorOrArchive, "operator");
  return value as DetectorCalibrationIdentityV365;
}

export function parseDetectorCalibrationProvenanceV365(value: unknown): DetectorCalibrationProvenanceV365 {
  const source = object(value);
  if (source.version !== "v365-detector-calibration-provenance-v1" || !/^https:\/\//.test(String(source.sourceUrl ?? "")) || !text(source.licenseOrTerms, "terms") || ![source.identityFileSha256, source.throughputFileSha256, source.noiseFileSha256, source.processingParametersSha256].every((entry) => typeof entry === "string" && SHA.test(entry))) throw new Error("v365-provenance");
  return value as DetectorCalibrationProvenanceV365;
}

function mean(values: readonly number[]): number { return values.reduce((sum, value) => sum + value, 0) / values.length; }
function slope(points: readonly Readonly<{ x: number; y: number }>[]): number { const x = mean(points.map((point) => point.x)); const y = mean(points.map((point) => point.y)); const denominator = points.reduce((sum, point) => sum + (point.x - x) ** 2, 0); if (!(denominator > 0)) throw new Error("v365-regression-degenerate"); return points.reduce((sum, point) => sum + (point.x - x) * (point.y - y), 0) / denominator; }

export function compileDetectorCalibrationV365(args: {
  identity: DetectorCalibrationIdentityV365;
  provenance: DetectorCalibrationProvenanceV365;
  throughputRows: readonly KerrCalibrationThroughputRowV364[];
  noiseRows: readonly KerrCalibrationNoiseRowV364[];
  sourceKind: "test-fixture" | "measured-import";
  sourceFileSha256: Readonly<{ identity: string; throughput: string; noise: string }>;
  conditioningInput?: Readonly<{ jacobian: readonly (readonly number[])[]; observationVariance: readonly number[] }>;
}): DetectorCalibrationCompilationResultV365 {
  parseDetectorCalibrationIdentityV365(args.identity); parseDetectorCalibrationProvenanceV365(args.provenance);
  if (args.provenance.identityFileSha256 !== args.sourceFileSha256.identity || args.provenance.throughputFileSha256 !== args.sourceFileSha256.throughput || args.provenance.noiseFileSha256 !== args.sourceFileSha256.noise) throw new Error("v365-source-file-sha");
  const tableValidation = validateKerrCalibrationTablesV364(args.throughputRows, args.noiseRows); if (!tableValidation.passed) throw new Error(`v365-table:${tableValidation.failures.join(",")}`);
  const gainRows = args.noiseRows.filter((row) => row.kind === "gain"); const gain = slope(gainRows.map((row) => ({ x: row.meanAdu, y: Number(row.referenceElectrons) })));
  if (!(gain > 0)) throw new Error("v365-gain");
  const biasRows = args.noiseRows.filter((row) => row.kind === "bias"); const biasMean = mean(biasRows.map((row) => row.meanAdu)); const readNoise = Math.sqrt(mean(biasRows.map((row) => row.varianceAduSquared))) * gain;
  const darkRows = args.noiseRows.filter((row) => row.kind === "dark" && Math.abs(row.detectorTemperatureK - args.identity.calibration.detectorTemperatureK) <= 0.25);
  if (new Set(darkRows.map((row) => row.exposureTimeS)).size < 4) throw new Error("v365-dark-operating-temperature-coverage");
  const darkCurrent = slope(darkRows.map((row) => ({ x: row.exposureTimeS, y: (row.meanAdu - biasMean) * gain })));
  if (!(darkCurrent >= 0)) throw new Error("v365-dark-current");
  const backgroundRows = args.noiseRows.filter((row) => row.kind === "background"); const background = mean(backgroundRows.map((row) => (row.meanAdu - biasMean) * gain - darkCurrent * row.exposureTimeS));
  if (!(background >= 0)) throw new Error("v365-background");
  const bands = BANDS.map((bandId) => {
    const rows = args.throughputRows.filter((row) => row.bandId === bandId); const wavelengths = [...new Set(rows.map((row) => row.wavelengthM))].sort((left, right) => left - right);
    return { bandId, wavelengthUnit: "m" as const, throughputUnit: "dimensionless" as const, points: wavelengths.map((wavelengthM) => ({ wavelengthM, throughput: mean(rows.filter((row) => row.wavelengthM === wavelengthM).map((row) => row.throughput)) })) };
  });
  const repeatMeans = [1, 2, 3].map((repeatIndex) => BANDS.map((bandId) => mean(args.throughputRows.filter((row) => row.bandId === bandId && row.repeatIndex === repeatIndex).map((row) => row.throughput))));
  const bandMeans = BANDS.map((_, band) => mean(repeatMeans.map((row) => row[band])));
  const covariance = BANDS.map((_, left) => BANDS.map((__, right) => repeatMeans.reduce((sum, row) => sum + (row[left] - bandMeans[left]) * (row[right] - bandMeans[right]), 0) / 2));
  const normalizedPayload = { bands, gain, readNoise, darkCurrent, background, covariance };
  const normalizedArtifactSha256 = sha(JSON.stringify(canonicalize(normalizedPayload))); const rawBundleSha256 = sha([args.sourceFileSha256.identity, args.sourceFileSha256.throughput, args.sourceFileSha256.noise].join(":"));
  const manifest = parseDetectorCalibrationManifestV361({ version: "v361-measured-detector-calibration-manifest-v1", measuredCalibration: true, instrument: args.identity.instrument, calibration: args.identity.calibration, response: { bands }, noise: { readNoiseRmsUnit: "electron/pixel/read", readNoiseRms: readNoise, darkCurrentUnit: "electron/pixel/s", darkCurrent, gainUnit: "electron/adu", gain, backgroundUnit: "electron/pixel/exposure", background }, provenance: { sourceUrl: args.provenance.sourceUrl, licenseOrTerms: args.provenance.licenseOrTerms, rawArtifactSha256: rawBundleSha256, normalizedArtifactSha256, processingParametersSha256: args.provenance.processingParametersSha256 } });
  const manifestCanonicalSha256 = sha(JSON.stringify(canonicalize(manifest)));
  const conditioning = args.conditioningInput ? analyzeKerrCalibrationConditionV364({ ...args.conditioningInput, sourceKind: args.sourceKind === "measured-import" ? "measured" : "test-fixture" }) : "unavailable-no-measured-jacobian-or-covariance";
  return Object.freeze({ version: DETECTOR_CALIBRATION_COMPILER_VERSION_V365, status: args.sourceKind === "measured-import" ? "compiled-measured-manifest-awaiting-independent-validation" : "compiled-test-fixture-nonpublishable", sourceKind: args.sourceKind, manifest, manifestCanonicalSha256, derived: Object.freeze({ gainElectronPerAdu: gain, readNoiseRmsElectronPerPixelRead: readNoise, darkCurrentElectronPerPixelSecond: darkCurrent, backgroundElectronPerPixelExposure: background, operatingTemperatureK: args.identity.calibration.detectorTemperatureK }), throughput: Object.freeze({ bandCount: 3 as const, wavelengthNodeCount: 27 as const, repeatCountPerNode: 3 as const, covarianceBandOrder: BANDS, bandMeanCovariance: Object.freeze(covariance.map((row) => Object.freeze(row))) }), tableValidation, conditioning, manifestPublishable: args.sourceKind === "measured-import", measuredAuthorityGranted: false, independentScientificValidation: "pending", boundary: "compiler-does-not-grant-measured-authority-or-science-qualification" });
}
