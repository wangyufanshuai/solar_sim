"use client";

import {
  ChevronDown,
  Layers3,
  Pause,
  Play,
  RotateCcw,
  Search,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { SimulationViewSettings } from "../lib/simulationViewSettings";
import type {
  OrbitAtlasRenderBudget,
  OrbitAtlasScaleMode,
} from "../lib/orbitAtlasPresentation";

type OrbitAtlasHudProps = {
  isPlaying: boolean;
  onPlayPause: () => void;
  simulationTimeSlot: ReactNode;
  daysPerSecond: number;
  scaleMode: OrbitAtlasScaleMode;
  onScaleModeChange: (mode: OrbitAtlasScaleMode) => void;
  renderBudget: OrbitAtlasRenderBudget;
  onRenderBudgetChange: (budget: OrbitAtlasRenderBudget) => void;
  viewSettings: SimulationViewSettings;
  onViewSettingsChange: (settings: SimulationViewSettings) => void;
  onSearch: () => void;
  onResetView: () => void;
  onOpenSandbox: () => void;
};

const iconButton =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40";

export default function OrbitAtlasHud({
  isPlaying,
  onPlayPause,
  simulationTimeSlot,
  daysPerSecond,
  scaleMode,
  onScaleModeChange,
  renderBudget,
  onRenderBudgetChange,
  viewSettings,
  onViewSettingsChange,
  onSearch,
  onResetView,
  onOpenSandbox,
}: OrbitAtlasHudProps) {
  const [layersOpen, setLayersOpen] = useState(false);
  const layersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!layersOpen) return;
    const close = (event: PointerEvent) => {
      if (!layersRef.current?.contains(event.target as Node)) setLayersOpen(false);
    };
    document.addEventListener("pointerdown", close, true);
    return () => document.removeEventListener("pointerdown", close, true);
  }, [layersOpen]);

  const patchView = (patch: Partial<SimulationViewSettings>) => {
    onViewSettingsChange({ ...viewSettings, ...patch });
  };

  return (
    <>
      <div className="pointer-events-none fixed left-1/2 top-4 z-[90] -translate-x-1/2">
        <div className="flex h-8 items-center gap-2 rounded-md border border-white/10 bg-black/60 px-3 text-[10px] text-white/[0.58] shadow-lg backdrop-blur-md">
          <span className="whitespace-nowrap font-medium text-white/[0.78]">ORBIT ATLAS</span>
          <span className="hidden h-3 w-px bg-white/12 sm:block" />
          <span className="ui-instrument hidden whitespace-nowrap uppercase tracking-[0.08em] sm:inline">
            {scaleMode === "compressed" ? "/ COMPRESSED" : "/ PHYSICAL"}
          </span>
        </div>
      </div>

      <footer className="pointer-events-auto fixed inset-x-0 bottom-0 z-[100] pb-[max(0px,env(safe-area-inset-bottom))]">
        <div className="flex h-14 items-center justify-between border-t border-white/8 bg-[rgba(14,15,17,0.86)] px-3 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onPlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
              aria-pressed={isPlaying}
              className={iconButton}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <div className="min-w-0 border-l border-white/10 pl-3">
              <div className="truncate text-[11px] text-white/[0.72]">{simulationTimeSlot}</div>
              <div className="ui-instrument text-[9px] text-white/[0.36]">
                {daysPerSecond.toFixed(1)} days/s
              </div>
            </div>
          </div>

          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-md bg-black/28 p-1">
            <button
              type="button"
              onClick={() => onScaleModeChange("compressed")}
              aria-pressed={scaleMode === "compressed"}
              className={`h-8 px-3 text-[10px] transition-colors ${
                scaleMode === "compressed" ? "bg-white/10 text-white" : "text-white/[0.42] hover:text-white/[0.75]"
              }`}
            >
              Atlas
            </button>
            <button
              type="button"
              onClick={() => onScaleModeChange("physical")}
              aria-pressed={scaleMode === "physical"}
              className={`h-8 px-3 text-[10px] transition-colors ${
                scaleMode === "physical" ? "bg-white/10 text-white" : "text-white/[0.42] hover:text-white/[0.75]"
              }`}
            >
              Physical
            </button>
          </div>

          <div className="flex items-center gap-1" ref={layersRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setLayersOpen((open) => !open)}
                className={`${iconButton} w-auto gap-1 px-2`}
                aria-expanded={layersOpen}
                title="Layers"
              >
                <Layers3 className="h-4 w-4" />
                <span className="hidden text-[10px] sm:inline">Layers</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </button>
              {layersOpen ? (
                <div className="absolute bottom-full right-0 mb-2 w-56 rounded-md border border-white/12 bg-[rgba(12,13,15,0.96)] p-2 shadow-2xl backdrop-blur-xl">
                  <div className="px-2 pb-2 pt-1 text-[9px] uppercase tracking-[0.12em] text-white/[0.35]">
                    Atlas layers
                  </div>
                  <LayerToggle
                    label="Chinese labels"
                    checked={viewSettings.showBodyLabels}
                    onChange={(checked) => patchView({ showBodyLabels: checked })}
                  />
                  <LayerToggle
                    label="Reference orbits"
                    checked={viewSettings.showReferenceOrbits}
                    onChange={(checked) => patchView({ showReferenceOrbits: checked })}
                  />
                  <LayerToggle
                    label="Live trails"
                    checked={viewSettings.showOrbitTrails}
                    onChange={(checked) => patchView({ showOrbitTrails: checked })}
                  />
                  <div className="my-2 h-px bg-white/8" />
                  <button
                    type="button"
                    onClick={() => onRenderBudgetChange(renderBudget === "dense" ? "balanced" : "dense")}
                    className="flex h-8 w-full items-center justify-between rounded px-2 text-[11px] text-white/[0.62] hover:bg-white/5"
                  >
                    <span>Orbit density</span>
                    <span className="ui-instrument text-[9px] uppercase text-white/40">{renderBudget}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenSandbox}
                    className="mt-1 flex h-8 w-full items-center rounded px-2 text-[11px] text-white/[0.62] hover:bg-white/5"
                  >
                    Open engineering sandbox
                  </button>
                </div>
              ) : null}
            </div>
            <button type="button" onClick={onResetView} className={iconButton} aria-label="Reset view" title="Reset view">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button type="button" onClick={onSearch} className={iconButton} aria-label="Search" title="Search objects">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}

function LayerToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-8 cursor-pointer items-center justify-between rounded px-2 text-[11px] text-white/[0.62] hover:bg-white/5">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 accent-[#d5c395]"
      />
    </label>
  );
}
