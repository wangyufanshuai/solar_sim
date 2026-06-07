import type { MissionAdvisorReport, MissionOptimizationResult, MissionPlan } from "./missionDesignerTypes";

export const MISSION_REPORT_CAVEAT =
  "Preliminary Lambert/Cowell/low-thrust audit only. Not GMAT/STK/SPICE certification.";

export type MissionReportExport = {
  schemaVersion: 1;
  exportedAt: string;
  caveat: typeof MISSION_REPORT_CAVEAT;
  plan: MissionPlan;
  advisor?: MissionAdvisorReport;
  resultSummary?: {
    generatedAt: number;
    feasibleCount: number;
    rejectedCount: number;
    bestPlanId: string | null;
  };
};

function fmt(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "--";
}

function safeFilePart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "mission";
}

export function missionPlanToReportJson(
  plan: MissionPlan,
  advisor?: MissionAdvisorReport,
  result?: MissionOptimizationResult | null,
): MissionReportExport {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    caveat: MISSION_REPORT_CAVEAT,
    plan,
    advisor,
    resultSummary: result
      ? {
          generatedAt: result.generatedAt,
          feasibleCount: result.plans.length,
          rejectedCount: result.rejectedPlans.length,
          bestPlanId: result.bestPlan?.id ?? null,
        }
      : undefined,
  };
}

