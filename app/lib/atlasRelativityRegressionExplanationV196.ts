export const ATLAS_RELATIVITY_REGRESSION_EXPLANATION_V196_VERSION =
  "v196-per-body-regression-explanation" as const;

type PerBodyCheckpoint = {
  bodyId: string;
  legacyPositionResidualKm: number;
  candidatePositionResidualKm: number;
  positionDeltaKm: number;
  positionUncertaintyKm: number;
  legacyVelocityResidualMS: number;
  candidateVelocityResidualMS: number;
  velocityDeltaMS: number;
  velocityUncertaintyMS: number;
  noRegression: boolean;
};

type Dop853Report = {
  version: string;
  fixtureSha256: string;
  coordinateFrame: string;
  timeScale: string;
  perBodyComparison: readonly {
    label: string;
    offsetDays: number;
    bodies: readonly PerBodyCheckpoint[];
  }[];
  promotionEvaluation: {
    absoluteErrorGatePassed: boolean;
    aggregateImprovementBeyondUncertainty: boolean;
    perBodyNoRegression: boolean;
    effectIsolationComplete: boolean;
    promotionQualified: boolean;
  };
};

export function createAtlasRelativityRegressionExplanationV196(report: Dop853Report) {
  const regressions = report.perBodyComparison.flatMap((checkpoint) =>
    checkpoint.bodies.filter((body) => !body.noRegression).map((body) => {
      const positionRatio = body.positionDeltaKm > 0
        ? body.positionDeltaKm / Math.max(body.positionUncertaintyKm, Number.MIN_VALUE)
        : 0;
      const velocityRatio = body.velocityDeltaMS > 0
        ? body.velocityDeltaMS / Math.max(body.velocityUncertaintyMS, Number.MIN_VALUE)
        : 0;
      return {
        checkpoint: checkpoint.label,
        offsetDays: checkpoint.offsetDays,
        bodyId: body.bodyId,
        positionDeltaKm: body.positionDeltaKm,
        positionDeltaMeters: body.positionDeltaKm * 1000,
        velocityDeltaMS: body.velocityDeltaMS,
        positionUncertaintyKm: body.positionUncertaintyKm,
        velocityUncertaintyMS: body.velocityUncertaintyMS,
        dominantRegressionMetric: positionRatio >= velocityRatio ? "position" : "velocity",
        maximumRegressionToUncertaintyRatio: Math.max(positionRatio, velocityRatio),
        numericalNoiseExplanationRejected: Math.max(positionRatio, velocityRatio) > 5,
        interpretation:
          "Candidate-local regression is resolved beyond the DOP853 fine/finer uncertainty, but its physical cause is not identified by this comparison alone.",
      } as const;
    }),
  );
  const mercuryTenYear = regressions.find(
    ({ bodyId, offsetDays }) => bodyId === "mercury" && offsetDays === 3652.5,
  ) ?? null;

  return {
    version: ATLAS_RELATIVITY_REGRESSION_EXPLANATION_V196_VERSION,
    sourceReportVersion: report.version,
    fixtureSha256: report.fixtureSha256,
    coordinateFrame: report.coordinateFrame,
    timeScale: report.timeScale,
    regressionCount: regressions.length,
    regressionCheckpointCounts: Object.fromEntries(
      report.perBodyComparison.map((checkpoint) => [
        checkpoint.label,
        regressions.filter(({ offsetDays }) => offsetDays === checkpoint.offsetDays).length,
      ]),
    ),
    regressions,
    mercuryTenYear,
    aggregateContext: report.promotionEvaluation,
    decision: "shadow-retained" as const,
    independentCrossValidation: {
      status: "pending" as const,
      requiredImplementation: "independent-IAS15-or-DE440-Horizons-checkpoint-comparator" as const,
      reason:
        "Aggregate improvement cannot override statistically resolved per-body regressions; an independent implementation is required before causal attribution or promotion qualification.",
    },
    defaultKernel: "legacy-eih-1pn" as const,
    shadowKernel: "eih-1pn-2pn-lt" as const,
    livePhysicsMutated: false as const,
    workerPhysicsMutated: false as const,
  };
}
