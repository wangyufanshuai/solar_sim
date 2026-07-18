import { describe, expect, it } from "vitest";
import {
  CURRENT_SCIENTIFIC_EXPERIENCE_EVIDENCE_V7,
  createScientificExperienceEvidenceV7,
} from "./scientificExperienceEvidenceV7";

describe("v165 scientific experience evidence v7", () => {
  it("retains the legacy default despite the candidate absolute gate passing", () => {
    const evidence = createScientificExperienceEvidenceV7({ currentPerformancePassed: true, currentRegressionPassed: true });
    expect(evidence.relativity.absoluteGatePassed).toBe(true);
    expect(evidence.relativity.comparativeImprovementDemonstrated).toBe(false);
    expect(evidence.defaultKernel).toBe("legacy-eih-1pn");
    expect(evidence.promotionApplied).toBe(false);
    expect(evidence.boundary).toContain("not-numerical-relativity");
  });

  it("fails closed while current release QA is pending", () => {
    const evidence = createScientificExperienceEvidenceV7();
    expect(evidence.releaseDecision).toBe("blocked-pending-v166-runtime-qa");
    expect(evidence.blockers).toContain("v166-hardware-performance-pending");
  });

  it("records current product QA without promoting the scientific shadow kernel", () => {
    expect(CURRENT_SCIENTIFIC_EXPERIENCE_EVIDENCE_V7.regression.status).toBe("verified");
    expect(CURRENT_SCIENTIFIC_EXPERIENCE_EVIDENCE_V7.performance.status).toBe("verified");
    expect(CURRENT_SCIENTIFIC_EXPERIENCE_EVIDENCE_V7.blockers).not.toContain("v166-regression-pending");
    expect(CURRENT_SCIENTIFIC_EXPERIENCE_EVIDENCE_V7.blockers).not.toContain("v166-hardware-performance-pending");
    expect(CURRENT_SCIENTIFIC_EXPERIENCE_EVIDENCE_V7.blockers).toContain("candidate-does-not-improve-legacy-aggregate-rms");
    expect(CURRENT_SCIENTIFIC_EXPERIENCE_EVIDENCE_V7.defaultKernel).toBe("legacy-eih-1pn");
    expect(CURRENT_SCIENTIFIC_EXPERIENCE_EVIDENCE_V7.releaseDecision).toBe("blocked-pending-v166-runtime-qa");
  });
});
