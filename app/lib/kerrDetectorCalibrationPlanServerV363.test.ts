import { describe, expect, it } from "vitest";
import { loadKerrDetectorCalibrationPlanV363, resetKerrDetectorCalibrationPlanServerV363CacheForTests } from "./kerrDetectorCalibrationPlanServerV363";

describe("v363 detector calibration plan server", () => {
  it("returns an mtime/size/SHA cached validated plan", async () => {
    resetKerrDetectorCalibrationPlanServerV363CacheForTests();
    const first = await loadKerrDetectorCalibrationPlanV363();
    const second = await loadKerrDetectorCalibrationPlanV363();
    expect(first).toBe(second);
    expect(first).toMatchObject({ status: "qualified-synthetic-calibration-acquisition-design-measured-input-still-blocked", measuredPerformanceClaimed: false, taskExecutionStatus: "not-run-plan-only" });
  });
});
