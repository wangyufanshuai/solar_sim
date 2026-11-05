import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseDetectorCalibrationInspectArtifactV361 } from "./detectorCalibrationAdmissionV361";
import { parseKerrDetectorBreakEvenArtifactV360 } from "./kerrDetectorBreakEvenV360";
import { createKerrDetectorCalibrationPlanV363, parseKerrDetectorCalibrationPlanV363 } from "./kerrDetectorCalibrationPlanV363";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const fileSha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
const breakEvenPath = "dist/science/kerr-detector-break-even-v360/audit.json";
const inspectPath = "dist/science/detector-calibration-v361/inspect.json";

describe("v363 detector calibration acquisition plan", () => {
  it("covers every missing input and proves structural rank without inventing measurements", () => {
    const breakEven = parseKerrDetectorBreakEvenArtifactV360(read(breakEvenPath));
    const inspect = parseDetectorCalibrationInspectArtifactV361(read(inspectPath));
    const plan = createKerrDetectorCalibrationPlanV363(breakEven, inspect, { breakEvenPath, breakEvenFileSha256: fileSha(breakEvenPath), breakEvenArtifactSha256: breakEven.artifactSha256, calibrationInspectPath: inspectPath, calibrationInspectFileSha256: fileSha(inspectPath), calibrationInspectArtifactSha256: inspect.artifactSha256 }, "a".repeat(64));
    expect(parseKerrDetectorCalibrationPlanV363(plan)).toMatchObject({
      counts: { sourceRowCount: 12, bandCount: 3, missingRequirementCount: 11, acquisitionTaskCount: 9, quantitativeTaskCount: 7, parameterCount: 7 },
      identifiability: { rank: 7, fullColumnRank: true, authority: "structural-binary-design-only-numerical-conditioning-awaits-measurements" },
      measuredCalibrationAuthority: "blocked-input-unavailable-v361",
      measuredPerformanceClaimed: false,
      taskExecutionStatus: "not-run-plan-only",
      attemptConsumed: false,
      networkAttempted: false,
      denseCampaignStatus: "incomplete-0-of-49",
    });
    expect(plan.requirementCoverage.every((entry) => entry.covered && entry.taskIds.length > 0)).toBe(true);
    expect(plan.bandPressure.slice().sort((left, right) => left.priorityRank - right.priorityRank).map((entry) => entry.bandId)).toEqual(["euv", "soft-x-ray", "visible"]);
    expect(plan.bandPressure.every((entry) => entry.interpretation === "synthetic-planning-pressure-not-measured-detector-performance")).toBe(true);
  });

  it("fails closed on missing coverage, false measured claims or dense promotion", () => {
    const artifact = read("dist/science/kerr-detector-calibration-plan-v363/plan.json");
    expect(() => parseKerrDetectorCalibrationPlanV363({ ...artifact, measuredPerformanceClaimed: true })).toThrow("v363-calibration-plan-identity");
    expect(() => parseKerrDetectorCalibrationPlanV363({ ...artifact, denseCampaignStatus: "complete-49-of-49" })).toThrow("v363-calibration-plan-identity");
    expect(() => parseKerrDetectorCalibrationPlanV363({ ...artifact, requirementCoverage: artifact.requirementCoverage.slice(1) })).toThrow("v363-calibration-plan-identity");
  });
});
