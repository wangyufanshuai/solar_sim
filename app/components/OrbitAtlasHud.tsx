"use client";

import {
  CircleDot,
  ChevronDown,
  FileCheck2,
  FileText,
  Layers3,
  LayoutDashboard,
  MapPinned,
  Pause,
  Play,
  Plus,
  Minus,
  RotateCcw,
  Rocket,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { SimulationViewSettings } from "../lib/simulationViewSettings";
import type {
  OrbitAtlasRenderBudget,
  OrbitAtlasScaleMode,
} from "../lib/orbitAtlasPresentation";
import { useGaiaCatalogSource } from "../lib/gaiaCatalogSourceState";
import { ATLAS_INSTRUMENT_UI_VERSION } from "../lib/atlasInstrumentUi";

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
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onOpenSandbox: () => void;
  onOpenLaunch: () => void;
  analysisAvailable: boolean;
  analysisOpen: boolean;
  onAnalysisToggle: () => void;
  atlasWorkflowsOpen: boolean;
  onAtlasWorkflowsOpen: () => void;
  missionHubOpen: boolean;
  onMissionHubOpen: () => void;
  observatoryDeckOpen: boolean;
  onObservatoryDeckOpen: () => void;
  scientificReportOpen: boolean;
  onScientificReportOpen: () => void;
  validationConsoleOpen: boolean;
  onValidationConsoleOpen: () => void;
  evidenceLedgerOpen: boolean;
  onEvidenceLedgerToggle: () => void;
};

const iconButton =
  "atlas-cinematic-icon shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-a11y-focus)]";

