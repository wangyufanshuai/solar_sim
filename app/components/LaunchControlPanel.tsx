"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, ExternalLink, FileUp, Gauge, MapPin, Rocket, Shield, Timer, Users, X } from "lucide-react";
import type { LaunchConfig } from "../lib/launchTelemetryTypes";
import {
  LAUNCH_MISSION_PROFILES,
  LAUNCH_SITES,
  configFromMissionProfile,
  getLaunchMissionProfile,
} from "../lib/launchMissionProfiles";
import { LAUNCH_CAMERA_FOLLOW_EVENT } from "../lib/launchCameraControl";
import {
  getDesktopCapabilities,
  importOpenRocketDesktop,
  launchOpenRocketDesktop,
  selectOpenRocketFileDesktop,
} from "../lib/desktopBridge";

type Props = {
  onLaunch: (config: LaunchConfig) => void;
  onAbort: () => void;
  onClose?: () => void;
  isStreaming: boolean;
  defaultProfileId?: string;
};

const ICON_STROKE = 1.0;

const fieldClassName =
  "min-h-10 w-full appearance-none border-b-[0.5px] border-[var(--ui-glass-border)] bg-transparent px-0 py-2 font-mono text-[11px] uppercase text-[var(--ui-text-muted)] outline-none transition-colors focus:border-[var(--ui-accent)] disabled:cursor-not-allowed disabled:opacity-60";
const labelClassName =
  "mb-0.5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ui-text-dim)]";

function formatAlt(meters: number): string {
  if (meters >= 1_000_000) return `${(meters / 1_000_000).toFixed(1)} Mm`;
  return `${(meters / 1_000).toFixed(0)} km`;
}

