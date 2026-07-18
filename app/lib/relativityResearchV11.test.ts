import { describe, expect, it } from "vitest";
import {
  RELATIVITY_RESEARCH_V11_VERSION,
  validateRelativityReferenceDisagreementV11,
  validateRelativityVariationalSTMReportV11,
  type RelativityReferenceDisagreementReportV11,
  type RelativityVariationalSTMReportV11,
} from "./relativityResearchV11";

describe("relativity research V11 contracts", () => {
  it("does not mislabel finite-difference batch sensitivity as variational STM", () => {
    const report: RelativityVariationalSTMReportV11 = {
      version: RELATIVITY_RESEARCH_V11_VERSION,
      mode: "legacy-eih-1pn",
      calibrationWindowDays: [0, 30],
      finiteDifferenceSensitivity: {
        method: "finite-difference-batch-sensitivity",
        available: true,
        conditioning: {
          unregularizedConditionNumber: null,
          effectiveRank: null,
          parameterCount: 66,
          rankTolerance: null,
          regularizedConditionNumber: 12,
          regularizationLambda: 1,
        },
      },
      variationalSTM: {
        method: "integrated-variational-stm",
        available: false,
        stateAndPhiIntegratedTogether: false,
        conditioning: null,
      },
      raw: { positionRmsKm: 1, velocityRmsMS: null },
      finiteDifferenceFit: { positionRmsKm: 2, velocityRmsMS: null },
      variationalFit: null,
      blindHoldoutDays: [365, 3652.5],
      rawPropagationReplaced: false,
      promotionDecision: "shadow-retained",
      boundary: "offline-research-only-no-runtime-promotion",
    };
    expect(validateRelativityVariationalSTMReportV11(report)).toEqual({
      semanticsSeparated: true,
      conditioningComplete: false,
      variationalComplete: false,
      passed: false,
    });
  });

  it("accepts a provenance-ready DE440/Horizons disagreement matrix", () => {
    const report: RelativityReferenceDisagreementReportV11 = {
      version: RELATIVITY_RESEARCH_V11_VERSION,
      sources: ["de440-naif", "horizons-frozen"],
      frame: "ICRF-J2000-barycentric",
      timeScale: "TDB",
      checkpoints: [{
        offsetDays: 365,
        bodyCount: 12,
        positionRmsKm: 0.1,
        positionMaxKm: 0.2,
        velocityRmsMS: 0.01,
        velocityMaxMS: 0.02,
      }],
      referenceAgreementQuantifiedBeforeModelResiduals: true,
      provenanceReady: true,
      promotionDecision: "shadow-retained",
      boundary: "offline-reference-disagreement-no-runtime-promotion",
    };
    expect(validateRelativityReferenceDisagreementV11(report).passed).toBe(true);
  });
});
