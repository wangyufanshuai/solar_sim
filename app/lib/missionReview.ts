import type {
  MissionArtifactRecord,
  MissionComparisonRow,
  MissionConstraintCheck,
  MissionEngineeringMatrixRow,
  MissionExportFormat,
  MissionMonteCarloConfig,
  MissionMonteCarloResult,
  MissionOptimizationResult,
  MissionPlan,
  MissionProject,
  MissionReviewPackage,
  MissionRunNotebookEntry,
  MissionRunRecord,
  MissionTrajectoryInspectionSample,
} from "./missionDesignerTypes";

export const MISSION_REVIEW_CAVEAT =
  "Preliminary mission design review package only. Not GMAT/STK/SPICE certification.";

export const DEFAULT_MONTE_CARLO_CONFIG: MissionMonteCarloConfig = {
  seed: "solar-sim-review-v1",
  samples: 64,
  departureSigmaDays: 4,
  tofSigmaFraction: 0.018,
  dsmReserveSigmaFraction: 0.12,
  navigationSigmaKm: 350,
  ispSigmaSeconds: 3,
  dryMassSigmaKg: 75,
};

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function stableMissionHash(value: unknown) {
  const json = JSON.stringify(value, (_key, item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    return Object.keys(item)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = (item as Record<string, unknown>)[key];
        return acc;
      }, {});
  });
  let hash = 2166136261;
  for (let index = 0; index < json.length; index += 1) {
    hash ^= json.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function seededRandom(seed: string) {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random: () => number) {
  const u1 = Math.max(1e-9, random());
  const u2 = Math.max(1e-9, random());
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function percentile(values: number[], fraction: number) {
  if (!values.length) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * fraction)));
  return sorted[idx]!;
}

function metric(values: number[], unit: string) {
  return {
    p10: percentile(values, 0.1),
    p50: percentile(values, 0.5),
    p90: percentile(values, 0.9),
    worst: values.length ? Math.max(...values.map((value) => Math.abs(value))) : Number.NaN,
    unit,
  };
}

function marginMetric(values: number[]) {
  return {
    p10: percentile(values, 0.1),
    p50: percentile(values, 0.5),
    p90: percentile(values, 0.9),
    worst: values.length ? Math.min(...values) : Number.NaN,
    unit: "margin",
  };
}

function minimumConstraintMargin(checks: MissionConstraintCheck[]) {
  return checks.length ? Math.min(...checks.map((check) => check.margin)) : Number.NaN;
}

function grade(successRate: number, worstMargin: number) {
  if (successRate >= 0.92 && worstMargin >= 0) return "A";
  if (successRate >= 0.78 && worstMargin >= -0.1) return "B";
  if (successRate >= 0.6) return "C";
  if (successRate >= 0.35) return "D";
  return "F";
}

function addFailure(histogram: Record<string, number>, reason: string) {
  histogram[reason] = (histogram[reason] ?? 0) + 1;
}

function dominantFailureReason(histogram: Record<string, number>) {
  return Object.entries(histogram).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";
}

