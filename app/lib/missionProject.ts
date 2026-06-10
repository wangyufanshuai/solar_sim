import { missionPlanToCcsdsOem, missionPlanToCcsdsOpm } from "./missionCcsds";
import {
  missionManeuverEventsToCsv,
  missionStateHistoryToCsv,
  resultWithRiskRows,
} from "./missionReview";
import type {
  MissionComparisonRow,
  MissionEngineeringConstraints,
  MissionEngineeringMatrixRow,
  MissionExportFormat,
  MissionOptimizationResult,
  MissionOptimizerOptions,
  MissionPlan,
  MissionProject,
  MissionProjectV1,
  MissionRunRecord,
  MissionRunRecordV1,
  MissionScenario,
  MissionScenarioV1,
} from "./missionDesignerTypes";

export const LEGACY_PROJECT_STORAGE_KEY = "solar-sim:mission-project:v1";
export const MISSION_PROJECT_SCHEMA_VERSION = 2;
export const MISSION_SOLVER_VERSION = "solar-sim-mission-worker-2";
const CERTIFICATION_CAVEAT =
  "Preliminary aerospace engineering workbench data only. Not GMAT/STK/SPICE certification.";

function isoNow() {
  return new Date().toISOString();
}

function idPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "mission";
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function fmt(value: number, digits = 6) {
  return Number.isFinite(value) ? value.toFixed(digits) : "";
}

