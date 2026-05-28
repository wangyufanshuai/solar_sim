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
  const tags = [
    plan.risk === "high" ? "risk-watch" : "viable",
    plan.totalDeltaVKms < 8 ? "low-dv" : "high-energy",
    plan.durationDays > 2300 ? "long-cruise" : "fast-transfer",
    "local-ai",
  ];

  return {
    summary: `Best current Lambert patched-conics plan scores ${fmt(plan.score, 0)}/100 with ${fmt(plan.totalDeltaVKms)} km/s deterministic delta-v over ${fmt(plan.durationDays, 0)} days. This is still an approximate first-pass plan, not GMAT/STK validation.`,
    fuelTradeoff:
      plan.durationDays > 2300
        ? `The optimizer accepts a longer ${fmt(plan.durationDays / 365.25, 1)} year cruise to reduce injection energy and keep fuel near ${fmt(plan.fuelEstimateKg / 1000, 1)} t.`
        : `This is an aggressive transfer; fuel estimate is ${fmt(plan.fuelEstimateKg / 1000, 1)} t and should be protected with larger correction margins.`,
    gravityAssist: `Venus requires about ${fmt(venus?.turnAngleDeg ?? 0, 0)} deg of B-plane turn shaping; Jupiter is the main energy pump at ${fmt(jupiter?.turnAngleDeg ?? 0, 0)} deg before Saturn arrival. Lambert convergence is ${plan.segments.filter((s) => s.lambertConverged).length}/${plan.segments.length} legs.`,
    risk:
      highRisk.length > 0
        ? `${highRisk.length} segment(s) need review, mainly flyby altitude, B-plane targeting, and navigation covariance.`
        : "No segment is above low risk in the first-pass Lambert patched-conics model.",
    communication: `Maximum one-way light time reaches ${fmt(plan.maxCommunicationDelayMin, 1)} min; schedule autonomous fault protection near ${longest.toBody.toUpperCase()} cruise.`,
    recommendation:
      plan.totalDeltaVKms > 9
        ? "Extend the departure window or accept a slower Venus-to-Jupiter leg before treating this as a reference design."
        : "Keep this as a reference candidate, then run a narrower Lambert search around the selected departure day. Do not treat it as real mission feasibility.",
    tags,
    provider: "local",
  };
}
