import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrMeasuredCalibrationPreflightV504,
  createKerrMeasuredCalibrationPreflightSummaryV504,
  KERR_MEASURED_CALIBRATION_PREFLIGHT_API_VERSION_V504,
  parseKerrMeasuredCalibrationPreflightApiV504,
  parseKerrMeasuredCalibrationPreflightArtifactV504,
} from "./kerrMeasuredCalibrationPreflightV504";

const artifact = JSON.parse(
  readFileSync(
    "dist/science/kerr-measured-calibration-preflight-v504/preflight.json",
    "utf8",
  ),
);

describe("v504 measured calibration preflight artifact", () => {
  it("records the real zero-read missing-file result", () => {
    const summary = createKerrMeasuredCalibrationPreflightSummaryV504(artifact);
    expect(summary).toMatchObject({
      status: "blocked-inputs-missing",
      observation: {
        stagingRootPresent: false,
        stagingRootSafe: true,
        readyFileCount: 0,
        bytesRead: 0,
        candidateReadyForIndependentValidation: false,
      },
      decision: {
        measuredDetectorAuthorityGranted: false,
        runtimeProjectionAllowed: false,
        scienceRasterAllowed: false,
        nextAction: "provide-missing-files",
      },
    });
    expect(summary.observation.missingFileIds).toHaveLength(6);
  });

  it("preserves the canonical artifact SHA", () => {
    const parsed = parseKerrMeasuredCalibrationPreflightArtifactV504(artifact);
    expect(
      createHash("sha256")
        .update(canonicalKerrMeasuredCalibrationPreflightV504(parsed))
        .digest("hex"),
    ).toBe(parsed.artifactSha256);
  });

  it("parses the sanitized API summary", () => {
    const summary = createKerrMeasuredCalibrationPreflightSummaryV504(artifact);
    expect(
      parseKerrMeasuredCalibrationPreflightApiV504({
        version: KERR_MEASURED_CALIBRATION_PREFLIGHT_API_VERSION_V504,
        available: true,
        reason: "ready",
        summary,
      }),
    ).toMatchObject({ available: true, reason: "ready", summary });
  });
});
