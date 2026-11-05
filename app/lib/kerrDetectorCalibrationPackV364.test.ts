import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { analyzeKerrCalibrationConditionV364, parseKerrDetectorCalibrationPackV364, validateKerrCalibrationTablesV364, type KerrCalibrationNoiseRowV364, type KerrCalibrationThroughputRowV364 } from "./kerrDetectorCalibrationPackV364";

const SHA = "a".repeat(64);
function validTables() {
  const bands = ["visible", "euv", "soft-x-ray"] as const;
  const throughput: KerrCalibrationThroughputRowV364[] = bands.flatMap((bandId, bandIndex) => (
    Array.from({ length: 9 }, (_, node) => Array.from({ length: 3 }, (_, repeat) => ({
      bandId,
      wavelengthM: (bandIndex + 1) * 1e-8 + (node + 1) * 1e-10,
      throughput: 0.2 + node * 0.05,
      repeatIndex: (repeat + 1) as 1 | 2 | 3,
      detectorTemperatureK: 170,
      rawArtifactSha256: SHA,
    }))).flat()
  ));
  const noise: KerrCalibrationNoiseRowV364[] = [];
  const add = (kind: KerrCalibrationNoiseRowV364["kind"], count: number, exposureTimeS: number) => {
    for (let index = 0; index < count; index += 1) noise.push({ acquisitionId: `${kind}-${index}`, kind, bandId: kind === "background" ? bands[index % 3] : "all", exposureTimeS, detectorTemperatureK: 170 + (kind === "dark" ? index % 3 : 0), meanAdu: 100 + index, varianceAduSquared: 4 + index / 100, referenceElectrons: kind === "gain" ? (index + 1) * 1000 : null, rawArtifactSha256: SHA });
  };
  add("gain", 28, 1); add("bias", 32, 0); add("dark", 48, 10); add("background", 48, 10);
  return { throughput, noise };
}

describe("v364 empty calibration pack and validators", () => {
  it("ships only empty measurement templates and content-addressed plan files", () => {
    const artifact = parseKerrDetectorCalibrationPackV364(JSON.parse(readFileSync("dist/science/kerr-detector-calibration-pack-v364/pack.json", "utf8")));
    expect(artifact).toMatchObject({ counts: { fileCount: 5, emptyMeasurementTemplateCount: 3, acquisitionPlanTaskCount: 9, measuredDataRowCount: 0, validatorParameterCount: 7 }, measuredPerformanceClaimed: false, manifestAdmissionStatus: "not-attempted-empty-template-is-inadmissible", conditioningStatus: "unavailable-no-measured-jacobian-or-covariance" });
    const manifest = JSON.parse(readFileSync("dist/science/kerr-detector-calibration-pack-v364/manifest.template.json", "utf8"));
    expect(manifest).toMatchObject({ templateOnly: true, admissibleAsMeasured: false, measuredCalibration: null });
    expect(readFileSync("dist/science/kerr-detector-calibration-pack-v364/throughput.template.csv", "utf8").trim().split(/\r?\n/)).toHaveLength(1);
    expect(readFileSync("dist/science/kerr-detector-calibration-pack-v364/noise.template.csv", "utf8").trim().split(/\r?\n/)).toHaveLength(1);
  });

  it("validates complete three-band/repeat/noise table structure without granting authority", () => {
    const tables = validTables();
    expect(validateKerrCalibrationTablesV364(tables.throughput, tables.noise)).toMatchObject({ passed: true, failures: [], throughput: { rowCount: 81, bandCount: 3, wavelengthNodeCount: 27, repeatComplete: true }, noise: { rowCount: 156, gainCount: 28, biasCount: 32, darkCount: 48, backgroundCount: 48, acquisitionIdsUnique: true }, measuredAuthorityGranted: false });
    expect(validateKerrCalibrationTablesV364(tables.throughput.slice(1), tables.noise).passed).toBe(false);
    expect(validateKerrCalibrationTablesV364(tables.throughput, tables.noise.map((row, index) => index === 0 ? { ...row, rawArtifactSha256: "invalid" } : row)).failures).toContain("noise-row-invalid");
  });

  it("computes Fisher conditioning only when an explicit matrix is supplied", () => {
    const identity = Array.from({ length: 7 }, (_, row) => Array.from({ length: 7 }, (_, column) => row === column ? 1 : 0));
    const fixture = analyzeKerrCalibrationConditionV364({ jacobian: identity, observationVariance: Array(7).fill(1), sourceKind: "test-fixture" });
    expect(fixture).toMatchObject({ numericalRank: 7, conditionNumber: 1, fullRank: true, qualificationEligible: false, boundary: "fisher-conditioning-only-not-calibration-validation" });
    const singular = identity.map((row) => row.map((value, column) => column === 6 ? row[5] : value));
    expect(analyzeKerrCalibrationConditionV364({ jacobian: singular, observationVariance: Array(7).fill(1), sourceKind: "test-fixture" })).toMatchObject({ numericalRank: 6, conditionNumber: Number.POSITIVE_INFINITY, fullRank: false, qualificationEligible: false });
  });
});
