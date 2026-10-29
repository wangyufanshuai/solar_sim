"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrIdealAnalyzerSensitivitySnapshotV523,
  loadKerrIdealAnalyzerSensitivitySummaryV523,
  subscribeKerrIdealAnalyzerSensitivityV523,
} from "../lib/kerrIdealAnalyzerSensitivityClientV523";
import { resolveKerrProvenanceConstellationProfileV518 } from "../lib/kerrProvenanceConstellationV518";

export default function KerrIdealAnalyzerSensitivityV523() {
  const state = useSyncExternalStore(
    subscribeKerrIdealAnalyzerSensitivityV523,
    getKerrIdealAnalyzerSensitivitySnapshotV523,
    getKerrIdealAnalyzerSensitivitySnapshotV523,
  );
  useEffect(() => {
    void loadKerrIdealAnalyzerSensitivitySummaryV523().catch(() => undefined);
  }, []);
  const profile = resolveKerrProvenanceConstellationProfileV518("science");
  const style = {
    "--v523-panel": profile.panel,
    "--v523-raised": profile.panelRaised,
    "--v523-ink": profile.ink,
    "--v523-grid": profile.grid,
    "--v523-qualified": profile.nodeStroke,
  } as CSSProperties;
  const summary = state.summary;
  return (
    <section
      style={style}
      className="relative mt-7 overflow-hidden rounded-[40px] border border-white/10 bg-[var(--v523-panel)] p-5 font-mono text-[var(--v523-ink)] shadow-[0_70px_220px_rgba(0,0,0,.78)] sm:p-8"
      data-atlas-kerr-ideal-analyzer-sensitivity-v523
      data-atlas-v523-analyzer-state-count="4"
      data-atlas-v523-modulation-row-count="864"
      data-atlas-v523-reconstruction-count="216"
      data-atlas-v523-channel-envelope-count="96"
      data-atlas-v523-electron-count-row-count="0"
      data-atlas-v523-detector-projection-qualified="false"
      data-atlas-v523-scientific-mutation="false"
      data-atlas-v523-canvas-created="false"
      data-atlas-v523-scene-revision-delta="0"
    >
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(var(--v523-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v523-grid)_1px,transparent_1px)] [background-size:40px_40px]" />
      <header className="relative border-b border-white/10 pb-6">
        <div className="text-[9px] uppercase tracking-[.42em] opacity-50">
          V523 / ideal four-angle analyzer projection
        </div>
        <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.035em] sm:text-5xl">
          四个分析器方向，把每个场景重新拆成双束光
        </h2>
        <p className="mt-4 max-w-3xl text-[10px] leading-6 opacity-55">
          0°、45°、90°、135° 理想分析器把 216 个敏感度场景投影为 864 个双束调制行，再用独立闭式反演恢复能量与光子 I/Q/U。
        </p>
      </header>
      {!summary ? (
        <div className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-4 text-[10px] opacity-55">
          {state.status === "idle" || state.status === "loading"
            ? "正在读取理想分析器摘要…"
            : `理想分析器 projection 不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-4">
            <Metric label="analyzer states" value="4" />
            <Metric label="modulation rows" value="864" />
            <Metric label="reconstructions" value="216" />
            <Metric label="electron counts" value="0" />
          </div>
          <div className="relative mt-5 grid gap-3 md:grid-cols-2">
            <Gate label="beam-sum Δrel" value={scientific(summary.maxima.beamSumRelative)} />
            <Gate label="flux-law Δabs" value={scientific(summary.maxima.normalizedFluxLawAbsolute)} />
            <Gate label="energy Q inversion" value={scientific(summary.maxima.energyQReconstructionRelative)} />
            <Gate label="energy U inversion" value={scientific(summary.maxima.energyUReconstructionRelative)} />
            <Gate label="photon Q inversion" value={scientific(summary.maxima.photonQReconstructionRelative)} />
            <Gate label="photon U inversion" value={scientific(summary.maxima.photonUReconstructionRelative)} />
          </div>
          <div className="relative mt-5 border-l-2 border-amber-300/45 bg-amber-300/[.035] px-4 py-4 text-[9px] leading-5 text-amber-100/65">
            这是理想分析器代数，不包含 Mueller 矩阵、波长相关延迟、双束吞吐比、增益、噪声、电子计数或观测计数。
          </div>
          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.12em] opacity-40">
            <span>ideal only · detector false · counts 0 · calibration 0/6 · dense 0/49 · browser not-run</span>
            <a
              className="border border-white/12 px-3 py-2"
              href="/api/atlas/relativity-evidence/v523/ideal-analyzer?download=projection"
            >
              Export full projection
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-[var(--v523-raised)] px-3 py-4 text-center">
      <div className="text-[7px] uppercase tracking-[.14em] opacity-30">{label}</div>
      <div className="mt-1 text-xl text-[var(--v523-qualified)]">{value}</div>
    </div>
  );
}

function Gate({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-4 border border-white/10 bg-black/20 px-4 py-3 text-[9px]">
      <span className="opacity-35">{label}</span>
      <span className="text-[var(--v523-qualified)]">{value}</span>
    </div>
  );
}

const scientific = (value: string) => Number(value).toExponential(3);
