import { describe, expect, it } from "vitest";
import { loadPolarimeterCalibrationInspectV411, resetPolarimeterCalibrationServerV411CacheForTests } from "./kerrPolarimeterCalibrationServerV411";

describe("v411 polarimeter calibration server", () => {
  it("single-flights a bounded inspect and keeps the React summary schema-only", async () => {
    resetPolarimeterCalibrationServerV411CacheForTests();
    const first = await loadPolarimeterCalibrationInspectV411();
    const second = await loadPolarimeterCalibrationInspectV411();
    expect(second).toBe(first);
    expect(first.inspect.requiredInputs).toHaveLength(11);
    expect(first.summary).toMatchObject({ measuredPack: { present: false, rowCount: 0 }, admission: { status: "blocked-input-unavailable", authorityGranted: false } });
    expect(first.summary).not.toHaveProperty("requiredInputs");
  });
});
