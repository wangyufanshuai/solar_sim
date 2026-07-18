export type RelativityCrossValidatorV8 = "scipy-dop853" | "rebound-ias15";

export type ScientificRegressionAttributionV8 =
  | "cross-solver-regression-confirmed"
  | "solver-disagreement"
  | "provenance-mismatch"
  | "inconclusive";

export type RelativityCrossValidationMetricV8 = {
  metric: "position" | "velocity";
  dop853Delta: number;
  ias15Delta: number;
  jointUncertainty: number;
  solverAgreement: boolean;
  horizonsRegressionReproduced: boolean;
};

export type RelativityCrossValidationAttributionV8 = {
  checkpoint: string;
  offsetDays: number;
  bodyId: string;
  classification: ScientificRegressionAttributionV8;
  metrics: readonly RelativityCrossValidationMetricV8[];
};

export type RelativityCrossValidationReportV8 = {
  version: "v199-rebound-ias15-cross-validation-v8";
  fixtureSha256: string;
  coordinateFrame: "DE440-sun-centered-J2000-ecliptic";
  timeScale: "TDB";
  bodyCount: 12;
  modes: readonly [
    "newton",
    "legacy-eih-1pn",
    "legacy-plus-2pn-only",
    "legacy-plus-lense-thirring-only",
    "eih-1pn-2pn-lt",
  ];
  solver: {
    name: "REBOUND";
    version: "4.6.0";
    integrator: "ias15";
    epsilons: readonly [1e-11, 3e-12];
    forceIsVelocityDependent: true;
    newtonianOwner: "rebound-direct-n-body";
    additionalForces: "independent-scalar-eih-1pn-delta-plus-solar-2pn-lense-thirring";
  };
  provenance: {
    fixtureMatchesDop853: boolean;
    reboundWheelSha256: string;
    reboundLicense: "GPL-3.0-or-later";
  };
  rerunHashesMatch: boolean;
  regressionAttributions: readonly RelativityCrossValidationAttributionV8[];
  attributionCounts: Record<ScientificRegressionAttributionV8, number>;
  promotionDecision: "shadow-retained";
  defaultKernel: "legacy-eih-1pn";
  shadowKernel: "eih-1pn-2pn-lt";
  liveStateMutated: false;
  workerStateMutated: false;
};

export function validateRelativityCrossValidationV8(
  report: RelativityCrossValidationReportV8,
) {
  const attributionCount = Object.values(report.attributionCounts).reduce(
    (sum, count) => sum + count,
    0,
  );
  const provenanceReady =
    report.provenance.fixtureMatchesDop853 &&
    /^[a-f0-9]{64}$/.test(report.fixtureSha256) &&
    /^[a-f0-9]{64}$/.test(report.provenance.reboundWheelSha256);
  const solverReady =
    report.solver.name === "REBOUND" &&
    report.solver.version === "4.6.0" &&
    report.solver.integrator === "ias15" &&
    report.solver.forceIsVelocityDependent &&
    report.rerunHashesMatch;
  return {
    provenanceReady,
    solverReady,
    attributionCount,
    allDop853RegressionsAccountedFor:
      attributionCount === 15 && report.regressionAttributions.length === 15,
    confirmedRegressionCount:
      report.attributionCounts["cross-solver-regression-confirmed"],
    decision: "shadow-retained" as const,
    runtimePromotionApplied: false as const,
  };
}
