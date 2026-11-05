import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalShaV424,
  createKerrPredictedPolarimeterSummaryV424,
  createKerrPredictedPolarimeterViewV424,
  parseKerrPredictedPolarimeterArtifactV424,
  serializeKerrPredictedPolarimeterCsvV424,
} from "./kerrPredictedPolarimeterV424";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
describe("v424 ideal-model predicted polarimeter", () => {
  it("independently modulates all 24 v423 predictions into four HWP states and two nonnegative beams", () => {
    const view = createKerrPredictedPolarimeterViewV424(
      read("dist/science/kerr-predicted-stokes-admission-v423/predicted-stokes-catalog.json"),
      read("dist/science/kerr-ideal-polarimeter-v410/ideal-dual-beam.json"),
      read("dist/science/kerr-predicted-polarimeter-v424/python-modulation-oracle.json"),
    );
    expect(view.counts).toMatchObject({ sourcePredictionCount: 24, modulationRowCount: 96, predictedBeamSpectralRadianceCount: 192, reconstructionCount: 24, measuredRowCount: 0, photonCount: 0, electronCount: 0 });
    for (const row of view.modulationRows) {
      expect(row.predictedOrdinarySpectralRadiance).toBeGreaterThanOrEqual(0);
      expect(row.predictedExtraordinarySpectralRadiance).toBeGreaterThanOrEqual(0);
      expect(row.provenance).toMatchObject({ predictionNotMeasurement: true, photonOrElectronCountsProduced: false, measuredMuellerCalibrationApplied: false });
    }
    expect(view.maxima.pythonOracleDifference).toBe(0);
  });
  it("reconstructs I/Q/U while refusing measurement, detector, counts, pixel and dense authority", () => {
    const artifact = parseKerrPredictedPolarimeterArtifactV424(read("dist/science/kerr-predicted-polarimeter-v424/predicted-ideal-dual-beam.json"));
    expect(canonicalShaV424(artifact)).toBe(artifact.artifactSha256);
    expect(artifact.view.qualification).toMatchObject({ idealModelModulationQualified: true, fourAngleReconstructionQualified: true, wpAndKsPathsPreserved: true, measuredPolarimeterQualified: false, photonOrElectronCountsQualified: false, denseAuthorityQualified: false });
    const summary = createKerrPredictedPolarimeterSummaryV424(artifact);
    expect(summary.referenceModulationRows).toHaveLength(16);
    expect(summary.representativeReconstructions).toHaveLength(8);
    expect(summary).not.toHaveProperty("modulationRows");
    expect(serializeKerrPredictedPolarimeterCsvV424(artifact.view)).toContain("model_prediction,measurement_authority,photon_counts_available");
  });
});
