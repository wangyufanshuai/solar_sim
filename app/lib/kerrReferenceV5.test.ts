import { describe, expect, it } from "vitest";
import {
  validateKerrDenseCrossValidationReportV5,
  validateKerrHamiltonianDerivativeReportV5,
} from "./kerrReferenceV5";

describe("Kerr reference V5 contract", () => {
  it("keeps the internal target distinct from the release gate", () => {
    const result = validateKerrHamiltonianDerivativeReportV5({
      version: "v221-kerr-analytic-reference-contract-v5",
      implementation: "closed-form-analytic-spatial-inverse-metric-derivative",
      finiteDifferenceUsedForEvolution: false,
      derivativeReferenceMaxRelativeError: 2e-10,
      maxNullConstraint: 5e-11,
      maxLongDoubleNullConstraint: 4e-11,
      canonicalRayCount: 25,
      deterministicRerun: true,
      internalTargetPassed: false,
      releaseGatePassed: true,
    });
    expect(result.internalTargetPassed).toBe(false);
    expect(result.releaseGatePassed).toBe(true);
    expect(result.passed).toBe(true);
  });

  it("fails closed when the dense screen set is generated but not integrated", () => {
    expect(validateKerrDenseCrossValidationReportV5({
      version: "v221-kerr-analytic-reference-contract-v5",
      canonicalRayCount: 25,
      lowDiscrepancyRayCount: 2048,
      criticalBracketRayCount: 1024,
      executedLowDiscrepancyRayCount: 0,
      executedCriticalBracketRayCount: 0,
      screenManifestSha256: "a".repeat(64),
      classificationAgreement: null,
      criticalCurveMaxErrorPx: null,
      classificationGatePassed: false,
      criticalCurveGatePassed: false,
      promotionDecision: "shadow-retained",
    }).passed).toBe(false);
  });
});
