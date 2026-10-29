"use client";

import {
  Box,
  Crosshair,
  Earth,
  FastForward,
  Gauge,
  FlaskConical,
  Layers,
  Minus,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Rewind,
  RotateCcw,
  Rocket,
  Search,
  Wrench,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AtlasExperienceMode } from "../lib/atlasRuntimeStore";

const IS = 1.0;

export type BottomControlBarSection =
  | "simulation"
  | "view"
  | "tools"
  | "launch"
  | "lab";

export type BottomControlBarProps = {
  isPlaying?: boolean;
  onPlayPause?: () => void;
  simulationTimeText?: string;
  simulationTimeSlot?: ReactNode;
  daysPerSecond?: number;
  activeSection?: BottomControlBarSection;
  onSectionChange?: (section: BottomControlBarSection) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFocusSelected?: () => void;
  onResetView?: () => void;
  onEarthMoonView?: () => void;
  onSimSlower?: () => void;
  onSimFaster?: () => void;
  onSimRewind?: () => void;
  onSimFastForward?: () => void;
  onSearch?: () => void;
  relativityEnabled?: boolean;
  onRelativityToggle?: () => void;
  onRelativityCore?: () => void;
  historySlot?: ReactNode;
  experienceMode?: AtlasExperienceMode;
  onExperienceModeChange?: (mode: AtlasExperienceMode) => void;
};

const sections: { id: BottomControlBarSection; label: string; Icon: typeof Box }[] = [
  { id: "simulation", label: "模拟", Icon: Box },
  { id: "view", label: "视图", Icon: Layers },
  { id: "launch", label: "发射", Icon: Rocket },
  { id: "lab", label: "实验", Icon: FlaskConical },
  { id: "tools", label: "工具", Icon: Wrench },
];

const iconBtn =
  "atlas-cinematic-icon disabled:pointer-events-none disabled:opacity-25";