function formatMass(kg: number | undefined): string {
  if (!kg) return "N/A";
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(1)} kt`;
  return `${(kg / 1_000).toFixed(1)} t`;
}

function formatTime(seconds: number): string {
  if (seconds >= 3600) return `T+${(seconds / 3600).toFixed(1)}h`;
  if (seconds >= 60) return `T+${Math.round(seconds / 60)}m`;
  return `T+${seconds}s`;
}

function StatusLight({ color, label, blink }: { color: string; label: string; blink?: boolean }) {
  return (
    <div className="flex items-center gap-1" title={label}>
      <Circle
        className={`h-[5px] w-[5px] ${blink ? "animate-pulse" : ""}`}
        style={{ fill: color, color }}
        strokeWidth={0}
        aria-hidden="true"
      />
      <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--ui-text-dim)]">
        {label}
      </span>
    </div>
  );
}

export default function LaunchControlPanel({
  onLaunch,
  onAbort,
  onClose,
  isStreaming,
  defaultProfileId = "leo_satellite",
}: Props) {
  const [profileId, setProfileId] = useState(defaultProfileId);
  const selectedProfile = useMemo(() => getLaunchMissionProfile(profileId), [profileId]);
  const [site, setSite] = useState(selectedProfile.defaultSite);
  const [targetAlt, setTargetAlt] = useState(selectedProfile.targetAltitudeM);
  const [timeScale, setTimeScale] = useState(selectedProfile.defaultTimeScale);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [desktopOpenRocket, setDesktopOpenRocket] = useState(false);
  const [openRocketImportPath, setOpenRocketImportPath] = useState("");
  const [openRocketStatus, setOpenRocketStatus] = useState("离线导入就绪");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;
    const frame = window.requestAnimationFrame(() => {
      panelRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isStreaming) setProfileId(defaultProfileId);
  }, [defaultProfileId, isStreaming]);

  useEffect(() => {
    void getDesktopCapabilities().then((capabilities) => setDesktopOpenRocket(capabilities.available));
  }, []);

  useEffect(() => {
    if (isStreaming) return;
    setSite(selectedProfile.defaultSite);
    setTargetAlt(selectedProfile.targetAltitudeM);
    setTimeScale(selectedProfile.defaultTimeScale);
  }, [isStreaming, selectedProfile]);

  useEffect(() => {
    if (countdown === null) return undefined;
    if (countdown <= 0) {
      setCountdown(null);
      onLaunch(
        configFromMissionProfile(selectedProfile, {
          site,
          target_altitude_m: targetAlt,
          timeScale,
        }),
      );
      return undefined;
    }

    timerRef.current = setInterval(() => {
      setCountdown((current) => (current !== null ? current - 1 : null));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdown, onLaunch, selectedProfile, site, targetAlt, timeScale]);

  const handleLaunch = () => setCountdown(5);
  const handleRestoreFollow = () => {
    window.dispatchEvent(new Event(LAUNCH_CAMERA_FOLLOW_EVENT));
  };
  const handleCancelCountdown = () => {
    setCountdown(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const handleOpenRocketImport = async () => {
    try {
      const selected = await selectOpenRocketFileDesktop();
      if (!selected) return;
      const imported = await importOpenRocketDesktop(selected);
      setOpenRocketImportPath(imported);
      setOpenRocketStatus("已导入本地回放源");
    } catch (error) {
      setOpenRocketStatus(error instanceof Error ? error.message : "OpenRocket 导入失败");
    }
  };
  const handleOpenRocketLaunch = async () => {
    try {
      await launchOpenRocketDesktop(openRocketImportPath || undefined);
      setOpenRocketStatus("OpenRocket 已显式启动");
    } catch (error) {
      setOpenRocketStatus(error instanceof Error ? error.message : "OpenRocket 启动失败");
    }
  };

  const quickProfiles = LAUNCH_MISSION_PROFILES.filter((profile) =>
    ["leo_satellite", "leo_validation", "artemis_ii"].includes(profile.id),
  );

  return (
    <div
      ref={panelRef}
      role="region"
      aria-label="发射控制"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !onClose) return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      className="flex max-h-full w-full flex-col gap-2 overflow-y-auto overscroll-contain rounded-[var(--ui-radius)] border-[0.5px] border-[var(--ui-glass-border)] bg-[rgba(5,8,14,0.9)] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.52)] backdrop-blur-ui sm:max-h-[calc(100dvh-7rem)] sm:w-[21rem]"
      data-launch-control-panel="true"
      data-launch-default-profile={defaultProfileId}
      data-launch-gameplay-openrocket-bridge="offline-import-no-browser-exe-launch"
      data-atlas-launch-density="mobile-readable-v235"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-[4px] border-[0.5px] border-orange-300/20 bg-orange-300/[0.06]">
          <Rocket className="h-3.5 w-3.5 text-orange-200" strokeWidth={ICON_STROKE} />
        </div>
        <div>
          <h2 className="font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-primary)]">
            发射控制
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ui-text-dim)]">
            本地火箭与卫星任务序列
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b-[0.5px] border-[var(--ui-glass-border)] pb-1.5">
        <StatusLight color={isStreaming ? "#22c55e" : "#334155"} label="AUTO" blink={isStreaming} />
        <StatusLight color={countdown !== null ? "#f59e0b" : "#334155"} label="SEQ" blink={countdown !== null} />
        <StatusLight color="#38bdf8" label="GNC" />
        <StatusLight color="#fbbf24" label="MAX-Q" />
        <StatusLight color={selectedProfile.destination === "Mars" ? "#fb7185" : "#93c5fd"} label={selectedProfile.destination} />
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {quickProfiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => setProfileId(profile.id)}
            disabled={isStreaming}
            className={`min-h-11 rounded-[4px] border px-2 py-1.5 text-left transition-colors ui-press ${
              profileId === profile.id
                ? "border-orange-200/45 bg-orange-200/[0.11] text-orange-50"
                : "border-white/[0.07] bg-white/[0.03] text-white/52 hover:border-white/16 hover:text-white/78"
            }`}
            data-launch-profile-card={profile.id}
            data-launch-profile-card-active={profileId === profile.id ? "true" : "false"}
          >
            <div className="truncate font-mono text-[11px] font-semibold uppercase tracking-[0.1em]">
              {profile.shortName}
            </div>
            <div className="mt-0.5 truncate text-[10px] text-white/60">
              {profile.destination} / {formatMass(profile.cargoMassKg)}
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-[4px] border border-sky-200/12 bg-sky-200/[0.045] p-2" data-launch-camera-controls="auto-manual-follow">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-sky-100/55">Camera</div>
            <div className="mt-0.5 text-[11px] text-sky-50/82">自动跟随 / 拖拽进入手动环绕</div>
          </div>
          <button
            type="button"
            onClick={handleRestoreFollow}
            className="min-h-10 rounded-[3px] border border-sky-100/20 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-sky-100/82 transition-colors ui-press hover:border-sky-100/38 hover:bg-sky-100/[0.08]"
            data-launch-camera-follow="restore"
          >
            恢复跟随
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <span className={labelClassName}>
          <Shield className="h-2 w-2" strokeWidth={ICON_STROKE} />
          任务架构
        </span>
        <select aria-label="任务架构" value={profileId} onChange={(event) => setProfileId(event.target.value)} disabled={isStreaming} className={fieldClassName}>
          {LAUNCH_MISSION_PROFILES.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
        <span className="mt-1 font-mono text-[10px] leading-4 text-[var(--ui-text-dim)]">
          {selectedProfile.description}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-[4px] border border-white/[0.06] bg-white/[0.035] px-2 py-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ui-text-dim)]">载具</div>
          <div className="mt-0.5 truncate text-[11px] font-semibold text-[var(--ui-text-muted)]">{selectedProfile.vehicle}</div>
        </div>
        <div className="rounded-[4px] border border-white/[0.06] bg-white/[0.035] px-2 py-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ui-text-dim)]">倾角 / 乘员</div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[var(--ui-text-muted)]">
            <Users className="h-2.5 w-2.5" strokeWidth={ICON_STROKE} />
            {selectedProfile.targetInclinationDeg ? `${selectedProfile.targetInclinationDeg} deg` : `${selectedProfile.crewCount ?? 0}`}
          </div>
        </div>
        <div className="rounded-[4px] border border-white/[0.06] bg-white/[0.035] px-2 py-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ui-text-dim)]">载荷</div>
          <div className="mt-0.5 text-[11px] font-semibold text-[var(--ui-text-muted)]">{formatMass(selectedProfile.cargoMassKg)}</div>
        </div>
      </div>

      <div className="flex flex-col">
        <span className={labelClassName}>
          <MapPin className="h-2 w-2" strokeWidth={ICON_STROKE} />
          发射场
        </span>
        <select aria-label="发射场" value={site} onChange={(event) => setSite(event.target.value)} disabled={isStreaming} className={fieldClassName}>
          {LAUNCH_SITES.map((launchSite) => (
            <option key={launchSite.id} value={launchSite.id}>
              {launchSite.name} ({launchSite.lat}, {launchSite.lon})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <span className={labelClassName}>
            <Gauge className="h-2 w-2" strokeWidth={ICON_STROKE} />
            停泊轨道
          </span>
          <span className="ui-instrument text-[10px] text-[var(--ui-accent)]">{formatAlt(targetAlt)}</span>
        </div>
        <input
          aria-label="停泊轨道高度"
          type="range"
          min={160_000}
          max={600_000}
          step={5_000}
          value={targetAlt}
          onChange={(event) => setTargetAlt(Number(event.target.value))}
          disabled={isStreaming}
          className="h-px w-full cursor-pointer appearance-none bg-[var(--ui-glass-border)] accent-[var(--ui-accent)]"
        />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <span className={labelClassName}>
            <Timer className="h-2 w-2" strokeWidth={ICON_STROKE} />
            仿真倍率
          </span>
          <span className="ui-instrument text-[10px] text-[var(--ui-text-muted)]">{timeScale}x</span>
        </div>
        <input
          aria-label="仿真倍率"
          type="range"
          min={1}
          max={80}
          step={1}
          value={timeScale}
          onChange={(event) => setTimeScale(Number(event.target.value))}
          className="h-px w-full cursor-pointer appearance-none bg-[var(--ui-glass-border)] accent-[var(--ui-accent)]"
        />
      </div>

      <div className="rounded-[4px] border border-white/[0.06] bg-black/20 p-1.5">
        <div className="mb-1.5 rounded border border-sky-300/15 bg-sky-300/[0.04] px-2 py-1.5 text-[11px] leading-4 text-slate-300" data-launch-clear-instructions="true">
          选择任务，确认轨道高度、发射场和仿真倍率，然后点火。拖动画面进入手动环绕，恢复跟随会回到自动跟随。
        </div>
        <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ui-text-dim)]">任务目标</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          {selectedProfile.objectives.slice(0, 2).map((objective) => (
            <div key={objective} className="flex items-center gap-1 text-[10px] text-[var(--ui-text-muted)]">
              <span className="h-1 w-1 rounded-full bg-orange-200/80" />
              <span className="truncate">{objective}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[4px] border border-white/[0.06] bg-white/[0.025] p-1.5">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ui-text-dim)]">任务时间线</div>
        <div className="space-y-1" data-launch-mission-timeline={selectedProfile.id}>
          {selectedProfile.timeline.map((event) => (
            <div key={`${event.label}-${event.timeS}`} className="grid grid-cols-[3.5rem_1fr] items-center gap-2 text-[10px]">
              <span className="ui-instrument text-orange-100/75">{formatTime(event.timeS)}</span>
              <span className="truncate text-white/56">{event.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.08] pt-2" data-launch-openrocket-desktop={desktopOpenRocket ? "available" : "web-offline-import"}>
        <div className="flex items-center justify-between gap-2">
          <div><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ui-text-dim)]">OpenRocket Bridge</div><div className="mt-1 max-w-[180px] truncate text-[10px] text-white/50" title={openRocketStatus}>{openRocketStatus}</div></div>
          <div className="flex gap-1">
            <button type="button" disabled={!desktopOpenRocket || isStreaming} onClick={handleOpenRocketImport} className="atlas-cinematic-icon" aria-label="导入 OpenRocket 文件" title="导入 .ork / CSV / JSON"><FileUp className="h-3.5 w-3.5" /></button>
            <button type="button" disabled={!desktopOpenRocket || isStreaming} onClick={handleOpenRocketLaunch} className="atlas-cinematic-icon" aria-label="启动 OpenRocket" title="显式启动 OpenRocket"><ExternalLink className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>

      <div className="mt-0.5 shrink-0">
        {countdown !== null ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="ui-instrument text-3xl font-bold text-orange-200">T-{countdown}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ui-text-dim)]">
              终端倒计时序列
            </div>
            <button
              type="button"
              onClick={handleCancelCountdown}
              className="mt-0.5 flex min-h-10 items-center gap-1 rounded-[2px] border-[0.5px] border-[var(--ui-glass-border)] px-3 py-1 font-mono text-[10px] uppercase text-[var(--ui-text-dim)] transition-colors ui-press hover:border-[var(--ui-glass-border-strong)] hover:text-[var(--ui-text-muted)]"
            >
              <X className="h-2.5 w-2.5" strokeWidth={ICON_STROKE} />
              中止倒计时
            </button>
          </div>
        ) : isStreaming ? (
          <button
            type="button"
            onClick={onAbort}
            data-atlas-launch-action="abort"
            className="min-h-11 w-full rounded-[2px] border-[0.5px] border-red-500/25 bg-red-900/10 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-red-300 transition-[border-color,background-color,color] ui-press hover:border-red-400/40 hover:bg-red-900/20"
          >
            任务中止
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLaunch}
            data-atlas-launch-action="ignite"
          className="min-h-11 w-full rounded-[2px] border-[0.5px] border-orange-200/30 bg-orange-200/[0.06] px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-orange-100 transition-[border-color,background-color,color,box-shadow] ui-press hover:border-orange-200/50 hover:bg-orange-200/[0.12] hover:shadow-[0_0_18px_rgba(251,191,36,0.18)]"
          >
            点火发射
          </button>
        )}
      </div>
    </div>
  );
}
