"use client";

import { Compass, Crosshair, GalleryHorizontalEnd, Globe2, Radio, Rocket, Search, Sparkles } from "lucide-react";
import { describeSolarUiMode, type HudVisibilityState, type SolarUiMode } from "../lib/solarUi";

const ICON_STROKE = 1.35;

type ConsoleAction = {
  mode: SolarUiMode;
  label: string;
  detail: string;
  icon: typeof Compass;
  action: string;
  onClick: () => void;
};

export default function SolarConsoleShell({
  state,
  targetLabel,
  simRateLabel,
  onExplore,
  onAtlas,
  onMission,
  onDeepUniverse,
  onGallery,
  onSearch,
}: {
  state: HudVisibilityState;
  targetLabel: string | null;
  simRateLabel: string;
  onExplore: () => void;
  onAtlas: () => void;
  onMission: () => void;
  onDeepUniverse: () => void;
  onGallery: () => void;
  onSearch: () => void;
}) {
  if (!state.ordinaryHudVisible) return null;

  const actions: ConsoleAction[] = [
    { mode: "solar", label: "Explore", detail: "Solar system", icon: Compass, action: "aaa-explore", onClick: onExplore },
    { mode: "deep-universe", label: "Deep", detail: "Milky Way", icon: Sparkles, action: "aaa-deep", onClick: onDeepUniverse },
    { mode: "atlas", label: "Atlas", detail: "Targets", icon: Globe2, action: "aaa-atlas", onClick: onAtlas },
    { mode: "mission", label: "Mission", detail: "Ops", icon: Rocket, action: "aaa-mission", onClick: onMission },
    { mode: "gallery", label: "Gallery", detail: "NASA GLB", icon: GalleryHorizontalEnd, action: "aaa-gallery", onClick: onGallery },
  ];

  return (
    <header
      data-solar-console="v5"
      data-solar-ui-mode={state.mode}
      className="pointer-events-none fixed left-14 right-3 top-3 z-[94] flex items-start justify-between gap-3 max-lg:left-14 max-md:left-12 max-md:right-2"
    >
      <div className="pointer-events-auto min-w-0 rounded-[12px] border border-[var(--ui-glass-border)] bg-[rgba(4,8,16,0.72)] px-3 py-2 shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-ui">
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-[var(--ui-accent)]" strokeWidth={ICON_STROKE} />
          <div className="min-w-0">
            <div className="truncate font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ui-text-primary)]">
              Solar Sim Console
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--ui-text-dim)]">
              <span>{describeSolarUiMode(state.mode)}</span>
              <span>{state.density}</span>
              <span>{simRateLabel}</span>
              <span className="max-w-[15rem] truncate text-[var(--ui-text-muted)]">
                {targetLabel ?? "free camera"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <nav className="pointer-events-auto flex min-w-0 items-center gap-1.5 rounded-[14px] border border-[var(--ui-glass-border)] bg-[rgba(4,8,16,0.72)] p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.26)] backdrop-blur-ui max-md:max-w-[calc(100vw-4.25rem)] max-md:overflow-x-auto">
        {actions.map(({ mode, label, detail, icon: Icon, action, onClick }) => {
          const active = state.mode === mode;
          return (
            <button
              key={mode}
              type="button"
              data-solar-action={action}
              onClick={onClick}
              className={`flex h-10 min-w-[4.6rem] items-center gap-2 rounded-[10px] px-2.5 text-left transition-colors max-md:min-w-10 max-md:justify-center max-md:px-2 ${
                active
                  ? "bg-[var(--ui-accent-subtle)] text-[var(--ui-text-primary)] ring-1 ring-[var(--ui-glass-border-strong)]"
                  : "text-[var(--ui-text-muted)] hover:bg-[var(--ui-hover-bg)] hover:text-[var(--ui-text-primary)]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={ICON_STROKE} />
              <span className="min-w-0 max-md:hidden">
                <span className="block truncate text-[11px] font-medium leading-3">{label}</span>
                <span className="mt-0.5 block truncate font-mono text-[7px] uppercase tracking-[0.14em] opacity-55">
                  {detail}
                </span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          data-solar-action="aaa-search"
          onClick={onSearch}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-hover-bg)] hover:text-[var(--ui-text-primary)]"
          aria-label="Search objects"
          title="Search objects"
        >
          <Search className="h-4 w-4" strokeWidth={ICON_STROKE} />
        </button>
        <div className="mx-0.5 h-6 w-px bg-white/10 max-md:hidden" />
        <div className="hidden items-center gap-1 rounded-[9px] border border-white/[0.06] bg-white/[0.03] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--ui-text-dim)] sm:flex">
          <Crosshair className="h-3.5 w-3.5 text-[var(--ui-accent)]" strokeWidth={ICON_STROKE} />
          deterministic view
        </div>
      </nav>
    </header>
  );
}
