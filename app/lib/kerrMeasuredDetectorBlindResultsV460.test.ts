import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrMeasuredDetectorBlindResultsPayloadV460,
  createKerrMeasuredDetectorBlindControlRowsV460,
  evaluateKerrMeasuredDetectorBlindResultsV460,
  parseKerrMeasuredDetectorBlindResultsArtifactV460,
} from "./kerrMeasuredDetectorBlindResultsV460";

const artifact = JSON.parse(readFileSync("dist/science/kerr-measured-detector-blind-results-v460/blind-results.json", "utf8"));
describe("v460 blind result evaluator", () => {
  it("computes control metrics but keeps synthetic authority disabled", () => {
    const result = evaluateKerrMeasuredDetectorBlindResultsV460(createKerrMeasuredDetectorBlindControlRowsV460("a".repeat(64)), "synthetic-validation-fixture", "a".repeat(64), { uRepeatability: 0.001, uTrainFit: 0.001, uHoldout: 0.002, uReference: 0.001, uInitialState: 0.001 });
    expect(result).toMatchObject({ status: "validation-only", thresholdPass: true, authorityEligible: false, uncertaintyBudget: { closed: true, rssAllowed: false } });
  });
  it("rejects overlap and source SHA contamination", () => {
    const rows = [...createKerrMeasuredDetectorBlindControlRowsV460("a".repeat(64)), { ...createKerrMeasuredDetectorBlindControlRowsV460("a".repeat(64))[0], split: "holdout" as const }];
    expect(evaluateKerrMeasuredDetectorBlindResultsV460(rows, "measured-detector-calibration", "a".repeat(64), { uRepeatability: 0.001, uTrainFit: 0.001, uHoldout: 0.002, uReference: 0.001, uInitialState: 0.001 })).toMatchObject({ status: "rejected", reason: "duplicate-row-id" });
    expect(evaluateKerrMeasuredDetectorBlindResultsV460(createKerrMeasuredDetectorBlindControlRowsV460("b".repeat(64)), "measured-detector-calibration", "a".repeat(64), { uRepeatability: 0.001, uTrainFit: 0.001, uHoldout: 0.002, uReference: 0.001, uInitialState: 0.001 })).toMatchObject({ status: "rejected", reason: "source-sha-mismatch" });
  });
  it("preserves canonical artifact SHA and production nulls", () => {
    const parsed = parseKerrMeasuredDetectorBlindResultsArtifactV460(artifact);
    expect(createHash("sha256").update(canonicalKerrMeasuredDetectorBlindResultsPayloadV460(parsed)).digest("hex")).toBe(parsed.artifactSha256);
    expect(parsed.production.metrics).toEqual({ plateScaleRepeatCv: null, distortionHoldoutMaxResidualPx: null, psfRepeatCv: null, pixelResponseRelativeResidual: null, holdoutCoverage: null });
    expect(parsed.inspect.authorityGranted).toBe(false);
  });
});
