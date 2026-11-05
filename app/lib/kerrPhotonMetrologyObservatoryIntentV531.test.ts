import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV531 } from "./kerrPhotonMetrologyObservatoryIntentV531";

describe("v531 photon metrology observatory intent", () => {
  it("authorizes one of thirty-three details only in active local-shadow research", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV531("local-shadow", true)).toMatchObject({ observatoryImportAuthorized: true, detailComponentCatalogSize: 33, concurrentDetailSurfaceBudget: 1, dominanceComparisonCount: 4704, scalarizationEvaluationCount: 9898, scientificGeometryInputCount: 300, selectedPreferenceCount: 0, measuredCalibrationFileCount: 0, requiredMeasuredCalibrationFileCount: 6 });
  });
  it("keeps other profiles outside", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV531("standalone-full", true).reason).toBe("standalone-boundary");
    expect(resolveKerrPhotonMetrologyObservatoryIntentV531("vercel-lite", true).reason).toBe("lite-boundary");
    expect(resolveKerrPhotonMetrologyObservatoryIntentV531("local-shadow", false).reason).toBe("inactive");
  });
});
