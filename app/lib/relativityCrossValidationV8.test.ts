import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  validateRelativityCrossValidationV8,
  type RelativityCrossValidationReportV8,
} from "./relativityCrossValidationV8";

describe("v199 REBOUND IAS15 cross validation", () => {
  const report = JSON.parse(
    readFileSync("dist/science/relativity-cross-validation-v8.json", "utf8"),
  ) as RelativityCrossValidationReportV8;

  it("uses the independent pinned solver and preserves the runtime boundary", () => {
    expect(report.solver).toMatchObject({
      name: "REBOUND",
      version: "4.6.0",
      integrator: "ias15",
      forceIsVelocityDependent: true,
      newtonianOwner: "rebound-direct-n-body",
    });
    expect(report.provenance.reboundLicense).toBe("GPL-3.0-or-later");
    expect(report.defaultKernel).toBe("legacy-eih-1pn");
    expect(report.promotionDecision).toBe("shadow-retained");
    expect(report.liveStateMutated).toBe(false);
    expect(report.workerStateMutated).toBe(false);
  });

  it("accounts for all 15 DOP853 regressions and fails closed", () => {
    const validation = validateRelativityCrossValidationV8(report);
    expect(validation.provenanceReady).toBe(true);
    expect(validation.solverReady).toBe(true);
    expect(validation.allDop853RegressionsAccountedFor).toBe(true);
    expect(validation.runtimePromotionApplied).toBe(false);
    expect(validation.decision).toBe("shadow-retained");
  });

  it("reports Mercury's ten-year attribution without claiming a physical cause", () => {
    const mercury = report.regressionAttributions.find(
      (row) => row.bodyId === "mercury" && row.offsetDays === 3652.5,
    );
    expect(mercury).toBeDefined();
    expect([
      "cross-solver-regression-confirmed",
      "solver-disagreement",
      "inconclusive",
    ]).toContain(mercury?.classification);
  });
});
