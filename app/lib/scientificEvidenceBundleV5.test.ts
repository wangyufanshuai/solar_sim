import { describe, expect, it } from "vitest";
import { createScientificEvidenceBundleV5, validateScientificEvidenceBundleV5 } from "./scientificEvidenceBundleV5";

const artifact = { artifact: "dist/science/report.json", sha256: "a".repeat(64), independent: true, passed: true };

describe("v150 fail-closed scientific evidence bundle V5", () => {
  it("does not promote without independent data, observation, ephemeris, Kerr, performance and regression artifacts", () => {
    const blocked = createScientificEvidenceBundleV5({ generatedAt: "2026-07-13T00:00:00Z", ephemeris: { ...artifact, durationDays: 3_652.5 } });
    expect(blocked.defaultKernel).toBe("legacy-eih-1pn");
    expect(blocked.blockers).toContain("dataCatalog");
  });

  it("records eligibility but keeps the live kernel frozen until promotion is explicitly applied", () => {
    const eligible = createScientificEvidenceBundleV5({
      generatedAt: "2026-07-13T00:00:00Z",
      dataCatalog: artifact,
      observationModels: { ...artifact, transitRmsPpm: 12, radialVelocityRmsMS: 0.01 },
      ephemeris: { ...artifact, durationDays: 3_652.5, tenYearPositionRmsKm: 100, tenYearVelocityRmsMS: 0.1, convergencePositionRmsKm: 0.2, reversalPositionRmsM: 1, reversalVelocityRmsMS: 1e-5 },
      kerr: { ...artifact, maxHamiltonianDrift: 1e-10, maxCarterDrift: 1e-12, turningPointContinuationPassed: true },
      performance: artifact,
      regression: artifact,
    });
    expect(eligible.promotionEligible).toBe(true);
    expect(eligible.promotionApplied).toBe(false);
    expect(eligible.decision).toBe("promotion-eligible-shadow-retained");
    expect(eligible.defaultKernel).toBe("legacy-eih-1pn");
    expect(validateScientificEvidenceBundleV5(eligible)).toEqual([]);
  });

  it("permits an explicit promotion only when every checksummed independent gate passes", () => {
    const promoted = createScientificEvidenceBundleV5({
      generatedAt: "2026-07-13T00:00:00Z",
      dataCatalog: artifact,
      observationModels: { ...artifact, transitRmsPpm: 12, radialVelocityRmsMS: 0.01 },
      ephemeris: { ...artifact, durationDays: 3_652.5, tenYearPositionRmsKm: 100, tenYearVelocityRmsMS: 0.1, convergencePositionRmsKm: 0.2, reversalPositionRmsM: 1, reversalVelocityRmsMS: 1e-5 },
      kerr: { ...artifact, maxHamiltonianDrift: 1e-10, maxCarterDrift: 1e-12, turningPointContinuationPassed: true },
      performance: artifact,
      regression: artifact,
      applyPromotion: true,
    });
    expect(promoted.promotionApplied).toBe(true);
    expect(promoted.defaultKernel).toBe("relativity-force-model-v2");
    expect(validateScientificEvidenceBundleV5(promoted)).toEqual([]);
  });

  it("rejects a short ephemeris report even if a caller marks it passed", () => {
    const bundle = createScientificEvidenceBundleV5({
      generatedAt: "2026-07-13T00:00:00Z",
      dataCatalog: artifact, observationModels: artifact,
      ephemeris: { ...artifact, durationDays: 30 },
      kerr: artifact, performance: artifact, regression: artifact,
    });
    expect(validateScientificEvidenceBundleV5(bundle)).toContain("ephemeris-not-ten-year");
  });
});
