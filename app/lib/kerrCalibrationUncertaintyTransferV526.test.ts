import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrCalibrationUncertaintyTransferV526,
  compareKerrCalibrationUncertaintyHudEncodingsV526,
  createKerrCalibrationUncertaintyHudEncodingV526,
  createKerrCalibrationUncertaintyTransferSummaryV526,
  parseKerrCalibrationUncertaintyTransferArtifactV526,
  resolveKerrCalibrationUncertaintyHudProfileV526,
} from "./kerrCalibrationUncertaintyTransferV526";

const artifact = parseKerrCalibrationUncertaintyTransferArtifactV526(JSON.parse(readFileSync(
  "dist/science/kerr-calibration-uncertainty-transfer-v526/transfer.json",
  "utf8",
)));
describe("v526 calibration uncertainty transfer and V7.5 HUD", () => {
  it("has canonical 80-digit transfer identity", () => {
    expect(createHash("sha256").update(canonicalKerrCalibrationUncertaintyTransferV526(artifact)).digest("hex")).toBe(artifact.artifactSha256);
    expect(artifact.counts).toMatchObject({ inputChannelCount: 6, outputParameterCount: 6, observableParameterCount: 2, unitBoxVertexCount: 64 });
  });
  it("decomposes unit variance into equal science and calibration coefficients", () => {
    expect(artifact.unitVarianceTransfer.varianceRows).toEqual([
      { parameterId: "Q-over-I", scienceCoefficient: "0.5", calibrationCoefficient: "0.5", totalCoefficient: "1.0", physicalVarianceAvailable: false },
      { parameterId: "U-over-I", scienceCoefficient: "0.5", calibrationCoefficient: "0.5", totalCoefficient: "1.0", physicalVarianceAvailable: false },
    ]);
  });
  it("matches the 64-vertex worst-case oracle without claiming physical errors", () => {
    expect(Number(artifact.boundedUnitErrorTransfer.maximumQOverIAbsoluteCoefficient)).toBeCloseTo(1 + 2 ** -0.5, 14);
    expect(Number(artifact.boundedUnitErrorTransfer.maximumJointL2Coefficient)).toBeCloseTo(1 + 2 ** 0.5, 14);
    expect(artifact.boundedUnitErrorTransfer.physicalErrorBoundAvailable).toBe(false);
    expect(artifact.qualification.physicalUncertaintyQualified).toBe(false);
  });
  it("keeps V7.5 scientific rows stable across modes", () => {
    const summary = createKerrCalibrationUncertaintyTransferSummaryV526(artifact);
    const science = createKerrCalibrationUncertaintyHudEncodingV526(summary, "science");
    const cinematic = createKerrCalibrationUncertaintyHudEncodingV526(summary, "cinematic");
    expect(compareKerrCalibrationUncertaintyHudEncodingsV526(science, cinematic)).toMatchObject({ scientificPayloadStable: true, scientificRowsStable: true, numericScientificStyleInputCount: 0 });
    expect(resolveKerrCalibrationUncertaintyHudProfileV526("science")).toBe(resolveKerrCalibrationUncertaintyHudProfileV526("science"));
  });
});
