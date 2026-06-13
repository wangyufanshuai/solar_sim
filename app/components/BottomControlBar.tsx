"use client";

import {
  Box,
  Crosshair,
  Earth,
  FastForward,
  Globe2,
  Layers,
  Minus,
  MoreHorizontal,
  Orbit,
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

const IS = 1.0;

export type BottomControlBarSection = "simulation" | "view" | "tools" | "launch" | "mission" | "atlas";

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
  historySlot?: ReactNode;
  launchMode?: boolean;
  launchTelemetrySlot?: ReactNode;
};

const sections: { id: BottomControlBarSection; label: string; Icon: typeof Box }[] = [
  { id: "simulation", label: "Explore", Icon: Box },
  { id: "view", label: "Layers", Icon: Layers },
  { id: "launch", label: "Launch", Icon: Rocket },
  { id: "tools", label: "Tools", Icon: Wrench },
];

sections.splice(3, 0, { id: "mission", label: "Mission", Icon: Orbit });
sections.splice(4, 0, { id: "atlas", label: "Atlas", Icon: Globe2 });

const iconBtn =
  "flex h-9 w-9 items-center justify-center rounded-[10px] text-[var(--ui-text-dim)] transition-all duration-150 hover:bg-white/10 hover:text-[var(--ui-text-primary)] disabled:pointer-events-none disabled:opacity-25";

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
  historySlot,
  launchMode,
  launchTelemetrySlot,
}: BottomControlBarProps) {
  const [localPlaying, setLocalPlaying] = useState(true);
  const [localSection, setLocalSection] = useState<BottomControlBarSection>("simulation");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const isPlaying = isPlayingControlled !== undefined ? isPlayingControlled : localPlaying;
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
    <footer className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[100] flex flex-col pb-[max(0px,env(safe-area-inset-bottom))]">
      {historySlot ? (
        <div className="mx-auto mb-1 w-[min(96vw,720px)] overflow-hidden rounded-[10px] border border-white/[0.06] bg-[rgba(5,8,14,0.78)]">
          {historySlot}
        </div>
      ) : null}

      {launchMode && launchTelemetrySlot ? (
        <div className="mb-1 flex h-10 w-full items-center border-y border-white/5 bg-[rgba(18,18,20,0.74)] backdrop-blur-xl">
          {launchTelemetrySlot}
        </div>
      ) : null}

      <div className="mx-2 mb-2 flex min-h-[64px] items-center justify-between gap-2 rounded-[18px] border border-[var(--ui-glass-border)] bg-[rgba(4,8,16,0.86)] px-3 shadow-[0_18px_48px_rgba(0,0,0,0.36)] backdrop-blur-ui max-md:min-h-[58px] max-md:px-2">
        <div className="flex min-w-0 items-center gap-2 max-md:gap-1">
          <button
            type="button"
            onClick={togglePlay}
            data-solar-action="toggle-play"
            aria-pressed={isPlaying}
            aria-label={isPlaying ? "暂停" : "播放"}
            className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[var(--ui-glass-border)] bg-[var(--ui-accent-subtle)] text-[var(--ui-text-primary)] transition-all hover:bg-white/12"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" strokeWidth={IS} />
            ) : (
              <Play className="h-4 w-4 pl-px" strokeWidth={IS} />
            )}
          </button>
          <div className="min-w-[154px] max-sm:hidden">
            <div className="text-[12px] text-[var(--ui-text-muted)]">
              {simulationTimeSlot ?? simulationTimeText}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="ui-instrument text-[12px] text-[var(--ui-text-muted)]">
                {dps}
              </span>
              <span className="text-[12px] text-[var(--ui-text-dim)]">days/s</span>
              {onRelativityToggle !== undefined && relativityEnabled !== undefined ? (
                <button
                  type="button"
                  onClick={onRelativityToggle}
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    relativityEnabled
                      ? "bg-white/10 text-[var(--ui-text-primary)]"
                      : "bg-transparent text-[var(--ui-text-dim)]"
                  }`}
                >
                  {relativityEnabled ? "1PN" : "牛顿"}
                </button>
              ) : null}
            </div>
          </div>
          <button type="button" onClick={onSimRewind} className={iconBtn} aria-label="减速">
            <Rewind className="h-4 w-4" strokeWidth={IS} />
          </button>
          <button type="button" onClick={onSimFastForward} className={iconBtn} aria-label="加速">
            <FastForward className="h-4 w-4" strokeWidth={IS} />
          </button>
          <button type="button" onClick={onSimSlower} className={iconBtn} aria-label="更慢">
            <Minus className="h-4 w-4" strokeWidth={IS} />
          </button>
          <button type="button" onClick={onSimFaster} className={iconBtn} aria-label="更快">
            <Plus className="h-4 w-4" strokeWidth={IS} />
          </button>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 overflow-x-auto px-2 max-md:justify-start max-md:px-0">
          {sections.map(({ id, label, Icon }) => {
            const on = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectSection(id)}
                data-solar-section={id}
                className={`flex h-11 min-w-[62px] flex-col items-center justify-center gap-1 rounded-[12px] px-2 py-1 transition-colors max-md:min-w-11 ${
                  on ? "bg-white/[0.07] text-[var(--ui-text-primary)] ring-1 ring-white/[0.08]" : "text-[var(--ui-text-dim)] hover:bg-white/[0.045] hover:text-[var(--ui-text-muted)]"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={IS} />
                <span className="text-[11px] max-md:hidden">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-[14px] border border-white/[0.06] bg-black/24 px-1 py-1">
            <button type="button" onClick={onZoomIn} className={iconBtn} aria-label="拉近">
              <Plus className="h-4 w-4" strokeWidth={IS} />
            </button>
            <button type="button" onClick={onResetView} className={iconBtn} aria-label="重置视角">
              <RotateCcw className="h-4 w-4" strokeWidth={IS} />
            </button>
            <button type="button" onClick={onSearch} className={iconBtn} aria-label="搜索">
              <Search className="h-4 w-4" strokeWidth={IS} />
            </button>
          </div>
          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-black/24 text-[var(--ui-text-dim)] transition-colors hover:text-[var(--ui-text-primary)]"
              aria-label="更多"
            >
              <MoreHorizontal className="h-4 w-4" strokeWidth={IS} />
            </button>
            {moreOpen ? (
              <div className="absolute bottom-full right-0 mb-2 min-w-[140px] rounded-2xl border border-white/10 bg-[rgba(18,18,20,0.94)] p-1 shadow-2xl backdrop-blur-2xl">
                <MenuItem
                  label="拉远"
                  icon={<Minus className="h-4 w-4" strokeWidth={IS} />}
                  onClick={() => {
                    onZoomOut?.();
                    setMoreOpen(false);
                  }}
                  disabled={!onZoomOut}
                />
                <MenuItem
                  label="对准目标"
                  icon={<Crosshair className="h-4 w-4" strokeWidth={IS} />}
                  onClick={() => {
                    onFocusSelected?.();
                    setMoreOpen(false);
                  }}
                  disabled={!onFocusSelected}
                />
                <MenuItem
                  label="地月视角"
                  icon={<Earth className="h-4 w-4" strokeWidth={IS} />}
                  onClick={() => {
                    onEarthMoonView?.();
                    setMoreOpen(false);
                  }}
                  disabled={!onEarthMoonView}
                />
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
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] text-[var(--ui-text-muted)] transition-colors hover:bg-white/8 hover:text-[var(--ui-text-primary)] disabled:pointer-events-none disabled:opacity-25"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
