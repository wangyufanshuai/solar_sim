"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrFixedBandStokesSnapshotV520,
  loadKerrFixedBandStokesSummaryV520,
  subscribeKerrFixedBandStokesV520,
} from "../lib/kerrFixedBandStokesClientV520";
import { resolveKerrProvenanceConstellationProfileV518 } from "../lib/kerrProvenanceConstellationV518";

export default function KerrFixedBandStokesV520() {
  const state = useSyncExternalStore(
    subscribeKerrFixedBandStokesV520,
    getKerrFixedBandStokesSnapshotV520,
    getKerrFixedBandStokesSnapshotV520,
  );
  useEffect(() => {
    void loadKerrFixedBandStokesSummaryV520().catch(() => undefined);
  }, []);
  const profile = resolveKerrProvenanceConstellationProfileV518("science");
  const style = {
    "--v520-panel": profile.panel,
    "--v520-raised": profile.panelRaised,
    "--v520-ink": profile.ink,
    "--v520-grid": profile.grid,
    "--v520-qualified": profile.nodeStroke,
  } as CSSProperties;
  const summary = state.summary;
  return (
    <section
      style={style}
      className="relative mt-7 overflow-hidden rounded-[40px] border border-white/10 bg-[var(--v520-panel)] p-5 font-mono text-[var(--v520-ink)] shadow-[0_70px_220px_rgba(0,0,0,.78)] sm:p-8"
      data-atlas-kerr-fixed-band-stokes-v520
      data-atlas-v520-ray-count="4"
      data-atlas-v520-band-count="3"
      data-atlas-v520-transport-method-count="2"
      data-atlas-v520-row-count="24"
      data-atlas-v520-measured-stokes-row-count="0"
      data-atlas-v520-circular-stokes-row-count="0"
      data-atlas-v520-detector-projected-row-count="0"
      data-atlas-v520-scientific-mutation="false"
      data-atlas-v520-canvas-created="false"
      data-atlas-v520-scene-revision-delta="0"
    >
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(var(--v520-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v520-grid)_1px,transparent_1px)] [background-size:40px_40px]" />
      <header className="relative border-b border-white/10 pb-6">
        <div className="text-[9px] uppercase tracking-[.42em] opacity-50">
          V520 / fixed-band dual-transport Stokes authority
        </div>
        <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.035em] sm:text-5xl">
          让每个固定波段同时保留两条偏振传播证词
        </h2>
        <p className="mt-4 max-w-3xl text-[10px] leading-6 opacity-55">
          四条 disk ray、三个波段和两条独立传播路径共同生成 24 组能量与光子 I/Q/U。
          Walker–Penrose 与 Kerr–Schild 平行输运从不平均，循环偏振、Faraday 效应与实测探测器响应保持不可用。
        </p>
      </header>
      {!summary ? (
        <div className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-4 text-[10px] opacity-55">
          {state.status === "idle" || state.status === "loading"
            ? "正在读取固定波段 Stokes 摘要…"
            : `固定波段 Stokes 不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-4">
            <Metric label="rays" value="4" />
            <Metric label="bands" value="3" />
            <Metric label="methods" value="2" />
            <Metric label="I/Q/U rows" value="24" />
          </div>
          <div className="relative mt-5 grid gap-3 md:grid-cols-2">
            <Gate
              label="linear fraction residual"
              value={scientific(summary.maxima.linearFractionResidual)}
            />
            <Gate
              label="EVPA reconstruction"
              value={`${scientific(summary.maxima.evpaReconstructionDeg)} deg`}
            />
            <Gate
              label="WP ↔ KS EVPA"
              value={`${scientific(summary.maxima.wpKsEvpaDifferenceDeg)} deg`}
            />
            <Gate
              label="WP ↔ KS normalized Q"
              value={scientific(summary.maxima.wpKsNormalizedQDifference)}
            />
            <Gate
              label="WP ↔ KS normalized U"
              value={scientific(summary.maxima.wpKsNormalizedUDifference)}
            />
            <Gate label="polarization cone violation" value="0" />
          </div>
          <div className="relative mt-5 border-l-2 border-amber-300/45 bg-amber-300/[.035] px-4 py-4 text-[9px] leading-5 text-amber-100/65">
            这些是冻结薄盘与真空几何光学模型的预测 Stokes，不是实测偏振、Mueller 标定、圆偏振、探测器计数或科学影像资格。
          </div>
          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.12em] opacity-40">
            <span>model-only · measured 0 · circular 0 · detector 0 · dense 0/49 · browser not-run</span>
            <a
              className="border border-white/12 px-3 py-2"
              href="/api/atlas/relativity-evidence/v520/fixed-band-stokes?download=stokes"
            >
              Export full Stokes payload
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-[var(--v520-raised)] px-3 py-4 text-center">
      <div className="text-[7px] uppercase tracking-[.14em] opacity-30">{label}</div>
      <div className="mt-1 text-xl text-[var(--v520-qualified)]">{value}</div>
    </div>
  );
}

function Gate({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-4 border border-white/10 bg-black/20 px-4 py-3 text-[9px]">
      <span className="opacity-35">{label}</span>
      <span className="text-[var(--v520-qualified)]">{value}</span>
    </div>
  );
}

const scientific = (value: string) => Number(value).toExponential(3);
