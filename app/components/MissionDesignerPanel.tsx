"use client";

import { useEffect, useMemo, useState, type MutableRefObject } from "react";
import { BrainCircuit, Clock3, Radio, Route, Satellite, ShieldAlert, Sparkles } from "lucide-react";
import { AU_METERS, DAY_SECONDS } from "../lib/physicalConstants";
import { DEFAULT_MISSION_OPTIONS, optimizeMission } from "../lib/missionOptimizer";
import { explainMissionPlan } from "../lib/missionPlanningAdvisor";
import type { MissionAdvisorReport, MissionBodyId, MissionOptimizationResult, MissionPhysicsSnapshot, MissionPlan } from "../lib/missionDesignerTypes";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";

const BODY_IDS: MissionBodyId[] = ["earth", "venus", "jupiter", "saturn"];
const IS = 1.05;
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

function formatDay(days: number): string {
  return `T+${Math.round(days).toLocaleString()} d`;
}

function formatMass(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)} t` : `${kg.toFixed(0)} kg`;
}

function bodyDisplay(id: MissionBodyId): string {
  return id === "earth" ? "Earth" : id === "venus" ? "Venus" : id === "jupiter" ? "Jupiter" : "Saturn";
}

function validatePlan(plan: MissionPlan | null): string | null {
  if (!plan) return "Run the optimizer to generate a candidate.";
  if (plan.segments.length < 3) return "Trajectory needs at least 3 patched-conic segments.";
  if (!Number.isFinite(plan.totalDeltaVKms) || plan.totalDeltaVKms <= 0) return "Delta-v estimate is invalid.";
  if (!Number.isFinite(plan.durationDays) || plan.durationDays <= 0) return "Mission duration is invalid.";
  if (!Number.isFinite(plan.maxCommunicationDelayMin) || plan.maxCommunicationDelayMin <= 0) return "Communication delay estimate is invalid.";
  if (plan.segments.some((seg) => !Number.isFinite(seg.deltaVKms) || seg.deltaVKms <= 0 || seg.trajectoryAu.length < 8)) {
    return "One or more trajectory segments need review.";
  }
  return null;
}

function buildSnapshot(
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>,
  simDays: number,
): MissionPhysicsSnapshot | null {
  const p = physicsRef.current;
  if (!p) return null;
  const bodies = {} as MissionPhysicsSnapshot["bodies"];
  for (const id of BODY_IDS) {
    const idx = SOLAR_SYSTEM_BODIES.findIndex((b) => b.id === id);
    if (idx < 0 || idx >= p.n) return null;
    const k = idx * 3;
    bodies[id] = {
      id,
      name: bodyDisplay(id),
      massKg: p.mass[idx] ?? SOLAR_SYSTEM_BODIES[idx]!.massKg,
      posAu: [p.posAu[k] ?? 0, p.posAu[k + 1] ?? 0, p.posAu[k + 2] ?? 0],
      velAuPerDay: [
        ((p.velM[k] ?? 0) * DAY_SECONDS) / AU_METERS,
        ((p.velM[k + 1] ?? 0) * DAY_SECONDS) / AU_METERS,
        ((p.velM[k + 2] ?? 0) * DAY_SECONDS) / AU_METERS,
      ],
    };
  }
  return { simDays, bodies };
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-white/[0.07] bg-white/[0.035] px-2 py-1.5">
      <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-[var(--ui-text-dim)]">{label}</div>
      <div className="mt-1 truncate font-mono text-[11px] text-[var(--ui-text-primary)]">{value}</div>
    </div>
  );
}

function advisorStatusLabel(status: DeepSeekStatus, advisor: MissionAdvisorReport): string {
  if (status === "thinking") return "Thinking";
  if (advisor.provider === "deepseek") return `DeepSeek${advisor.model ? ` / ${advisor.model}` : ""}`;
  if (advisor.provider === "fallback") return advisor.error === "not_configured" ? "Not configured" : "Fallback";
  if (status === "error") return "Error";
  return "Local";
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
  const [departureWindowDays, setDepartureWindowDays] = useState(DEFAULT_MISSION_OPTIONS.departureWindowDays);
  const [departureStepDays, setDepartureStepDays] = useState(DEFAULT_MISSION_OPTIONS.departureStepDays);
  const [status, setStatus] = useState("Ready");
  const selectedPlan = useMemo(
    () => result?.plans.find((p) => p.id === selectedPlanId) ?? result?.bestPlan ?? null,
    [result, selectedPlanId],
  );
  const localAdvisor = useMemo(() => explainMissionPlan(selectedPlan), [selectedPlan]);
  const planWarning = useMemo(() => validatePlan(selectedPlan), [selectedPlan]);
  const [advisor, setAdvisor] = useState<MissionAdvisorReport>(localAdvisor);
  const [deepSeekStatus, setDeepSeekStatus] = useState<DeepSeekStatus>("idle");

  useEffect(() => {
    setAdvisor(localAdvisor);
    setDeepSeekStatus("idle");
  }, [localAdvisor]);

  const runOptimize = () => {
    const snapshot = buildSnapshot(physicsRef, simDaysRef.current);
    if (!snapshot) {
      setStatus("Physics state unavailable");
      return;
    }
    const next = optimizeMission(
      {
        ...DEFAULT_MISSION_OPTIONS,
        departureStartDay: simDaysRef.current + 35,
        departureWindowDays,
        departureStepDays,
        includeRelativity: relativityEnabled,
      },
      snapshot,
    );
    onResult(next);
    onSelectPlan(next.bestPlan);
    setStatus(`${next.plans.length} candidates generated`);
  };

  const runDeepSeekAdvisor = async () => {
    if (!selectedPlan) {
      setAdvisor(localAdvisor);
      setDeepSeekStatus("fallback");
      return;
    }
    setDeepSeekStatus("thinking");
    try {
      const res = await fetch("/api/mission-advisor/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = (await res.json()) as { ok?: boolean; report?: MissionAdvisorReport };
      if (!data.report) throw new Error("missing advisor report");
      setAdvisor(data.report);
      setDeepSeekStatus(data.report.provider === "deepseek" ? "deepseek" : "fallback");
    } catch {
      setAdvisor({ ...localAdvisor, provider: "fallback", error: "advisor request failed" });
      setDeepSeekStatus("error");
    }
  };

  return (
    <section className="pointer-events-auto absolute bottom-28 right-4 z-[132] flex max-h-[calc(100dvh-8.5rem)] w-[25rem] flex-col gap-2 overflow-y-auto rounded-[var(--ui-radius)] border-[0.5px] border-[var(--ui-glass-border)] bg-[rgba(5,8,14,0.82)] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-ui">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-[5px] border border-cyan-200/20 bg-cyan-300/[0.07]">
            <Route className="h-4 w-4 text-cyan-200" strokeWidth={IS} />
          </div>
          <div>
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-primary)]">
              Relativistic Space Mission Designer
            </h2>
            <p className="font-mono text-[7px] uppercase tracking-[0.18em] text-[var(--ui-text-dim)]">
              Earth / Venus / Jupiter / Saturn
            </p>
          </div>
        </div>
        <span className="rounded-full bg-white/8 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-cyan-100">
          {status}
        </span>
      </div>

      <div className="rounded-[4px] border border-amber-200/14 bg-amber-200/[0.045] px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-amber-100/82">
        First-pass patched-conics approximation / not high-fidelity optimal control
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {BODY_IDS.map((id, idx) => (
          <div key={id} className="rounded-[4px] border border-cyan-200/10 bg-cyan-200/[0.035] px-2 py-1">
            <div className="font-mono text-[7px] text-[var(--ui-text-dim)]">NODE {idx + 1}</div>
            <div className="mt-0.5 text-[10px] text-cyan-100">{bodyDisplay(id)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--ui-text-dim)]">Search Window</span>
          <input
            type="range"
            min={180}
            max={1200}
            step={30}
            value={departureWindowDays}
            onChange={(e) => setDepartureWindowDays(Number(e.target.value))}
            className="h-px cursor-pointer appearance-none bg-[var(--ui-glass-border)] accent-cyan-200"
          />
          <span className="font-mono text-[10px] text-[var(--ui-text-muted)]">{departureWindowDays} days</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--ui-text-dim)]">Grid Step</span>
          <input
            type="range"
            min={15}
            max={90}
            step={15}
            value={departureStepDays}
            onChange={(e) => setDepartureStepDays(Number(e.target.value))}
            className="h-px cursor-pointer appearance-none bg-[var(--ui-glass-border)] accent-cyan-200"
          />
          <span className="font-mono text-[10px] text-[var(--ui-text-muted)]">{departureStepDays} days</span>
        </label>
      </div>

      <button
        type="button"
        onClick={runOptimize}
        className="flex items-center justify-center gap-2 rounded-[3px] border border-cyan-200/25 bg-cyan-200/[0.07] px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100 transition-colors hover:border-cyan-100/45 hover:bg-cyan-200/[0.12]"
      >
        <Sparkles className="h-3.5 w-3.5" strokeWidth={IS} />
        Optimize Gravity-Assist Mission
      </button>

      {selectedPlan ? (
        <div className="grid grid-cols-4 gap-1.5">
          <Metric label="Delta-v" value={`${selectedPlan.totalDeltaVKms.toFixed(2)} km/s`} />
          <Metric label="Fuel est." value={formatMass(selectedPlan.fuelEstimateKg)} />
          <Metric label="Duration" value={`${(selectedPlan.durationDays / 365.25).toFixed(1)} yr`} />
          <Metric label="Score" value={`${selectedPlan.score.toFixed(0)}/100`} />
        </div>
      ) : null}

      {planWarning ? (
        <div className="rounded-[4px] border border-amber-200/20 bg-amber-200/[0.05] px-2 py-1.5 text-[10px] leading-4 text-amber-100/80">
          {planWarning}
        </div>
      ) : null}

      {result?.plans.length ? (
        <div className="rounded-[4px] border border-white/[0.07] bg-black/20">
          <div className="grid grid-cols-[1fr_4.5rem_4.5rem_4rem] border-b border-white/[0.06] px-2 py-1 font-mono text-[7px] uppercase tracking-[0.14em] text-[var(--ui-text-dim)]">
            <span>Candidate</span>
            <span>DV</span>
            <span>TOF</span>
            <span>Risk</span>
          </div>
          {result.plans.map((plan, idx) => (
            <button
              type="button"
              key={plan.id}
              onClick={() => onSelectPlan(plan)}
              onMouseEnter={() => onSelectPlan(plan)}
              className={`grid w-full grid-cols-[1fr_4.5rem_4.5rem_4rem] px-2 py-1.5 text-left text-[10px] transition-colors ${
                selectedPlan?.id === plan.id ? "bg-cyan-200/[0.10] text-cyan-100" : "text-[var(--ui-text-muted)] hover:bg-white/[0.05]"
              }`}
            >
              <span className="truncate font-mono">#{idx + 1} {formatDay(plan.departureDay - simDaysRef.current)}</span>
              <span className="font-mono">{plan.totalDeltaVKms.toFixed(1)}</span>
              <span className="font-mono">{Math.round(plan.durationDays)}</span>
              <span className="font-mono uppercase">{plan.risk}</span>
            </button>
          ))}
        </div>
      ) : null}

      {selectedPlan ? (
        <div className="grid gap-1.5">
          {selectedPlan.segments.map((seg) => (
            <div key={seg.id} className="rounded-[4px] border border-white/[0.06] bg-white/[0.03] px-2 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-[var(--ui-text-primary)]">
                  {bodyDisplay(seg.fromBody)} {"->"} {bodyDisplay(seg.toBody)}
                </span>
                <span className="font-mono text-[9px] uppercase text-[var(--ui-text-dim)]">{seg.risk}</span>
              </div>
              <div className="mt-1 grid grid-cols-4 gap-1 text-[8px] text-[var(--ui-text-dim)]">
                <span>{Math.round(seg.tofDays)} d</span>
                <span>{seg.deltaVKms.toFixed(2)} km/s</span>
                <span>{seg.turnAngleDeg.toFixed(0)} deg</span>
                <span>{seg.communicationDelayMin.toFixed(1)} min</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-[4px] border border-cyan-200/10 bg-cyan-200/[0.035] p-2">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-cyan-100">
            <BrainCircuit className="h-3 w-3" strokeWidth={IS} />
            Mission Planning AI
          </div>
          <button
            type="button"
            onClick={runDeepSeekAdvisor}
            disabled={!selectedPlan || deepSeekStatus === "thinking"}
            className="rounded-[3px] border border-cyan-200/20 bg-cyan-200/[0.06] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-cyan-100 transition-colors hover:border-cyan-100/40 disabled:pointer-events-none disabled:opacity-45"
          >
            DeepSeek AI
          </button>
        </div>
        <div className="mb-1 flex items-center justify-between gap-2 font-mono text-[7px] uppercase tracking-[0.14em] text-[var(--ui-text-dim)]">
          <span>{advisorStatusLabel(deepSeekStatus, advisor)}</span>
          {advisor.latencyMs ? <span>{advisor.latencyMs} ms</span> : null}
        </div>
        <p className="text-[10px] leading-4 text-[var(--ui-text-muted)]">{advisor.summary}</p>
        <p className="mt-1 text-[10px] leading-4 text-[var(--ui-text-dim)]">{advisor.recommendation}</p>
        <div className="mt-2 grid grid-cols-2 gap-1">
          <Metric label="Comms" value={selectedPlan ? `${selectedPlan.maxCommunicationDelayMin.toFixed(1)} min` : "--"} />
          <Metric label="Kalman sigma" value={selectedPlan ? `${selectedPlan.navigationUncertaintyKm.toFixed(0)} km` : "--"} />
        </div>
        <div className="mt-2 grid gap-1 text-[9px] leading-3 text-[var(--ui-text-dim)]">
          <span className="flex gap-1"><ShieldAlert className="h-3 w-3 shrink-0" strokeWidth={IS} />{advisor.risk}</span>
          <span className="flex gap-1"><Satellite className="h-3 w-3 shrink-0" strokeWidth={IS} />{advisor.gravityAssist}</span>
          <span className="flex gap-1"><Radio className="h-3 w-3 shrink-0" strokeWidth={IS} />{advisor.communication}</span>
          <span className="flex gap-1"><Clock3 className="h-3 w-3 shrink-0" strokeWidth={IS} />{selectedPlan?.grCorrectionNote ?? "1PN report follows the global relativity toggle."}</span>
        </div>
      </div>
    </section>
  );
}
