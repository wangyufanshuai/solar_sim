"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Gauge, MapPin, Rocket, Shield, Timer, Users, X } from "lucide-react";
import type { LaunchConfig } from "../lib/launchTelemetryTypes";
import {
  LAUNCH_MISSION_PROFILES,
  LAUNCH_SITES,
  configFromMissionProfile,
  getLaunchMissionProfile,
} from "../lib/launchMissionProfiles";

type Props = {
  onLaunch: (config: LaunchConfig) => void;
  onAbort: () => void;
  isStreaming: boolean;
};

const IS = 1.0;

const fieldCls =
  "w-full bg-transparent border-b-[0.5px] border-[var(--ui-glass-border)] px-0 py-1 font-mono text-[10px] uppercase text-[var(--ui-text-muted)] outline-none transition-colors focus:border-[var(--ui-accent)] appearance-none cursor-pointer";
const labelCls = "flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.15em] text-[var(--ui-text-dim)] mb-0.5";

function formatAlt(m: number): string {
  if (m >= 1_000_000) return `${(m / 1_000_000).toFixed(1)} Mm`;
  return `${(m / 1_000).toFixed(0)} km`;
}

function formatMass(kg: number | undefined): string {
  if (!kg) return "N/A";
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(1)} kt`;
  return `${(kg / 1_000).toFixed(1)} t`;
}

function StatusLight({ color, label, blink }: { color: string; label: string; blink?: boolean }) {
  return (
    <div className="flex items-center gap-1" title={label}>
      <Circle
        className={`h-[5px] w-[5px] ${blink ? "animate-pulse" : ""}`}
        style={{ fill: color, color }}
        strokeWidth={0}
      />
      <span className="font-mono text-[7px] uppercase tracking-wider text-[var(--ui-text-dim)]">{label}</span>
    </div>
  );
}

export default function LaunchControlPanel({ onLaunch, onAbort, isStreaming }: Props) {
  const [profileId, setProfileId] = useState("artemis_ii");
  const selectedProfile = useMemo(() => getLaunchMissionProfile(profileId), [profileId]);
  const [site, setSite] = useState(selectedProfile.defaultSite);
  const [targetAlt, setTargetAlt] = useState(selectedProfile.targetAltitudeM);
  const [timeScale, setTimeScale] = useState(selectedProfile.defaultTimeScale);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (isStreaming) return;
    setSite(selectedProfile.defaultSite);
    setTargetAlt(selectedProfile.targetAltitudeM);
    setTimeScale(selectedProfile.defaultTimeScale);
  }, [isStreaming, selectedProfile]);

  const handleLaunch = () => setCountdown(5);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      onLaunch(
        configFromMissionProfile(selectedProfile, {
          site,
          target_altitude_m: targetAlt,
          timeScale,
        }),
      );
      return;
    }
    timerRef.current = setInterval(() => {
      setCountdown((c) => (c !== null ? c - 1 : null));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdown, onLaunch, selectedProfile, site, targetAlt, timeScale]);

  const handleCancelCountdown = () => {
    setCountdown(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="flex max-h-[calc(100dvh-8.5rem)] w-[18rem] flex-col gap-1.5 overflow-y-auto rounded-[var(--ui-radius)] border-[0.5px] border-[var(--ui-glass-border)] bg-[rgba(5,8,14,0.78)] p-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.38)] backdrop-blur-ui">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-[4px] border-[0.5px] border-orange-300/20 bg-orange-300/[0.06]">
          <Rocket className="h-3.5 w-3.5 text-orange-200" strokeWidth={IS} />
        </div>
        <div>
          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-primary)]">
            Deep Space Launch
          </h2>
          <p className="font-mono text-[7px] uppercase tracking-[0.18em] text-[var(--ui-text-dim)]">
            Artemis / Mars mission sequencer
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b-[0.5px] border-[var(--ui-glass-border)] pb-1.5">
        <StatusLight color={isStreaming ? "#22c55e" : "#334155"} label="AUTO" blink={isStreaming} />
        <StatusLight color={countdown !== null ? "#f59e0b" : "#334155"} label="SEQ" blink={countdown !== null} />
        <StatusLight color="#38bdf8" label="GNC" />
        <StatusLight color="#fbbf24" label="ICPS" />
        <StatusLight color={selectedProfile.destination === "Mars" ? "#fb7185" : "#93c5fd"} label={selectedProfile.destination} />
      </div>

      {countdown === null && !isStreaming ? (
        <button
          type="button"
          onClick={handleLaunch}
          className="w-full rounded-[2px] border-[0.5px] border-orange-200/30 bg-orange-200/[0.07] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-orange-100 transition-all ui-press hover:border-orange-200/50 hover:bg-orange-200/[0.12] hover:shadow-[0_0_18px_rgba(251,191,36,0.18)]"
        >
          Commit Launch
        </button>
      ) : null}

      <div className="flex flex-col">
        <span className={labelCls}>
          <Shield className="h-2 w-2" strokeWidth={IS} />
          Mission Architecture
        </span>
        <select value={profileId} onChange={(e) => setProfileId(e.target.value)} disabled={isStreaming} className={fieldCls}>
          {LAUNCH_MISSION_PROFILES.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
        <span className="mt-1 font-mono text-[8px] leading-3 text-[var(--ui-text-dim)]">{selectedProfile.description}</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-[4px] border border-white/[0.06] bg-white/[0.035] px-2 py-1">
          <div className="font-mono text-[7px] uppercase tracking-[0.14em] text-[var(--ui-text-dim)]">Vehicle</div>
          <div className="mt-0.5 truncate text-[9px] font-semibold text-[var(--ui-text-muted)]">{selectedProfile.vehicle}</div>
        </div>
        <div className="rounded-[4px] border border-white/[0.06] bg-white/[0.035] px-2 py-1">
          <div className="font-mono text-[7px] uppercase tracking-[0.14em] text-[var(--ui-text-dim)]">Crew</div>
          <div className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold text-[var(--ui-text-muted)]">
            <Users className="h-2.5 w-2.5" strokeWidth={IS} />
            {selectedProfile.crewCount ?? 0}
          </div>
        </div>
        <div className="rounded-[4px] border border-white/[0.06] bg-white/[0.035] px-2 py-1">
          <div className="font-mono text-[7px] uppercase tracking-[0.14em] text-[var(--ui-text-dim)]">Payload</div>
          <div className="mt-0.5 text-[9px] font-semibold text-[var(--ui-text-muted)]">{formatMass(selectedProfile.cargoMassKg)}</div>
        </div>
      </div>

      <div className="flex flex-col">
        <span className={labelCls}>
          <MapPin className="h-2 w-2" strokeWidth={IS} />
          Launch Site
        </span>
        <select value={site} onChange={(e) => setSite(e.target.value)} disabled={isStreaming} className={fieldCls}>
          {LAUNCH_SITES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.lat}, {s.lon})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <span className={labelCls}>
            <Gauge className="h-2 w-2" strokeWidth={IS} />
            Parking Orbit
          </span>
          <span className="ui-instrument text-[10px] text-[var(--ui-accent)]">{formatAlt(targetAlt)}</span>
        </div>
        <input
          type="range"
          min={160_000}
          max={500_000}
          step={5_000}
          value={targetAlt}
          onChange={(e) => setTargetAlt(Number(e.target.value))}
          disabled={isStreaming}
          className="h-px w-full cursor-pointer appearance-none bg-[var(--ui-glass-border)] accent-[var(--ui-accent)]"
        />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <span className={labelCls}>
            <Timer className="h-2 w-2" strokeWidth={IS} />
            Sim Warp
          </span>
          <span className="ui-instrument text-[10px] text-[var(--ui-text-muted)]">{timeScale}x</span>
        </div>
        <input
          type="range"
          min={1}
          max={80}
          step={1}
          value={timeScale}
          onChange={(e) => setTimeScale(Number(e.target.value))}
          className="h-px w-full cursor-pointer appearance-none bg-[var(--ui-glass-border)] accent-[var(--ui-accent)]"
        />
      </div>

      <div className="rounded-[4px] border border-white/[0.06] bg-black/20 p-1.5">
        <div className="mb-1.5 rounded border border-sky-300/15 bg-sky-300/[0.04] px-2 py-1 text-[8px] leading-3 text-slate-300">
          {"用法：选择任务 -> 调整停车轨道/倍率 -> 点击 Commit Launch。点火后视角会切到地球发射场，跟随火箭看到飞船离开地球。"}
        </div>
        <div className="mb-1 font-mono text-[7px] uppercase tracking-[0.18em] text-[var(--ui-text-dim)]">Objectives</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          {selectedProfile.objectives.slice(0, 2).map((objective) => (
            <div key={objective} className="flex items-center gap-1 text-[8px] text-[var(--ui-text-muted)]">
              <span className="h-1 w-1 rounded-full bg-orange-200/80" />
              <span className="truncate">{objective}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-0.5 shrink-0">
        {countdown !== null ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="ui-instrument text-3xl font-bold text-orange-200">T-{countdown}</div>
            <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--ui-text-dim)]">
              terminal count sequence
            </div>
            <button
              type="button"
              onClick={handleCancelCountdown}
              className="mt-0.5 flex items-center gap-1 rounded-[2px] border-[0.5px] border-[var(--ui-glass-border)] px-3 py-1 font-mono text-[9px] uppercase text-[var(--ui-text-dim)] transition-colors ui-press hover:border-[var(--ui-glass-border-strong)] hover:text-[var(--ui-text-muted)]"
            >
              <X className="h-2.5 w-2.5" strokeWidth={IS} />
              Abort Count
            </button>
          </div>
        ) : isStreaming ? (
          <button
            type="button"
            onClick={onAbort}
            className="w-full rounded-[2px] border-[0.5px] border-red-500/25 bg-red-900/10 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-red-300 transition-all ui-press hover:border-red-400/40 hover:bg-red-900/20"
          >
            Mission Abort
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLaunch}
            className="w-full rounded-[2px] border-[0.5px] border-orange-200/30 bg-orange-200/[0.06] px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-orange-100 transition-all ui-press hover:border-orange-200/50 hover:bg-orange-200/[0.12] hover:shadow-[0_0_18px_rgba(251,191,36,0.18)]"
          >
            Launch
          </button>
        )}
      </div>
    </div>
  );
}
