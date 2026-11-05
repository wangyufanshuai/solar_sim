import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV430 } from "./atlasShadowCapabilityPointerV430";

describe("v430 local-shadow pointer", () => {
  it("qualifies likelihood mathematics without measured or dense authority", () => {
    const pointer = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v430.json", "utf8"));
    expect(isAtlasShadowCapabilityPointerV430(pointer)).toBe(true);
    expect(pointer.capabilities).toMatchObject({ v429ResponseUncertainty: "qualified-preserved", v430PoissonLikelihoodMath: "qualified-fixture-only", v430PredictiveCovarianceWhitening: "qualified-fixture-only", v430FixtureGoodnessOfFitAuthority: "not-granted", v430MeasuredObservedCounts: "zero", v430MeasuredResidualMetrics: "zero", v430MeasuredValidationRuns: "zero", v430MeasuredResponseAuthority: "unavailable", v430ScienceResponseApplications: "zero", v314CorrectedDense: "incomplete-0-of-49" });
  });
});
