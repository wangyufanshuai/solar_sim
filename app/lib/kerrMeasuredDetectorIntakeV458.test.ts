import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrMeasuredDetectorIntakePayloadV458,
  createKerrMeasuredDetectorIntakeSummaryV458,
  parseKerrMeasuredDetectorIntakeArtifactV458,
} from "./kerrMeasuredDetectorIntakeEnvelopeV458";
import {
  createKerrMeasuredDetectorAdversarialFixturesV458,
  createKerrMeasuredDetectorSyntheticControlV458,
  validateKerrMeasuredDetectorCandidateV458,
} from "./kerrMeasuredDetectorIntakeValidatorV458";

const artifact = JSON.parse(
  readFileSync(
    "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
    "utf8",
  ),
);

describe("v458 measured detector intake", () => {
  it("qualifies the protocol while preserving the real 0/6 production boundary", () => {
    const summary = createKerrMeasuredDetectorIntakeSummaryV458(artifact);
    expect(summary.inspect).toMatchObject({
      stagingRootPresent: false,
      readyFileCount: 0,
      candidateReadyForIndependentValidation: false,
      attemptConsumed: false,
    });
    expect(summary.inspect.missingFileIds).toHaveLength(6);
    expect(summary.productionAdmission).toMatchObject({
      measuredInputInventoryQualified: false,
      measuredDetectorAuthorityGranted: false,
      runtimeProjectionAllowed: false,
      scienceRasterAllowed: false,
    });
    expect(summary.boundary).toMatchObject({
      syntheticFixtureMayGrantAuthority: false,
      fitsWriteAllowed: false,
      pngWriteAllowed: false,
      sciencePayloadMutationAllowed: false,
    });
  });

  it("accepts the synthetic control only as validation-only", () => {
    const result = validateKerrMeasuredDetectorCandidateV458(
      createKerrMeasuredDetectorSyntheticControlV458(),
    );
    expect(result).toMatchObject({
      status: "validation-only",
      readyFileCount: 6,
      crossFileIdentityQualified: true,
      provenanceShaLinkageQualified: true,
      licenseBoundaryQualified: true,
      candidateReadyForIndependentValidation: false,
      measuredDetectorAuthorityGranted: false,
    });
  });

  it("rejects all eleven adversarial fixtures for their expected reasons", () => {
    for (const fixture of createKerrMeasuredDetectorAdversarialFixturesV458()) {
      const result = validateKerrMeasuredDetectorCandidateV458(fixture.candidate);
      expect(result.status, fixture.id).not.toBe("validation-only");
      expect(
        result.files.flatMap((file) => file.reasons),
        fixture.id,
      ).toContain(fixture.expectedReason);
      expect(result.measuredDetectorAuthorityGranted).toBe(false);
    }
  });

  it("preserves the canonical artifact SHA", () => {
    const parsed = parseKerrMeasuredDetectorIntakeArtifactV458(artifact);
    expect(
      createHash("sha256")
        .update(canonicalKerrMeasuredDetectorIntakePayloadV458(parsed))
        .digest("hex"),
    ).toBe(parsed.artifactSha256);
  });
});
