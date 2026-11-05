import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { compileDetectorCalibrationV365, parseDetectorCalibrationIdentityV365, parseDetectorCalibrationNoiseCsvV365, parseDetectorCalibrationProvenanceV365, parseDetectorCalibrationThroughputCsvV365 } from "./detectorCalibrationCompilerV365";
import { validateDetectorCalibrationIndependentlyV366 } from "./detectorCalibrationValidationV366";

const sha = (value: string) => createHash("sha256").update(value).digest("hex"), RAW = "a".repeat(64);
function fixture() {
  const identityDocument = { version: "v365-detector-calibration-identity-v1", measuredAcquisition: true, instrument: { manufacturer: "Fixture", model: "Fixture", serialOrCampaignId: "fixture-only" }, calibration: { performedAtUtc: "2026-07-29T00:00:00Z", laboratoryOrArchive: "Fixture", detectorTemperatureK: 170, exposureTimeS: 120 }, attestation: { statement: "real-measured-detector-acquisition-not-synthetic-or-example", operatorOrArchive: "test-fixture-only", signedAtUtc: "2026-07-29T00:00:01Z" } } as const, identitySource = JSON.stringify(identityDocument);
  const throughputLines = ["bandId,wavelengthM,throughput,repeatIndex,detectorTemperatureK,rawArtifactSha256"], bands = ["visible", "euv", "soft-x-ray"] as const;
  for (let band = 0; band < 3; band += 1) for (let node = 0; node < 9; node += 1) for (let repeat = 1; repeat <= 3; repeat += 1) throughputLines.push([bands[band], (band + 1) * 1e-8 + (node + 1) * 1e-10, 0.2 + band * 0.03 + node * 0.02 + (repeat - 2) * 0.001, repeat, 170, RAW].join(","));
  const noiseLines = ["acquisitionId,kind,bandId,exposureTimeS,detectorTemperatureK,meanAdu,varianceAduSquared,referenceElectrons,rawArtifactSha256"];
  for (let level = 1; level <= 7; level += 1) for (let repeat = 0; repeat < 4; repeat += 1) noiseLines.push([`gain-${level}-${repeat}`, "gain", "all", 1, 170, 100 + level * 500 + (repeat - 1.5) * 0.01, 4, level * 1000, RAW].join(","));
  for (let index = 0; index < 32; index += 1) noiseLines.push([`bias-${index}`, "bias", "all", 0, 170, 100, 4, "", RAW].join(","));
  for (const temperature of [169, 170, 171]) for (const exposure of [1, 2, 4, 8]) for (let repeat = 0; repeat < 4; repeat += 1) noiseLines.push([`dark-${temperature}-${exposure}-${repeat}`, "dark", "all", exposure, temperature, 100 + 0.25 * exposure + (temperature - 170) * 0.05, 4, "", RAW].join(","));
  for (const band of bands) for (const exposure of [1, 2, 4, 8]) for (let repeat = 0; repeat < 4; repeat += 1) noiseLines.push([`background-${band}-${exposure}-${repeat}`, "background", band, exposure, 170, 100 + (0.5 * exposure + 10) / 2, 4, "", RAW].join(","));
  const throughputSource = `${throughputLines.join("\n")}\n`, noiseSource = `${noiseLines.join("\n")}\n`, provenance = parseDetectorCalibrationProvenanceV365({ version: "v365-detector-calibration-provenance-v1", sourceUrl: "https://example.invalid/fixture", licenseOrTerms: "test fixture", identityFileSha256: sha(identitySource), throughputFileSha256: sha(throughputSource), noiseFileSha256: sha(noiseSource), processingParametersSha256: "b".repeat(64) }), identity = parseDetectorCalibrationIdentityV365(identityDocument), throughputRows = parseDetectorCalibrationThroughputCsvV365(throughputSource), noiseRows = parseDetectorCalibrationNoiseCsvV365(noiseSource);
  const compilation = compileDetectorCalibrationV365({ identity, provenance, throughputRows, noiseRows, sourceKind: "test-fixture", sourceFileSha256: { identity: sha(identitySource), throughput: sha(throughputSource), noise: sha(noiseSource) } });
  return { compilation, throughputRows, noiseRows };
}

describe("v366 independent calibration validation", () => {
  it("independently closes residual, covariance and conditioning gates for a nonpublishable fixture", () => {
    const { compilation, throughputRows, noiseRows } = fixture(); const identity = Array.from({ length: 7 }, (_, row) => Array.from({ length: 7 }, (_, column) => row === column ? 1 : 0));
    const result = validateDetectorCalibrationIndependentlyV366({ manifest: compilation.manifest, throughputRows, noiseRows, sourceKind: "test-fixture", compilerStatus: compilation.status, conditioningInput: { jacobian: identity, observationVariance: Array(7).fill(1) } });
    expect(result).toMatchObject({ status: "qualified-test-fixture-only", passed: true, measuredValidationQualified: false, measuredAuthorityGranted: false, independentFromCompilerDerivations: true, metrics: { covariancePositiveSemidefinite: true, conditioningRank: 7, conditionNumber: 1 }, failures: [] });
    expect(result.metrics.gainStandardizedResidualMaximum).toBeLessThan(5); expect(result.metrics.darkStandardizedResidualMaximum).toBeLessThan(5); expect(result.metrics.throughputRepeatCoefficientOfVariationMaximum).toBeLessThan(0.02); expect(result.metrics.derivedReconstructionRelativeDifferenceMaximum).toBeLessThan(1e-8);
  });

  it("blocks missing conditioning, compiler/source mismatch and reconstructed manifest drift", () => {
    const { compilation, throughputRows, noiseRows } = fixture();
    expect(validateDetectorCalibrationIndependentlyV366({ manifest: compilation.manifest, throughputRows, noiseRows, sourceKind: "test-fixture", compilerStatus: compilation.status })).toMatchObject({ status: "blocked-conditioning-input-unavailable", passed: false, measuredAuthorityGranted: false });
    expect(() => validateDetectorCalibrationIndependentlyV366({ manifest: compilation.manifest, throughputRows, noiseRows, sourceKind: "measured-import", compilerStatus: compilation.status })).toThrow("v366-compiler-source-kind-boundary");
    const identity = Array.from({ length: 7 }, (_, row) => Array.from({ length: 7 }, (_, column) => row === column ? 1 : 0)); const drifted = { ...compilation.manifest, noise: { ...compilation.manifest.noise, gain: compilation.manifest.noise.gain * 1.01 } };
    expect(validateDetectorCalibrationIndependentlyV366({ manifest: drifted, throughputRows, noiseRows, sourceKind: "test-fixture", compilerStatus: compilation.status, conditioningInput: { jacobian: identity, observationVariance: Array(7).fill(1) } })).toMatchObject({ status: "validation-failed", passed: false, failures: expect.arrayContaining(["derived-reconstruction"]), measuredAuthorityGranted: false });
  });
});
