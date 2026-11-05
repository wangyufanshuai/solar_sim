import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DetectorCalibrationCompilationResultV365 } from "./detectorCalibrationCompilerV365";
import type { DetectorCalibrationValidationResultV366 } from "./detectorCalibrationValidationV366";
import { evaluateDetectorCalibrationAuthorityV367, parseDetectorCalibrationConditioningInputV367 } from "./detectorCalibrationAuthorityAdmissionV367";

const SHA = "a".repeat(64);
const FILE_SHA = "b".repeat(64);
const conditioning = parseDetectorCalibrationConditioningInputV367({
  version: "v367-measured-jacobian-covariance-v1",
  sourceKind: "measured",
  instrumentSerialOrCampaignId: "campaign-001",
  manifestCanonicalSha256: SHA,
  jacobian: Array.from({ length: 7 }, (_, row) => Array.from({ length: 7 }, (_, column) => row === column ? 1 : 0)),
  observationVariance: Array(7).fill(1),
  provenance: { sourceUrl: "https://observatory.example/calibration", licenseOrTerms: "measured calibration terms", artifactSha256: FILE_SHA },
});
const compilation = {
  status: "compiled-measured-manifest-awaiting-independent-validation",
  sourceKind: "measured-import",
  manifestCanonicalSha256: SHA,
  manifestPublishable: true,
  measuredAuthorityGranted: false,
  independentScientificValidation: "pending",
  manifest: { instrument: { serialOrCampaignId: "campaign-001" } },
} as DetectorCalibrationCompilationResultV365;
const validation = {
  status: "measured-validation-qualified",
  sourceKind: "measured-import",
  passed: true,
  measuredValidationQualified: true,
  measuredAuthorityGranted: false,
  independentFromCompilerDerivations: true,
} as DetectorCalibrationValidationResultV366;

const evaluate = (overrides: Partial<Parameters<typeof evaluateDetectorCalibrationAuthorityV367>[0]> = {}) => evaluateDetectorCalibrationAuthorityV367({
  compilation,
  validation,
  validationManifestCanonicalSha256: SHA,
  conditioning,
  compiledArtifactSha256: FILE_SHA,
  validationArtifactSha256: "c".repeat(64),
  measuredManifestFileSha256: "d".repeat(64),
  conditioningFileSha256: "e".repeat(64),
  declaredTestFixture: false,
  ...overrides,
});

describe("v367 measured calibration authority admission", () => {
  it("qualifies only a fully identity-locked measured chain and never promotes product state", () => {
    expect(evaluate()).toMatchObject({
      status: "qualified-measured-authority-local-shadow-only",
      authorityGranted: true,
      reasons: [],
      sciencePayloadMutationAllowed: false,
      cinematicMutationAllowed: false,
      productPromotionAllowed: false,
      formalProductPointer: "v263",
    });
  });

  it("rejects fixture provenance even when every numerical field passes", () => {
    expect(evaluate({ declaredTestFixture: true })).toMatchObject({
      status: "rejected-test-fixture-nonpublishable",
      authorityGranted: false,
      reasons: expect.arrayContaining(["test-fixture-nonpublishable"]),
    });
  });

  it("fails closed on manifest identity or independent-validation mismatch", () => {
    expect(evaluate({ validationManifestCanonicalSha256: "f".repeat(64) })).toMatchObject({ status: "blocked-input-identity-mismatch", authorityGranted: false });
    expect(evaluate({ validation: { ...validation, passed: false, measuredValidationQualified: false, status: "validation-failed" } })).toMatchObject({ status: "blocked-validation-not-qualified", authorityGranted: false });
  });

  it("rejects malformed or nonpositive conditioning inputs", () => {
    expect(() => parseDetectorCalibrationConditioningInputV367({ ...conditioning, observationVariance: [0, 1, 1, 1, 1, 1, 1] })).toThrow("v367-conditioning-input-identity");
  });

  it("publishes the independent authority pointer only after a qualified decision", () => {
    const source = readFileSync("scripts/admit-detector-calibration-v367.ts", "utf8");
    expect(source).toContain("if (decision.authorityGranted)");
    expect(source).toContain("orbit-atlas-detector-calibration-authority-v367.json");
    expect(source).toContain("productPromotionAllowed: false");
    expect(source).not.toContain("fetch(");
  });
});
