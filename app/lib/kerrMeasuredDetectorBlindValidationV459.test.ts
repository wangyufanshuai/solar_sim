import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrMeasuredDetectorBlindValidationPayloadV459,
  createKerrMeasuredDetectorBlindValidationSummaryV459,
  parseKerrMeasuredDetectorBlindValidationArtifactV459,
  validateKerrMeasuredDetectorBlindSplitV459,
} from "./kerrMeasuredDetectorBlindValidationV459";

const artifact = JSON.parse(
  readFileSync(
    "dist/science/kerr-measured-detector-blind-validation-v459/blind-validation.json",
    "utf8",
  ),
);

describe("v459 measured detector blind validation", () => {
  it("keeps protocol qualified while fit and holdout remain unrun", () => {
    const summary = createKerrMeasuredDetectorBlindValidationSummaryV459(artifact);
    expect(summary.protocol).toMatchObject({
      fixedFoldCount: 3,
      minimumRepeatsPerFold: 3,
      sourceRowsNeverFitOnHoldout: true,
      holdoutReadOnlyAfterLock: true,
      overlapTolerance: 0,
    });
    expect(summary.control).toMatchObject({
      status: "validation-only",
      authorityGranted: false,
      observedRows: 12,
      overlapRows: 0,
    });
    expect(summary.inspect).toMatchObject({
      measuredInputReady: false,
      trainRows: 0,
      holdoutRows: 0,
      overlapRows: 0,
      fitExecuted: false,
      holdoutExecuted: false,
      validationExecuted: false,
      authorityGranted: false,
    });
    expect(summary.uncertaintyBudget).toMatchObject({
      combination: "linear-unless-independence-proven",
      rssAllowed: false,
      measuredComponentsAvailable: false,
      budgetClosed: false,
    });
  });

  it("rejects overlap and duplicates deterministically", () => {
    expect(
      validateKerrMeasuredDetectorBlindSplitV459(["a", "b"], ["c", "d"]),
    ).toMatchObject({ status: "qualified", reason: "none", overlapIds: [] });
    expect(
      validateKerrMeasuredDetectorBlindSplitV459(["a", "shared"], ["shared", "b"]),
    ).toMatchObject({ status: "rejected", reason: "train-holdout-overlap" });
    expect(
      validateKerrMeasuredDetectorBlindSplitV459(["a", "a"], ["b"]),
    ).toMatchObject({ status: "rejected", reason: "duplicate-train-id" });
  });

  it("preserves the canonical artifact SHA", () => {
    const parsed = parseKerrMeasuredDetectorBlindValidationArtifactV459(artifact);
    expect(
      createHash("sha256")
        .update(canonicalKerrMeasuredDetectorBlindValidationPayloadV459(parsed))
        .digest("hex"),
    ).toBe(parsed.artifactSha256);
    expect(parsed.adversarialFixtures).toHaveLength(6);
  });
});
