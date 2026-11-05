import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrCalibrationExcitationDesignV525,
  compareKerrCalibrationDesignHudEncodingsV525,
  createKerrCalibrationDesignHudEncodingV525,
  createKerrCalibrationExcitationDesignSummaryV525,
  parseKerrCalibrationExcitationDesignArtifactV525,
  resolveKerrCalibrationDesignHudProfileV525,
} from "./kerrCalibrationExcitationDesignV525";

const artifact = parseKerrCalibrationExcitationDesignArtifactV525(
  JSON.parse(readFileSync(
    "dist/science/kerr-calibration-excitation-design-v525/design.json",
    "utf8",
  )),
);

describe("v525 calibration excitation design and V7.4 HUD", () => {
  it("has canonical exhaustive pair identity", () => {
    expect(createHash("sha256")
      .update(canonicalKerrCalibrationExcitationDesignV525(artifact))
      .digest("hex")).toBe(artifact.artifactSha256);
    expect(artifact.counts).toMatchObject({
      candidateConstraintCount: 8,
      candidatePairCount: 28,
      fullRankPairCount: 9,
      uniqueDOptimalPairCount: 1,
    });
  });

  it("selects the unique minimum full-rank differential pair", () => {
    expect(artifact.selectedDesign).toMatchObject({
      constraintIds: ["delta-q-pair", "delta-u-pair"],
      minimumConstraintCount: 2,
      rank: 6,
      nullity: 0,
      nullspaceCouplingRank: 2,
      uniqueDOptimalWithinCandidateSet: true,
    });
  });

  it("keeps algebraic design separate from six measured files", () => {
    expect(artifact.acquisitionBoundary).toMatchObject({
      algebraicConstraintCount: 2,
      measuredFileContractCount: 6,
      countsAreDistinctContracts: true,
      readyMeasuredFileCount: 0,
      designReplacesMeasuredAcquisition: false,
    });
    expect(artifact.qualification.measuredInstrumentQualified).toBe(false);
  });

  it("keeps V7.4 scientific rows byte-stable across modes", () => {
    const summary = createKerrCalibrationExcitationDesignSummaryV525(artifact);
    const science = createKerrCalibrationDesignHudEncodingV525(summary, "science");
    const cinematic = createKerrCalibrationDesignHudEncodingV525(summary, "cinematic");
    expect(compareKerrCalibrationDesignHudEncodingsV525(science, cinematic)).toMatchObject({
      scientificPayloadStable: true,
      scientificRowsStable: true,
      numericScientificStyleInputCount: 0,
    });
    expect(resolveKerrCalibrationDesignHudProfileV525("science")).toBe(
      resolveKerrCalibrationDesignHudProfileV525("science"),
    );
  });
});
