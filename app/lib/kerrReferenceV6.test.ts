import { describe, expect, it } from "vitest";
import {
  KERR_REFERENCE_V6_VERSION,
  validateKerrDenseCrossValidationReportV6,
  validateKerrRayShardManifestV6,
  type KerrRayShardManifestV6,
} from "./kerrReferenceV6";

const hash = "a".repeat(64);

function shard(complete = true): KerrRayShardManifestV6 {
  const executions = (["carter-mino-dop853", "kerr-schild-hamiltonian-dop853"] as const)
    .flatMap((solver) => (["fine", "finer"] as const).flatMap((tolerance) =>
      (["A", "B"] as const).map((run) => ({
        solver,
        tolerance,
        run,
        status: "escaped" as const,
        outputSha256: hash,
        maxNullConstraint: 1e-12,
      }))));
  return {
    version: KERR_REFERENCE_V6_VERSION,
    shardId: "0000",
    shardIndex: 0,
    shardSizeLimit: 64,
    rayCount: 1,
    rayClassCounts: { canonical: 1, "low-discrepancy": 0, "critical-bracket": 0 },
    frozenScreenManifestSha256: hash,
    codeSha256: hash,
    environmentSha256: hash,
    inputSha256: hash,
    outputSha256: hash,
    complete,
    watchdogSeconds: 120,
    executionsPerRay: 8,
    rays: [{ id: "canonical-0000", rayClass: "canonical", executions }],
  };
}

describe("Kerr reference V6 shard contract", () => {
  it("accepts only complete eight-way per-ray executions", () => {
    expect(validateKerrRayShardManifestV6(shard()).passed).toBe(true);
    expect(validateKerrRayShardManifestV6(shard(false)).passed).toBe(false);
  });

  it("never aggregates partial dense coverage into a pass", () => {
    const report = {
      version: KERR_REFERENCE_V6_VERSION,
      frozenScreenManifestSha256: hash,
      expected: { canonical: 25 as const, lowDiscrepancy: 2048 as const, criticalBracket: 1024 as const },
      executed: { canonical: 1, lowDiscrepancy: 0, criticalBracket: 0 },
      shardCount: 1,
      completeShardCount: 1,
      partialResultsAggregated: false as const,
      deterministicRerunPassed: true,
      classificationAgreement: 1,
      criticalCurveMaxErrorPx: 0,
      maxNullConstraint: 1e-12,
      redshiftMaxRelativeError: 0,
      evpaMaxErrorDeg: 0,
      classificationGatePassed: false,
      criticalCurveGatePassed: false,
      nullConstraintGatePassed: false,
      redshiftGatePassed: false,
      evpaGatePassed: false,
      promotionDecision: "shadow-retained" as const,
      boundary: "offline-dense-kerr-reference-not-grmhd-no-runtime-promotion" as const,
    };
    expect(validateKerrDenseCrossValidationReportV6(report, [shard()])).toEqual(
      expect.objectContaining({ coverageComplete: false, passed: false }),
    );
  });
});
