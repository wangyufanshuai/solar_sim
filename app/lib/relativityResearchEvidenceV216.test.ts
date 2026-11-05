import { describe, expect, it } from "vitest";

import { ATLAS_RELATIVITY_RESEARCH_STATUS_V216 } from "./relativityResearchEvidenceV216";

describe("relativity V216 evidence summary", () => {
  it("keeps research evidence fail closed and raw/fitted results separate", () => {
    const evidence = ATLAS_RELATIVITY_RESEARCH_STATUS_V216;
    expect(evidence.defaultSolarKernel).toBe("legacy-eih-1pn");
    expect(evidence.runtimePromotionApplied).toBe(false);
    expect(evidence.referenceBundle.epochCount).toBe(68);
    expect(evidence.referenceBundle.sourceEpochCount).toBe(34);
    expect(evidence.stm.deterministicRerun).toBe(true);
    expect(evidence.stm.blindHoldoutImproved).toBe(false);
    expect(evidence.stm.legacyFitTenYearPositionRmsKm).toBeGreaterThan(
      evidence.stm.legacyRawTenYearPositionRmsKm,
    );
    expect(evidence.kerrCrossValidation.classificationGatePassed).toBe(true);
    expect(evidence.kerrCrossValidation.invariantGatePassed).toBe(false);
    expect(evidence.kerrCrossValidation.redshiftCrossValidated).toBe(false);
    expect(evidence.kerrCrossValidation.polarizationCrossValidated).toBe(false);
  });
});
