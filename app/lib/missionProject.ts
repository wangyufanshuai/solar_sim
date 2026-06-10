import type {
  MissionEngineeringConstraints,
  MissionEngineeringMatrixRow,
  MissionExportFormat,
  MissionOptimizationResult,
  MissionOptimizerOptions,
  MissionPlan,
  MissionProject,
  MissionRunRecord,
  MissionScenario,
} from "./missionDesignerTypes";

const PROJECT_STORAGE_KEY = "solar-sim:mission-project:v1";
const CERTIFICATION_CAVEAT =
  "Preliminary aerospace engineering workbench data only. Not GMAT/STK/SPICE certification.";

function isoNow() {
  return new Date().toISOString();
}

function idPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "mission";
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

function fmt(value: number, digits = 6) {
  return Number.isFinite(value) ? value.toFixed(digits) : "";
}

function minimumConstraintMargin(plan: MissionPlan) {
  if (plan.constraintChecks.length === 0) return Number.NaN;
  return Math.min(...plan.constraintChecks.map((check) => check.margin));
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
    schemaVersion: 1,
    id: createId("scenario"),
    name,
    createdAt: now,
    updatedAt: now,
    epochSimDays,
    options,
    constraints,
    selectedPlanId,
    notes: [CERTIFICATION_CAVEAT],
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
  const runs: MissionRunRecord[] = result
    ? [{
        id: createId("run"),
        scenarioId: scenario.id,
        createdAt: now,
        result,
        selectedPlanId: scenario.selectedPlanId,
      }]
    : [];
  return {
    schemaVersion: 1,
    id: createId("project"),
    name,
    createdAt: now,
    updatedAt: now,
    activeScenarioId: scenario.id,
    scenarios: [scenario],
    runs,
  };
}

export function missionProjectToJson(project: MissionProject) {
  return JSON.stringify(project, null, 2);
}

export function parseMissionProjectJson(text: string): MissionProject {
  const parsed = JSON.parse(text) as Partial<MissionProject>;
  if (parsed.schemaVersion !== 1) throw new Error("Unsupported mission project schema");
  if (!parsed.id || !parsed.activeScenarioId || !Array.isArray(parsed.scenarios)) {
    throw new Error("Mission project is missing required fields");
  }
  return {
    schemaVersion: 1,
    id: parsed.id,
    name: parsed.name ?? "Imported Mission Project",
    createdAt: parsed.createdAt ?? isoNow(),
    updatedAt: parsed.updatedAt ?? isoNow(),
    activeScenarioId: parsed.activeScenarioId,
    scenarios: parsed.scenarios as MissionScenario[],
    runs: Array.isArray(parsed.runs) ? parsed.runs as MissionRunRecord[] : [],
  };
}

export function saveMissionProjectLocal(project: MissionProject) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROJECT_STORAGE_KEY, missionProjectToJson(project));
}

export function loadMissionProjectLocal(): MissionProject | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROJECT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return parseMissionProjectJson(raw);
  } catch {
    return null;
  }
}

export function missionEngineeringMatrix(result: MissionOptimizationResult | null): MissionEngineeringMatrixRow[] {
  if (!result) return [];
  return [...result.plans, ...result.rejectedPlans].map((plan) => {
    const lowThrustStatuses = new Set(plan.lowThrustSolutions.map((solution) => solution.status));
    const lowThrustStatusValues = Array.from(lowThrustStatuses);
    const lowThrustStatus =
      plan.missionWorkerProvenance?.lowThrustMatchStatus ??
      (lowThrustStatusValues.length === 0 ? "none" : lowThrustStatusValues.length === 1 ? lowThrustStatusValues[0]! : "mixed");
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
  const lines = [
    "CCSDS_OEM_VERS = 2.0",
    `CREATION_DATE = ${isoNow()}`,
    "ORIGINATOR = Solar Sim preliminary workbench",
    `COMMENT ${CERTIFICATION_CAVEAT}`,
    "META_START",
    `OBJECT_NAME = ${plan.name}`,
    `OBJECT_ID = ${plan.id}`,
    "CENTER_NAME = SUN",
    "REF_FRAME = ECLIPJ2000",
    "TIME_SYSTEM = TDB",
    "META_STOP",
  ];
  for (const segment of plan.segments) {
    for (let index = 0; index < segment.trajectoryAu.length; index += 1) {
      const point = segment.trajectoryAu[index]!;
      const u = index / Math.max(1, segment.trajectoryAu.length - 1);
      const day = segment.departureDay + segment.tofDays * u;
      const velocity =
        u < 0.5 ? segment.departureVelocityAuPerDay : segment.arrivalVelocityAuPerDay;
      lines.push(
        [
          `T+${fmt(day, 6)}d`,
          fmt(point[0], 12),
          fmt(point[1], 12),
          fmt(point[2], 12),
          fmt(velocity[0], 12),
          fmt(velocity[1], 12),
          fmt(velocity[2], 12),
        ].join(" "),
      );
    }
  }
  return `${lines.join("\n")}\n`;
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
    text = missionProjectToJson(project ?? createMissionProject({
      name: "Solar Sim Mission Project",
      scenario: createMissionScenario({
        name: "Imported scenario",
        epochSimDays: plan.solverProvenance.epochSimDays,
        options: {
          sequence: plan.sequence,
          departureStartDay: plan.departureDay,
          departureWindowDays: 0,
          departureStepDays: 1,
          maxCandidates: 1,
          includeRelativity: plan.grCorrectionNote.includes("1PN"),
          ephemerisMode: plan.ephemerisAudit.mode,
          constraintPreset: "aggressive",
        },
        constraints: {
          preset: "aggressive",
          dryMassKg: 0,
          ispSeconds: 0,
          parkingOrbitAltitudeKm: 0,
          maxC3Km2S2: 0,
          maxTotalDeltaVKms: 0,
          maxDsmDeltaVKms: 0,
          maxDurationDays: 0,
          minVenusFlybyAltitudeKm: 0,
          minJupiterFlybyAltitudeKm: 0,
          maxNavigationUncertaintyKm: 0,
        },
        selectedPlanId: plan.id,
      }),
    }));
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
  } else {
    text = missionPlanToCcsdsOemLike(plan);
    extension = "oem";
  }
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${idPart(plan.name)}-${idPart(plan.id)}.${extension}`;
  a.click();
  URL.revokeObjectURL(url);
}
