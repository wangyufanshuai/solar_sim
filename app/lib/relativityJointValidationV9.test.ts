import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  RELATIVITY_JOINT_VALIDATION_V9_VERSION,
  validateRelativityJointReportV9,
  type RelativityJointValidationReportV9,
} from "./relativityJointValidationV9";

const report = JSON.parse(
  readFileSync("dist/science/relativity-joint-validation-v9.json", "utf8"),
) as RelativityJointValidationReportV9 & {
  priorFifteenRegressionClosure: {
    rowCount: number;
    allRowsPresent: boolean;
    allRowsResolved: boolean;
    counts: Record<string, number>;
  };
  effectIsolation: ReadonlyArray<{ effectId: string; allBodiesResolved: boolean }>;
};

describe("relativity joint validation v9", () => {
  it("uses the requested additive joint uncertainty exactly", () => {
    expect(report.version).toBe(RELATIVITY_JOINT_VALIDATION_V9_VERSION);
    expect(validateRelativityJointReportV9(report).formulaPassed).toBe(true);
  });

  it("reproduces deterministic DOP853 and IAS15 reruns", () => {
    expect(report.deterministicReruns.dop853.passed).toBe(true);
    expect(report.deterministicReruns.ias15.passed).toBe(true);
    expect(report.fittedBlindPropagation.deterministicReruns.passed).toBe(true);
    expect(report.fittedBlindPropagation.deterministicReruns.count).toBe(2);
    expect(report.deterministicReruns.dop853.primaryHash).toBe(report.deterministicReruns.dop853.rerunHash);
    expect(report.deterministicReruns.ias15.primaryHash).toBe(report.deterministicReruns.ias15.rerunHash);
  });

  it("confirms the Mercury ten-year regression without claiming its physical cause", () => {
    const validation = validateRelativityJointReportV9(report);
    expect(validation.mercuryRegressionConfirmed).toBe(true);
    expect(report.mercuryTenYear.dop853PositionDeltaMeters).toBeCloseTo(45.5896, 3);
    expect(report.mercuryTenYear.ias15PositionDeltaMeters).toBeCloseTo(45.3171, 3);
    expect(report.mercuryTenYear.physicalCauseEstablished).toBe(false);
  });

  it("closes the old 15-row inventory but keeps unresolved rows fail closed", () => {
    expect(report.priorFifteenRegressionClosure.rowCount).toBe(15);
    expect(report.priorFifteenRegressionClosure.allRowsPresent).toBe(true);
    expect(report.priorFifteenRegressionClosure.allRowsResolved).toBe(false);
    expect(report.priorFifteenRegressionClosure.counts["solver-disagreement"]).toBe(0);
    expect(report.priorFifteenRegressionClosure.counts.inconclusive).toBe(2);
  });

  it("keeps raw propagation separate from the completed fitted blind holdout", () => {
    expect(report.fittedBlindPropagation.status).toBe("complete");
    expect(report.fittedBlindPropagation.rawResultsMayNotBeReplaced).toBe(true);
    expect(report.fittedBlindPropagation.mercuryTenYear.outcome).toBe("cross-solver-regression-confirmed");
    expect(report.fittedBlindPropagation.mercuryTenYear.dop853PositionDeltaKm).toBeCloseTo(0.0160471, 6);
    expect(report.fittedBlindPropagation.aggregateImprovement).toBe(false);
    expect(report.promotionEvaluation.fittedBlindComplete).toBe(true);
  });

  it("retains shadow because aggregate position worsens and 2PN is unresolved", () => {
    expect(report.rawPropagation.aggregates.dop853.candidatePositionRmsKm)
      .toBeGreaterThan(report.rawPropagation.aggregates.dop853.legacyPositionRmsKm);
    expect(report.rawPropagation.aggregates.ias15.candidatePositionRmsKm)
      .toBeGreaterThan(report.rawPropagation.aggregates.ias15.legacyPositionRmsKm);
    expect(report.effectIsolation.find((effect) => effect.effectId === "solar-2pn")?.allBodiesResolved).toBe(false);
    expect(report.promotionEvaluation.promotionQualified).toBe(false);
    expect(report.defaultKernel).toBe("legacy-eih-1pn");
  });
});
