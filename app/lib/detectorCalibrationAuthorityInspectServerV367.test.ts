import { describe, expect, it } from "vitest";
import { loadDetectorCalibrationAuthorityInspectV367, resetDetectorCalibrationAuthorityInspectServerV367CacheForTests } from "./detectorCalibrationAuthorityInspectServerV367";

describe("v367 authority inspect server", () => {
  it("serves one bounded content-addressed cached snapshot", async () => {
    resetDetectorCalibrationAuthorityInspectServerV367CacheForTests();
    const first = await loadDetectorCalibrationAuthorityInspectV367();
    const second = await loadDetectorCalibrationAuthorityInspectV367();
    expect(first).toBe(second);
    expect(first).toMatchObject({ status: "blocked-admission-inputs-unavailable", presentInputCount: 0, admissionExecuted: false, measuredAuthorityGranted: false });
  });
});
