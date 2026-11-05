import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrIdealAnalyzerSensitivityV523,
  parseKerrIdealAnalyzerSensitivityArtifactV523,
} from "./kerrIdealAnalyzerSensitivityV523";

const artifact = parseKerrIdealAnalyzerSensitivityArtifactV523(
  JSON.parse(
    readFileSync(
      "dist/science/kerr-ideal-analyzer-sensitivity-v523/projection.json",
      "utf8",
    ),
  ),
);

describe("v523 ideal analyzer sensitivity projection", () => {
  it("has canonical four-angle projection and reconstruction coverage", () => {
    expect(
      createHash("sha256")
        .update(canonicalKerrIdealAnalyzerSensitivityV523(artifact))
        .digest("hex"),
    ).toBe(artifact.artifactSha256);
    expect(artifact.analyzerPlan).toHaveLength(4);
    expect(artifact.modulationRows).toHaveLength(864);
    expect(artifact.reconstructions).toHaveLength(216);
    expect(artifact.channelEnvelopes).toHaveLength(96);
  });

  it("keeps every forward and inverse residual below the frozen limit", () => {
    const limit = Number(artifact.limits.idealAlgebraResidual);
    for (const [key, value] of Object.entries(artifact.maxima)) {
      if (key === "nonnegativeBeamViolation") expect(Number(value)).toBe(0);
      else expect(Number(value)).toBeLessThan(limit);
    }
  });

  it("does not promote ideal beams to calibrated detector authority", () => {
    expect(artifact.operator.idealOnly).toBe(true);
    expect(artifact.qualification).toMatchObject({
      measuredInstrumentQualified: false,
      detectorProjectionQualified: false,
      scienceAuthorityPromotionAllowed: false,
    });
    expect(artifact.counts.expectedElectronCountRowCount).toBe(0);
    expect(artifact.counts.observedCountRowCount).toBe(0);
  });

  it("keeps dense and formal product boundaries frozen", () => {
    expect(artifact.boundary).toMatchObject({
      instrumentMuellerMatrixAvailable: false,
      scienceRasterAuthorityAvailable: false,
      denseCampaignStatus: "incomplete-0-of-49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    });
  });
});
