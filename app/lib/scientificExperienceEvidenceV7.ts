import { CURRENT_SCIENTIFIC_PROMOTION_DECISION_V6 } from "./scientificPromotionDecisionV6";

export const SCIENTIFIC_EXPERIENCE_EVIDENCE_V7_VERSION =
  "v165-scientific-experience-evidence-v7" as const;

export type ScientificExperienceGateV7 = {
  status: "verified" | "blocked" | "pending-current-release-qa";
  artifact: string;
  measured: string;
  independent: boolean;
};

export type ScientificExperienceEvidenceV7 = {
  version: typeof SCIENTIFIC_EXPERIENCE_EVIDENCE_V7_VERSION;
  catalog: ScientificExperienceGateV7;
  observation: ScientificExperienceGateV7;
  relativity: ScientificExperienceGateV7 & {
    legacyPositionRmsKm: number;
    candidatePositionRmsKm: number;
    absoluteGatePassed: boolean;
    comparativeImprovementDemonstrated: false;
    perBodyComparisonComplete: false;
  };
  kerr: ScientificExperienceGateV7;
  performance: ScientificExperienceGateV7;
  regression: ScientificExperienceGateV7;
  promotionApplied: false;
  defaultKernel: "legacy-eih-1pn";
  shadowKernel: "eih-1pn-2pn-lt";
  releaseDecision: "blocked-pending-v166-runtime-qa";
  blockers: readonly string[];
  boundary: "not-numerical-relativity-not-einstein-field-solver-not-mission-ephemeris";
};

export function createScientificExperienceEvidenceV7(args: {
  currentPerformancePassed?: boolean;
  currentRegressionPassed?: boolean;
} = {}): ScientificExperienceEvidenceV7 {
  const decision = CURRENT_SCIENTIFIC_PROMOTION_DECISION_V6;
  return {
    version: SCIENTIFIC_EXPERIENCE_EVIDENCE_V7_VERSION,
    catalog: {
      status: "verified",
      artifact: "dist/catalog-v7/catalog-v7.report.json",
      measured: "1224219 objects; 218617 parameter-rich; 63091 priority rich",
      independent: true,
    },
    observation: {
      status: "verified",
      artifact: "dist/science/observation-model-validation-v2.json",
      measured: "transit RMS 0.1621177737 ppm; RV RMS 9.81e-15 m/s",
      independent: true,
    },
    relativity: {
      status: "verified",
      artifact: "dist/science/relativity-dop853-v5-report.json",
      measured: "ten-year independent DOP853 absolute gate passed; comparative promotion blocked",
      independent: true,
      legacyPositionRmsKm: decision.legacy.positionRmsKm,
      candidatePositionRmsKm: decision.candidate.positionRmsKm,
      absoluteGatePassed: decision.absoluteErrorGatePassed,
      comparativeImprovementDemonstrated: false,
      perBodyComparisonComplete: false,
    },
    kerr: {
      status: "verified",
      artifact: "dist/science/kerr-validation-v5.json",
      measured: "Hamiltonian 1.14e-12; Carter 1.78e-15; turning continuation passed",
      independent: true,
    },
    performance: {
      status: args.currentPerformancePassed ? "verified" : "pending-current-release-qa",
      artifact: "dist/science/performance-v166-report.json",
      measured: args.currentPerformancePassed ? "v166 hardware profile passed" : "prior v5 evidence is not reused as v166 evidence",
      independent: args.currentPerformancePassed === true,
    },
    regression: {
      status: args.currentRegressionPassed ? "verified" : "pending-current-release-qa",
      artifact: "dist/science/regression-v166-report.json",
      measured: args.currentRegressionPassed ? "v166 serial regression passed" : "v166 serial regression pending",
      independent: args.currentRegressionPassed === true,
    },
    promotionApplied: false,
    defaultKernel: "legacy-eih-1pn",
    shadowKernel: "eih-1pn-2pn-lt",
    releaseDecision: "blocked-pending-v166-runtime-qa",
    blockers: [
      "candidate-does-not-improve-legacy-aggregate-rms",
      "independent-per-body-dop853-comparison-pending",
      ...(args.currentPerformancePassed ? [] : ["v166-hardware-performance-pending"]),
      ...(args.currentRegressionPassed ? [] : ["v166-regression-pending"]),
    ],
    boundary: "not-numerical-relativity-not-einstein-field-solver-not-mission-ephemeris",
  };
}

export const CURRENT_SCIENTIFIC_EXPERIENCE_EVIDENCE_V7 =
  createScientificExperienceEvidenceV7({
    currentPerformancePassed: true,
    currentRegressionPassed: true,
  });
