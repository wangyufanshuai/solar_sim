import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { compileDetectorCalibrationV365, parseDetectorCalibrationIdentityV365, parseDetectorCalibrationNoiseCsvV365, parseDetectorCalibrationProvenanceV365, parseDetectorCalibrationThroughputCsvV365 } from "./detectorCalibrationCompilerV365";

const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const RAW = "a".repeat(64);
const identityDocument = { version: "v365-detector-calibration-identity-v1", measuredAcquisition: true, instrument: { manufacturer: "Measured Detector Lab", model: "MDL-1", serialOrCampaignId: "campaign-2026-001" }, calibration: { performedAtUtc: "2026-07-29T00:00:00Z", laboratoryOrArchive: "Traceable Lab", detectorTemperatureK: 170, exposureTimeS: 120 }, attestation: { statement: "real-measured-detector-acquisition-not-synthetic-or-example", operatorOrArchive: "test-fixture-only", signedAtUtc: "2026-07-29T00:00:01Z" } } as const;
const identitySource = JSON.stringify(identityDocument);

function throughputCsv(): string {
  const rows = ["bandId,wavelengthM,throughput,repeatIndex,detectorTemperatureK,rawArtifactSha256"];
  const bands = ["visible", "euv", "soft-x-ray"] as const;
  for (let band = 0; band < bands.length; band += 1) for (let node = 0; node < 9; node += 1) for (let repeat = 1; repeat <= 3; repeat += 1) rows.push([bands[band], (band + 1) * 1e-8 + (node + 1) * 1e-10, 0.2 + band * 0.03 + node * 0.02 + (repeat - 2) * 0.001, repeat, 170, RAW].join(","));
  return `${rows.join("\n")}\n`;
}

function noiseCsv(): string {
  const rows = ["acquisitionId,kind,bandId,exposureTimeS,detectorTemperatureK,meanAdu,varianceAduSquared,referenceElectrons,rawArtifactSha256"];
  for (let level = 1; level <= 7; level += 1) for (let repeat = 0; repeat < 4; repeat += 1) rows.push([`gain-${level}-${repeat}`, "gain", "all", 1, 170, 100 + level * 500 + (repeat - 1.5) * 0.01, 4, level * 1000, RAW].join(","));
  for (let index = 0; index < 32; index += 1) rows.push([`bias-${index}`, "bias", "all", 0, 170, 100, 4, "", RAW].join(","));
  const temperatures = [169, 170, 171], exposures = [1, 2, 4, 8];
  for (const temperature of temperatures) for (const exposure of exposures) for (let repeat = 0; repeat < 4; repeat += 1) rows.push([`dark-${temperature}-${exposure}-${repeat}`, "dark", "all", exposure, temperature, 100 + 0.25 * exposure + (temperature - 170) * 0.05, 4, "", RAW].join(","));
  const bands = ["visible", "euv", "soft-x-ray"];
  for (const band of bands) for (const exposure of exposures) for (let repeat = 0; repeat < 4; repeat += 1) rows.push([`background-${band}-${exposure}-${repeat}`, "background", band, exposure, 170, 100 + (0.5 * exposure + 10) / 2, 4, "", RAW].join(","));
  return `${rows.join("\n")}\n`;
}

describe("v365 measured calibration compiler", () => {
  it("derives manifest units and repeat covariance but keeps test fixtures nonpublishable", () => {
    const throughputSource = throughputCsv(), noiseSource = noiseCsv();
    const provenanceDocument = { version: "v365-detector-calibration-provenance-v1", sourceUrl: "https://example.invalid/measured-calibration", licenseOrTerms: "test fixture only", identityFileSha256: sha(identitySource), throughputFileSha256: sha(throughputSource), noiseFileSha256: sha(noiseSource), processingParametersSha256: "b".repeat(64) } as const;
    const result = compileDetectorCalibrationV365({ identity: parseDetectorCalibrationIdentityV365(identityDocument), provenance: parseDetectorCalibrationProvenanceV365(provenanceDocument), throughputRows: parseDetectorCalibrationThroughputCsvV365(throughputSource), noiseRows: parseDetectorCalibrationNoiseCsvV365(noiseSource), sourceKind: "test-fixture", sourceFileSha256: { identity: sha(identitySource), throughput: sha(throughputSource), noise: sha(noiseSource) }, conditioningInput: { jacobian: Array.from({ length: 7 }, (_, row) => Array.from({ length: 7 }, (_, column) => row === column ? 1 : 0)), observationVariance: Array(7).fill(1) } });
    expect(result).toMatchObject({ status: "compiled-test-fixture-nonpublishable", manifestPublishable: false, measuredAuthorityGranted: false, independentScientificValidation: "pending", derived: { operatingTemperatureK: 170 }, throughput: { bandCount: 3, wavelengthNodeCount: 27, repeatCountPerNode: 3 }, conditioning: { numericalRank: 7, fullRank: true, qualificationEligible: false } });
    expect(result.derived.gainElectronPerAdu).toBeCloseTo(2, 8);
    expect(result.derived.readNoiseRmsElectronPerPixelRead).toBeCloseTo(4, 8);
    expect(result.derived.darkCurrentElectronPerPixelSecond).toBeCloseTo(0.5, 8);
    expect(result.derived.backgroundElectronPerPixelExposure).toBeCloseTo(10, 8);
    expect(result.manifest.response.bands).toHaveLength(3); expect(result.manifest.response.bands.every((band) => band.points.length === 9)).toBe(true); expect(result.throughput.bandMeanCovariance).toHaveLength(3); expect(result.manifestCanonicalSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("fails closed on CSV shape, attestation, SHA and incomplete reference-electron data", () => {
    expect(() => parseDetectorCalibrationThroughputCsvV365("bad,header\n1,2\n")).toThrow("v365-csv-shape");
    expect(() => parseDetectorCalibrationIdentityV365({ ...identityDocument, measuredAcquisition: false })).toThrow("v365-identity-boundary");
    const throughputSource = throughputCsv(), noiseSource = noiseCsv(); const provenance = parseDetectorCalibrationProvenanceV365({ version: "v365-detector-calibration-provenance-v1", sourceUrl: "https://example.invalid/source", licenseOrTerms: "fixture", identityFileSha256: sha(identitySource), throughputFileSha256: sha(throughputSource), noiseFileSha256: sha(noiseSource), processingParametersSha256: "b".repeat(64) });
    expect(() => compileDetectorCalibrationV365({ identity: parseDetectorCalibrationIdentityV365(identityDocument), provenance, throughputRows: parseDetectorCalibrationThroughputCsvV365(throughputSource), noiseRows: parseDetectorCalibrationNoiseCsvV365(noiseSource), sourceKind: "test-fixture", sourceFileSha256: { identity: "c".repeat(64), throughput: sha(throughputSource), noise: sha(noiseSource) } })).toThrow("v365-source-file-sha");
    const noise = parseDetectorCalibrationNoiseCsvV365(noiseSource); expect(() => compileDetectorCalibrationV365({ identity: parseDetectorCalibrationIdentityV365(identityDocument), provenance, throughputRows: parseDetectorCalibrationThroughputCsvV365(throughputSource), noiseRows: noise.map((row, index) => index === 0 ? { ...row, referenceElectrons: null } : row), sourceKind: "test-fixture", sourceFileSha256: { identity: sha(identitySource), throughput: sha(throughputSource), noise: sha(noiseSource) } })).toThrow(/v365-table/);
  });
});