export function missionPlanToMarkdown(
  plan: MissionPlan,
  advisor?: MissionAdvisorReport,
  result?: MissionOptimizationResult | null,
): string {
  const firstC3 = plan.segments[0]?.c3Km2S2 ?? Number.NaN;
  const failedChecks = plan.constraintChecks.filter((check) => check.status === "fail");
  const warningChecks = plan.constraintChecks.filter((check) => check.status === "warning");
  const rejected = result?.rejectedPlans ?? [];
  const lines = [
    `# ${plan.name} Mission Engineering Report`,
    "",
    MISSION_REPORT_CAVEAT,
    "",
    "## Summary",
    "",
    `- Verdict: ${plan.validationStatus.toUpperCase()}`,
    `- Score: ${fmt(plan.score, 0)}/100`,
    `- Sequence: ${plan.sequence.map((body) => body.toUpperCase()).join(" -> ")}`,
    `- Departure: T+${fmt(plan.departureDay, 1)} d`,
    `- Arrival: T+${fmt(plan.arrivalDay, 1)} d`,
    `- Duration: ${fmt(plan.durationDays, 0)} d`,
    `- Deterministic delta-v: ${fmt(plan.deterministicDeltaVKms)} km/s`,
    `- DSM reserve: ${fmt(plan.dsmReserveDeltaVKms)} km/s`,
    `- Total delta-v: ${fmt(plan.totalDeltaVKms)} km/s`,
    `- Propellant estimate: ${fmt(plan.fuelEstimateKg, 0)} kg`,
    `- C3: ${fmt(firstC3)} km^2/s^2`,
    `- Max communication delay: ${fmt(plan.maxCommunicationDelayMin, 1)} min`,
    "",
    "## Solver Provenance",
    "",
    `- Model level: ${plan.solverProvenance.modelLevel}`,
    `- Gravity model: ${plan.solverProvenance.gravityModel}`,
    `- Ephemeris source: ${plan.solverProvenance.ephemerisSource}`,
    `- Epoch: T+${fmt(plan.solverProvenance.epochSimDays, 1)} d`,
    `- Lambert tolerance: ${plan.solverProvenance.lambertToleranceSeconds} s`,
    `- Converged candidates: ${plan.solverProvenance.convergedCandidateCount}/${plan.solverProvenance.candidateCount}`,
    `- Propagation mode: ${plan.propagationMode}`,
    "",
    "## High-Fidelity Propagation",
    "",
    plan.cowellAudit
      ? [
          `- Integrator: ${plan.cowellAudit.integrator}`,
          `- Force model: ${plan.cowellAudit.forceModel.join("; ")}`,
          `- Accepted/rejected steps: ${plan.cowellAudit.acceptedSteps}/${plan.cowellAudit.rejectedSteps}`,
          `- Maximum position residual: ${fmt(plan.cowellAudit.maxPositionResidualKm, 3)} km`,
          `- Maximum velocity residual: ${fmt(plan.cowellAudit.maxVelocityResidualMps, 3)} m/s`,
          `- Relative energy drift: ${plan.cowellAudit.relativeEnergyDrift.toExponential(3)}`,
          `- Converged: ${plan.cowellAudit.converged ? "yes" : "no"}`,
        ].join("\n")
      : "- Cowell propagation was not run.",
    "",
    "## Covariance",
    "",
    plan.covarianceAudit
      ? [
          `- Method: ${plan.covarianceAudit.method}`,
          `- Saturn arrival 3-sigma: ${fmt(plan.covarianceAudit.saturnArrivalThreeSigmaKm, 1)} km`,
          `- B-plane 3-sigma: ${fmt(plan.covarianceAudit.bPlaneThreeSigmaKm, 1)} km`,
          `- Positive semidefinite: ${plan.covarianceAudit.positiveSemidefinite ? "yes" : "no"}`,
          `- Caveat: ${plan.covarianceAudit.caveat}`,
        ].join("\n")
      : "- Covariance propagation was not run.",
    "",
    "## Ephemeris Audit",
    "",
    `- Mode: ${plan.ephemerisAudit.mode}`,
    `- Source: ${plan.ephemerisAudit.source}`,
    `- Coverage: T+${fmt(plan.ephemerisAudit.coverageSimDays[0], 0)} to T+${fmt(plan.ephemerisAudit.coverageSimDays[1], 0)} d`,
    `- Step: ${plan.ephemerisAudit.stepDays} d`,
    `- Interpolation: ${plan.ephemerisAudit.interpolation}`,
    `- Caveat: ${plan.ephemerisAudit.caveat}`,
    "",
    "| Body | Position delta km | Velocity delta m/s |",
    "| --- | ---: | ---: |",
    ...plan.ephemerisAudit.liveVsTableDelta.map(
      (delta) => `| ${delta.body} | ${fmt(delta.positionDeltaKm, 3)} | ${fmt(delta.velocityDeltaMps, 3)} |`,
    ),
    "",
    "## Constraint Checks",
    "",
    "| Check | Status | Actual | Limit | Margin | Explanation |",
    "| --- | --- | ---: | ---: | ---: | --- |",
    ...plan.constraintChecks.map(
      (check) =>
        `| ${check.label} | ${check.status} | ${fmt(check.actual)} ${check.unit} | ${fmt(check.limit)} ${check.unit} | ${fmt(check.margin)} | ${check.explanation} |`,
    ),
    "",
    "## Legs",
    "",
    "| Leg | TOF d | Delta-v km/s | DSM km/s | C3 | Flyby altitude km | Risk |",
    "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
    ...plan.segments.map(
      (segment) =>
        `| ${segment.fromBody}->${segment.toBody} | ${fmt(segment.tofDays, 0)} | ${fmt(segment.deltaVKms)} | ${fmt(segment.dsmDeltaVKms)} | ${fmt(segment.c3Km2S2)} | ${fmt(segment.periapsisAltitudeKm, 0)} | ${segment.risk} |`,
    ),
    "",
    "## Sensitivity",
    "",
    plan.sensitivitySummary
      ? [
          `- Samples: ${plan.sensitivitySummary.samples}`,
          `- Departure perturbation: +/-${plan.sensitivitySummary.departurePerturbationDays} d`,
          `- TOF perturbation: +/-${fmt(plan.sensitivitySummary.tofPerturbationFraction * 100, 1)}%`,
          `- Delta-v range: ${fmt(plan.sensitivitySummary.deltaVRangeKms[0])} to ${fmt(plan.sensitivitySummary.deltaVRangeKms[1])} km/s`,
          `- C3 range: ${fmt(plan.sensitivitySummary.c3RangeKm2S2[0])} to ${fmt(plan.sensitivitySummary.c3RangeKm2S2[1])} km^2/s^2`,
          `- Minimum flyby margin: ${fmt(plan.sensitivitySummary.minimumFlybyMarginKm, 0)} km`,
          `- Score range: ${fmt(plan.sensitivitySummary.scoreRange[0], 0)} to ${fmt(plan.sensitivitySummary.scoreRange[1], 0)}`,
          `- Robustness score: ${fmt(plan.sensitivitySummary.robustnessScore, 0)}`,
        ].join("\n")
      : "- No sensitivity summary available.",
    "",
    "## Advisor",
    "",
    advisor
      ? [
          `- Provider: ${advisor.provider ?? "local"}${advisor.model ? ` / ${advisor.model}` : ""}`,
          `- Summary: ${advisor.summary}`,
          `- Fuel tradeoff: ${advisor.fuelTradeoff}`,
          `- Gravity assist: ${advisor.gravityAssist}`,
          `- Risk: ${advisor.risk}`,
          `- Communication: ${advisor.communication}`,
          `- Recommendation: ${advisor.recommendation}`,
          `- Tags: ${advisor.tags.join(", ")}`,
        ].join("\n")
      : "- No advisor output attached.",
    "",
    "## Assumptions",
    "",
    ...plan.assumptions.map((assumption) => `- ${assumption}`),
    "",
    "## Rejected Candidates",
    "",
    rejected.length
      ? rejected
          .slice(0, 12)
          .map(
            (candidate) =>
              `- ${candidate.id}: ${candidate.rejectionReasons.join("; ") || "Rejected by engineering audit"} (${fmt(candidate.totalDeltaVKms)} km/s)`,
          )
          .join("\n")
      : "- No rejected candidates were attached to this export.",
    "",
    failedChecks.length || warningChecks.length
      ? `Audit flags: ${failedChecks.length} fail, ${warningChecks.length} warning.`
      : "Audit flags: no failed or warning constraints.",
    "",
  ];
  return lines.flat().join("\n");
}

export function downloadMissionReport(
  plan: MissionPlan,
  format: "json" | "markdown",
  advisor?: MissionAdvisorReport,
  result?: MissionOptimizationResult | null,
) {
  const filenameBase = `${safeFilePart(plan.name)}-${safeFilePart(plan.id)}-mission-report`;
  const text =
    format === "json"
      ? JSON.stringify(missionPlanToReportJson(plan, advisor, result), null, 2)
      : missionPlanToMarkdown(plan, advisor, result);
  const blob = new Blob([text], {
    type: format === "json" ? "application/json" : "text/markdown",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}.${format === "json" ? "json" : "md"}`;
  a.click();
  URL.revokeObjectURL(url);
}