export function runMissionMonteCarloLite(
  plan: MissionPlan,
  runId: string,
  config: MissionMonteCarloConfig = DEFAULT_MONTE_CARLO_CONFIG,
): MissionMonteCarloResult {
  const random = seededRandom(`${config.seed}:${runId}:${plan.id}`);
  const c3Values: number[] = [];
  const deltaVValues: number[] = [];
  const sigmaValues: number[] = [];
  const marginValues: number[] = [];
  const failReasonHistogram: Record<string, number> = {};
  const baseC3 = plan.segments[0]?.c3Km2S2 ?? 0;
  const baseMargin = minimumConstraintMargin(plan.constraintChecks);
  const baseSigma = plan.covarianceAudit?.saturnArrivalThreeSigmaKm ?? plan.navigationUncertaintyKm;
  let successes = 0;

  for (let sample = 0; sample < config.samples; sample += 1) {
    const departureOffset = gaussian(random) * config.departureSigmaDays;
    const tofScale = 1 + gaussian(random) * config.tofSigmaFraction;
    const dsmScale = 1 + Math.abs(gaussian(random)) * config.dsmReserveSigmaFraction;
    const ispLoss = Math.max(0, -gaussian(random) * config.ispSigmaSeconds);
    const dryMassGain = Math.max(0, gaussian(random) * config.dryMassSigmaKg);
    const navGrowth = Math.abs(gaussian(random)) * config.navigationSigmaKm;
    const deltaV = Math.max(0, plan.totalDeltaVKms * tofScale + plan.dsmReserveDeltaVKms * (dsmScale - 1) + ispLoss / 1400);
    const c3 = Math.max(0, baseC3 + Math.abs(departureOffset) * 0.18 + gaussian(random) * 0.35);
    const sigma = Math.max(0, baseSigma + navGrowth + Math.abs(departureOffset) * 18);
    const margin = baseMargin - Math.abs(departureOffset) * 0.025 - Math.abs(tofScale - 1) * 6 - dryMassGain / 6000;
    c3Values.push(c3);
    deltaVValues.push(deltaV);
    sigmaValues.push(sigma);
    marginValues.push(margin);

    let ok = true;
    if (plan.validationStatus === "fail") {
      addFailure(failReasonHistogram, "baseline-failed");
      ok = false;
    }
    if (c3 > plan.engineeringConstraints.maxC3Km2S2) {
      addFailure(failReasonHistogram, "c3-margin");
      ok = false;
    }
    if (deltaV > plan.engineeringConstraints.maxTotalDeltaVKms) {
      addFailure(failReasonHistogram, "delta-v-margin");
      ok = false;
    }
    if (sigma > plan.engineeringConstraints.maxNavigationUncertaintyKm * 4) {
      addFailure(failReasonHistogram, "navigation-growth");
      ok = false;
    }
    if (margin < 0) {
      addFailure(failReasonHistogram, "constraint-margin");
      ok = false;
    }
    if (plan.lowThrustSolutions.some((solution) => solution.status === "seed" || solution.status === "failed" || solution.status === "unavailable")) {
      addFailure(failReasonHistogram, "finite-thrust-unverified");
    }
    if (ok) successes += 1;
  }

  const successRate = successes / Math.max(1, config.samples);
  const worstMargin = Math.min(...marginValues);
  return {
    id: id("risk"),
    runId,
    planId: plan.id,
    createdAt: nowIso(),
    config: { ...config },
    successRate,
    robustnessGrade: grade(successRate, worstMargin),
    failReasonHistogram,
    c3: metric(c3Values, "km^2/s^2"),
    deltaV: metric(deltaVValues, "km/s"),
    arrivalThreeSigma: metric(sigmaValues, "km"),
    minimumConstraintMargin: marginMetric(marginValues),
    dominantFailureReason: dominantFailureReason(failReasonHistogram),
    preliminaryCaveat: "Monte Carlo Lite uses deterministic design perturbations for preliminary risk review only.",
  };
}

export function selectedPlanForRun(run: MissionRunRecord) {
  return (
    run.result.plans.find((plan) => plan.id === run.selectedPlanId) ??
    run.result.rejectedPlans.find((plan) => plan.id === run.selectedPlanId) ??
    run.result.bestPlan ??
    run.result.rejectedPlans[0] ??
    null
  );
}

export function buildMissionArtifactRecord(
  runId: string,
  format: MissionExportFormat | "project-json",
  text: string,
  label = format,
): MissionArtifactRecord {
  return {
    id: id("artifact"),
    runId,
    createdAt: nowIso(),
    format,
    label,
    checksum: stableMissionHash(text),
    bytes: new Blob([text]).size,
  };
}

export function createMissionNotebookEntry({
  run,
  note,
  decision,
  riskTags,
}: {
  run: MissionRunRecord;
  note: string;
  decision: string;
  riskTags: string[];
}): MissionRunNotebookEntry {
  const plan = selectedPlanForRun(run);
  return {
    id: id("note"),
    runId: run.id,
    createdAt: nowIso(),
    author: "local-user",
    note: note.trim(),
    decision: decision.trim(),
    riskTags: riskTags.map((tag) => tag.trim()).filter(Boolean),
    auditSnapshot: {
      verdict: plan?.validationStatus ?? "unavailable",
      reportReadiness: run.reportReadiness,
      inputHash: run.inputHash,
      solverVersion: run.solverVersion,
      spiceChecksum: run.spiceChecksum,
    },
  };
}

export function appendMissionNotebookEntry(project: MissionProject, entry: MissionRunNotebookEntry): MissionProject {
  return {
    ...project,
    updatedAt: nowIso(),
    runNotebooks: [...(project.runNotebooks ?? []), entry],
  };
}

export function appendMissionRiskResult(project: MissionProject, result: MissionMonteCarloResult): MissionProject {
  return {
    ...project,
    updatedAt: nowIso(),
    riskResults: [...(project.riskResults ?? []).filter((item) => item.runId !== result.runId), result],
  };
}

export function addMissionArtifactRecord(project: MissionProject, artifact: MissionArtifactRecord): MissionProject {
  return {
    ...project,
    updatedAt: nowIso(),
    artifactRecords: [...(project.artifactRecords ?? []), artifact],
  };
}

