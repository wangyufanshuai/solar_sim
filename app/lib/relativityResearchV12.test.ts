import { describe, expect, it } from "vitest";
import {
  RELATIVITY_RESEARCH_V12_VERSION,
  validateRelativityVariationalSTMReportV12,
  type RelativityVariationalSTMReportV12,
} from "./relativityResearchV12";

function report(overrides: Partial<RelativityVariationalSTMReportV12> = {}): RelativityVariationalSTMReportV12 {
  const dop = [365, 3652.5].map((offsetDays) => ({
    offsetDays: offsetDays as 365 | 3652.5,
    positionRmsKm: 1,
    velocityRmsMS: 0.001,
    solver: "scipy-dop853" as const,
  }));
  const ias = dop.map((row) => ({ ...row, solver: "rebound-ias15" as const }));
  return {
    version: RELATIVITY_RESEARCH_V12_VERSION,
    mode: "legacy-eih-1pn",
    bodyCount: 12,
    fullStateDimension: 72,
    independentParameterDimension: 66,
    integratedStateAndPhiDimension: 4824,
    parameterBasis: "barycentric-com-and-momentum-constrained-66d",
    calibrationWindowDays: [0, 30],
    propagation: {
      primary: "scipy-dop853",
      independentCheck: "rebound-ias15",
      stateAndPhiIntegratedTogether: true,
      finiteDifferenceSensitivityKeptSeparate: true,
      ias15Available: true,
    },
    jacobians: {
      newtonAndJ2: "analytic",
      velocityDependentPn: "complex-step",
      directionalValidationMaxRelativeError: 1e-8,
      directionalValidationPassed: true,
    },
    conditioning: {
      unregularizedConditionNumber: 10,
      effectiveRank: 66,
      rankTolerance: 1e-12,
      singularValues: Array.from({ length: 66 }, (_, index) => 67 - index),
      regularizationLambda: 1e-6,
      regularizedConditionNumber: 9,
      covarianceDiagonal: Array.from({ length: 66 }, () => 1),
    },
    nonlinearBatchFit: {
      method: "deterministic-variational-gauss-newton",
      requestedIterations: 3,
      completedIterations: 3,
      iterations: Array.from({ length: 3 }, (_, index) => ({
        iteration: index + 1,
        weightedResidualRmsBeforeStep: 1,
        coefficientNorm: 1,
        maxPositionStepM: 1,
        maxVelocityStepMS: 1e-3,
        effectiveRank: 66,
        unregularizedConditionNumber: 10,
        regularizedConditionNumber: 9,
        functionEvaluations: 10,
      })),
      finalCalibrationFunctionEvaluations: 10,
    },
    calibrationResiduals: Array.from({ length: 30 }, (_, index) => ({
      offsetDays: index + 1,
      weightedRms: 1,
    })),
    leaveOneDayOut: Array.from({ length: 30 }, (_, index) => ({
      offsetDays: index + 1,
      weightedRms: 1,
    })),
    leaveOneDayOutMethod: "regularized-linearized-grouped-press",
    comparisons: { raw: dop, finiteDifferenceFit: dop, variationalSTMFit: dop, ias15VariationalFit: ias },
    provenanceReady: true,
    deterministicRerunPassed: true,
    rankDeficient: false,
    tenYearRegressionDetected: false,
    tenYearRegressionDetails: [{
      solver: "scipy-dop853",
      positionRegression: false,
      velocityRegression: false,
      positionDeltaKm: -1,
      velocityDeltaMS: -1e-3,
    }],
    rawPropagationReplaced: false,
    promotionDecision: "promotion-qualified-not-applied",
    boundary: "offline-integrated-variational-stm-no-runtime-promotion",
    ...overrides,
  };
}

describe("Relativity variational STM V12 contract", () => {
  it("requires an integrated 72 + 72x66 system with full rank", () => {
    expect(validateRelativityVariationalSTMReportV12(report()).passed).toBe(true);
    const dimensionDrift = {
      ...report(),
      integratedStateAndPhiDimension: 72,
      promotionDecision: "shadow-retained",
    } as unknown as RelativityVariationalSTMReportV12;
    expect(validateRelativityVariationalSTMReportV12(dimensionDrift).passed).toBe(false);
  });

  it("keeps any ten-year regression in shadow", () => {
    const result = validateRelativityVariationalSTMReportV12(report({
      tenYearRegressionDetected: true,
      promotionDecision: "shadow-retained",
    }));
    expect(result.decisionConsistent).toBe(true);
    expect(result.passed).toBe(false);
  });
});
