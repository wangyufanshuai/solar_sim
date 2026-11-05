import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrInstrumentAuthorityMatrixV511,
  createKerrInstrumentAuthorityMatrixSummaryV511,
  parseKerrInstrumentAuthorityMatrixApiV511,
  parseKerrInstrumentAuthorityMatrixArtifactV511,
} from "./kerrInstrumentAuthorityMatrixV511";

const artifact = JSON.parse(
  readFileSync("dist/science/kerr-instrument-authority-matrix-v511/matrix.json", "utf8"),
);

describe("v511 instrument authority matrix", () => {
  it("locks six canonical stages without promoting detector outputs", () => {
    const parsed = parseKerrInstrumentAuthorityMatrixArtifactV511(artifact);
    expect(parsed.stages.map((stage) => stage.id)).toEqual([
      "v444-photon-response",
      "v445-electron-preflight",
      "v452-response-composition",
      "v458-measured-intake",
      "v465-response-contract",
      "v510-portable-provenance",
    ]);
    expect(parsed.stages[0].authorityGranted).toBe(true);
    expect(parsed.stages.slice(1).every((stage) => !stage.authorityGranted)).toBe(true);
    expect(parsed.counts).toMatchObject({
      sourcePhotonRows: 4,
      computationalFixtureRows: 4,
      measuredCalibrationFiles: 0,
      requiredMeasuredCalibrationFiles: 6,
      measuredResponseRows: 0,
      electronExpectationRows: 0,
      observedCountRows: 0,
      sciencePixelRows: 0,
    });
    expect(parsed.boundary).toMatchObject({
      detectorResponseAvailable: false,
      observedCountsAvailable: false,
      observedIntensityAvailable: false,
      scienceRasterAvailable: false,
      denseCampaignStatus: "incomplete-0-of-49",
      formalProductPointer: "v263",
      formalDefaultKernel: "legacy-eih-1pn",
    });
    expect(
      createHash("sha256")
        .update(canonicalKerrInstrumentAuthorityMatrixV511(parsed))
        .digest("hex"),
    ).toBe(parsed.artifactSha256);
  });

  it("requires response exactly once and preserves null-not-zero semantics", () => {
    const summary = createKerrInstrumentAuthorityMatrixSummaryV511(artifact);
    expect(summary.dimensionalContract).toMatchObject({
      responseAppliedExactlyOnce: true,
      collectingAreaGeometricOnly: true,
      gainAppliedAfterElectronExpectation: true,
      psfAndDistortionAppliedBeforeRasterQualification: true,
      missingQuantityPolicy: "null-not-zero",
    });
    expect(summary.transitions).toHaveLength(3);
    expect(summary.transitions.every((entry) => entry.status === "blocked")).toBe(true);
    expect(summary.transitions.every((entry) => !entry.syntheticFallbackAllowed)).toBe(true);
  });

  it("parses bounded available and unavailable API payloads", () => {
    const summary = createKerrInstrumentAuthorityMatrixSummaryV511(artifact);
    expect(
      parseKerrInstrumentAuthorityMatrixApiV511({
        version: "v511-kerr-instrument-authority-matrix-api-v1",
        available: true,
        reason: "ready",
        summary,
      }).available,
    ).toBe(true);
    expect(
      parseKerrInstrumentAuthorityMatrixApiV511({
        version: "v511-kerr-instrument-authority-matrix-api-v1",
        available: false,
        reason: "lite-boundary",
        summary: null,
      }).summary,
    ).toBeNull();
  });

  it("rejects a forged measured-authority promotion", () => {
    const forged = JSON.parse(JSON.stringify(artifact));
    forged.qualification.measuredDetectorAuthorityGranted = true;
    expect(() => parseKerrInstrumentAuthorityMatrixArtifactV511(forged)).toThrow(
      "v511-instrument-authority-matrix-boundary",
    );
  });
});
