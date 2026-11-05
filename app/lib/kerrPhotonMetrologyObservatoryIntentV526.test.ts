import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV526 } from "./kerrPhotonMetrologyObservatoryIntentV526";

describe("v526 photon metrology observatory intent", () => {
  it("authorizes one of twenty-eight details only in active local-shadow research", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV526("local-shadow", true)).toMatchObject({ observatoryImportAuthorized: true, detailComponentCatalogSize: 28, concurrentDetailSurfaceBudget: 1, inputChannelCount: 6, observableParameterCount: 2, correlationStressSampleCount: 5, unitBoxVertexCount: 64, measuredCalibrationFileCount: 0, requiredMeasuredCalibrationFileCount: 6 });
  });
  it("keeps standalone, Lite and inactive workbenches outside the artifact", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV526("standalone-full", true).reason).toBe("standalone-boundary");
    expect(resolveKerrPhotonMetrologyObservatoryIntentV526("vercel-lite", true).reason).toBe("lite-boundary");
    expect(resolveKerrPhotonMetrologyObservatoryIntentV526("local-shadow", false).reason).toBe("inactive");
  });
});
