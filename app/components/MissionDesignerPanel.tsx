"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type MutableRefObject } from "react";
import {
  BrainCircuit,
  ChevronDown,
  Copy,
  Clock3,
  Download,
  Radio,
  Route,
  Satellite,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { AU_METERS, DAY_SECONDS } from "../lib/physicalConstants";
import {
  DEFAULT_MISSION_OPTIONS,
  MISSION_CONSTRAINT_PRESETS,
} from "../lib/missionOptimizer";
import { explainMissionPlan } from "../lib/missionPlanningAdvisor";
import { downloadMissionReport, missionPlanToMarkdown, missionPlanToReportJson } from "../lib/missionReport";
import {
  appendMissionRun,
  createMissionProject,
  createMissionScenario,
  deleteMissionScenario,
  downloadMissionWorkbenchArtifact,
  duplicateMissionScenario,
  missionEngineeringMatrix,
  missionComparisonRows,
  parseMissionProjectJson,
  renameMissionScenario,
  updateMissionScenarioDefinition,
} from "../lib/missionProject";
import { loadMissionProject, saveMissionProject } from "../lib/missionProjectStore";
import { runMissionOptimizationWorker } from "../lib/missionHighFidelityClient";
import type {
  MissionAdvisorReport,
  MissionBodyId,
  MissionConstraintPreset,
  MissionEngineeringConstraints,
  MissionExportFormat,
  MissionOptimizationResult,
  MissionPhysicsSnapshot,
  MissionPlan,
  MissionProject,
} from "../lib/missionDesignerTypes";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";

const BODY_IDS: MissionBodyId[] = ["earth", "venus", "jupiter", "saturn"];
const TABS = ["project", "scenario", "run", "compare", "report"] as const;
const IS = 1.05;
type MissionTab = (typeof TABS)[number];
type DeepSeekStatus = "idle" | "thinking" | "deepseek" | "fallback" | "error";

type Props = {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  simDaysRef: MutableRefObject<number>;
  relativityEnabled: boolean;
  result: MissionOptimizationResult | null;
  selectedPlanId: string | null;
  onResult: (result: MissionOptimizationResult) => void;
  onSelectPlan: (plan: MissionPlan | null) => void;
};

function bodyDisplay(id: MissionBodyId): string {
  return id === "earth" ? "Earth" : id === "venus" ? "Venus" : id === "jupiter" ? "Jupiter" : "Saturn";
}

function formatMass(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)} t` : `${kg.toFixed(0)} kg`;
}

function buildSnapshot(
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>,
  simDays: number,
): MissionPhysicsSnapshot | null {
  const physics = physicsRef.current;
  if (!physics) return null;
  const bodies = {} as MissionPhysicsSnapshot["bodies"];
  for (const id of BODY_IDS) {
    const index = SOLAR_SYSTEM_BODIES.findIndex((body) => body.id === id);
    if (index < 0 || index >= physics.n) return null;
    const offset = index * 3;
    bodies[id] = {
      id,
      name: bodyDisplay(id),
      massKg: physics.mass[index] ?? SOLAR_SYSTEM_BODIES[index]!.massKg,
      posAu: [physics.posAu[offset] ?? 0, physics.posAu[offset + 1] ?? 0, physics.posAu[offset + 2] ?? 0],
      velAuPerDay: [
        ((physics.velM[offset] ?? 0) * DAY_SECONDS) / AU_METERS,
        ((physics.velM[offset + 1] ?? 0) * DAY_SECONDS) / AU_METERS,
        ((physics.velM[offset + 2] ?? 0) * DAY_SECONDS) / AU_METERS,
      ],
    };
  }
  return { simDays, bodies };
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[4px] border border-white/[0.07] bg-white/[0.035] px-2 py-1.5">
      <div className="font-mono text-[7px] uppercase tracking-[0.12em] text-[var(--ui-text-dim)]">{label}</div>
      <div className="mt-1 truncate font-mono text-[10px] text-[var(--ui-text-primary)]">{value}</div>
    </div>
  );
}

function NumberField({
  label,
  value,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid grid-cols-[1fr_5rem_2.5rem] items-center gap-1.5 text-[8px] text-[var(--ui-text-dim)]">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-w-0 rounded-[3px] border border-white/10 bg-black/30 px-1.5 py-1 text-right font-mono text-[9px] text-white/80 outline-none focus:border-cyan-200/35"
      />
      <span className="font-mono">{unit}</span>
    </label>
  );
}

function statusClass(status: "pass" | "warning" | "fail"): string {
  return status === "pass"
    ? "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-100"
    : status === "warning"
      ? "border-amber-200/20 bg-amber-200/[0.06] text-amber-100"
      : "border-rose-300/20 bg-rose-300/[0.07] text-rose-100";
}

function advisorStatusLabel(status: DeepSeekStatus, advisor: MissionAdvisorReport): string {
  if (status === "thinking") return "Thinking";
  if (advisor.provider === "deepseek") return `DeepSeek${advisor.model ? ` / ${advisor.model}` : ""}`;
  if (advisor.provider === "fallback") return advisor.error === "not_configured" ? "Not configured" : "Fallback";
  if (status === "error") return "Error";
  return "Local audit";
}

export default function MissionDesignerPanel({
  physicsRef,
  simDaysRef,
  relativityEnabled,
  result,
  selectedPlanId,
  onResult,
  onSelectPlan,
}: Props) {
  const [activeTab, setActiveTab] = useState<MissionTab>("run");
  const [departureWindowDays, setDepartureWindowDays] = useState(DEFAULT_MISSION_OPTIONS.departureWindowDays);
  const [departureStepDays, setDepartureStepDays] = useState(DEFAULT_MISSION_OPTIONS.departureStepDays);
  const [preset, setPreset] = useState<MissionConstraintPreset>("aggressive");
  const [constraints, setConstraints] = useState<MissionEngineeringConstraints>(MISSION_CONSTRAINT_PRESETS.aggressive);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [, startResultTransition] = useTransition();
  const [deepSeekStatus, setDeepSeekStatus] = useState<DeepSeekStatus>("idle");
  const [project, setProject] = useState<MissionProject | null>(null);
  const [compareRunIds, setCompareRunIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedPlan = useMemo(
    () =>
      result?.plans.find((plan) => plan.id === selectedPlanId) ??
      result?.rejectedPlans.find((plan) => plan.id === selectedPlanId) ??
      result?.bestPlan ??
      result?.rejectedPlans[0] ??
      null,
    [result, selectedPlanId],
  );
  const localAdvisor = useMemo(() => explainMissionPlan(selectedPlan), [selectedPlan]);
  const [advisor, setAdvisor] = useState<MissionAdvisorReport>(localAdvisor);
  const matrixRows = useMemo(() => missionEngineeringMatrix(result), [result]);
  const comparisonRows = useMemo(
    () => missionComparisonRows(project, compareRunIds),
    [project, compareRunIds],
  );
  const activeScenario = useMemo(
    () => project?.scenarios.find((scenario) => scenario.id === project.activeScenarioId) ?? null,
    [project],
  );

  useEffect(() => {
    setAdvisor(localAdvisor);
    setDeepSeekStatus("idle");
  }, [localAdvisor]);

  useEffect(() => {
    void loadMissionProject().then((loaded) => {
      setProject(loaded);
      setCompareRunIds(loaded?.runs.slice(-4).map((run) => run.id) ?? []);
    });
  }, []);

  const persistProject = async (next: MissionProject, message?: string) => {
    setProject(next);
    await saveMissionProject(next);
    if (message) setStatus(message);
  };

  const choosePreset = (next: MissionConstraintPreset) => {
    setPreset(next);
    setConstraints(MISSION_CONSTRAINT_PRESETS[next]);
  };

  const patchConstraint = (
    key: keyof Omit<MissionEngineeringConstraints, "preset">,
    value: number,
  ) => {
    if (!Number.isFinite(value)) return;
    setConstraints((current) => ({ ...current, [key]: value }));
  };

  const runOptimize = async () => {
    if (isOptimizing) return;
    const snapshot = buildSnapshot(physicsRef, simDaysRef.current);
    if (!snapshot) {
      setStatus("Physics unavailable");
      return;
    }
    const options = {
      ...DEFAULT_MISSION_OPTIONS,
      departureStartDay: simDaysRef.current + 35,
      departureWindowDays,
      departureStepDays,
      includeRelativity: relativityEnabled,
      ephemerisMode: "spice-table" as const,
      constraintPreset: preset,
      constraints,
    };
    setIsOptimizing(true);
    setStatus("Worker queued");
    try {
      const next = await runMissionOptimizationWorker({
        options,
        physicsSnapshot: snapshot,
        onProgress: (_phase, message) => {
          if (message) setStatus(message);
        },
        onIntermediate: (intermediate) => {
          startResultTransition(() => {
            onResult(intermediate);
            onSelectPlan(intermediate.bestPlan ?? intermediate.rejectedPlans[0] ?? null);
          });
          setStatus(`${intermediate.plans.length} feasible / Cowell running`);
        },
      });
      startResultTransition(() => {
        onResult(next);
        onSelectPlan(next.bestPlan ?? next.rejectedPlans[0] ?? null);
      });
      setStatus(
        next.plans.length
          ? `${next.plans.length} feasible / Cowell audited`
          : `0 feasible / ${next.rejectedPlans.length} rejected`,
      );
      const nextSelectedPlanId = next.bestPlan?.id ?? next.rejectedPlans[0]?.id ?? null;
      if (project && activeScenario) {
        const updated = updateMissionScenarioDefinition(project, activeScenario.id, {
          epochSimDays: snapshot.simDays,
          options,
          constraints,
          selectedPlanId: nextSelectedPlanId,
        });
        const appended = appendMissionRun(updated, activeScenario.id, next, nextSelectedPlanId);
        await persistProject(appended);
        setCompareRunIds((current) => Array.from(new Set([...current, appended.activeRunId!])).slice(-4));
      } else {
        const scenario = createMissionScenario({
          name: "Earth-Venus-Jupiter-Saturn Scenario",
          epochSimDays: snapshot.simDays,
          options,
          constraints,
          selectedPlanId: nextSelectedPlanId,
        });
        const nextProject = createMissionProject({
          name: "Solar Sim Preliminary Mission Workbench",
          scenario,
          result: next,
        });
        await persistProject(nextProject);
        setCompareRunIds(nextProject.runs.map((run) => run.id));
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Mission worker unavailable");
    } finally {
      setIsOptimizing(false);
    }
  };

  const runDeepSeekAdvisor = async () => {
    if (!selectedPlan) return;
    setDeepSeekStatus("thinking");
    try {
      const response = await fetch("/api/mission-advisor/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = (await response.json()) as { report?: MissionAdvisorReport };
      if (!data.report) throw new Error("missing report");
      setAdvisor(data.report);
      setDeepSeekStatus(data.report.provider === "deepseek" ? "deepseek" : "fallback");
    } catch {
      setAdvisor({ ...localAdvisor, provider: "fallback", error: "advisor request failed" });
      setDeepSeekStatus("error");
    }
  };

  const exportReport = (format: "json" | "markdown") => {
    if (!selectedPlan) return;
    downloadMissionReport(selectedPlan, format, advisor, result);
  };

  const exportWorkbench = (format: MissionExportFormat | "project-json") => {
    if (!selectedPlan) return;
    downloadMissionWorkbenchArtifact({
      plan: selectedPlan,
      project,
      format,
      reportJson: JSON.stringify(missionPlanToReportJson(selectedPlan, advisor, result), null, 2),
      reportMarkdown: missionPlanToMarkdown(selectedPlan, advisor, result),
    });
  };

  const saveProject = async () => {
    const scenario = createMissionScenario({
      name: "Earth-Venus-Jupiter-Saturn Scenario",
      epochSimDays: simDaysRef.current,
      options: {
        ...DEFAULT_MISSION_OPTIONS,
        departureStartDay: simDaysRef.current + 35,
        departureWindowDays,
        departureStepDays,
        includeRelativity: relativityEnabled,
        ephemerisMode: "spice-table",
        constraintPreset: preset,
        constraints,
      },
      constraints,
      selectedPlanId: selectedPlan?.id ?? null,
    });
    const next = project && activeScenario
      ? updateMissionScenarioDefinition(project, activeScenario.id, {
          epochSimDays: simDaysRef.current,
          options: scenario.options,
          constraints,
          selectedPlanId: selectedPlan?.id ?? null,
        })
      : createMissionProject({
          name: "Solar Sim Preliminary Mission Workbench",
          scenario,
          result,
        });
    await persistProject(next, "Project saved to IndexedDB");
  };

  const importProject = async (file: File | null) => {
    if (!file) return;
    try {
      const imported = parseMissionProjectJson(await file.text());
      const scenario = imported.scenarios.find((item) => item.id === imported.activeScenarioId) ?? imported.scenarios[0];
      if (scenario) {
        setDepartureWindowDays(scenario.options.departureWindowDays);
        setDepartureStepDays(scenario.options.departureStepDays);
        setPreset(scenario.constraints.preset);
        setConstraints(scenario.constraints);
      }
      const latestRun = [...imported.runs].reverse().find((run) => run.scenarioId === imported.activeScenarioId) ?? imported.runs.at(-1);
      if (latestRun) {
        onResult(latestRun.result);
        const restoredPlan =
          latestRun.result.plans.find((plan) => plan.id === latestRun.selectedPlanId) ??
          latestRun.result.bestPlan ??
          latestRun.result.rejectedPlans[0] ??
          null;
        onSelectPlan(restoredPlan);
      }
      await persistProject(imported);
      setCompareRunIds(imported.runs.slice(-4).map((run) => run.id));
      setStatus("Project imported");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Project import failed");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateScenarioProject = async (next: MissionProject, message: string) => {
    await persistProject(next, message);
  };

  const selectScenario = async (scenarioId: string) => {
    if (!project) return;
    const next = { ...project, activeScenarioId: scenarioId, activeRunId: null };
    const scenario = next.scenarios.find((item) => item.id === scenarioId);
    if (scenario) {
      setDepartureWindowDays(scenario.options.departureWindowDays);
      setDepartureStepDays(scenario.options.departureStepDays);
      setPreset(scenario.constraints.preset);
      setConstraints(scenario.constraints);
    }
    await updateScenarioProject(next, "Scenario activated");
  };

  const toggleCompareRun = (runId: string) => {
    setCompareRunIds((current) => {
      if (current.includes(runId)) return current.filter((id) => id !== runId);
      return [...current, runId].slice(-4);
    });
  };

  return (
    <section
      data-solar-panel="mission"
      className={`pointer-events-auto absolute inset-x-2 bottom-24 z-[132] flex max-h-[62dvh] flex-col overflow-hidden rounded-[var(--ui-radius)] border-[0.5px] border-[var(--ui-glass-border)] bg-[rgba(5,8,14,0.88)] shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-ui sm:inset-x-auto sm:bottom-28 sm:right-4 sm:max-h-[calc(100dvh-8.5rem)] ${activeTab === "compare" ? "sm:w-[44rem]" : "sm:w-[25rem]"}`}
    >
      <header className="shrink-0 border-b border-white/[0.07] p-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[5px] border border-cyan-200/20 bg-cyan-300/[0.07]">
              <Route className="h-4 w-4 text-cyan-200" strokeWidth={IS} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-primary)]">
                Mission Engineering Workbench
              </h2>
              <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-[var(--ui-text-dim)]">
                Preliminary aerospace project workspace
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-[3px] bg-white/8 px-2 py-1 font-mono text-[7px] uppercase text-cyan-100">
            {status}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-5 gap-1 rounded-[4px] bg-black/25 p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-[3px] px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em] ${
                activeTab === tab ? "bg-cyan-200/[0.11] text-cyan-100" : "text-white/42 hover:text-white/70"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 pt-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => void importProject(event.target.files?.[0] ?? null)}
        />
        {activeTab === "project" ? (
          <div className="grid gap-2">
            <div className="rounded-[4px] border border-white/[0.07] bg-white/[0.03] p-2">
              <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/72">Project status</div>
              <div className="mt-1 text-[10px] leading-4 text-white/55">
                <p>{project?.name ?? "No local mission project saved"}</p>
                <p>Scenarios {project?.scenarios.length ?? 0} / runs {project?.runs.length ?? 0}</p>
                <p>Active {project?.activeScenarioId ?? "none"}</p>
              </div>
            </div>
            {project?.scenarios.map((scenario) => {
              const scenarioRuns = project.runs.filter((run) => run.scenarioId === scenario.id);
              const active = scenario.id === project.activeScenarioId;
              return (
                <div
                  key={scenario.id}
                  className={`grid grid-cols-[1fr_auto] items-center gap-2 rounded-[4px] border px-2 py-1.5 ${
                    active
                      ? "border-cyan-200/20 bg-cyan-200/[0.055]"
                      : "border-white/[0.07] bg-white/[0.02]"
                  }`}
                >
                  <button type="button" onClick={() => void selectScenario(scenario.id)} className="min-w-0 text-left">
                    <span className="block truncate text-[10px] text-white/72">{scenario.name}</span>
                    <span className="font-mono text-[7px] uppercase text-white/34">
                      {scenarioRuns.length} immutable runs / T+{scenario.epochSimDays.toFixed(1)} d
                    </span>
                  </button>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      title="Duplicate scenario"
                      onClick={() => void updateScenarioProject(duplicateMissionScenario(project, scenario.id), "Scenario duplicated")}
                      className="grid h-7 w-7 place-items-center rounded-[3px] border border-white/[0.08] text-white/45"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      title="Delete scenario"
                      disabled={project.scenarios.length <= 1}
                      onClick={() => void updateScenarioProject(deleteMissionScenario(project, scenario.id), "Scenario deleted")}
                      className="grid h-7 w-7 place-items-center rounded-[3px] border border-white/[0.08] text-white/45 disabled:opacity-25"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => void saveProject()}
                data-solar-action="mission-project-save"
                className="rounded-[3px] border border-cyan-200/15 bg-cyan-200/[0.04] px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-cyan-100/72"
              >
                Save Project
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                data-solar-action="mission-project-import"
                className="rounded-[3px] border border-white/[0.08] bg-white/[0.035] px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-white/62"
              >
                Import JSON
              </button>
              <button
                type="button"
                onClick={() => selectedPlan && project && exportWorkbench("project-json")}
                data-solar-action="mission-project-export"
                disabled={!selectedPlan || !project}
                className="rounded-[3px] border border-white/[0.08] bg-white/[0.035] px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-white/62 disabled:opacity-35"
              >
                Export Project
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("run")}
                className="rounded-[3px] border border-white/[0.08] bg-white/[0.035] px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-white/62"
              >
                Open Run
              </button>
            </div>
            <div className="rounded-[3px] border border-amber-200/12 bg-amber-200/[0.035] px-2 py-1 font-mono text-[7px] uppercase leading-3 text-amber-100/72">
              Local JSON workspace only. Preliminary design data; not flight certification.
            </div>
          </div>
        ) : null}

        {activeTab === "run" ? (
          <div className="grid gap-2">
            <div className="grid grid-cols-3 gap-1">
              {(["conservative", "nominal", "aggressive"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => choosePreset(value)}
                  className={`rounded-[3px] border px-1.5 py-1.5 font-mono text-[7px] uppercase ${
                    preset === value
                      ? "border-cyan-200/25 bg-cyan-200/[0.09] text-cyan-100"
                      : "border-white/[0.07] text-white/42"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setAdvancedOpen((open) => !open)}
              className="flex items-center justify-between rounded-[3px] border border-white/[0.07] bg-white/[0.025] px-2 py-1.5 font-mono text-[8px] uppercase text-white/55"
            >
              <span className="flex items-center gap-1.5"><SlidersHorizontal className="h-3 w-3" /> Engineering constraints</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
            </button>
            {advancedOpen ? (
              <div className="grid gap-1.5 rounded-[4px] border border-white/[0.07] bg-black/20 p-2">
                <NumberField label="Dry mass" value={constraints.dryMassKg} unit="kg" onChange={(value) => patchConstraint("dryMassKg", value)} />
                <NumberField label="Specific impulse" value={constraints.ispSeconds} unit="s" onChange={(value) => patchConstraint("ispSeconds", value)} />
                <NumberField label="Parking orbit" value={constraints.parkingOrbitAltitudeKm} unit="km" onChange={(value) => patchConstraint("parkingOrbitAltitudeKm", value)} />
                <NumberField label="Maximum C3" value={constraints.maxC3Km2S2} unit="km²/s²" onChange={(value) => patchConstraint("maxC3Km2S2", value)} />
                <NumberField label="Maximum delta-v" value={constraints.maxTotalDeltaVKms} unit="km/s" onChange={(value) => patchConstraint("maxTotalDeltaVKms", value)} />
                <NumberField label="DSM budget" value={constraints.maxDsmDeltaVKms} unit="km/s" onChange={(value) => patchConstraint("maxDsmDeltaVKms", value)} />
                <NumberField label="Mission duration" value={constraints.maxDurationDays} unit="days" onChange={(value) => patchConstraint("maxDurationDays", value)} />
                <NumberField label="Venus altitude" value={constraints.minVenusFlybyAltitudeKm} unit="km" onChange={(value) => patchConstraint("minVenusFlybyAltitudeKm", value)} />
                <NumberField label="Jupiter altitude" value={constraints.minJupiterFlybyAltitudeKm} unit="km" onChange={(value) => patchConstraint("minJupiterFlybyAltitudeKm", value)} />
                <NumberField label="Navigation sigma" value={constraints.maxNavigationUncertaintyKm} unit="km" onChange={(value) => patchConstraint("maxNavigationUncertaintyKm", value)} />
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1 font-mono text-[8px] uppercase text-white/42">
                Search window
                <input type="range" min={180} max={1200} step={30} value={departureWindowDays} onChange={(event) => setDepartureWindowDays(Number(event.target.value))} className="accent-cyan-200" />
                <span className="text-[9px] text-white/65">{departureWindowDays} days</span>
              </label>
              <label className="grid gap-1 font-mono text-[8px] uppercase text-white/42">
                Grid step
                <input type="range" min={15} max={90} step={15} value={departureStepDays} onChange={(event) => setDepartureStepDays(Number(event.target.value))} className="accent-cyan-200" />
                <span className="text-[9px] text-white/65">{departureStepDays} days</span>
              </label>
            </div>

            <button
              type="button"
              onClick={runOptimize}
              data-solar-action="mission-optimize"
              disabled={isOptimizing}
              className="flex items-center justify-center gap-2 rounded-[3px] border border-cyan-200/25 bg-cyan-200/[0.08] px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-100 disabled:cursor-wait disabled:opacity-55"
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={IS} />
              {isOptimizing ? "Mission worker running" : "Run audited search"}
            </button>

            {selectedPlan ? (
              <>
                <div className={`rounded-[4px] border px-2 py-1.5 font-mono text-[8px] uppercase ${statusClass(selectedPlan.validationStatus)}`}>
                  Verdict {selectedPlan.validationStatus} · score {selectedPlan.score.toFixed(0)} · robustness {selectedPlan.sensitivitySummary?.robustnessScore.toFixed(0) ?? "--"}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => exportReport("json")}
                    data-solar-action="mission-export-json"
                    className="flex items-center justify-center gap-1.5 rounded-[3px] border border-white/[0.08] bg-white/[0.035] px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-white/62 hover:text-white/84"
                  >
                    <Download className="h-3 w-3" strokeWidth={IS} />
                    Export JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => exportReport("markdown")}
                    data-solar-action="mission-export-markdown"
                    className="flex items-center justify-center gap-1.5 rounded-[3px] border border-white/[0.08] bg-white/[0.035] px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-white/62 hover:text-white/84"
                  >
                    <Download className="h-3 w-3" strokeWidth={IS} />
                    Export MD
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <Metric label="Deterministic DV" value={`${selectedPlan.deterministicDeltaVKms.toFixed(2)} km/s`} />
                  <Metric label="DSM reserve" value={`${selectedPlan.dsmReserveDeltaVKms.toFixed(2)} km/s`} />
                  <Metric label="Propellant" value={formatMass(selectedPlan.fuelEstimateKg)} />
                  <Metric label="Duration" value={`${(selectedPlan.durationDays / 365.25).toFixed(1)} yr`} />
                  <Metric label="C3" value={`${(selectedPlan.segments[0]?.c3Km2S2 ?? 0).toFixed(1)}`} />
                  <Metric label="Max residual" value={`${Math.max(...selectedPlan.segments.map((segment) => segment.lambertResidual)).toFixed(0)} s`} />
                </div>
              </>
            ) : null}

            {result?.plans.length ? (
              <div className="rounded-[4px] border border-white/[0.07] bg-black/20">
                {result.plans.map((plan, index) => (
                  <button
                    type="button"
                    key={plan.id}
                    onClick={() => onSelectPlan(plan)}
                    className={`grid w-full grid-cols-[1fr_3.4rem_3.4rem_3.4rem] gap-1 border-b border-white/[0.05] px-2 py-1.5 text-left font-mono text-[9px] last:border-0 ${
                      selectedPlan?.id === plan.id ? "bg-cyan-200/[0.09] text-cyan-100" : "text-white/55"
                    }`}
                  >
                    <span>#{index + 1} T+{Math.round(plan.departureDay - simDaysRef.current)}d</span>
                    <span>{plan.totalDeltaVKms.toFixed(1)} DV</span>
                    <span>{plan.sensitivitySummary?.robustnessScore.toFixed(0) ?? "--"} R</span>
                    <span className="uppercase">{plan.validationStatus}</span>
                  </button>
                ))}
              </div>
            ) : null}
            {result?.rejectedPlans.length ? (
              <div className="rounded-[4px] border border-rose-300/10 bg-rose-300/[0.025] p-1.5">
                <div className="mb-1 font-mono text-[7px] uppercase text-rose-100/55">
                  Rejected samples · excluded from ranking
                </div>
                {result.rejectedPlans.slice(0, 3).map((plan) => (
                  <button
                    type="button"
                    key={`rejected-${plan.id}`}
                    onClick={() => onSelectPlan(plan)}
                    className={`grid w-full grid-cols-[1fr_3.4rem] gap-1 px-1 py-1 text-left font-mono text-[8px] ${
                      selectedPlan?.id === plan.id ? "bg-rose-300/[0.08] text-rose-100" : "text-rose-100/48"
                    }`}
                  >
                    <span className="truncate">{plan.rejectionReasons[0] ?? "Engineering audit failed"}</span>
                    <span>{plan.totalDeltaVKms.toFixed(1)} DV</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === "scenario" ? (
          <div className="grid gap-1.5">
            {activeScenario ? (
              <label className="grid gap-1 font-mono text-[8px] uppercase text-white/42">
                Scenario name
                <input
                  value={activeScenario.name}
                  onChange={(event) => {
                    if (!project) return;
                    setProject(renameMissionScenario(project, activeScenario.id, event.target.value));
                  }}
                  onBlur={() => project && void saveMissionProject(project)}
                  className="rounded-[3px] border border-white/10 bg-black/30 px-2 py-1.5 text-[10px] normal-case text-white/75 outline-none focus:border-cyan-200/35"
                />
              </label>
            ) : null}
            <div className="rounded-[4px] border border-white/[0.07] bg-black/20 p-2 text-[9px] leading-4 text-white/52">
              <div className="font-mono text-[8px] uppercase text-white/72">Scenario definition</div>
              <p>Sequence Earth - Venus - Jupiter - Saturn</p>
              <p>Epoch T+{simDaysRef.current.toFixed(1)} d / SPICE table mode</p>
              <p>Preset {preset} / window {departureWindowDays} d / step {departureStepDays} d</p>
            </div>
            {selectedPlan?.segments.map((segment) => (
              <div key={segment.id} className="rounded-[4px] border border-white/[0.07] bg-white/[0.03] p-2">
                <div className="flex justify-between font-mono text-[10px] text-white/82">
                  <span>{bodyDisplay(segment.fromBody)} {"->"} {bodyDisplay(segment.toBody)}</span>
                  <span className="uppercase text-white/42">{segment.risk}</span>
                </div>
                <div className="mt-1.5 grid grid-cols-3 gap-1">
                  <Metric label="TOF" value={`${Math.round(segment.tofDays)} d`} />
                  <Metric label="Delta-v" value={`${segment.deltaVKms.toFixed(2)} km/s`} />
                  <Metric label="DSM" value={`${segment.dsmDeltaVKms.toFixed(2)} km/s`} />
                  <Metric label="v∞ out/in" value={`${segment.departureVinfinityKms.toFixed(1)} / ${segment.arrivalVinfinityKms.toFixed(1)}`} />
                  <Metric label="Turn req/max" value={`${segment.requiredTurnAngleDeg.toFixed(0)}° / ${segment.maxTurnAngleDeg.toFixed(0)}°`} />
                  <Metric label="Flyby alt." value={Number.isFinite(segment.periapsisAltitudeKm) ? `${segment.periapsisAltitudeKm.toFixed(0)} km` : "--"} />
                </div>
              </div>
            )) ?? <div className="text-[10px] text-white/42">Run the audited search to inspect mission legs.</div>}
            {project?.runs.filter((run) => run.scenarioId === project.activeScenarioId).length ? (
              <div className="rounded-[4px] border border-white/[0.07] bg-black/20 p-2">
                <div className="mb-1 font-mono text-[8px] uppercase text-white/65">Immutable run history</div>
                {[...project.runs]
                  .filter((run) => run.scenarioId === project.activeScenarioId)
                  .reverse()
                  .map((run) => (
                    <label key={run.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-t border-white/[0.05] py-1.5 first:border-0">
                      <input
                        type="checkbox"
                        checked={compareRunIds.includes(run.id)}
                        onChange={() => toggleCompareRun(run.id)}
                        className="accent-cyan-200"
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-mono text-[8px] text-white/62">{run.id}</span>
                        <span className="block font-mono text-[7px] text-white/32">
                          {run.inputHash} / {run.solverVersion}
                        </span>
                      </span>
                      <span className={`font-mono text-[7px] uppercase ${run.reportReadiness === "ready" ? "text-emerald-200/65" : "text-amber-100/60"}`}>
                        {run.reportReadiness}
                      </span>
                    </label>
                  ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === "compare" ? (
          <div className="grid gap-2" data-solar-mission-compare>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-mono text-[8px] uppercase text-white/72">Run compare</div>
                <p className="text-[9px] text-white/38">Select 2-4 immutable runs in Scenario.</p>
              </div>
              <span className="font-mono text-[8px] text-cyan-100/65">{comparisonRows.length}/4</span>
            </div>
            {comparisonRows.length >= 2 ? (
              <div className="overflow-x-auto rounded-[4px] border border-white/[0.07] bg-black/20">
                <table className="w-full min-w-[38rem] border-collapse font-mono text-[8px] text-white/55">
                  <thead className="bg-white/[0.035] text-[7px] uppercase text-white/42">
                    <tr>
                      {["Run", "Verdict", "C3", "Delta-v", "Propellant", "Duration", "Robust.", "Min margin", "Cowell", "3sigma"].map((label) => (
                        <th key={label} className="px-2 py-1.5 text-left font-medium">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.runId} className={`border-t border-white/[0.05] ${row.recommended ? "bg-emerald-300/[0.045] text-emerald-100/72" : ""}`}>
                        <td className="max-w-28 truncate px-2 py-1.5">{row.runId}</td>
                        <td className="px-2 py-1.5 uppercase">{row.recommended ? "recommended" : row.verdict}</td>
                        <td className="px-2 py-1.5">{row.c3Km2S2?.toFixed(1) ?? "--"}</td>
                        <td className="px-2 py-1.5">{row.deltaVKms?.toFixed(2) ?? "--"}</td>
                        <td className="px-2 py-1.5">{row.propellantKg ? formatMass(row.propellantKg) : "--"}</td>
                        <td className="px-2 py-1.5">{row.durationDays?.toFixed(0) ?? "--"} d</td>
                        <td className="px-2 py-1.5">{row.robustnessScore?.toFixed(0) ?? "--"}</td>
                        <td className="px-2 py-1.5">{row.minimumConstraintMargin?.toFixed(2) ?? "--"}</td>
                        <td className="px-2 py-1.5">{row.cowellResidualKm?.toExponential(1) ?? "--"}</td>
                        <td className="px-2 py-1.5">{row.arrivalThreeSigmaKm?.toExponential(1) ?? "--"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-[4px] border border-white/[0.07] bg-white/[0.025] p-4 text-center text-[10px] text-white/42">
                Select at least two runs. Failed, seed, and unavailable solutions remain audit-only and cannot be recommended.
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "report" ? (
          <div className="grid gap-2">
            {selectedPlan ? (
              <>
                <div className="grid gap-1">
                  {selectedPlan.constraintChecks.map((check) => (
                    <div key={check.id} className={`rounded-[4px] border px-2 py-1.5 ${statusClass(check.status)}`}>
                      <div className="flex items-center justify-between gap-2 font-mono text-[8px] uppercase">
                        <span>{check.label}</span>
                        <span>{check.status}</span>
                      </div>
                      <div className="mt-1 font-mono text-[8px] opacity-75">
                        {check.actual.toFixed(2)} / {check.limit.toFixed(2)} {check.unit} · margin {check.margin.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-[4px] border border-white/[0.07] bg-black/20 p-2 text-[9px] leading-4 text-white/52">
                  <div className="font-mono text-[8px] uppercase text-white/72">Solver provenance</div>
                  <p className="text-cyan-100/70">{selectedPlan.ephemerisAudit.caveat}</p>
                  <p>{selectedPlan.solverProvenance.gravityModel}</p>
                  <p>{selectedPlan.solverProvenance.ephemerisSource}</p>
                  {selectedPlan.missionWorkerProvenance ? (
                    <p>
                      Worker {selectedPlan.missionWorkerProvenance.status} / SPICE{" "}
                      {selectedPlan.missionWorkerProvenance.spiceBinarySha256?.slice(0, 12) ?? "unverified"}
                    </p>
                  ) : null}
                  <p>Epoch T+{selectedPlan.solverProvenance.epochSimDays.toFixed(1)} d · tolerance {selectedPlan.solverProvenance.lambertToleranceSeconds}s</p>
                  <p>{selectedPlan.solverProvenance.convergedCandidateCount}/{selectedPlan.solverProvenance.candidateCount} sampled candidates converged.</p>
                </div>
                <div className="rounded-[4px] border border-white/[0.07] bg-black/20 p-2 text-[9px] leading-4 text-white/52">
                  <div className="font-mono text-[8px] uppercase text-white/72">Ephemeris audit</div>
                  <p>{selectedPlan.ephemerisAudit.source}</p>
                  <p>Coverage T+{selectedPlan.ephemerisAudit.coverageSimDays[0].toFixed(0)} to T+{selectedPlan.ephemerisAudit.coverageSimDays[1].toFixed(0)} d 路 step {selectedPlan.ephemerisAudit.stepDays} d</p>
                  <p>{selectedPlan.ephemerisAudit.interpolation}</p>
                  {selectedPlan.ephemerisAudit.liveVsTableDelta.map((delta) => (
                    <p key={delta.body}>
                      {bodyDisplay(delta.body)} delta {Number.isFinite(delta.positionDeltaKm) ? delta.positionDeltaKm.toExponential(2) : "--"} km / {Number.isFinite(delta.velocityDeltaMps) ? delta.velocityDeltaMps.toFixed(2) : "--"} m/s
                    </p>
                  ))}
                </div>
                <div className="rounded-[4px] border border-white/[0.07] bg-black/20 p-2 text-[9px] leading-4 text-white/52">
                  <div className="font-mono text-[8px] uppercase text-white/72">High-fidelity propagation</div>
                  <p>Mode {selectedPlan.propagationMode}</p>
                  {selectedPlan.cowellAudit ? (
                    <>
                      <p>{selectedPlan.cowellAudit.integrator} · {selectedPlan.cowellAudit.acceptedSteps} accepted / {selectedPlan.cowellAudit.rejectedSteps} rejected</p>
                      <p>Residual {selectedPlan.cowellAudit.maxPositionResidualKm.toExponential(2)} km / {selectedPlan.cowellAudit.maxVelocityResidualMps.toExponential(2)} m/s</p>
                      <p>Energy drift {selectedPlan.cowellAudit.relativeEnergyDrift.toExponential(2)} · min approach {selectedPlan.cowellAudit.minimumApproachKm.toExponential(2)} km</p>
                    </>
                  ) : <p>Cowell Worker audit pending.</p>}
                  <p>
                    Low-thrust {selectedPlan.missionWorkerProvenance?.lowThrustMatchStatus ?? "none"} /{" "}
                    {selectedPlan.lowThrustSolutions.filter((solution) => solution.status === "converged").length} verified /{" "}
                    {selectedPlan.lowThrustSolutions.length} library records
                  </p>
                  {selectedPlan.missionWorkerProvenance?.message ? (
                    <p>{selectedPlan.missionWorkerProvenance.message}</p>
                  ) : null}
                </div>
                {selectedPlan.covarianceAudit ? (
                  <div className="rounded-[4px] border border-white/[0.07] bg-black/20 p-2 text-[9px] leading-4 text-white/52">
                    <div className="font-mono text-[8px] uppercase text-white/72">Covariance / STM</div>
                    <p>{selectedPlan.covarianceAudit.method}</p>
                    <p>Saturn arrival 3σ {selectedPlan.covarianceAudit.saturnArrivalThreeSigmaKm.toExponential(2)} km</p>
                    <p>B-plane 3σ {selectedPlan.covarianceAudit.bPlaneThreeSigmaKm.toExponential(2)} km · PSD {selectedPlan.covarianceAudit.positiveSemidefinite ? "pass" : "fail"}</p>
                  </div>
                ) : null}
                {matrixRows.length ? (
                  <div className="rounded-[4px] border border-white/[0.07] bg-black/20 p-2 text-[9px] leading-4 text-white/52">
                    <div className="mb-1 font-mono text-[8px] uppercase text-white/72">Engineering audit matrix</div>
                    <div className="grid gap-1">
                      {matrixRows.slice(0, 6).map((row) => (
                        <div
                          key={row.planId}
                          className={`grid grid-cols-[1fr_2.8rem_3.2rem_3.4rem] gap-1 rounded-[3px] border px-1.5 py-1 font-mono text-[7px] uppercase ${
                            row.reportReady
                              ? "border-emerald-300/12 bg-emerald-300/[0.035] text-emerald-100/70"
                              : "border-rose-300/12 bg-rose-300/[0.035] text-rose-100/68"
                          }`}
                        >
                          <span className="truncate">{row.planId}</span>
                          <span>{row.verdict}</span>
                          <span>{row.lambertConvergedLegs}/{row.lambertTotalLegs} L</span>
                          <span>{row.lowThrustStatus}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-1 text-[8px] text-white/38">
                      Failed, seed, and unavailable finite-thrust records remain excluded from feasible ranking.
                    </p>
                  </div>
                ) : null}
                <div className="rounded-[4px] border border-white/[0.07] bg-black/20 p-2 text-[9px] leading-4 text-white/52">
                  <div className="font-mono text-[8px] uppercase text-white/72">Assumptions</div>
                  {selectedPlan.assumptions.map((assumption) => <p key={assumption}>· {assumption}</p>)}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => exportReport("json")}
                    data-solar-action="mission-audit-export-json"
                    className="flex items-center justify-center gap-1.5 rounded-[3px] border border-cyan-200/15 bg-cyan-200/[0.04] px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-cyan-100/72 hover:text-cyan-100"
                  >
                    <Download className="h-3 w-3" strokeWidth={IS} />
                    Export JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => exportReport("markdown")}
                    data-solar-action="mission-audit-export-markdown"
                    className="flex items-center justify-center gap-1.5 rounded-[3px] border border-cyan-200/15 bg-cyan-200/[0.04] px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-cyan-100/72 hover:text-cyan-100"
                  >
                    <Download className="h-3 w-3" strokeWidth={IS} />
                    Export MD
                  </button>
                  <button
                    type="button"
                    onClick={() => exportWorkbench("csv")}
                    data-solar-action="mission-export-csv"
                    className="flex items-center justify-center gap-1.5 rounded-[3px] border border-cyan-200/15 bg-cyan-200/[0.04] px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-cyan-100/72 hover:text-cyan-100"
                  >
                    <Download className="h-3 w-3" strokeWidth={IS} />
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportWorkbench("ccsds-oem")}
                    data-solar-action="mission-export-oem"
                    className="flex items-center justify-center gap-1.5 rounded-[3px] border border-cyan-200/15 bg-cyan-200/[0.04] px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-cyan-100/72 hover:text-cyan-100"
                  >
                    <Download className="h-3 w-3" strokeWidth={IS} />
                    Export CCSDS OEM
                  </button>
                  <button
                    type="button"
                    onClick={() => exportWorkbench("ccsds-opm")}
                    data-solar-action="mission-export-opm"
                    className="flex items-center justify-center gap-1.5 rounded-[3px] border border-cyan-200/15 bg-cyan-200/[0.04] px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-cyan-100/72 hover:text-cyan-100"
                  >
                    <Download className="h-3 w-3" strokeWidth={IS} />
                    Export CCSDS OPM
                  </button>
                </div>
              </>
            ) : <div className="text-[10px] text-white/42">No audit is available until a feasible candidate is selected.</div>}
          </div>
        ) : null}

        {selectedPlan && activeTab === "run" ? (
          <div className="mt-2 rounded-[4px] border border-cyan-200/10 bg-cyan-200/[0.035] p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase text-cyan-100">
                <BrainCircuit className="h-3 w-3" /> Mission advisor
              </span>
              <button
                type="button"
                onClick={runDeepSeekAdvisor}
                data-solar-action="mission-deepseek"
                disabled={deepSeekStatus === "thinking"}
                className="rounded-[3px] border border-cyan-200/20 px-2 py-1 font-mono text-[7px] uppercase text-cyan-100 disabled:opacity-45"
              >
                DeepSeek AI
              </button>
            </div>
            <div className="font-mono text-[7px] uppercase text-white/35">{advisorStatusLabel(deepSeekStatus, advisor)}</div>
            <p className="mt-1 text-[9px] leading-4 text-white/62">{advisor.summary}</p>
            <p className="mt-1 text-[9px] leading-4 text-white/42">{advisor.recommendation}</p>
            <div className="mt-2 grid gap-1 text-[8px] leading-3 text-white/42">
              <span className="flex gap-1"><ShieldAlert className="h-3 w-3 shrink-0" />{advisor.risk}</span>
              <span className="flex gap-1"><Satellite className="h-3 w-3 shrink-0" />{advisor.gravityAssist}</span>
              <span className="flex gap-1"><Radio className="h-3 w-3 shrink-0" />{advisor.communication}</span>
              <span className="flex gap-1"><Clock3 className="h-3 w-3 shrink-0" />{selectedPlan.grCorrectionNote}</span>
            </div>
          </div>
        ) : null}

        <div className="mt-2 rounded-[3px] border border-amber-200/12 bg-amber-200/[0.035] px-2 py-1 font-mono text-[7px] uppercase leading-3 text-amber-100/72">
          Preliminary Lambert/Cowell/low-thrust audit only. Not GMAT/STK/SPICE certification.
        </div>
      </div>
    </section>
  );
}
