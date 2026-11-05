"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import { getKerrScatteringCorrectedSnapshotV409, loadKerrScatteringCorrectedSummaryV409, subscribeKerrScatteringCorrectedV409 } from "../lib/kerrScatteringCorrectedClientV409";

const pct = (value: number) => `${(value * 100).toFixed(3)}%`;
const exp = (value: number) => value === 0 ? "0" : value.toExponential(2);

export default function KerrScatteringCorrectionSurfaceV409() {
  const state = useSyncExternalStore(subscribeKerrScatteringCorrectedV409, getKerrScatteringCorrectedSnapshotV409, getKerrScatteringCorrectedSnapshotV409);
  useEffect(() => { void loadKerrScatteringCorrectedSummaryV409().catch(() => undefined); }, []);
  const summary = state.summary;
  return (
    <section className="relative mt-3 overflow-hidden border border-sky-100/12 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(125,211,252,.09),transparent_42%),linear-gradient(104deg,rgba(3,11,16,.97),rgba(3,7,11,.96)_60%,rgba(12,8,4,.9))] px-3 py-3 font-mono" data-atlas-kerr-scattering-correction-v409 data-atlas-v409-status={state.status} data-atlas-v409-summary-only-in-react-state="true" data-atlas-v409-sample-array-in-react-state="false" data-atlas-v409-interpolation-applied="false" data-atlas-v409-dense-image-authority="false" data-atlas-v409-science-buffer-mutation="false" data-atlas-v409-cinematic-buffer-mutation="false" data-atlas-v409-canvas-created="false" aria-live="polite">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/36 to-transparent" />
      <header className="relative grid gap-3 border-b border-white/7 pb-2.5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div><div className="text-[6px] uppercase tracking-[.25em] text-sky-100/43">V409 · immutable sparse science payload</div><h4 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[19px] font-light uppercase tracking-[.16em] text-sky-50/88">Stokes correction matrix</h4><p className="mt-1 max-w-[94ch] text-[6px] leading-relaxed text-white/34">将 v408 四射线离散纵标偏振分数应用到 24 个稀疏 Stokes 样本。强度、redshift 与 EVPA 沿用已验证传输；Q/U 由同一科学几何重建，电影渲染不得回写。</p></div>
        <div className="flex items-center gap-2 self-start border border-sky-100/14 bg-sky-100/[.025] px-2.5 py-1.5"><span className={`h-1.5 w-1.5 rounded-full ${state.status === "ready" ? "bg-lime-200/70 shadow-[0_0_14px_rgba(190,242,100,.34)]" : state.status === "loading" ? "animate-pulse bg-sky-200/60" : "bg-amber-200/60"}`} /><div><div className="text-[5px] uppercase tracking-[.12em] text-white/22">payload channel</div><div className="mt-0.5 text-[6px] uppercase text-sky-100/60">{state.status}</div></div></div>
      </header>
      {!summary ? <div className="relative mt-2 border-l-2 border-sky-100/22 px-2 py-1.5 text-[6px] text-sky-50/44">{state.status === "loading" || state.status === "idle" ? "读取校正后的稀疏 Science payload…" : `校正 payload 不可用 · ${state.reason ?? "request-failed"}`}</div> : <>
        <div className="relative mt-2 grid gap-px bg-white/6 lg:grid-cols-[minmax(0,1.45fr)_minmax(230px,.55fr)]">
          <div className="grid gap-px bg-white/6 sm:grid-cols-2 xl:grid-cols-4">{summary.rayCorrections.map((ray) => { const gain = ray.multiplicativeCorrection - 1; const style = { "--atlas-v409-gain": `${Math.min(100, gain * 1000)}%` } as CSSProperties; return <article key={ray.rayId} style={style} className="relative overflow-hidden bg-black/36 px-2.5 py-2.5" data-atlas-v409-ray={ray.rayId}><div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-sky-300/70 via-lime-200/40 to-transparent" style={{ width: "var(--atlas-v409-gain)" }} /><div className="flex items-center justify-between"><span className="text-[7px] text-sky-50/72">{ray.rayId}</span><span className="text-[5px] text-white/24">μ {ray.muEmission.toFixed(4)}</span></div><div className="mt-3 text-[18px] font-light tracking-[-.035em] text-sky-100/82">+{(gain * 100).toFixed(2)}%</div><div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[5px]"><span className="text-white/22">approx</span><span className="text-amber-100/55">{pct(ray.v407Approximation)}</span><span className="text-white/22">corrected</span><span className="text-lime-100/55">{pct(ray.v408DiscreteOrdinates)}</span><span className="text-white/22">u absolute</span><span className="text-cyan-100/52">{exp(ray.numericalUncertaintyAbsolute)}</span></div></article>; })}</div>
          <aside className="grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-1"><Metric label="science samples" value="24" tone="sky" /><Metric label="transport paths" value="WP + KS/PT" tone="lime" /><Metric label="curve interpolation" value="NOT APPLIED" tone="amber" /><Metric label="dense image" value="NOT QUALIFIED" tone="amber" /></aside>
        </div>
        <div className="relative mt-px grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-4"><Metric label="max correction" value={`${((summary.maxima.correctionFactor - 1) * 100).toFixed(3)}%`} tone="sky" /><Metric label="Stokes residual" value={exp(summary.maxima.observedLinearFractionAbsolute)} tone="lime" /><Metric label="WP/PT ΔEVPA" value={`${exp(summary.maxima.pathEvpaDifferenceDeg)}°`} tone="lime" /><Metric label="max p uncertainty" value={exp(summary.maxima.numericalPolarizationFractionAbsolute)} tone="cyan" /></div>
        <footer className="relative mt-2 flex flex-wrap items-center justify-between gap-2 text-[5px] text-white/27"><span>仅四条权威盘射线 × 3 频段 × 2 传输路径 · 181 点曲线未插值 · 无 dense authority</span><a href="/api/atlas/relativity-evidence/v409/scattering-correction?download=1" download className="atlas-accessible-focus border border-sky-100/15 bg-sky-100/[.025] px-2 py-1 uppercase tracking-[.08em] text-sky-100/55">下载 24-sample payload</a></footer>
      </>}
    </section>
  );
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "sky" | "lime" | "cyan" | "amber" }>) { const color = tone === "sky" ? "text-sky-100/58" : tone === "lime" ? "text-lime-100/54" : tone === "cyan" ? "text-cyan-100/54" : "text-amber-100/54"; return <div className="bg-black/36 px-2.5 py-1.5"><div className="text-[5px] uppercase tracking-[.11em] text-white/23">{label}</div><div className={`mt-0.5 text-[7px] ${color}`}>{value}</div></div>; }
