import { describe, expect, it } from "vitest";
import {
  KERR_CALIBRATION_EXCITATION_DESIGN_ARTIFACT_MAX_BYTES_V525,
  loadKerrCalibrationExcitationDesignV525,
  resetKerrCalibrationExcitationDesignServerCacheForTestsV525,
} from "./kerrCalibrationExcitationDesignServerV525";

describe("v525 calibration excitation design server", () => {
  it("loads one bounded artifact through the mtime-size-sha cache", async () => {
    resetKerrCalibrationExcitationDesignServerCacheForTestsV525();
    const first = await loadKerrCalibrationExcitationDesignV525();
    const second = await loadKerrCalibrationExcitationDesignV525();
    expect(first).toBe(second);
    expect(first.summary.selectedDesign).toMatchObject({ rank: 6, nullity: 0 });
    expect(first.export.bytes.byteLength).toBeGreaterThan(0);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(
      KERR_CALIBRATION_EXCITATION_DESIGN_ARTIFACT_MAX_BYTES_V525,
    );
  });
});
