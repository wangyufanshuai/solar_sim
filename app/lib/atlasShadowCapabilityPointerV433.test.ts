import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV433 } from "./atlasShadowCapabilityPointerV433";

describe("v433 local-shadow capability pointer", () => {
  it("keeps synthetic joint nuisance math separate from Science admission", () => {
    const pointer = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v433.json", "utf8"));
    expect(isAtlasShadowCapabilityPointerV433(pointer)).toBe(true);
    expect(pointer.capabilities).toMatchObject({ v432AlternativeLikelihoodAuthority: "qualified-preserved", v433JointNuisanceAnalyticMath: "qualified-synthetic-only", v433NegativeBinomialJointCovariance: "qualified-synthetic-only", v433PoissonLognormalJointCovariance: "qualified-synthetic-only", v433MonteCarloCrossValidation: "qualified-synthetic-only", v433MeasuredCrossBlockIndependence: "unavailable", v433MeasuredResponseAuthority: "unavailable", v433MeasuredLikelihoodAuthority: "unavailable", v433ScienceBoundary: "implemented-not-admitted", v433ScienceResponseApplications: "zero", v433BrowserQualification: "not-run", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable" });
  });
});
