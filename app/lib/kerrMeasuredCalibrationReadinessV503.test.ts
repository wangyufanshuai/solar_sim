import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  KERR_MEASURED_CALIBRATION_READINESS_API_VERSION_V503,
  canonicalKerrMeasuredCalibrationReadinessV503,
  createKerrMeasuredCalibrationReadinessSummaryV503,
  parseKerrMeasuredCalibrationReadinessApiV503,
  parseKerrMeasuredCalibrationReadinessArtifactV503,
} from "./kerrMeasuredCalibrationReadinessV503";

const artifact = JSON.parse(
  readFileSync(
    "dist/science/kerr-measured-calibration-readiness-v503/readiness.json",
    "utf8",
  ),
);

describe("v503 measured calibration readiness", () => {
  it("exposes the exact six-file schema and provenance handoff", () => {
    const summary = createKerrMeasuredCalibrationReadinessSummaryV503(artifact);
    expect(summary.files).toHaveLength(6);
    expect(summary.files.map((file) => file.id)).toEqual([
      "identity",
      "plate-scale",
      "distortion",
      "psf",
      "pixel-response",
      "provenance",
    ]);
    expect(summary.files.every((file) => file.status === "missing")).toBe(true);
    expect(summary.files.find((file) => file.id === "plate-scale")).toMatchObject({
      format: "csv",
      provenanceLink: "provenance.fileSha256.plate-scale",
    });
    expect(summary.files.find((file) => file.id === "provenance")).toMatchObject({
      format: "json",
      provenanceLink: "self-provenance-record",
    });
  });

  it("keeps production outputs unavailable and performs no intake", () => {
    const summary = createKerrMeasuredCalibrationReadinessSummaryV503(artifact);
    expect(summary.decision).toMatchObject({
      admitted: false,
      reason: "measured-files-missing",
      readyFileCount: 0,
      missingFileCount: 6,
    });
    expect(summary.outputs).toEqual({
      detectorResponse: "unavailable",
      observedCounts: "unavailable",
      observedIntensity: "unavailable",
      scienceRaster: "unavailable",
      fitsProducts: 0,
      pngProducts: 0,
    });
    expect(summary.boundary).toMatchObject({
      stagingInspectedByV503: false,
      networkAttempted: false,
      missingFilesGenerated: false,
      syntheticAuthorityAllowed: false,
      sciencePayloadMutationAllowed: false,
    });
  });

  it("preserves the canonical artifact SHA", () => {
    const parsed = parseKerrMeasuredCalibrationReadinessArtifactV503(artifact);
    expect(
      createHash("sha256")
        .update(canonicalKerrMeasuredCalibrationReadinessV503(parsed))
        .digest("hex"),
    ).toBe(parsed.artifactSha256);
  });

  it("parses the sanitized API summary consumed by the explicit-intent surface", () => {
    const summary = createKerrMeasuredCalibrationReadinessSummaryV503(artifact);
    expect(
      parseKerrMeasuredCalibrationReadinessApiV503({
        version: KERR_MEASURED_CALIBRATION_READINESS_API_VERSION_V503,
        available: true,
        reason: "ready",
        summary,
      }),
    ).toMatchObject({ available: true, reason: "ready", summary });
  });
});
