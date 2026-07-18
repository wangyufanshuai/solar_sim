import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createAtlasRelativityRegressionExplanationV196 } from "./atlasRelativityRegressionExplanationV196";

describe("v196 relativity regression explanation", () => {
  const report = JSON.parse(
    readFileSync("dist/science/relativity-dop853-v7-report.json", "utf8"),
  );

  it("accounts for all 15 local regressions without changing promotion state", () => {
    const explanation = createAtlasRelativityRegressionExplanationV196(report);
    expect(explanation.regressionCount).toBe(15);
    expect(explanation.regressionCheckpointCounts).toEqual({ "+30d": 4, "+365d": 4, "+10y": 7 });
    expect(explanation.decision).toBe("shadow-retained");
    expect(explanation.defaultKernel).toBe("legacy-eih-1pn");
    expect(explanation.livePhysicsMutated).toBe(false);
    expect(explanation.workerPhysicsMutated).toBe(false);
  });

  it("records the Mercury ten-year regression as resolved, not solver noise", () => {
    const mercury = createAtlasRelativityRegressionExplanationV196(report).mercuryTenYear;
    expect(mercury?.positionDeltaMeters).toBeCloseTo(42.29510369440148, 9);
    expect(mercury?.numericalNoiseExplanationRejected).toBe(true);
    expect(mercury?.maximumRegressionToUncertaintyRatio).toBeGreaterThan(5);
  });
});