export default function BottomControlBar({
  isPlaying: isPlayingControlled,
  onPlayPause,
  simulationTimeText = "2026-03-21 14:43",
  simulationTimeSlot,
  daysPerSecond = 15.5,
  activeSection: activeSectionControlled,
  onSectionChange,
  onZoomIn,
  onZoomOut,
  onFocusSelected,
  onResetView,
  onEarthMoonView,
  onSimSlower,
  onSimFaster,
  onSimRewind,
  onSimFastForward,
  onSearch,
  relativityEnabled,
  onRelativityToggle,
  onRelativityCore,
  historySlot,
  experienceMode = "explore",
  onExperienceModeChange,
}: BottomControlBarProps) {
  const [localPlaying, setLocalPlaying] = useState(true);
  const [localSection, setLocalSection] =
    useState<BottomControlBarSection>("simulation");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const isPlaying =
    isPlayingControlled !== undefined ? isPlayingControlled : localPlaying;
  const activeSection =
    activeSectionControlled !== undefined ? activeSectionControlled : localSection;

  useEffect(() => {
    if (!moreOpen) return;
    const h = (e: PointerEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("pointerdown", h, true);
    return () => document.removeEventListener("pointerdown", h, true);
  }, [moreOpen]);

  const togglePlay = useCallback(() => {
    if (onPlayPause) onPlayPause();
    else setLocalPlaying((p) => !p);
  }, [onPlayPause]);

  const selectSection = useCallback(
    (id: BottomControlBarSection) => {
      if (onSectionChange) onSectionChange(id);
      else setLocalSection(id);
    },
    [onSectionChange],
  );

  const dps =
    Number.isFinite(daysPerSecond) && daysPerSecond >= 0
      ? daysPerSecond.toFixed(1)
      : "--";

  return (
    <footer
      className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[100] flex flex-col pb-[max(0px,env(safe-area-inset-bottom))]"
      data-bottom-control-bar="true"
      data-atlas-experience-mode={experienceMode}
    >
      {historySlot ? (
        <div className="mx-auto mb-1 w-[min(96vw,720px)] overflow-hidden rounded-full bg-[rgba(38,38,42,0.78)]">
          {historySlot}
        </div>
      ) : null}

      <div
        className="atlas-cinematic-dock mx-0 flex h-[58px] w-full items-center justify-between px-3 sm:px-5"
        data-atlas-cinematic-hud="bottom-dock"
      >
        <div className="flex min-w-0 items-center gap-2" data-atlas-cinematic-control-cluster="transport">
          <button
            type="button"
            onClick={togglePlay}
            aria-pressed={isPlaying}
            aria-label={isPlaying ? "暂停" : "播放"}
            title={isPlaying ? "暂停" : "播放"}
            className="atlas-cinematic-icon border border-[rgba(211,179,110,0.22)] bg-[rgba(211,179,110,0.08)] text-[var(--atlas-cine-text)]"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" strokeWidth={IS} />
            ) : (
              <Play className="h-4 w-4 pl-px" strokeWidth={IS} />
            )}
          </button>
          <div className="hidden min-w-[170px] sm:block">
            <div className="text-[12px] text-[var(--ui-text-muted)]">
              {simulationTimeSlot ?? simulationTimeText}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="ui-instrument text-[12px] text-[var(--ui-text-muted)]">
                {dps}
              </span>
              <span className="text-[12px] text-[var(--ui-text-dim)]">天/秒</span>
              {onRelativityToggle !== undefined && relativityEnabled !== undefined ? (
                <button
                  type="button"
                  onClick={onRelativityToggle}
                  className={`rounded px-2 py-0.5 text-[10px] ${
                    relativityEnabled
                      ? "bg-white/10 text-[var(--ui-text-primary)]"
                      : "bg-transparent text-[var(--ui-text-dim)]"
                  }`}
                  aria-pressed={relativityEnabled}
                  title={relativityEnabled ? "EIH 1PN 已启用" : "牛顿模式"}
                >
                  {relativityEnabled ? "1PN" : "牛顿"}
                </button>
              ) : null}
              {onRelativityCore ? (
                <button
                  type="button"
                  onClick={onRelativityCore}
                  className="rounded border border-cyan-100/18 bg-cyan-100/[0.06] px-2 py-0.5 text-[10px] text-cyan-50/80 transition-colors hover:border-cyan-100/32 hover:bg-cyan-100/[0.1]"
                  data-atlas-relativity-core-entry="bottom-bar"
                >
                  相对论核心
                </button>
              ) : null}
              {onExperienceModeChange ? (
                <button
                  type="button"
                  onClick={() => onExperienceModeChange(experienceMode === "explore" ? "research" : "explore")}
                  className="rounded border border-white/10 bg-white/[0.035] px-2 py-0.5 text-[10px] text-[var(--ui-text-muted)] transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-[var(--ui-text-primary)]"
                  aria-pressed={experienceMode === "research"}
                  data-atlas-experience-mode-toggle="desktop"
                >
                  {experienceMode === "research" ? "研究模式" : "大众模式"}
                </button>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onSimRewind}
            className={`${iconBtn} hidden sm:flex`}
            aria-label="后退"
            title="后退"
          >
            <Rewind className="h-4 w-4" strokeWidth={IS} />
          </button>
          <button
            type="button"
            onClick={onSimFastForward}
            className={`${iconBtn} hidden sm:flex`}
            aria-label="快进"
            title="快进"
          >
            <FastForward className="h-4 w-4" strokeWidth={IS} />
          </button>
          <button
            type="button"
            onClick={onSimSlower}
            className={`${iconBtn} hidden sm:flex`}
            aria-label="减慢"
            title="减慢"
          >
            <Minus className="h-4 w-4" strokeWidth={IS} />
          </button>
          <button
            type="button"
            onClick={onSimFaster}
            className={`${iconBtn} hidden sm:flex`}
            aria-label="加速"
            title="加速"
          >
            <Plus className="h-4 w-4" strokeWidth={IS} />
          </button>
        </div>

        <div className="hidden items-center gap-2 sm:flex" data-atlas-cinematic-control-cluster="mode-tabs">
          {sections.map(({ id, label, Icon }) => {
            const on = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectSection(id)}
                className="atlas-cinematic-tab flex min-w-[58px] flex-col items-center gap-1 px-2 py-1 transition-colors"
                data-active={on ? "true" : "false"}
                data-atlas-section={id}
                aria-pressed={on}
              >
                <Icon className="h-4 w-4" strokeWidth={IS} />
                <span className="text-[11px]">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2" data-atlas-cinematic-control-cluster="camera-tools">
          <div className="atlas-cinematic-cluster flex items-center px-1 py-0.5">
            <button
              type="button"
              onClick={onZoomIn}
              className={iconBtn}
              aria-label="放大"
              title="放大"
              data-atlas-camera-zoom="in"
            >
              <Plus className="h-4 w-4" strokeWidth={IS} />
            </button>
            <button
              type="button"
              onClick={onZoomOut}
              className={iconBtn}
              aria-label="缩小"
              title="缩小"
              data-atlas-camera-zoom="out"
            >
              <Minus className="h-4 w-4" strokeWidth={IS} />
            </button>
            <button
              type="button"
              onClick={onResetView}
              className={iconBtn}
              aria-label="重置视图"
              title="重置视图"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={IS} />
            </button>
            <button
              type="button"
              onClick={onSearch}
              className={iconBtn}
              aria-label="搜索"
              title="搜索"
              data-atlas-accessibility-return-target="search"
            >
              <Search className="h-4 w-4" strokeWidth={IS} />
            </button>
          </div>
          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="atlas-cinematic-icon atlas-cinematic-cluster"
              aria-label="更多"
              title="更多"
            >
              <MoreHorizontal className="h-4 w-4" strokeWidth={IS} />
            </button>
            {moreOpen ? (
              <div className="atlas-cinematic-menu absolute bottom-full right-0 mb-2 min-w-[160px] rounded-lg p-1">
                {sections.map(({ id, label, Icon }) => (
                  <MenuItem
                    key={id}
                    label={label}
                    icon={<Icon className="h-4 w-4" strokeWidth={IS} />}
                    onClick={() => {
                      selectSection(id);
                      setMoreOpen(false);
                    }}
                    dataSection={id}
                    mobileOnly
                  />
                ))}
                <div className="my-1 h-px bg-white/8 sm:hidden" aria-hidden />
                <MenuItem
                  label={"减慢"}
                  icon={<Minus className="h-4 w-4" strokeWidth={IS} />}
                  onClick={() => {
                    onSimSlower?.();
                    setMoreOpen(false);
                  }}
                  disabled={!onSimSlower}
                  mobileOnly
                />
                <MenuItem
                  label={"加速"}
                  icon={<Plus className="h-4 w-4" strokeWidth={IS} />}
                  onClick={() => {
                    onSimFaster?.();
                    setMoreOpen(false);
                  }}
                  disabled={!onSimFaster}
                  mobileOnly
                />
                <MenuItem
                  label="缩小"
                  icon={<Minus className="h-4 w-4" strokeWidth={IS} />}
                  onClick={() => {
                    onZoomOut?.();
                    setMoreOpen(false);
                  }}
                  disabled={!onZoomOut}
                />
                <MenuItem
                  label="聚焦目标"
                  icon={<Crosshair className="h-4 w-4" strokeWidth={IS} />}
                  onClick={() => {
                    onFocusSelected?.();
                    setMoreOpen(false);
                  }}
                  disabled={!onFocusSelected}
                />
                <MenuItem
                  label="地月视图"
                  icon={<Earth className="h-4 w-4" strokeWidth={IS} />}
                  onClick={() => {
                    onEarthMoonView?.();
                    setMoreOpen(false);
                  }}
                  disabled={!onEarthMoonView}
                />
                <MenuItem
                  label={experienceMode === "research" ? "切换到大众模式" : "切换到研究模式"}
                  icon={<FlaskConical className="h-4 w-4" strokeWidth={IS} />}
                  onClick={() => {
                    onExperienceModeChange?.(experienceMode === "research" ? "explore" : "research");
                    setMoreOpen(false);
                  }}
                  disabled={!onExperienceModeChange}
                  dataAttr="experience-mode"
                />
                <MenuItem
                  label="相对论核心"
                  icon={<Gauge className="h-4 w-4" strokeWidth={IS} />}
                  onClick={() => {
                    onRelativityCore?.();
                    setMoreOpen(false);
                  }}
                  disabled={!onRelativityCore}
                  dataAttr="bottom-menu"
                />
                <a
                  href="/downloads"
                  onClick={() => setMoreOpen(false)}
                  className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[12px] text-[var(--ui-text-muted)] transition-colors hover:bg-[rgba(211,179,110,0.08)] hover:text-[var(--ui-text-primary)]"
                >
                  <span aria-hidden className="inline-flex h-4 w-4 items-center justify-center">↓</span>
                  <span>下载与版本</span>
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}

function MenuItem({
  label,
  icon,
  onClick,
  disabled,
  dataAttr,
  dataSection,
  mobileOnly,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  dataAttr?: string;
  dataSection?: BottomControlBarSection;
  mobileOnly?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-atlas-relativity-core-entry={dataAttr}
      data-atlas-section={dataSection}
      className={`${mobileOnly ? "flex sm:hidden" : "flex"} min-h-10 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[12px] text-[var(--ui-text-muted)] transition-colors hover:bg-[rgba(211,179,110,0.08)] hover:text-[var(--ui-text-primary)] disabled:pointer-events-none disabled:opacity-25`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
