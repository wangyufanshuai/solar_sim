import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseDetectorCalibrationAuthorityInspectV367 } from "./detectorCalibrationAuthorityInspectV367";

describe("v367 authority admission inspect", () => {
  it("reports all seven real measured inputs missing without consuming an attempt", () => {
    expect(parseDetectorCalibrationAuthorityInspectV367(JSON.parse(readFileSync("dist/science/detector-calibration-v367/inspect.json", "utf8")))).toMatchObject({
      status: "blocked-admission-inputs-unavailable",
      presentInputCount: 0,
      missingInputs: ["v365-identity", "v365-throughput", "v365-noise", "v365-provenance", "v365-compiled-artifact", "v361-measured-manifest", "measured-jacobian-covariance"],
      admissionControllerImplemented: true,
      admissionExecuted: false,
      measuredAuthorityGranted: false,
      attemptConsumed: false,
      networkAttempted: false,
      automaticPromotionAllowed: false,
    });
  });
});
