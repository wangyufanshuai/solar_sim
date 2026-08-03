"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrPolarizationFrequencySensitivitySnapshotV522,
  loadKerrPolarizationFrequencySensitivitySummaryV522,
  subscribeKerrPolarizationFrequencySensitivityV522,
} from "../lib/kerrPolarizationFrequencySensitivityClientV522";
import { resolveKerrProvenanceConstellationProfileV518 } from "../lib/kerrProvenanceConstellationV518";

export default function KerrPolarizationFrequencySensitivityV522() {
  const state = useSyncExternalStore(
    subscribeKerrPolarizationFrequencySensitivityV522,
    getKerrPolarizationFrequencySensitivitySnapshotV522,
    getKerrPolarizationFrequencySensitivitySnapshotV522,
  );
  useEffect(() => {
    void loadKerrPolarizationFrequencySensitivitySummaryV522().catch(() => undefined);
  }, []);
  const profile = resolveKerrProvenanceConstellationProfileV518("science");
  const style = {
    "--v522-panel": profile.panel,
    "--v522-raised": profile.panelRaised,
    "--v522-ink": profile.ink,
    "--v522-grid": profile.grid,
    "--v522-qualified": profile.nodeStroke,
  } as CSSProperties;
  const summary = state.summary;
  return (
    <section
      style={style}
      className="relative mt-7 overflow-hidden rounded-[40px] border border-white/10 bg-[var(--v522-panel)] p-5 font-mono text-[var(--v522-ink)] shadow-[0_70px_220px_rgba(0,0,0,.78)] sm:p-8"
      data-atlas-kerr-polarization-frequency-sensitivity-v522
      data-atlas-v522-scenario-count="9"
      data-atlas-v522-scenario-row-count="216"
      data-atlas-v522-direct-integral-count="888"
      data-atlas-v522-envelope-row-count="24"
      data-atlas-v522-physical-prior-qualified="false"
      data-atlas-v522-measured-stokes-row-count="0"
      data-atlas-v522-scientific-mutation="false"
      data-atlas-v522-canvas-created="false"
      data-atlas-v522-scene-revision-delta="0"
    >
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(var(--v522-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v522-grid)_1px,transparent_1px)] [background-size:40px_40px]" />
      <header className="relative border-b border-white/10 pb-6">
        <div className="text-[9px] uppercase tracking-[.42em] opacity-50">
          V522 / frequency-dependent polarization sensitivity envelope
        </div>
        <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.035em] sm:text-5xl">
          把“波段内恒定”假设送进九格压力舱
        </h2>
        <p className="mt-4 max-w-3xl text-[10px] leading-6 opacity-55">
          偏振率频率斜率 ±25% 与 EVPA 扭转 ±5° 形成确定性 3×3 网格，生成 216 个场景行和 24 个 envelope。
          这些边界没有实测标定或概率先验，只用于暴露模型敏感度。
        </p>
      </header>
      {!summary ? (
        <div className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-4 text-[10px] opacity-55">
          {state.status === "idle" || state.status === "loading"
            ? "正在读取频率敏感度摘要…"
            : `频率敏感度 envelope 不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-4">
            <Metric label="scenarios" value="9" />
            <Metric label="scenario rows" value="216" />
            <Metric label="direct integrals" value="888" />
            <Metric label="physical priors" value="0" />
          </div>
          <div className="relative mt-5 grid gap-3 md:grid-cols-2">
            <Gate label="baseline energy I Δrel" value={scientific(summary.maxima.baselineVsV521EnergyIRelative)} />
            <Gate label="baseline photon U Δrel" value={scientific(summary.maxima.baselineVsV521PhotonURelative)} />
            <Gate label="max energy EVPA shift" value={`${Number(summary.maxima.energyEvpaShiftDeg).toFixed(3)}°`} />
            <Gate label="max photon EVPA shift" value={`${Number(summary.maxima.photonEvpaShiftDeg).toFixed(3)}°`} />
            <Gate label="max normalized Q shift" value={scientific(summary.maxima.normalizedQShift)} />
            <Gate label="max normalized U shift" value={scientific(summary.maxima.normalizedUShift)} />
          </div>
          <div className="relative mt-5 border-l-2 border-amber-300/45 bg-amber-300/[.035] px-4 py-4 text-[9px] leading-5 text-amber-100/65">
            这是确定性模型压力测试，不是可信区间、后验分布或物理先验。不得与数值误差做 RSS，也不得据此晋级科学 authority。
          </div>
          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.12em] opacity-40">
            <span>stress only · no probability · no RSS · measured 0 · dense 0/49 · browser not-run</span>
            <a
              className="border border-white/12 px-3 py-2"
              href="/api/atlas/relativity-evidence/v522/polarization-sensitivity?download=envelope"
            >
              Export full envelope
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-[var(--v522-raised)] px-3 py-4 text-center">
      <div className="text-[7px] uppercase tracking-[.14em] opacity-30">{label}</div>
      <div className="mt-1 text-xl text-[var(--v522-qualified)]">{value}</div>
    </div>
  );
}

function Gate({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-4 border border-white/10 bg-black/20 px-4 py-3 text-[9px]">
      <span className="opacity-35">{label}</span>
      <span className="text-[var(--v522-qualified)]">{value}</span>
    </div>
  );
}

const scientific = (value: string) => Number(value).toExponential(3);
