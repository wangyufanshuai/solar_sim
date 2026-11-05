import { describe, expect, it } from "vitest";
import { createScientificEvidenceBundleV4, validateScientificEvidenceBundleV4 } from "./scientificEvidenceBundleV4";

describe("v145 single scientific evidence bundle", () => {
  it("keeps legacy default until every evidence gate passes", () => {
    const blocked = createScientificEvidenceBundleV4({ generatedAt: "2026-01-01T00:00:00Z", tenYearPositionRmsKm: 20, tenYearVelocityRmsMS: 0.05, convergencePositionRmsKm: 0.3, reversalPositionRmsM: 3, reversalVelocityRmsMS: 7e-6 });
    expect(blocked.defaultKernel).toBe("legacy-eih-1pn");
    const promoted = createScientificEvidenceBundleV4({ generatedAt: "2026-01-01T00:00:00Z", tenYearPositionRmsKm: 20, tenYearVelocityRmsMS: 0.05, convergencePositionRmsKm: 0.3, reversalPositionRmsM: 3, reversalVelocityRmsMS: 7e-6, kerrHamiltonianDrift: 1e-10, kerrCarterDrift: 1e-12, turningPointContinuationPassed: true, performancePassed: true, regressionPassed: true });
    expect(promoted.defaultKernel).toBe("relativity-force-model-v2");
    expect(validateScientificEvidenceBundleV4(promoted)).toEqual([]);
  });
});
