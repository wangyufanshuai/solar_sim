import { afterEach, describe, expect, it } from "vitest";
import {
  loadKerrMeasuredCalibrationReadinessV503,
  resetKerrMeasuredCalibrationReadinessServerCacheForTestsV503,
} from "./kerrMeasuredCalibrationReadinessServerV503";

afterEach(() => resetKerrMeasuredCalibrationReadinessServerCacheForTestsV503());

describe("v503 measured calibration readiness server", () => {
  it("single-flights the bounded canonical artifact", async () => {
    const [first, second] = await Promise.all([
      loadKerrMeasuredCalibrationReadinessV503(),
      loadKerrMeasuredCalibrationReadinessV503(),
    ]);
    expect(first).toBe(second);
    expect(first.bytes.byteLength).toBeLessThanOrEqual(256 * 1024);
    expect(first.summary.files).toHaveLength(6);
    expect(first.summary.decision).toMatchObject({
      admitted: false,
      readyFileCount: 0,
      missingFileCount: 6,
    });
  });
});
