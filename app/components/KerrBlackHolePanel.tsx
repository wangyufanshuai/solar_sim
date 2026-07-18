"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  kerrOuterHorizonRadiusMeters,
  kerrStaticLimitRadiusMeters,
  schwarzschildRadiusMeters,
} from "../lib/kerrGeometry";
import {
  createKerrGeodesicValidationSummary,
  kerrEquatorialIscoRadiusM,
} from "../lib/kerrGeodesicKernel";
import {
  KERR_RELATIVITY_STUDIO_VERSION,
  createKerrRelativityStudioSummary,
} from "../lib/kerrRelativityStudio";
import {
  DEFAULT_KERR_IMPACT_PARAMETER_M,
  DEFAULT_KERR_GEODESIC_RENDER_MODE,
  DEFAULT_KERR_ORBIT_PRESET_ID,
  KERR_GEODESIC_VISUALIZATION_ID,
  KERR_ORBIT_PRESETS,
  KERR_RELATIVITY_LAB_VERSION,
  createKerrGeodesicTrackSet,
} from "../lib/kerrGeodesicVisualization";
import type {
  KerrGeodesicRenderMode,
  KerrGeodesicTrackKind,
  KerrOrbitPresetId,
  KerrRelativityStudioMode,
} from "../lib/simulationDiagnosticsTypes";
import { KERR_BLACK_HOLE_OFFSET_AU } from "./KerrBlackHole";
import {
  createKerrRayTraceReportV3,
  KERR_RAY_TRACE_V3_VERSION,
  type KerrRayTraceQualityV3,
} from "../lib/kerrRayTraceV3";

const SUN_MASS_KG = 1.98847e30;

export type KerrBlackHoleUiState = {
  massSolar: number;
  aOverM: number;
  impactParameterM: number;
  orbitPresetId: KerrOrbitPresetId;
  showFormulaPanel: boolean;
  highlightTrackKind: KerrGeodesicTrackKind | null;
  frameDragTeachingScale: number;
  renderMode: KerrGeodesicRenderMode;
  studioMode?: KerrRelativityStudioMode;
  rayTraceQuality?: KerrRayTraceQualityV3;
};

type KerrBlackHolePanelProps = {
  value: KerrBlackHoleUiState;
  onChange: (next: KerrBlackHoleUiState) => void;
};

function formatTeachingScale(value: number): string {
  return value >= 1e9 ? `${(value / 1e9).toFixed(2)} x10^9` : value.toExponential(1);
}

function trackLabel(kind: KerrGeodesicTrackKind): string {
  switch (kind) {
    case "photon-sphere":
      return "photon sphere";
    case "isco":
      return "Schw. ISCO";
    case "capture":
      return "capture";
    case "escape":
      return "escape";
    case "kerr-prograde":
      return "Kerr prograde";
    case "kerr-retrograde":
      return "Kerr retrograde";
    case "probe-null":
      return "probe null";
  }
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="science-metric-row">
      <span>{label}</span>
      <span className="science-mono text-right">{value}</span>
    </div>
  );
}

const RENDER_MODE_OPTIONS: ReadonlyArray<{ value: KerrGeodesicRenderMode; label: string }> = [
  { value: "geodesic-tracks", label: "Geodesic tracks" },
  { value: "teaching-particles", label: "Teaching particles" },
  { value: "both", label: "Both" },
];

const RAY_TRACE_QUALITY_OPTIONS: ReadonlyArray<{ value: KerrRayTraceQualityV3; label: string }> = [
  { value: "mobile-safe", label: "Mobile safe" },
  { value: "interactive", label: "Interactive" },
  { value: "science-still", label: "Science still" },
];

const STUDIO_MODE_OPTIONS: ReadonlyArray<{ value: KerrRelativityStudioMode; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "probe", label: "Probe" },
  { value: "isco", label: "ISCO" },
  { value: "error", label: "Error" },
  { value: "boundary", label: "Boundary" },
];

function studioModeForPreset(presetId: KerrOrbitPresetId): KerrRelativityStudioMode {
  switch (presetId) {
    case "isco-comparison":
    case "frame-drag-split":
      return "isco";
    case "capture-cone":
    case "wide-deflection":
      return "probe";
    case "photon-ring-demo":
    default:
      return "overview";
  }
}

