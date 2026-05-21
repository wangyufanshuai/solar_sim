"use client";

import type { LaunchPhase, LaunchSimState } from "../lib/launchTelemetryTypes";
import type { LocalLaunchPhase, LocalTelemetry } from "../lib/localLaunchPhysics";

type Props = {
  state: LaunchSimState;
  localTelemetry?: LocalTelemetry | null;
};

const PHASE_LABELS: Record<LaunchPhase, string> = {
  idle: "待命",
  prelaunch: "发射前",
  verticalRise: "垂直上升",
  gravityTurn: "重力转弯",
  circularization: "入轨点火",
  coast: "惯性滑行",
  deepSpace: "深空航行",
  descent: "再入下降",
  landed: "着陆",
};

const LOCAL_PHASE_LABELS: Record<LocalLaunchPhase, string> = {
  prelaunch: "发射前",
  srbBurn: "SRB 助推",
  coreBurn: "芯级燃烧",
  staging: "级间分离",
  icpsFirst: "ICPS 入轨",
  orbitCoast: "停车轨道",
  tliBurn: "月球转移点火",
  transLunarCoast: "地月转移",
  marsInjection: "火星注入点火",
  interplanetaryCoast: "行星际巡航",
};

function formatMET(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `T+${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}

function formatAlt(m: number): string {
  if (!Number.isFinite(m)) return "--";
  if (Math.abs(m) >= 1_000_000) return `${(m / 1_000_000).toFixed(1)} Mm`;
  if (Math.abs(m) >= 1_000) return `${(m / 1_000).toFixed(1)} km`;
  return `${m.toFixed(0)} m`;
}

function formatVel(velMs: number): string {
  if (!Number.isFinite(velMs)) return "--";
  return `${(velMs / 1_000).toFixed(2)} km/s`;
}

function formatMach(mach: number): string {
  if (!Number.isFinite(mach)) return "--";
  return `M ${mach.toFixed(2)}`;
}

function formatQ(qPa: number): string {
  if (!Number.isFinite(qPa)) return "--";
  if (qPa >= 1_000_000) return `${(qPa / 1_000_000).toFixed(2)} MPa`;
  if (qPa >= 1_000) return `${(qPa / 1_000).toFixed(1)} kPa`;
  return `${qPa.toFixed(0)} Pa`;
}

function formatMass(kg: number): string {
  if (!Number.isFinite(kg)) return "--";
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(2)} kt`;
  return `${(kg / 1_000).toFixed(1)} t`;
}

function formatGamma(gamma: number): string {
  if (!Number.isFinite(gamma) || gamma === 1.0) return "1.0000000";
  return gamma.toFixed(7);
}

function TelemetryCell({
  label,
  value,
  unit,
  warn,
  wide,
}: {
  label: string;
  value: string;
  unit?: string;
  warn?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={`flex min-w-0 flex-col items-center gap-px px-2 py-0.5 sm:px-3 ${wide ? "min-w-[7rem]" : ""}`}>
      <span className="font-mono text-[7px] uppercase tracking-[0.15em] text-[var(--ui-text-dim)]">{label}</span>
      <span className={`ui-instrument truncate text-[11px] font-semibold leading-none ${warn ? "text-amber-300" : "text-[var(--ui-accent)]"}`}>
        {value}
      </span>
      {unit ? <span className="text-[7px] text-[var(--ui-text-dim)]">{unit}</span> : null}
    </div>
  );
}

function Separator() {
  return <div className="h-6 w-px shrink-0 bg-white/[0.08]" />;
}

function LocalTelemetryStrip({ t }: { t: LocalTelemetry }) {
  const highG = t.gForce > 3;
  const maxQ = t.dynamicPressurePa > 28_000;

  return (
    <div className="flex items-center justify-center gap-1 overflow-x-auto sm:gap-0">
      <TelemetryCell label="任务" value={`${t.missionName} -> ${t.destination}`} wide />
      <Separator />
      <TelemetryCell label="MET" value={formatMET(t.missionTimeS)} wide />
      <Separator />
      <TelemetryCell label="高度" value={formatAlt(t.altitudeKm * 1000)} warn={t.altitudeKm < 0} />
      <Separator />
      <TelemetryCell label="速度" value={formatVel(t.speedKms * 1000)} />
      <Separator />
      <TelemetryCell label="马赫" value={formatMach(t.mach)} warn={t.mach > 20} />
      <Separator />
      <TelemetryCell label="Max-Q" value={formatQ(t.dynamicPressurePa)} warn={maxQ} />
      <Separator />
      <TelemetryCell label="G 载荷" value={`${t.gForce.toFixed(2)} g`} warn={highG} />
      <Separator />
      <TelemetryCell label="燃料" value={`${Math.max(0, t.fuelPercent).toFixed(1)}%`} warn={t.fuelPercent < 12} />
      <Separator />
      <TelemetryCell label="远地点" value={Number.isFinite(t.apoapsisAltKm) ? `${t.apoapsisAltKm.toFixed(0)} km` : "escape"} />
      <Separator />
      <TelemetryCell label="近地点" value={`${t.periapsisAltKm.toFixed(0)} km`} warn={t.periapsisAltKm < 80 && t.phase !== "prelaunch"} />
      <Separator />
      <TelemetryCell label="质量" value={formatMass(t.totalMassKg)} />
      <Separator />
      <TelemetryCell label="推力" value={`${t.thrustKN.toFixed(0)}`} unit="kN" />
      <Separator />
      <TelemetryCell label="阶段" value={LOCAL_PHASE_LABELS[t.phase] || t.phase} wide />
    </div>
  );
}

function WebSocketTelemetryStrip({ state }: { state: LaunchSimState }) {
  const s = state.currentSample;
  if (!s) {
    return <div className="flex h-10 items-center justify-center text-xs text-[var(--ui-text-dim)]">等待发射数据...</div>;
  }

  const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy + s.vz * s.vz);
  const nearMaxQ = s.dynamicPressurePa > state.maxQPa * 0.9 && state.maxQPa > 0;

  return (
    <div className="flex items-center justify-center gap-1 overflow-x-auto sm:gap-0">
      <TelemetryCell label="MET" value={formatMET(s.t)} wide />
      <Separator />
      <TelemetryCell label="高度" value={formatAlt(s.altitudeM)} warn={s.altitudeM < 0} />
      <Separator />
      <TelemetryCell label="速度" value={formatVel(speed)} />
      <Separator />
      <TelemetryCell label="马赫" value={formatMach(s.mach)} warn={s.mach > 20} />
      <Separator />
      <TelemetryCell label="Q" value={formatQ(s.dynamicPressurePa)} warn={nearMaxQ} />
      <Separator />
      <TelemetryCell label="质量" value={formatMass(s.massKg)} />
      <Separator />
      <TelemetryCell label="γ" value={formatGamma(s.lorentzGamma)} />
      <Separator />
      <TelemetryCell label="阶段" value={PHASE_LABELS[state.phase] || state.phase} wide />
      <Separator />
      <TelemetryCell label="倍率" value={`${state.timeScale.toFixed(1)}x`} />
    </div>
  );
}

export default function LaunchTelemetryStrip({ state, localTelemetry }: Props) {
  if (localTelemetry) return <LocalTelemetryStrip t={localTelemetry} />;
  return <WebSocketTelemetryStrip state={state} />;
}
