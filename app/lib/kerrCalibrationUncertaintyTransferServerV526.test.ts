import { describe, expect, it } from "vitest";
import {
  KERR_CALIBRATION_UNCERTAINTY_TRANSFER_ARTIFACT_MAX_BYTES_V526,
  loadKerrCalibrationUncertaintyTransferV526,
  resetKerrCalibrationUncertaintyTransferServerCacheForTestsV526,
} from "./kerrCalibrationUncertaintyTransferServerV526";

describe("v526 calibration uncertainty transfer server", () => {
  it("loads one bounded artifact through the mtime-size-sha cache", async () => {
    resetKerrCalibrationUncertaintyTransferServerCacheForTestsV526();
    const first = await loadKerrCalibrationUncertaintyTransferV526();
    const second = await loadKerrCalibrationUncertaintyTransferV526();
    expect(first).toBe(second);
    expect(first.summary.boundedUnitErrorTransfer.vertexCount).toBe(64);
    expect(first.export.bytes.byteLength).toBeGreaterThan(0);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(KERR_CALIBRATION_UNCERTAINTY_TRANSFER_ARTIFACT_MAX_BYTES_V526);
  });
});