export function createMissionReviewPackage({
  project,
  run,
  comparisonRows,
  engineeringMatrix,
  monteCarlo,
}: {
  project: MissionProject | null;
  run: MissionRunRecord | null;
  comparisonRows: MissionComparisonRow[];
  engineeringMatrix: MissionEngineeringMatrixRow[];
  monteCarlo: MissionMonteCarloResult | null;
}): MissionReviewPackage {
  const plan = run ? selectedPlanForRun(run) : null;
  const failedChecks = plan?.constraintChecks.filter((check) => check.status !== "pass") ?? [];
  const topRisks = [
    ...failedChecks.slice(0, 4).map((check) => `${check.label}: ${check.explanation}`),
    ...(monteCarlo?.dominantFailureReason && monteCarlo.dominantFailureReason !== "none"
      ? [`Monte Carlo: ${monteCarlo.dominantFailureReason}`]
      : []),
    ...(plan?.lowThrustSolutions.some((solution) => solution.status !== "converged")
      ? ["Finite-thrust solve unavailable or audit-only seed"]
      : []),
  ].slice(0, 6);
  const artifactRecords = project?.artifactRecords?.filter((artifact) => artifact.runId === run?.id) ?? [];
  const ready = Boolean(plan && run?.reportReadiness === "ready" && plan.validationStatus !== "fail");
  return {
    schemaVersion: 1,
    id: id("review"),
    createdAt: nowIso(),
    projectId: project?.id ?? null,
    scenarioId: run?.scenarioId ?? null,
    runId: run?.id ?? null,
    planId: plan?.id ?? null,
    verdict: plan?.validationStatus ?? "unavailable",
    inputHash: run?.inputHash ?? null,
    solverVersion: run?.solverVersion ?? null,
    spiceChecksum: run?.spiceChecksum ?? null,
    reportReadiness: run?.reportReadiness ?? "unavailable",
    comparisonRows,
    engineeringMatrix,
    monteCarlo,
    artifactRecords,
    topRisks: topRisks.length ? topRisks : ["No blocking review risks detected in the selected run."],
    exportReadiness: {
      report: ready,
      ccsdsOem: Boolean(plan?.cowellAudit?.stateHistory.length),
      ccsdsOpm: Boolean(plan?.covarianceAudit),
      reviewPackage: Boolean(run && plan),
    },
    caveat: MISSION_REVIEW_CAVEAT,
  };
}

export function missionReviewPackageToMarkdown(pkg: MissionReviewPackage) {
  const lines = [
    `# Solar Sim Mission Design Review`,
    "",
    pkg.caveat,
    "",
    `- Verdict: ${pkg.verdict}`,
    `- Run: ${pkg.runId ?? "unavailable"}`,
    `- Plan: ${pkg.planId ?? "unavailable"}`,
    `- Input hash: ${pkg.inputHash ?? "unavailable"}`,
    `- Solver: ${pkg.solverVersion ?? "unavailable"}`,
    `- SPICE checksum: ${pkg.spiceChecksum ?? "unverified"}`,
    "",
    "## Top Risks",
    ...pkg.topRisks.map((risk) => `- ${risk}`),
    "",
    "## Export Readiness",
    ...Object.entries(pkg.exportReadiness).map(([key, value]) => `- ${key}: ${value ? "ready" : "blocked"}`),
  ];
  if (pkg.monteCarlo) {
    lines.push(
      "",
      "## Monte Carlo Lite",
      `- Samples: ${pkg.monteCarlo.config.samples}`,
      `- Success rate: ${(pkg.monteCarlo.successRate * 100).toFixed(1)}%`,
      `- Robustness grade: ${pkg.monteCarlo.robustnessGrade}`,
      `- Dominant failure: ${pkg.monteCarlo.dominantFailureReason}`,
      `- Delta-v P10/P50/P90: ${pkg.monteCarlo.deltaV.p10.toFixed(3)} / ${pkg.monteCarlo.deltaV.p50.toFixed(3)} / ${pkg.monteCarlo.deltaV.p90.toFixed(3)} km/s`,
      "",
      pkg.monteCarlo.preliminaryCaveat,
    );
  }
  if (pkg.comparisonRows.length) {
    lines.push("", "## Run Compare", "| Run | Verdict | DV km/s | MC success | Dominant failure |", "| --- | --- | ---: | ---: | --- |");
    for (const row of pkg.comparisonRows) {
      lines.push(
        `| ${row.runId} | ${row.verdict} | ${row.deltaVKms?.toFixed(3) ?? "--"} | ${
          row.monteCarloSuccessRate == null ? "--" : `${(row.monteCarloSuccessRate * 100).toFixed(1)}%`
        } | ${row.monteCarloDominantFailureReason ?? "--"} |`,
      );
    }
  }
  return `${lines.join("\n")}\n`;
}

