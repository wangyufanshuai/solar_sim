import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrUncertaintyIndependentVerificationV517,
  parseKerrUncertaintyIndependentVerificationReceiptV517,
} from "./kerrUncertaintyIndependentVerificationV517";

const receipt = parseKerrUncertaintyIndependentVerificationReceiptV517(
  JSON.parse(
    readFileSync(
      "dist/science/kerr-uncertainty-independent-verification-v517/verification-receipt.json",
      "utf8",
    ),
  ),
);

describe("v517 independent replay witness verification", () => {
  it("records full independent recomputation with no mismatches", () => {
    expect(receipt.verification).toMatchObject({
      independentImplementation: true,
      importedV516Parser: false,
      importedV516Builder: false,
      artifactCanonicalValid: true,
      sourceManifestValid: true,
      transitionCount: 512,
      recomputedWitnessCount: 512,
      checkpointCount: 8,
      matchedCheckpointCount: 8,
      witnessMismatchCount: 0,
      checkpointMismatchCount: 0,
      sequenceMismatchCount: 0,
      boundaryViolationCount: 0,
    });
  });

  it("has a valid canonical receipt SHA", () => {
    expect(
      createHash("sha256")
        .update(canonicalKerrUncertaintyIndependentVerificationV517(receipt))
        .digest("hex"),
    ).toBe(receipt.artifactSha256);
  });

  it("keeps measured, dense, browser and product boundaries explicit", () => {
    expect(receipt.boundary).toMatchObject({
      detectorCalibrationStatus: "incomplete-0-of-6",
      detectorAuthorityAvailable: false,
      scienceRasterAvailable: false,
      denseCampaignStatus: "incomplete-0-of-49",
      browserQualification: "not-run",
      localShadowDefaultApplied: false,
      formalProductPointer: "v263",
      formalDefaultKernel: "legacy-eih-1pn",
    });
  });

  it("does not import the v516 parser or builder into the verifier", () => {
    const source = readFileSync(
      "scripts/verify-kerr-uncertainty-replay-witness-v517.ts",
      "utf8",
    );
    expect(source).not.toContain("kerrUncertaintyReplayWitnessV516");
    expect(source).not.toContain("build-kerr-uncertainty-replay-witness-v516");
  });
});
