import { describe, expect, it } from "vitest";
import {
  SCIENTIFIC_VISUAL_FIDELITY_V152_BUDGETS,
  createScientificVisualFidelityV152Summary,
} from "./scientificVisualFidelityV152";

describe("v152 data-driven scientific visual fidelity", () => {
  it("keeps rendering budgets bounded and historical contracts frozen", () => {
    const summary = createScientificVisualFidelityV152Summary();
    expect(summary.stellarDrawCallBudget).toBeLessThanOrEqual(6);
    expect(summary.planetDrawCallBudget).toBeLessThanOrEqual(8);
    expect(summary.boundary).toContain("v99");
    expect(SCIENTIFIC_VISUAL_FIDELITY_V152_BUDGETS.jupiter.bandMaskOpacity).toBeLessThan(0.4);
    expect(SCIENTIFIC_VISUAL_FIDELITY_V152_BUDGETS.saturn.frameCoverage).toBeGreaterThanOrEqual(0.46);
    expect(SCIENTIFIC_VISUAL_FIDELITY_V152_BUDGETS.earth.minimumTextureEmissive).toBeLessThanOrEqual(0.12);
  });
});