export function missionStateHistoryToCsv(plan: MissionPlan) {
  const rows = [
    ["segment_id", "epoch_tdb_jd", "sim_day", "x_km", "y_km", "z_km", "vx_km_s", "vy_km_s", "vz_km_s", "mass_kg", "integration_status"],
    ...(plan.cowellAudit?.stateHistory ?? []).map((sample) => [
      sample.segmentId,
      sample.epochTdbJd.toFixed(9),
      sample.simDay.toFixed(6),
      ...sample.positionKm.map((value) => value.toFixed(6)),
      ...sample.velocityKmS.map((value) => value.toFixed(9)),
      sample.massKg.toFixed(3),
      sample.integrationStatus,
    ]),
  ];
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function missionManeuverEventsToCsv(plan: MissionPlan) {
  const rows = [
    ["id", "segment_id", "type", "epoch_tdb_jd", "sim_day", "dvx_km_s", "dvy_km_s", "dvz_km_s", "dv_mag_km_s", "estimated_mass_change_kg", "source"],
    ...(plan.cowellAudit?.maneuverEvents ?? []).map((event) => [
      event.id,
      event.segmentId,
      event.type,
      event.epochTdbJd.toFixed(9),
      event.simDay.toFixed(6),
      ...event.deltaVVectorKmS.map((value) => value.toFixed(9)),
      event.deltaVMagnitudeKmS.toFixed(9),
      event.estimatedMassChangeKg.toFixed(3),
      event.source,
    ]),
  ];
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function trajectoryInspectionSamples(plan: MissionPlan): MissionTrajectoryInspectionSample[] {
  const checks = plan.constraintChecks;
  const nearest = (segmentId: string) =>
    checks.find((check) => check.id.includes(segmentId))?.status ??
    checks.find((check) => check.status !== "pass")?.status ??
    "pass";
  const states = (plan.cowellAudit?.stateHistory ?? [])
    .filter((sample, index) => index === 0 || sample.integrationStatus === "terminal" || index % 128 === 0)
    .slice(0, 32)
    .map<MissionTrajectoryInspectionSample>((sample, index) => ({
      id: `state-${sample.segmentId}-${index}`,
      kind: "state",
      segmentId: sample.segmentId,
      label: `${sample.segmentId} state ${index + 1}`,
      epochTdbJd: sample.epochTdbJd,
      simDay: sample.simDay,
      positionKm: sample.positionKm,
      velocityKmS: sample.velocityKmS,
      massKg: sample.massKg,
      source: sample.integrationStatus,
      nearestConstraintStatus: nearest(sample.segmentId),
    }));
  const maneuvers = (plan.cowellAudit?.maneuverEvents ?? []).map<MissionTrajectoryInspectionSample>((event) => ({
    id: event.id,
    kind: "maneuver",
    segmentId: event.segmentId,
    label: `${event.type.toUpperCase()} ${event.deltaVMagnitudeKmS.toFixed(3)} km/s`,
    epochTdbJd: event.epochTdbJd,
    simDay: event.simDay,
    positionKm: null,
    velocityKmS: null,
    massKg: null,
    deltaVVectorKmS: event.deltaVVectorKmS,
    source: event.source,
    nearestConstraintStatus: nearest(event.segmentId),
  }));
  const flybys = plan.segments.map<MissionTrajectoryInspectionSample>((segment) => ({
    id: `flyby-${segment.id}`,
    kind: segment.toBody === "saturn" ? "state" : "flyby",
    segmentId: segment.id,
    label: segment.toBody === "saturn" ? "Saturn arrival" : `${segment.toBody} flyby`,
    epochTdbJd: 2451545 + segment.arrivalDay,
    simDay: segment.arrivalDay,
    positionKm: null,
    velocityKmS: null,
    massKg: null,
    source: segment.flybyFeasible ? "patched-conics flyby feasible" : "patched-conics flyby risk",
    nearestConstraintStatus: segment.flybyFeasible ? "pass" : "warning",
  }));
  return [...maneuvers, ...flybys, ...states].sort((a, b) => a.simDay - b.simDay);
}

export function resultWithRiskRows(rows: MissionComparisonRow[], risks: MissionMonteCarloResult[] | undefined) {
  return rows.map((row) => {
    const risk = risks?.find((item) => item.runId === row.runId) ?? null;
    return {
      ...row,
      monteCarloSuccessRate: risk?.successRate ?? null,
      monteCarloDeltaVP50Kms: risk?.deltaV.p50 ?? null,
      monteCarloWorstMargin: risk?.minimumConstraintMargin.worst ?? null,
      monteCarloDominantFailureReason: risk?.dominantFailureReason ?? null,
    };
  });
}