export default function KerrBlackHolePanel({
  value,
  onChange,
}: KerrBlackHolePanelProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const renderMode = value.renderMode ?? DEFAULT_KERR_GEODESIC_RENDER_MODE;
  const orbitPresetId = value.orbitPresetId ?? DEFAULT_KERR_ORBIT_PRESET_ID;
  const impactParameterM = value.impactParameterM ?? DEFAULT_KERR_IMPACT_PARAMETER_M;
  const showFormulaPanel = value.showFormulaPanel ?? true;
  const highlightTrackKind = value.highlightTrackKind ?? "probe-null";
  const studioMode = value.studioMode ?? "overview";
  const rayTraceQuality = value.rayTraceQuality ?? "interactive";

  const mKg = value.massSolar * SUN_MASS_KG;
  const rgKm = useMemo(() => schwarzschildRadiusMeters(mKg) / 1000, [mKg]);
  const rPlusKm = useMemo(
    () => kerrOuterHorizonRadiusMeters(mKg, value.aOverM) / 1000,
    [mKg, value.aOverM],
  );
  const rSlEqKm = useMemo(
    () => kerrStaticLimitRadiusMeters(mKg, value.aOverM, 0) / 1000,
    [mKg, value.aOverM],
  );
  const validation = useMemo(
    () =>
      createKerrGeodesicValidationSummary({
        spinA: value.aOverM,
        impactParameterM,
        presetId: orbitPresetId,
      }),
    [impactParameterM, orbitPresetId, value.aOverM],
  );
  const trackSet = useMemo(
    () =>
      createKerrGeodesicTrackSet({
        spinA: value.aOverM,
        impactParameterM,
        presetId: orbitPresetId,
      }),
    [impactParameterM, orbitPresetId, value.aOverM],
  );
  const iscoProM = useMemo(
    () => kerrEquatorialIscoRadiusM(value.aOverM, "prograde"),
    [value.aOverM],
  );
  const iscoRetroM = useMemo(
    () => kerrEquatorialIscoRadiusM(value.aOverM, "retrograde"),
    [value.aOverM],
  );
  const studioSummary = useMemo(
    () =>
      createKerrRelativityStudioSummary({
        spinA: value.aOverM,
        impactParameterM,
        presetId: orbitPresetId,
        renderMode,
        mode: studioMode,
        trackSet,
        validationSummary: validation,
      }),
    [impactParameterM, orbitPresetId, renderMode, studioMode, trackSet, validation, value.aOverM],
  );
  const rayTraceSummary = useMemo(
    () => createKerrRayTraceReportV3({ quality: rayTraceQuality, spinA: value.aOverM }),
    [rayTraceQuality, value.aOverM],
  );
  const activeStudioSection =
    studioSummary.sections.find((section) => section.id === studioMode) ??
    studioSummary.sections[0];

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || !open) return;
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
    window.requestAnimationFrame(() => toggleRef.current?.focus({ preventScroll: true }));
  };

  return (
    <aside
      ref={panelRef}
      className="atlas-accessible-surface atlas-cinematic-workbench science-panel pointer-events-auto fixed bottom-[calc(var(--ui-dock-height)+14px+env(safe-area-inset-bottom))] right-3 z-[111] max-h-[46dvh] w-[min(calc(100vw-1.5rem),320px)] select-none overflow-y-auto px-3 py-2 text-xs text-ui-primary shadow-ui-panel sm:bottom-[5.5rem] sm:max-h-[calc(100dvh-7rem)] sm:w-[min(100vw,320px)]"
      data-relativity-visualization={KERR_GEODESIC_VISUALIZATION_ID}
      data-relativity-lab-version={KERR_RELATIVITY_LAB_VERSION}
      data-kerr-geodesic-track-count={trackSet.trackCount}
      data-kerr-geodesic-render-mode={renderMode}
      data-kerr-orbit-preset={orbitPresetId}
      data-kerr-impact-parameter-m={impactParameterM.toFixed(2)}
      data-kerr-probe-status={trackSet.probe.probeStatus}
      data-kerr-relativity-studio-version={KERR_RELATIVITY_STUDIO_VERSION}
      data-kerr-studio-mode={studioMode}
      data-kerr-studio-preset={studioSummary.presetId}
      data-kerr-studio-probe-status={studioSummary.probeStatus}
      data-kerr-studio-isco-split-m={studioSummary.iscoSplitM.toFixed(3)}
      data-kerr-studio-hamiltonian-drift={studioSummary.maxHamiltonianDrift.toExponential(1)}
      data-kerr-studio-boundary={studioSummary.boundary}
      data-kerr-3d-geodesic-version="v129-kerr-3d-geodesics"
      data-kerr-render-resolution-policy="webgl2-0.75-mobile-shadow-0.5"
      data-kerr-accretion-boundary="display-model-not-grmhd"
      data-kerr-ray-trace-version={KERR_RAY_TRACE_V3_VERSION}
      data-kerr-ray-trace-quality={rayTraceQuality}
      data-kerr-ray-trace-boundary={rayTraceSummary.boundary}
      data-atlas-accessibility-surface-id="kerr-relativity-studio"
      data-atlas-accessibility-focus-target="true"
      aria-label="Kerr Relativity Studio"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="atlas-accessible-focus flex min-h-9 w-full items-center justify-between rounded-md px-1 text-left font-medium text-ui-primary"
        aria-expanded={open}
        aria-controls="kerr-relativity-studio-content"
      >
        <span id="kerr-relativity-studio-title">Kerr Relativity Studio</span>
        <span className="science-status-pill" aria-hidden="true">
          {open ? "收起" : "展开"}
        </span>
      </button>
      <p className="px-1 pb-1 text-[11px] leading-4 text-amber-100/70" data-kerr-research-boundary="shadow-not-grmhd">
        研究模型 · shadow · 解析薄盘，非 GRMHD
      </p>
      {open ? (
        <div id="kerr-relativity-studio-content" className="mt-2 space-y-3 border-t border-white/8 pt-2">
          <p className="text-[11px] leading-relaxed text-ui-dim">
            Geodesic-backed strong-field lab at ({KERR_BLACK_HOLE_OFFSET_AU[0]},
            {KERR_BLACK_HOLE_OFFSET_AU[1]},{KERR_BLACK_HOLE_OFFSET_AU[2]}) AU.
            Visual tracks are test-particle geodesics; solar dynamics remains EIH
            1PN. The weak-field particle stream is a secondary teaching layer.
          </p>
          <p className="text-[10px] leading-relaxed text-amber-100/55">
            吸积盘与光子环为程序化展示模型，不是 GRMHD 模拟；非赤道轨迹使用
            E、Lz 与 Carter Q 的隔离测试粒子内核。
          </p>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            <div className="rounded-md border border-cyan-100/12 bg-cyan-100/[0.035] px-2 py-1.5">
              <div className="text-[9px] uppercase tracking-[0.12em] text-cyan-100/45">Probe</div>
              <div className="mt-0.5 truncate text-[11px] font-medium text-cyan-50/82">
                {studioSummary.probeStatus}
              </div>
            </div>
            <div className="rounded-md border border-white/8 bg-black/16 px-2 py-1.5">
              <div className="text-[9px] uppercase tracking-[0.12em] text-white/32">4M/b</div>
              <div className="mt-0.5 truncate text-[11px] text-white/70">
                {studioSummary.weakFieldDeflectionRad.toExponential(1)} rad
              </div>
            </div>
            <div className="rounded-md border border-white/8 bg-black/16 px-2 py-1.5">
              <div className="text-[9px] uppercase tracking-[0.12em] text-white/32">ISCO split</div>
              <div className="mt-0.5 truncate text-[11px] text-white/70">
                {studioSummary.iscoSplitM.toFixed(2)}M
              </div>
            </div>
            <div className="rounded-md border border-white/8 bg-black/16 px-2 py-1.5">
              <div className="text-[9px] uppercase tracking-[0.12em] text-white/32">H drift</div>
              <div className="mt-0.5 truncate text-[11px] text-white/70">
                {studioSummary.maxHamiltonianDrift.toExponential(1)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 overflow-hidden rounded-md border border-cyan-100/12 bg-black/20" role="group" aria-label="Kerr Studio mode">
            {STUDIO_MODE_OPTIONS.map((option) => {
              const active = studioMode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...value,
                      studioMode: option.value,
                    })
                  }
                  className={
                      active
                        ? "atlas-accessible-focus min-h-6 bg-cyan-100/[0.12] px-1.5 py-1.5 text-[10px] text-cyan-50/90"
                        : "atlas-accessible-focus min-h-6 px-1.5 py-1.5 text-[10px] text-ui-muted hover:bg-white/7 hover:text-ui-primary"
                  }
                  aria-pressed={active}
                >
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-ui-muted">
              <span>Experiment cards</span>
              <span className="science-mono text-[10px] text-cyan-100/52">{studioSummary.version}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {KERR_ORBIT_PRESETS.map((preset) => {
                const active = orbitPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        orbitPresetId: preset.id,
                        aOverM: preset.spinA,
                        impactParameterM: preset.impactParameterM,
                        highlightTrackKind: preset.highlightTrackKind,
                        studioMode: studioModeForPreset(preset.id),
                      })
                    }
                    className={
                      active
                        ? "atlas-accessible-focus min-h-6 rounded-md border border-cyan-100/24 bg-cyan-100/[0.105] px-2 py-1.5 text-left text-[10px] text-cyan-50/90"
                        : "atlas-accessible-focus min-h-6 rounded-md border border-white/8 bg-black/16 px-2 py-1.5 text-left text-[10px] text-ui-muted hover:bg-white/7 hover:text-ui-primary"
                    }
                  >
                    <span className="block truncate">{preset.label}</span>
                    <span className="mt-0.5 block truncate text-[9px] opacity-70">
                      a/M {preset.spinA.toFixed(2)} · b/M {preset.impactParameterM.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeStudioSection ? (
            <div className="rounded-md border border-cyan-100/12 bg-cyan-100/[0.028] px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/55">
                {activeStudioSection.title}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-white/58">
                {activeStudioSection.body}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {activeStudioSection.metrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="min-w-0 rounded border border-white/8 bg-black/18 px-2 py-1.5"
                  >
                    <div className="truncate text-[9px] uppercase tracking-[0.11em] text-white/31">
                      {metric.label}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-white/66">
                      {metric.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <div className="mb-1 text-ui-muted">Render mode</div>
            <div className="grid grid-cols-3 overflow-hidden rounded-md border border-white/10">
              {RENDER_MODE_OPTIONS.map((option) => {
                const active = renderMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        renderMode: option.value,
                      })
                    }
                    className={
                      active
                        ? "atlas-accessible-focus min-h-6 bg-sky-300/16 px-2 py-1 text-[10px] text-sky-100"
                        : "atlas-accessible-focus min-h-6 bg-black/18 px-2 py-1 text-[10px] text-ui-muted hover:bg-white/7 hover:text-ui-primary"
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-ui-muted">
              <span>Ray-trace quality</span>
              <span className="science-mono text-[10px] text-cyan-100/52">V3 reference-backed</span>
            </div>
            <div className="grid grid-cols-3 overflow-hidden rounded-md border border-white/10">
              {RAY_TRACE_QUALITY_OPTIONS.map((option) => {
                const active = rayTraceQuality === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange({ ...value, rayTraceQuality: option.value })}
                    className={
                      active
                        ? "atlas-accessible-focus min-h-6 bg-cyan-300/16 px-2 py-1 text-[10px] text-cyan-100"
                        : "atlas-accessible-focus min-h-6 bg-black/18 px-2 py-1 text-[10px] text-ui-muted hover:bg-white/7 hover:text-ui-primary"
                    }
                    aria-pressed={active}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="text-ui-muted">
              Mass M (solar masses): {value.massSolar.toFixed(2)}
            </span>
            <input
              type="range"
              min={1}
              max={80}
              step={0.5}
              value={value.massSolar}
              onChange={(e) =>
                onChange({
                  ...value,
                  massSolar: Number(e.target.value),
                })
              }
              className="mt-1 min-h-6 w-full accent-sky-300"
            />
          </label>

          <label className="block">
            <span className="text-ui-muted">Spin a/M: {value.aOverM.toFixed(3)}</span>
            <input
              type="range"
              min={0}
              max={0.998}
              step={0.002}
              value={value.aOverM}
              onChange={(e) =>
                onChange({
                  ...value,
                  aOverM: Number(e.target.value),
                  studioMode: "isco",
                })
              }
              className="mt-1 min-h-6 w-full accent-sky-300"
            />
          </label>

          <label className="block">
            <span className="text-ui-muted">Impact parameter b/M: {impactParameterM.toFixed(2)}</span>
            <input
              type="range"
              min={2.2}
              max={18}
              step={0.05}
              value={impactParameterM}
              onChange={(e) =>
                onChange({
                  ...value,
                  impactParameterM: Number(e.target.value),
                  highlightTrackKind: "probe-null",
                  studioMode: "probe",
                })
              }
              className="mt-1 min-h-6 w-full accent-cyan-200"
            />
          </label>

          <label className="block">
            <span className="text-ui-muted">
              Teaching particle frame-drag scale: {formatTeachingScale(value.frameDragTeachingScale)}
            </span>
            <input
              type="range"
              min={5}
              max={15}
              step={0.08}
              value={Math.min(
                15,
                Math.max(5, Math.log10(Math.max(1, value.frameDragTeachingScale))),
              )}
              onChange={(e) =>
                onChange({
                  ...value,
                  frameDragTeachingScale: Math.pow(10, Number(e.target.value)),
                })
              }
              className="mt-1 min-h-6 w-full accent-sky-300"
            />
          </label>

          <div>
            <div className="mb-1 flex items-center justify-between text-ui-muted">
              <span>Track legend</span>
              <button
                type="button"
                onClick={() => onChange({ ...value, highlightTrackKind: null })}
                className="atlas-accessible-focus min-h-6 rounded px-1 text-[10px] text-sky-200/72 hover:text-sky-100"
              >
                show all
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {trackSet.tracks.map((track) => {
                const active = highlightTrackKind === track.kind;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        highlightTrackKind: track.kind,
                      })
                    }
                    className={
                      active
                        ? "flex items-center gap-2 rounded-md border border-white/16 bg-white/8 px-2 py-1 text-[10px] text-ui-primary"
                        : "flex items-center gap-2 rounded-md border border-white/7 bg-black/12 px-2 py-1 text-[10px] text-ui-muted hover:bg-white/6"
                    }
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: track.color }} />
                    <span className="truncate">{trackLabel(track.kind)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="science-section-title">Geometry</div>
          <div className="space-y-1 text-[11px] text-ui-muted">
            <MetricRow label="GM/c^2" value={`${rgKm.toFixed(3)} km`} />
            <MetricRow label="Outer horizon r+" value={`${rPlusKm.toFixed(3)} km`} />
            <MetricRow label="Equatorial static limit" value={`${rSlEqKm.toFixed(3)} km`} />
            <MetricRow label="ISCO pro / retro" value={`${iscoProM.toFixed(3)}M / ${iscoRetroM.toFixed(3)}M`} />
          </div>

          <div className="science-section-title">Validation</div>
          <div className="space-y-1 text-[11px] text-ui-muted">
            <MetricRow label="Ray reference" value={KERR_RAY_TRACE_V3_VERSION} />
            <MetricRow label="Ray quality" value={rayTraceQuality} />
            <MetricRow
              label="Critical curve RMS"
              value={`${rayTraceSummary.criticalCurveRadiusScreenM.toFixed(6)}M`}
            />
            <MetricRow label="Kernel" value={validation.kernel} />
            <MetricRow label="Status" value={validation.status} />
            <MetricRow label="Visualization" value={trackSet.visualization} />
            <MetricRow label="Visible tracks" value={`${trackSet.trackCount}`} />
            <MetricRow label="Preset / probe" value={`${orbitPresetId} / ${trackSet.probe.probeStatus}`} />
            <MetricRow label="Impact b/M" value={impactParameterM.toFixed(2)} />
            <MetricRow
              label="Max H drift"
              value={trackSet.maxHamiltonianConstraintAbs.toExponential(1)}
            />
            <MetricRow
              label="H drift null / timelike"
              value={`${validation.integration.nullHamiltonianDrift.toExponential(1)} / ${validation.integration.timelikeHamiltonianDrift.toExponential(1)}`}
            />
            <MetricRow
              label="Capture / escape"
              value={`${validation.integration.captureStatus} / ${validation.integration.escapeStatus}`}
            />
            <MetricRow
              label="Probe radial range"
              value={`${trackSet.probe.radialRangeMinM.toFixed(2)}-${trackSet.probe.radialRangeMaxM.toFixed(2)}M`}
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-3 border-t border-white/8 pt-2 text-[11px] text-ui-muted">
            <span>Formula and error panel</span>
            <input
              type="checkbox"
              checked={showFormulaPanel}
              onChange={(e) => onChange({ ...value, showFormulaPanel: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-white/20 bg-transparent text-white focus:ring-0"
            />
          </label>

          {showFormulaPanel ? (
            <div className="science-panel px-3 py-2 text-[11px] leading-5 text-ui-muted">
              <div className="science-section-title mb-1">Formula / error</div>
              <div>
                Null probe: Schwarzschild equatorial geodesic with E=1, L=b.
              </div>
              <div>
                Weak-field reference: alpha = 4M/b ={" "}
                {studioSummary.weakFieldDeflectionRad.toExponential(2)} rad
                {" "}({studioSummary.weakFieldDeflectionArcsec.toFixed(1)} arcsec).
              </div>
              <div>
                Strong-field result: {trackSet.probe.geodesicStatus} /{" "}
                {studioSummary.probeStatus}; H drift{" "}
                {studioSummary.maxHamiltonianDrift.toExponential(1)}; ISCO split{" "}
                {studioSummary.iscoSplitM.toFixed(3)}M.
              </div>
              <div>
                Boundary note: b near 3sqrt(3)M marks the Schwarzschild photon capture edge; this is a {studioSummary.boundary}, not numerical relativity.
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
