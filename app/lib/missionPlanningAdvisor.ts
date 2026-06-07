import type { MissionAdvisorReport, MissionPlan } from "./missionDesignerTypes";

function fmt(n: number, digits = 1): string {
  return Number.isFinite(n) ? n.toFixed(digits) : "--";
}

export function explainMissionPlan(plan: MissionPlan | null): MissionAdvisorReport {
  if (!plan) {
    return {
      summary: "Run the optimizer to generate an Earth-Venus-Jupiter-Saturn mission plan.",
      fuelTradeoff: "No candidate has been selected yet.",
      gravityAssist: "Gravity assist analysis is waiting for trajectory candidates.",
      risk: "Risk state unavailable.",
      communication: "Communication delay timeline unavailable.",
      recommendation: "Use the default sequence and search window for the first pass.",
      tags: ["standby"],
      provider: "local",
    };
  }

  const venus = plan.segments.find((s) => s.toBody === "venus");
  const jupiter = plan.segments.find((s) => s.toBody === "jupiter");
  const longest = [...plan.segments].sort((a, b) => b.tofDays - a.tofDays)[0]!;
  const highRisk = plan.segments.filter((s) => s.risk !== "low");
  const failedChecks = plan.constraintChecks.filter((check) => check.status === "fail");
  const warningChecks = plan.constraintChecks.filter((check) => check.status === "warning");
  const bPlaneRisks = plan.segments.filter((seg) => !seg.flybyFeasible || seg.bPlaneRisk !== "low");
  const verifiedLowThrust = plan.lowThrustSolutions.filter((solution) => solution.status === "converged").length;
  const lowThrustNote =
    verifiedLowThrust === plan.segments.length && plan.segments.length > 0
      ? "Verified low-thrust records cover every leg in the precomputed library."
      : "Finite-thrust optimization is not certified for this candidate; an offline Hermite-Simpson solve is required.";
  const tags = [
    plan.validationStatus === "fail" ? "constraint-fail" : plan.validationStatus === "warning" ? "margin-watch" : "audited-pass",
    plan.totalDeltaVKms < 8 ? "low-dv" : "high-energy",
    plan.durationDays > 2300 ? "long-cruise" : "fast-transfer",
    "local-ai",
  ];

  return {
    summary: `The audited Lambert patched-conics candidate is ${plan.validationStatus.toUpperCase()} at ${fmt(plan.score, 0)}/100, with ${fmt(plan.deterministicDeltaVKms)} km/s deterministic delta-v plus ${fmt(plan.dsmReserveDeltaVKms, 2)} km/s DSM reserve over ${fmt(plan.durationDays, 0)} days.`,
    fuelTradeoff:
      plan.durationDays > 2300
        ? `The optimizer accepts a longer ${fmt(plan.durationDays / 365.25, 1)} year cruise; the configured rocket equation estimates ${fmt(plan.fuelEstimateKg / 1000, 1)} t of propellant including DSM reserve.`
        : `This is an aggressive transfer; the configured rocket equation estimates ${fmt(plan.fuelEstimateKg / 1000, 1)} t of propellant, so dry-mass and Isp assumptions dominate the result.`,
    gravityAssist: `Venus requires about ${fmt(venus?.requiredTurnAngleDeg ?? venus?.turnAngleDeg ?? 0, 0)} deg of B-plane turn shaping; Jupiter is the main energy pump at ${fmt(jupiter?.requiredTurnAngleDeg ?? jupiter?.turnAngleDeg ?? 0, 0)} deg before Saturn arrival. Lambert convergence is ${plan.segments.filter((s) => s.lambertConverged).length}/${plan.segments.length} legs.`,
    risk:
      failedChecks.length > 0
        ? `${failedChecks.length} engineering constraint(s) fail: ${failedChecks.map((check) => check.label).join(", ")}.`
        : warningChecks.length > 0
          ? `${warningChecks.length} engineering margin(s) need review: ${warningChecks.map((check) => check.label).join(", ")}.`
          : highRisk.length > 0 || bPlaneRisks.length > 0
            ? `${Math.max(highRisk.length, bPlaneRisks.length)} segment(s) need flyby or navigation review.`
            : "All configured engineering checks retain margin in this preliminary model.",
    communication: `Maximum one-way light time reaches ${fmt(plan.maxCommunicationDelayMin, 1)} min; schedule autonomous fault protection near ${longest.toBody.toUpperCase()} cruise.`,
    recommendation:
      plan.validationStatus === "fail"
        ? "Reject this candidate under the current constraint preset and inspect the failed audit rows before widening the search."
        : plan.totalDeltaVKms > 9
        ? `Extend the departure window or accept a slower Venus-to-Jupiter leg before treating this as a reference design. ${lowThrustNote}`
        : `Keep this as a preliminary reference candidate, then narrow the departure grid and validate it in an external high-fidelity tool. ${lowThrustNote}`,
    tags,
    provider: "local",
  };
}
