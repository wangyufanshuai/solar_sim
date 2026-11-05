import { afterEach, describe, expect, it } from "vitest";
import {
  loadKerrMeasuredCalibrationPreflightV504,
  resetKerrMeasuredCalibrationPreflightServerCacheForTestsV504,
} from "./kerrMeasuredCalibrationPreflightServerV504";

afterEach(() => resetKerrMeasuredCalibrationPreflightServerCacheForTestsV504());

describe("v504 measured calibration preflight server", () => {
  it("single-flights the bounded canonical report", async () => {
    const [first, second] = await Promise.all([
      loadKerrMeasuredCalibrationPreflightV504(),
      loadKerrMeasuredCalibrationPreflightV504(),
    ]);
    expect(first).toBe(second);
    expect(first.bytes.byteLength).toBeLessThanOrEqual(256 * 1024);
    expect(first.summary.observation.files).toHaveLength(6);
    expect(first.summary.boundary).toMatchObject({
      stagingWritePerformed: false,
      networkAttempted: false,
      detectorResponseAvailable: false,
      scienceRasterAvailable: false,
    });
  });
});