function stableHash(value: unknown) {
  const input = JSON.stringify(value, Object.keys(value as object).sort());
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function minimumConstraintMargin(plan: MissionPlan) {
  if (plan.constraintChecks.length === 0) return Number.NaN;
  return Math.min(...plan.constraintChecks.map((check) => check.margin));
}

function selectedPlanForRun(run: MissionRunRecord) {
  return (
    run.result.plans.find((plan) => plan.id === run.selectedPlanId) ??
    run.result.rejectedPlans.find((plan) => plan.id === run.selectedPlanId) ??
    run.result.bestPlan ??
    run.result.rejectedPlans[0] ??
    null
  );
}

function reportReadiness(result: MissionOptimizationResult, selectedPlanId: string | null) {
  const plan =
    result.plans.find((item) => item.id === selectedPlanId) ??
    result.rejectedPlans.find((item) => item.id === selectedPlanId) ??
    result.bestPlan;
  if (!plan || plan.validationStatus === "fail") return "blocked" as const;
  return plan.cowellAudit?.stateHistory.length && plan.covarianceAudit ? "ready" as const : "partial" as const;
}

export function createMissionScenario({
  name,
  epochSimDays,
  options,
  constraints,
  selectedPlanId,
}: {
  name: string;
  epochSimDays: number;
  options: MissionOptimizerOptions;
  constraints: MissionEngineeringConstraints;
  selectedPlanId: string | null;
}): MissionScenario {
  const now = isoNow();
  return {
    schemaVersion: 2,
    id: createId("scenario"),
    name,
    createdAt: now,
    updatedAt: now,
    epochSimDays,
    options,
    constraints: { ...constraints },
    selectedPlanId,
    notes: [CERTIFICATION_CAVEAT],
  };
}

export function createMissionRunRecord({
  scenario,
  result,
  selectedPlanId,
}: {
  scenario: MissionScenario;
  result: MissionOptimizationResult;
  selectedPlanId: string | null;
}): MissionRunRecord {
  const selected =
    result.plans.find((plan) => plan.id === selectedPlanId) ??
    result.rejectedPlans.find((plan) => plan.id === selectedPlanId) ??
    result.bestPlan;
  return {
    schemaVersion: 2,
    id: createId("run"),
    scenarioId: scenario.id,
    createdAt: isoNow(),
    inputHash: stableHash({
      epochSimDays: scenario.epochSimDays,
      options: scenario.options,
      constraints: scenario.constraints,
    }),
    solverVersion: MISSION_SOLVER_VERSION,
    spiceChecksum: selected?.missionWorkerProvenance?.spiceBinarySha256 ?? null,
    constraintsSnapshot: { ...scenario.constraints },
    status: "completed",
    reportReadiness: reportReadiness(result, selectedPlanId),
    result,
    selectedPlanId,
  };
}

export function createMissionProject({
  name,
  scenario,
  result,
}: {
  name: string;
  scenario: MissionScenario;
  result?: MissionOptimizationResult | null;
}): MissionProject {
  const now = isoNow();
  const run = result
    ? createMissionRunRecord({ scenario, result, selectedPlanId: scenario.selectedPlanId })
    : null;
  return {
    schemaVersion: 2,
    id: createId("project"),
    name,
    createdAt: now,
    updatedAt: now,
    activeScenarioId: scenario.id,
    activeRunId: run?.id ?? null,
    scenarios: [scenario],
    runs: run ? [run] : [],
    runNotebooks: [],
    reviewPackages: [],
    riskResults: [],
    artifactRecords: [],
  };
}

export function appendMissionRun(
  project: MissionProject,
  scenarioId: string,
  result: MissionOptimizationResult,
  selectedPlanId: string | null,
) {
  const scenario = project.scenarios.find((item) => item.id === scenarioId);
  if (!scenario) throw new Error("Active mission scenario is unavailable");
  const run = createMissionRunRecord({ scenario, result, selectedPlanId });
  return {
    ...project,
    updatedAt: isoNow(),
    activeScenarioId: scenarioId,
    activeRunId: run.id,
    scenarios: project.scenarios.map((item) =>
      item.id === scenarioId
        ? { ...item, selectedPlanId, updatedAt: isoNow() }
        : item,
    ),
    runs: [...project.runs, run],
  } satisfies MissionProject;
}

export function updateMissionScenarioDefinition(
  project: MissionProject,
  scenarioId: string,
  definition: Pick<MissionScenario, "epochSimDays" | "options" | "constraints" | "selectedPlanId">,
) {
  return {
    ...project,
    updatedAt: isoNow(),
    scenarios: project.scenarios.map((scenario) =>
      scenario.id === scenarioId
        ? { ...scenario, ...definition, constraints: { ...definition.constraints }, updatedAt: isoNow() }
        : scenario,
    ),
  };
}

export function duplicateMissionScenario(project: MissionProject, scenarioId: string) {
  const source = project.scenarios.find((item) => item.id === scenarioId);
  if (!source) return project;
  const duplicate = createMissionScenario({
    name: `${source.name} Copy`,
    epochSimDays: source.epochSimDays,
    options: structuredClone(source.options),
    constraints: structuredClone(source.constraints),
    selectedPlanId: null,
  });
  return {
    ...project,
    updatedAt: isoNow(),
    activeScenarioId: duplicate.id,
    activeRunId: null,
    scenarios: [...project.scenarios, duplicate],
  };
}

export function renameMissionScenario(project: MissionProject, scenarioId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return project;
  return {
    ...project,
    updatedAt: isoNow(),
    scenarios: project.scenarios.map((scenario) =>
      scenario.id === scenarioId ? { ...scenario, name: trimmed, updatedAt: isoNow() } : scenario,
    ),
  };
}

export function deleteMissionScenario(project: MissionProject, scenarioId: string) {
  if (project.scenarios.length <= 1) return project;
  const scenarios = project.scenarios.filter((scenario) => scenario.id !== scenarioId);
  const runs = project.runs.filter((run) => run.scenarioId !== scenarioId);
  const activeScenarioId =
    project.activeScenarioId === scenarioId ? scenarios[0]!.id : project.activeScenarioId;
  const activeRunId = runs.some((run) => run.id === project.activeRunId)
    ? project.activeRunId
    : [...runs].reverse().find((run) => run.scenarioId === activeScenarioId)?.id ?? null;
  return { ...project, scenarios, runs, activeScenarioId, activeRunId, updatedAt: isoNow() };
}

function migrateScenario(scenario: MissionScenarioV1): MissionScenario {
  return { ...scenario, schemaVersion: 2 };
}

function migrateRun(run: MissionRunRecordV1, scenario: MissionScenario): MissionRunRecord {
  return {
    schemaVersion: 2,
    id: run.id,
    scenarioId: run.scenarioId,
    createdAt: run.createdAt,
    inputHash: stableHash({
      epochSimDays: scenario.epochSimDays,
      options: scenario.options,
      constraints: scenario.constraints,
    }),
    solverVersion: "solar-sim-mission-worker-1-migrated",
    spiceChecksum:
      selectedPlanForRun({
        ...run,
        schemaVersion: 2,
        inputHash: "",
        solverVersion: "",
        spiceChecksum: null,
        constraintsSnapshot: scenario.constraints,
        status: "completed",
        reportReadiness: "partial",
      })?.missionWorkerProvenance?.spiceBinarySha256 ?? null,
    constraintsSnapshot: { ...scenario.constraints },
    status: "completed",
    reportReadiness: reportReadiness(run.result, run.selectedPlanId),
    result: run.result,
    selectedPlanId: run.selectedPlanId,
  };
}

export function migrateMissionProjectV1(project: MissionProjectV1): MissionProject {
  const scenarios = project.scenarios.map(migrateScenario);
  const runs = project.runs.map((run) => {
    const scenario = scenarios.find((item) => item.id === run.scenarioId) ?? scenarios[0]!;
    return migrateRun(run, scenario);
  });
  return {
    schemaVersion: 2,
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: isoNow(),
    activeScenarioId: project.activeScenarioId,
    activeRunId: runs.at(-1)?.id ?? null,
    scenarios,
    runs,
  };
}

export function missionProjectToJson(project: MissionProject) {
  return JSON.stringify(project, null, 2);
}

export function parseMissionProjectJson(text: string): MissionProject {
  const parsed = JSON.parse(text) as MissionProject | MissionProjectV1;
  if (parsed.schemaVersion === 1) return migrateMissionProjectV1(parsed);
  if (parsed.schemaVersion !== 2) throw new Error("Unsupported mission project schema");
  if (!parsed.id || !parsed.activeScenarioId || !Array.isArray(parsed.scenarios)) {
    throw new Error("Mission project is missing required fields");
  }
  return {
    ...parsed,
    schemaVersion: 2,
    activeRunId: parsed.activeRunId ?? null,
    runs: Array.isArray(parsed.runs) ? parsed.runs : [],
    runNotebooks: Array.isArray(parsed.runNotebooks) ? parsed.runNotebooks : [],
    reviewPackages: Array.isArray(parsed.reviewPackages) ? parsed.reviewPackages : [],
    riskResults: Array.isArray(parsed.riskResults) ? parsed.riskResults : [],
    artifactRecords: Array.isArray(parsed.artifactRecords) ? parsed.artifactRecords : [],
  };
}

export function missionEngineeringMatrix(result: MissionOptimizationResult | null): MissionEngineeringMatrixRow[] {
  if (!result) return [];
  return [...result.plans, ...result.rejectedPlans].map((plan) => {
    const lowThrustStatuses = new Set(plan.lowThrustSolutions.map((solution) => solution.status));
    const values = Array.from(lowThrustStatuses);
    const lowThrustStatus =
      plan.missionWorkerProvenance?.lowThrustMatchStatus ??
      (values.length === 0 ? "none" : values.length === 1 ? values[0]! : "mixed");
    return {
      planId: plan.id,
      verdict: plan.validationStatus,
      score: plan.score,
      ephemerisSource: plan.solverProvenance.ephemerisSource,
      lambertConvergedLegs: plan.segments.filter((segment) => segment.lambertConverged).length,
      lambertTotalLegs: plan.segments.length,
      cowellResidualKm: plan.cowellAudit?.maxPositionResidualKm ?? null,
      covarianceThreeSigmaKm: plan.covarianceAudit?.saturnArrivalThreeSigmaKm ?? null,
      lowThrustStatus,
      minimumConstraintMargin: minimumConstraintMargin(plan),
      reportReady:
        plan.solverProvenance.candidateCount > 0 &&
        plan.ephemerisAudit.segmentStateSources.length > 0 &&
        plan.validationStatus !== "fail",
    };
  });
}

export function missionComparisonRows(
  project: MissionProject | null,
  runIds: string[],
): MissionComparisonRow[] {
  if (!project) return [];
  const rows = project.runs
    .filter((run) => runIds.includes(run.id))
    .map((run) => {
      const plan = selectedPlanForRun(run);
      const eligible =
        plan &&
        plan.validationStatus !== "fail" &&
        !plan.lowThrustSolutions.some((solution) =>
          solution.status === "seed" || solution.status === "failed" || solution.status === "unavailable",
        );
      return {
        runId: run.id,
        scenarioId: run.scenarioId,
        createdAt: run.createdAt,
        planId: plan?.id ?? null,
        verdict: plan?.validationStatus ?? "unavailable",
        c3Km2S2: plan?.segments[0]?.c3Km2S2 ?? null,
        deltaVKms: plan?.totalDeltaVKms ?? null,
        propellantKg: plan?.fuelEstimateKg ?? null,
        durationDays: plan?.durationDays ?? null,
        robustnessScore: plan?.sensitivitySummary?.robustnessScore ?? null,
        minimumConstraintMargin: plan ? minimumConstraintMargin(plan) : null,
        cowellResidualKm: plan?.cowellAudit?.maxPositionResidualKm ?? null,
        arrivalThreeSigmaKm: plan?.covarianceAudit?.saturnArrivalThreeSigmaKm ?? null,
        monteCarloSuccessRate: null,
        monteCarloDeltaVP50Kms: null,
        monteCarloWorstMargin: null,
        monteCarloDominantFailureReason: null,
        recommended: Boolean(eligible),
      } satisfies MissionComparisonRow;
    });
  const ranked = rows
    .filter((row) => row.recommended)
    .sort((a, b) =>
      (a.deltaVKms ?? Number.POSITIVE_INFINITY) - (b.deltaVKms ?? Number.POSITIVE_INFINITY) ||
      (b.robustnessScore ?? 0) - (a.robustnessScore ?? 0),
    );
  return resultWithRiskRows(
    rows.map((row) => ({ ...row, recommended: row.runId === ranked[0]?.runId })),
    project.riskResults,
  );
}

export function missionLegsToCsv(plan: MissionPlan) {
  const rows = [
    ["leg", "departure_day", "arrival_day", "tof_days", "delta_v_kms", "dsm_kms", "c3_km2_s2", "flyby_altitude_km", "risk"],
    ...plan.segments.map((segment) => [
      `${segment.fromBody}-${segment.toBody}`,
      fmt(segment.departureDay, 3),
      fmt(segment.arrivalDay, 3),
      fmt(segment.tofDays, 3),
      fmt(segment.deltaVKms, 6),
      fmt(segment.dsmDeltaVKms, 6),
      fmt(segment.c3Km2S2, 6),
      fmt(segment.periapsisAltitudeKm, 3),
      segment.risk,
    ]),
  ];
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function missionPlanToCcsdsOemLike(plan: MissionPlan) {
  return missionPlanToCcsdsOem(plan);
}

export function downloadMissionWorkbenchArtifact({
  plan,
  project,
  format,
  reportJson,
  reportMarkdown,
}: {
  plan: MissionPlan;
  project?: MissionProject | null;
  format: MissionExportFormat | "project-json";
  reportJson?: string;
  reportMarkdown?: string;
}) {
  let text = "";
  let extension = "txt";
  if (format === "project-json") {
    if (!project) throw new Error("No mission project is available for export");
    text = missionProjectToJson(project);
    extension = "json";
  } else if (format === "report-json") {
    text = reportJson ?? "{}";
    extension = "json";
  } else if (format === "report-md") {
    text = reportMarkdown ?? "";
    extension = "md";
  } else if (format === "csv") {
    text = missionLegsToCsv(plan);
    extension = "csv";
  } else if (format === "ccsds-oem") {
    text = missionPlanToCcsdsOem(plan);
    extension = "oem";
  } else if (format === "ccsds-opm") {
    text = missionPlanToCcsdsOpm(plan);
    extension = "opm";
  } else if (format === "state-history-csv") {
    text = missionStateHistoryToCsv(plan);
    extension = "csv";
  } else if (format === "maneuver-events-csv") {
    text = missionManeuverEventsToCsv(plan);
    extension = "csv";
  } else if (format === "review-json") {
    text = reportJson ?? "{}";
    extension = "json";
  } else {
    text = reportMarkdown ?? "";
    extension = "md";
  }
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${idPart(plan.name)}-${idPart(plan.id)}.${extension}`;
  anchor.click();
  URL.revokeObjectURL(url);
}