function layerActionClass(active = false): string {
  return `mt-1 flex h-8 w-full items-center justify-between rounded-md border px-2 text-[11px] transition-colors ${
    active
      ? "border-cyan-100/18 bg-cyan-100/[0.06] text-cyan-50/86"
      : "border-transparent text-white/[0.62] hover:border-cyan-100/12 hover:bg-cyan-100/[0.035] hover:text-white/82"
  }`;
}

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
  onZoomIn,
  onZoomOut,
  onResetView,
  onOpenSandbox,
  onOpenLaunch,
  analysisAvailable,
  analysisOpen,
  onAnalysisToggle,
  atlasWorkflowsOpen,
  onAtlasWorkflowsOpen,
  missionHubOpen,
  onMissionHubOpen,
  observatoryDeckOpen,
  onObservatoryDeckOpen,
  scientificReportOpen,
  onScientificReportOpen,
  validationConsoleOpen,
  onValidationConsoleOpen,
  evidenceLedgerOpen,
  onEvidenceLedgerToggle,
}: OrbitAtlasHudProps) {
  const [layersOpen, setLayersOpen] = useState(false);
  const layersRef = useRef<HTMLDivElement>(null);
  const gaiaCatalogSource = useGaiaCatalogSource();

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
      <div className="pointer-events-none fixed left-1/2 top-4 z-[90] -translate-x-1/2 text-center">
        <div className="atlas-cinematic-topline inline-flex h-7 items-center gap-2 px-3 text-[9px]" data-atlas-cinematic-hud="orbit-atlas-topline">
          <span className="whitespace-nowrap font-medium text-white/[0.68]">轨道图谱</span>
          <span className="hidden h-3 w-px bg-white/12 sm:block" />
          <span className="ui-instrument hidden whitespace-nowrap uppercase tracking-[0.08em] sm:inline">
            {scaleMode === "compressed" ? "/ 压缩尺度" : "/ 物理尺度"}
          </span>
          <span className="h-3 w-px bg-white/12" />
          <span className="ui-instrument whitespace-nowrap uppercase tracking-[0.08em]">
            {gaiaCatalogSource === "gaia-dr3" ? "GAIA DR3" : "PLACEHOLDER"}
          </span>
        </div>
        <div className="mt-1 hidden text-[9px] uppercase tracking-[0.12em] text-white/[0.30] sm:block">
          轨道图层仅用于可视化呈现
        </div>
      </div>

      <footer className="pointer-events-auto fixed inset-x-0 bottom-0 z-[100] pb-[max(0px,env(safe-area-inset-bottom))]">
        <div className="atlas-cinematic-dock flex h-[58px] items-center justify-between px-3 sm:px-5" data-atlas-cinematic-hud="bottom-dock">
          <div className="flex w-[78px] min-w-0 shrink-0 items-center gap-1 sm:w-auto sm:gap-3" data-atlas-cinematic-control-cluster="transport">
            <button
              type="button"
              onClick={onPlayPause}
              aria-label={isPlaying ? "暂停" : "播放"}
              aria-pressed={isPlaying}
              className={iconButton}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <div className="min-w-0 border-l border-white/10 pl-2 sm:pl-3">
              <div className="max-w-[42px] truncate text-[9px] leading-tight text-white/[0.72] sm:max-w-none sm:text-[11px]">{simulationTimeSlot}</div>
              <div className="ui-instrument whitespace-nowrap text-[9px] leading-tight text-white/[0.42]">
                {daysPerSecond.toFixed(1)} 天/秒
              </div>
            </div>
          </div>

          <div className="atlas-cinematic-cluster absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 p-1 sm:flex" data-atlas-cinematic-control-cluster="mode-tabs">
            <button
              type="button"
              onClick={() => onScaleModeChange("compressed")}
              aria-pressed={scaleMode === "compressed"}
              className="atlas-cinematic-tab h-8 px-3 text-[10px] transition-colors"
              data-active={scaleMode === "compressed" ? "true" : "false"}
            >
              图谱
            </button>
            <button
              type="button"
              onClick={() => onScaleModeChange("physical")}
              aria-pressed={scaleMode === "physical"}
              className="atlas-cinematic-tab h-8 px-3 text-[10px] transition-colors"
              data-active={scaleMode === "physical" ? "true" : "false"}
            >
              物理
            </button>
          </div>

          <div className="flex items-center gap-1" ref={layersRef} data-atlas-cinematic-control-cluster="camera-tools">
            <button
              type="button"
              onClick={onOpenLaunch}
              className={`${iconButton} w-auto gap-1 px-2`}
              aria-label="打开发射控制"
              title="火箭与卫星发射"
              data-atlas-launch-entry="orbit-atlas"
            >
              <Rocket className="h-4 w-4" />
              <span className="hidden text-[10px] sm:inline">发射</span>
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setLayersOpen((open) => !open)}
                className={`${iconButton} w-auto gap-1 px-2`}
                aria-expanded={layersOpen}
                title="图层"
              >
                <Layers3 className="h-4 w-4" />
                <span className="hidden text-[10px] sm:inline">图层</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </button>
              {layersOpen ? (
                <div
                  className="atlas-cinematic-menu absolute bottom-full right-0 mb-2 w-56 rounded-lg p-2"
                  data-atlas-instrument-ui-version={ATLAS_INSTRUMENT_UI_VERSION}
                >
                  <div className="px-2 pb-2 pt-1 text-[9px] uppercase tracking-[0.12em] text-white/[0.35]">
                    图谱图层
                  </div>
                  <LayerToggle
                    label="中文标签"
                    checked={viewSettings.showBodyLabels}
                    onChange={(checked) => patchView({ showBodyLabels: checked })}
                  />
                  <LayerToggle
                    label="参考轨道"
                    checked={viewSettings.showReferenceOrbits}
                    onChange={(checked) => patchView({ showReferenceOrbits: checked })}
                  />
                  <LayerToggle
                    label="实时轨迹"
                    checked={viewSettings.showOrbitTrails}
                    onChange={(checked) => patchView({ showOrbitTrails: checked })}
                  />
                  <LayerToggle
                    label="星座"
                    checked={viewSettings.showConstellationLines}
                    onChange={(checked) => patchView({ showConstellationLines: checked })}
                  />
                  <LayerToggle
                    label="深空天体"
                    checked={viewSettings.showDeepSkyObjects}
                    onChange={(checked) => patchView({ showDeepSkyObjects: checked })}
                  />
                  <LayerToggle
                    label="目录标签"
                    checked={viewSettings.showCatalogLabels}
                    onChange={(checked) => patchView({ showCatalogLabels: checked })}
                  />
                  <div className="my-2 h-px bg-white/8" />
                  <button
                    type="button"
                    onClick={() => {
                      onMissionHubOpen();
                      setLayersOpen(false);
                    }}
                    aria-pressed={missionHubOpen}
                    className={layerActionClass(missionHubOpen)}
                  >
                    <span className="flex items-center gap-2"><MapPinned className="h-3.5 w-3.5" />任务中心</span>
                    <span className="ui-instrument text-[9px] uppercase text-white/40">{missionHubOpen ? "已开" : "会话"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onObservatoryDeckOpen();
                      setLayersOpen(false);
                    }}
                    aria-pressed={observatoryDeckOpen}
                    className={layerActionClass(observatoryDeckOpen)}
                  >
                    <span className="flex items-center gap-2"><LayoutDashboard className="h-3.5 w-3.5" />观测台</span>
                    <span className="ui-instrument text-[9px] uppercase text-white/40">{observatoryDeckOpen ? "已开" : "工作台"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onScientificReportOpen();
                      setLayersOpen(false);
                    }}
                    aria-pressed={scientificReportOpen}
                    className={layerActionClass(scientificReportOpen)}
                  >
                    <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" />报告工作室</span>
                    <span className="ui-instrument text-[9px] uppercase text-white/40">{scientificReportOpen ? "已开" : "导出"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onValidationConsoleOpen();
                      setLayersOpen(false);
                    }}
                    aria-pressed={validationConsoleOpen}
                    className={layerActionClass(validationConsoleOpen)}
                  >
                    <span className="flex items-center gap-2"><ShieldAlert className="h-3.5 w-3.5" />验证控制台</span>
                    <span className="ui-instrument text-[9px] uppercase text-white/40">{validationConsoleOpen ? "已开" : "矩阵"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRenderBudgetChange(renderBudget === "dense" ? "balanced" : "dense")}
                    className="flex h-8 w-full items-center justify-between rounded px-2 text-[11px] text-white/[0.62] hover:bg-white/5"
                  >
                    <span>轨道密度</span>
                    <span className="ui-instrument text-[9px] uppercase text-white/40">{renderBudget}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onAnalysisToggle}
                    disabled={!analysisAvailable}
                    aria-pressed={analysisOpen}
                    className={`${layerActionClass(analysisOpen)} disabled:cursor-not-allowed disabled:opacity-35`}
                  >
                    <span className="flex items-center gap-2"><CircleDot className="h-3.5 w-3.5" />轨道分析</span>
                    <span className="ui-instrument text-[9px] uppercase text-white/40">{analysisOpen ? "已开" : "实时"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onAtlasWorkflowsOpen();
                      setLayersOpen(false);
                    }}
                    aria-pressed={atlasWorkflowsOpen}
                    className={layerActionClass(atlasWorkflowsOpen)}
                  >
                    <span className="flex items-center gap-2"><FileCheck2 className="h-3.5 w-3.5" />图谱流程</span>
                    <span className="ui-instrument text-[9px] uppercase text-white/40">{atlasWorkflowsOpen ? "已开" : "导览"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onEvidenceLedgerToggle();
                      setLayersOpen(false);
                    }}
                    aria-pressed={evidenceLedgerOpen}
                    className={layerActionClass(evidenceLedgerOpen)}
                  >
                    <span className="flex items-center gap-2"><FileCheck2 className="h-3.5 w-3.5" />证据账本</span>
                    <span className="ui-instrument text-[9px] uppercase text-white/40">{evidenceLedgerOpen ? "已开" : "证据"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenSandbox}
                    className="mt-1 flex h-8 w-full items-center rounded px-2 text-[11px] text-white/[0.62] hover:bg-white/5"
                  >
                    打开工程沙盒
                  </button>
                </div>
              ) : null}
            </div>
            <button type="button" onClick={onZoomIn} className={iconButton} aria-label="放大" title="放大" data-atlas-camera-zoom="in">
              <Plus className="h-4 w-4" />
            </button>
            <button type="button" onClick={onZoomOut} className={iconButton} aria-label="缩小" title="缩小" data-atlas-camera-zoom="out">
              <Minus className="h-4 w-4" />
            </button>
            <button type="button" onClick={onResetView} className={iconButton} aria-label="重置视图" title="重置视图">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button type="button" onClick={onSearch} className={iconButton} aria-label="搜索" title="搜索天体" data-atlas-accessibility-return-target="search">
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
        className="h-3.5 w-3.5 accent-cyan-200"
      />
    </label>
  );
}
