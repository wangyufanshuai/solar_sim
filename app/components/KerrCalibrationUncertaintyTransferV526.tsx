"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrCalibrationUncertaintyTransferSnapshotV526,
  loadKerrCalibrationUncertaintyTransferSummaryV526,
  subscribeKerrCalibrationUncertaintyTransferV526,
} from "../lib/kerrCalibrationUncertaintyTransferClientV526";
import {
  compareKerrCalibrationUncertaintyHudEncodingsV526,
  createKerrCalibrationUncertaintyHudEncodingV526,
  resolveKerrCalibrationUncertaintyHudProfileV526,
  type KerrCalibrationUncertaintyHudModeV526,
} from "../lib/kerrCalibrationUncertaintyTransferV526";

export default function KerrCalibrationUncertaintyTransferV526() {
  const [mode, setMode] = useState<KerrCalibrationUncertaintyHudModeV526>("science");
  const state = useSyncExternalStore(
    subscribeKerrCalibrationUncertaintyTransferV526,
    getKerrCalibrationUncertaintyTransferSnapshotV526,
    getKerrCalibrationUncertaintyTransferSnapshotV526,
  );
  useEffect(() => {
    void loadKerrCalibrationUncertaintyTransferSummaryV526().catch(() => undefined);
  }, []);
  const profile = resolveKerrCalibrationUncertaintyHudProfileV526(mode);
  const summary = state.summary;
  const encoding = summary ? createKerrCalibrationUncertaintyHudEncodingV526(summary, mode) : null;
  if (summary) {
    compareKerrCalibrationUncertaintyHudEncodingsV526(
      createKerrCalibrationUncertaintyHudEncodingV526(summary, "science"),
      createKerrCalibrationUncertaintyHudEncodingV526(summary, "cinematic"),
    );
  }
  const style = {
    "--v526-panel": profile.panel,
    "--v526-raised": profile.panelRaised,
    "--v526-ink": profile.ink,
    "--v526-muted": profile.muted,
    "--v526-grid": profile.grid,
    "--v526-science": profile.scienceNoise,
    "--v526-calibration": profile.calibrationNoise,
    "--v526-combined": profile.combined,
    "--v526-unavailable": profile.unavailable,
    "--v526-rail-opacity": profile.railOpacity,
    "--v526-node-glow": profile.nodeGlowOpacity,
  } as CSSProperties;
  return (
    <section
      style={style}
      className="relative mt-7 overflow-hidden rounded-[42px] border border-white/10 bg-[var(--v526-panel)] p-5 font-mono text-[var(--v526-ink)] shadow-[0_70px_220px_rgba(0,0,0,.8)] sm:p-8"
      data-atlas-kerr-calibration-uncertainty-transfer-v526
      data-atlas-v526-profile={profile.id}
      data-atlas-v526-mode={mode}
      data-atlas-v526-linear-display={profile.scienceBoundary.linearDisplay}
      data-atlas-v526-bloom-intensity={profile.scienceBoundary.bloomIntensity}
      data-atlas-v526-color-grade-intensity={profile.scienceBoundary.colorGradeIntensity}
      data-atlas-v526-cinematic-seed={profile.cinematicSeed ?? "none"}
      data-atlas-v526-numeric-scientific-style-input-count={profile.scienceBoundary.numericScientificStyleInputCount}
      data-atlas-v526-variance-drives-style={profile.scienceBoundary.varianceDrivesStyle}
      data-atlas-v526-correlation-drives-style={profile.scienceBoundary.correlationDrivesStyle}
      data-atlas-v526-bound-drives-style={profile.scienceBoundary.boundDrivesStyle}
      data-atlas-v526-scientific-mutation={profile.scienceBoundary.scientificFieldMutation}
      data-atlas-v526-scientific-row-count={encoding?.rows.length ?? 0}
      data-atlas-v526-canvas-created="false"
      data-atlas-v526-scene-revision-delta="0"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[var(--v526-rail-opacity)] [background-image:linear-gradient(var(--v526-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v526-grid)_1px,transparent_1px)] [background-size:38px_38px]" />
      <header className="relative border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[9px] uppercase tracking-[.42em] text-[var(--v526-muted)]">V526 / calibration uncertainty transfer</div>
            <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.035em] sm:text-5xl">误差传播公式已闭合，真实误差条仍未被测量</h2>
          </div>
          <div className="flex border border-white/10 bg-black/20 p-1" aria-label="V7.5 uncertainty HUD mode">
            {(["science", "cinematic"] as const).map((candidate) => (
              <button key={candidate} type="button" aria-pressed={mode === candidate} className={mode === candidate ? "bg-white/10 px-3 py-2 text-[8px] uppercase tracking-[.16em] text-white" : "px-3 py-2 text-[8px] uppercase tracking-[.16em] text-white/35"} onClick={() => setMode(candidate)}>{candidate}</button>
            ))}
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-[10px] leading-6 text-[var(--v526-muted)]">解析反演与 80 位矩阵 oracle 独立得到相同传递行；64 个确定性误差盒顶点验证最坏情况系数。页面只展示无量纲系数，不把未知噪声尺度伪装成 Q/I 或 U/I 的物理误差。</p>
      </header>

      {!summary ? (
        <div className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-4 text-[10px] text-[var(--v526-muted)]">
          {state.status === "idle" || state.status === "loading" ? "正在读取误差传播摘要…" : `误差传播 artifact 不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-3 md:grid-cols-2">
            {summary.unitVarianceTransfer.varianceRows.map((row) => (
              <article key={row.parameterId} className="border border-white/10 bg-[var(--v526-raised)] p-4">
                <div className="text-[9px] uppercase tracking-[.18em] text-[var(--v526-combined)]">{row.parameterId} unit-variance coefficients</div>
                <div className="mt-4 grid grid-cols-3 gap-px bg-white/10 text-center">
                  <Metric label="science" value={row.scienceCoefficient} tone="science" />
                  <Metric label="calibration" value={row.calibrationCoefficient} tone="calibration" />
                  <Metric label="total" value={row.totalCoefficient} tone="combined" />
                </div>
                <div className="mt-3 text-[8px] text-[var(--v526-unavailable)]">physical variance unavailable</div>
              </article>
            ))}
          </div>

          <div className="relative mt-5 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
            <article className="border border-white/10 bg-black/20 p-4">
              <div className="text-[8px] uppercase tracking-[.18em] text-[var(--v526-combined)]">64-vertex deterministic bound</div>
              <div className="mt-4 space-y-2 text-[9px]">
                <Datum label="max |δ(Q/I)| coefficient" value={compact(summary.boundedUnitErrorTransfer.maximumQOverIAbsoluteCoefficient)} />
                <Datum label="max |δ(U/I)| coefficient" value={compact(summary.boundedUnitErrorTransfer.maximumUOverIAbsoluteCoefficient)} />
                <Datum label="max joint L2 coefficient" value={compact(summary.boundedUnitErrorTransfer.maximumJointL2Coefficient)} />
                <Datum label="vertices" value={String(summary.boundedUnitErrorTransfer.vertexCount)} />
              </div>
            </article>
            <article className="border border-white/10 bg-[var(--v526-raised)] p-4">
              <div className="text-[8px] uppercase tracking-[.18em] text-[var(--v526-calibration)]">Constraint-correlation stress · not a prior</div>
              <div className="mt-4 grid grid-cols-[1fr_1fr] gap-px bg-white/10 text-[8px]">
                <Cell value="ρ constraint" header />
                <Cell value="ρ Q/U" header />
                {summary.correlatedConstraintStress.samples.flatMap((sample) => [
                  <Cell key={`${sample.constraintCorrelation}-input`} value={sample.constraintCorrelation} />,
                  <Cell key={`${sample.constraintCorrelation}-output`} value={sample.observableCorrelation} />,
                ])}
              </div>
            </article>
          </div>

          <div className="relative mt-5 border-l-2 border-[var(--v526-unavailable)] bg-black/20 px-4 py-4 text-[9px] leading-5 text-[var(--v526-muted)]">真实 science noise、calibration noise 和相关性先验均 unavailable；因此 numerical covariance、Q/I/U/I error bars、expected electrons、observed counts 和 science raster 全部保持不可用。</div>
          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.12em] text-[var(--v526-muted)]">
            <span>unit transfer qualified · physical uncertainty unavailable · measured 0/6 · dense 0/49 · browser not-run</span>
            <a className="border border-white/12 px-3 py-2 hover:border-white/25" href="/api/atlas/relativity-evidence/v526/calibration-uncertainty-transfer?download=transfer">Export full transfer</a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "science" | "calibration" | "combined" }>) {
  const color = tone === "science" ? "var(--v526-science)" : tone === "calibration" ? "var(--v526-calibration)" : "var(--v526-combined)";
  return <div className="bg-black/20 px-2 py-3"><div className="text-[7px] uppercase tracking-[.12em] text-[var(--v526-muted)]">{label}</div><div className="mt-1 text-lg" style={{ color }}>{value}</div></div>;
}
function Datum({ label, value }: Readonly<{ label: string; value: string }>) {
  return <div className="flex items-center justify-between gap-4 border border-white/10 bg-[var(--v526-raised)] px-3 py-2"><span className="text-[var(--v526-muted)]">{label}</span><span className="text-[var(--v526-combined)]">{value}</span></div>;
}
function Cell({ value, header = false }: Readonly<{ value: string; header?: boolean }>) {
  return <div className={header ? "bg-white/[.06] px-3 py-2 uppercase tracking-[.12em] text-white/45" : "bg-black/20 px-3 py-2 text-[var(--v526-muted)]"}>{value}</div>;
}
const compact = (value: string) => Number(value).toFixed(8);
