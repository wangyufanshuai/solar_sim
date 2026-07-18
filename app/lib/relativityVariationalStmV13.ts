export const RELATIVITY_VARIATIONAL_STM_GATE_V13_VERSION =
  "v243-relativity-variational-stm-gate-v13" as const;

export type RelativityVariationalSTMGateReportV13 = {
  version: typeof RELATIVITY_VARIATIONAL_STM_GATE_V13_VERSION;
  jacobianModes: readonly [
    "newton",
    "legacy-eih-1pn",
    "full-eih-1pn-j2",
    "full-eih-1pn-2pn-lt",
  ];
  fitModes: readonly ["legacy-eih-1pn", "full-eih-1pn-2pn-lt"];
  calibrationDays: 30;
  gaussNewtonIterations: 1;
  holdoutDays: readonly [365];
  propagators: readonly ["scipy-dop853", "rebound-ias15"];
  reruns: readonly ["A", "B"];
  gatePassed: boolean;
  failures: readonly string[];
  canonicalEvidenceSha256: string;
  promotionDecision: "shadow-retained";
};

export type RelativityVariationalSTMReportV13 = {
  version: "v241-relativity-variational-stm-release-v13";
  profile: "release";
  reruns: readonly ["A", "B"];
  tenYearHoldoutDays: 3652.5;
  effectiveRank: 66 | number;
  deterministicRerunPassed: boolean;
  promotionDecision: "shadow-retained" | "promotion-qualified-not-applied";
  canonicalEvidenceSha256: string;
};

export type RelativityRegressionAttributionV13 =
  | "initial-state-fit-resolved"
  | "cross-solver-regression-confirmed"
  | "solver-disagreement"
  | "provenance-mismatch"
  | "inconclusive";

