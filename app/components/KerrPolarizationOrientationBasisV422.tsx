"use client";

import { useEffect, useSyncExternalStore } from "react";

import { getKerrPolarizationOrientationBasisSnapshotV422, loadKerrPolarizationOrientationBasisSummaryV422, subscribeKerrPolarizationOrientationBasisV422 } from "../lib/kerrPolarizationOrientationBasisClientV422";

const EXPORTS = [["BASIS JSON", "json"], ["MASK CSV", "csv"], ["WCS FITS", "fits"], ["COMPASS PNG", "png"]] as const;
const COLORS = ["#67e8f9", "#5eead4", "#bef264", "#fbbf24"] as const;
const scientific = (value: number) => value === 0 ? "0" : value.toExponential(2);

export default function KerrPolarizationOrientationBasisV422() {
  const state = useSyncExternalStore(subscribeKerrPolarizationOrientationBasisV422, getKerrPolarizationOrientationBasisSnapshotV422, getKerrPolarizationOrientationBasisSnapshotV422);
  useEffect(() => { void loadKerrPolarizationOrientationBasisSummaryV422().catch(() => undefined); }, []);
  const summary = state.summary;
  return (
    <section
      className="relative mt-3 overflow-hidden border border-emerald-100/15 bg-[radial-gradient(circle_at_76%_42%,rgba(16,185,129,.07),transparent_31%),linear-gradient(128deg,rgba(1,9,10,.995),rgba(3,8,10,.99)_58%,rgba(11,7,2,.98))] px-3 py-3 font-mono"
      data-atlas-kerr-orientation-basis-v422
      data-atlas-v422-status={state.status}
      data-atlas-v422-q-hat="cos-two-chi-not-Q-over-I"
      data-atlas-v422-u-hat="sin-two-chi-not-U-over-I"
      data-atlas-v422-stokes-measurement="unavailable"
      data-atlas-v422-polarization-amplitude="unavailable"
      data-atlas-v422-raster-mask="false"
      data-atlas-v422-nearest-pixel-assignment="false"
      data-atlas-v422-interpolation="false"
      data-atlas-v422-unavailable-is-zero="false"
      data-atlas-v422-summary-only-in-react-state="true"
      data-atlas-v422-canvas-created="false"
      aria-live="polite"
    >
      <header className="relative grid gap-3 border-b border-white/7 pb-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div><div className="text-[6px] uppercase tracking-[.31em] text-emerald-100/43">V422 · measurement admission membrane</div><h4 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[20px] font-light uppercase tracking-[.17em] text-emerald-50/92">Mask-aware orientation basis</h4><p className="mt-1 max-w-[110ch] text-[6px] leading-relaxed text-white/38">`q̂=cos(2χ)` 与 `û=sin(2χ)`仅编码轴向偏振方向，单位半径是数学定义，不是偏振度。四个连续源坐标允许显示方向；I、Q、U、V、Q/I、U/I、偏振幅度与未采样像素仍不可用，绝不按零值填充。</p></div>
        <div className="flex items-center gap-2 self-start border border-emerald-100/14 bg-emerald-100/[.025] px-2.5 py-1.5"><span className={`h-1.5 w-1.5 rounded-full ${state.status === "ready" ? "bg-emerald-200/75 shadow-[0_0_14px_rgba(110,231,183,.3)]" : state.status === "loading" ? "animate-pulse bg-amber-200/60" : "bg-rose-200/60"}`} /><div><div className="text-[5px] uppercase tracking-[.12em] text-white/22">admission channel</div><div className="mt-0.5 text-[6px] uppercase text-emerald-100/62">{state.status}</div></div></div>
      </header>
      {!summary ? <div className="relative mt-2 border-l-2 border-emerald-100/24 px-2 py-1.5 text-[6px] text-emerald-50/48">{state.status === "loading" || state.status === "idle" ? "正在读取方向基与适用性掩码…" : `方向基不可用 · ${state.reason ?? "request-failed"}`}</div> : (
        <>
          <div className="relative mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_260px]">
            <figure className="relative aspect-square border border-cyan-100/10 bg-[linear-gradient(rgba(103,232,249,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,.04)_1px,transparent_1px)] bg-[size:12.5%_12.5%]">
              <figcaption className="absolute left-2 top-2 z-10 text-[5px] uppercase tracking-[.12em] text-cyan-100/36">continuous observer coordinates</figcaption>
              <svg viewBox="0 0 384 384" className="absolute inset-0 h-full w-full" role="img" aria-label="Sparse observer coordinates with four orientation-only polarization glyphs">
                {summary.rows.map((row, index) => { const x = row.continuousCoordinate.pixelX - .5, y = 384.5 - row.continuousCoordinate.pixelY, chi = row.authorityEvpaDeg * Math.PI / 180, dx = Math.sin(chi) * 18, dy = -Math.cos(chi) * 18; return <g key={row.rayId}><line x1={x - dx} y1={y - dy} x2={x + dx} y2={y + dy} stroke={COLORS[index]} strokeWidth="2.2" vectorEffect="non-scaling-stroke" /><circle cx={x} cy={y} r="3.5" fill="#fbbf24" stroke="#fef3c7" strokeWidth=".7" vectorEffect="non-scaling-stroke" /><text x={x + 7} y={y + 9} fill="rgba(240,253,250,.68)" fontSize="7">{row.rayId}</text></g>; })}
              </svg>
            </figure>
            <figure className="relative aspect-square border border-emerald-100/10 bg-black/25">
              <figcaption className="absolute left-2 top-2 z-10 text-[5px] uppercase tracking-[.12em] text-emerald-100/36">double-angle orientation compass</figcaption>
              <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" role="img" aria-label="Unit double-angle q-hat u-hat orientation compass">
                <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(110,231,183,.28)" strokeWidth=".8" /><line x1="20" y1="100" x2="180" y2="100" stroke="rgba(110,231,183,.16)" strokeWidth=".6" /><line x1="100" y1="20" x2="100" y2="180" stroke="rgba(110,231,183,.16)" strokeWidth=".6" /><text x="172" y="96" fill="rgba(167,243,208,.45)" fontSize="5">+q̂</text><text x="104" y="25" fill="rgba(167,243,208,.45)" fontSize="5">+û</text>
                {summary.rows.map((row, index) => { const x = 100 + row.orientationBasis.qHat * 80, y = 100 - row.orientationBasis.uHat * 80; return <g key={row.rayId}><line x1="100" y1="100" x2={x} y2={y} stroke={COLORS[index]} strokeOpacity=".42" strokeWidth=".7" /><circle cx={x} cy={y} r="3.2" fill={COLORS[index]} stroke="#ecfdf5" strokeWidth=".5" /></g>; })}
              </svg>
              <div className="absolute bottom-9 left-2 grid gap-0.5 text-[4px] leading-none">{summary.rows.map((row, index) => <div key={row.rayId} className="flex items-center gap-1.5" style={{ color: COLORS[index] }}><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[index] }} /><span>{row.rayId} · q̂ {row.orientationBasis.qHat.toFixed(4)} · û {row.orientationBasis.uHat.toFixed(4)}</span></div>)}</div>
              <div className="absolute bottom-2 left-2 right-2 border-l border-amber-100/20 pl-2 text-[5px] leading-relaxed text-amber-100/42">半径恒为 1 是方向表示，不是 pL；不得读取为观测振幅。</div>
            </figure>
            <aside className="grid content-start gap-px bg-white/6 sm:grid-cols-2 xl:grid-cols-1"><Metric label="orientation mask" value="4 AVAILABLE" tone="emerald" /><Metric label="Stokes mask" value="0 AVAILABLE" tone="amber" /><Metric label="basis norm max" value={scientific(summary.maxima.basisNormResidual)} tone="lime" /><Metric label="EVPA recovery max" value={`${scientific(summary.maxima.recoveredAxialEvpaResidualDeg)}°`} tone="lime" /><Metric label="raster mask" value="NOT GENERATED" tone="amber" /><Metric label="dense authority" value="0 / 49" tone="amber" /></aside>
          </div>
          <div className="relative mt-3 grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-4">{EXPORTS.map(([label, format]) => <a key={format} href={`/api/atlas/relativity-evidence/v422/orientation-basis?download=${format}`} download className="atlas-accessible-focus bg-black/42 px-2.5 py-2 transition-colors hover:bg-emerald-100/[.05]"><div className="text-[7px] text-emerald-100/60">{label}</div><div className="mt-0.5 text-[5px] text-white/25">{format === "fits" ? "WCS + 方向基表，无 image HDU" : format === "png" ? "方向罗盘诊断，不是科学 raster" : "四源方向基与适用性掩码"}</div></a>)}</div>
          <footer className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 text-[5px] text-white/28"><span>连续坐标不是像素样本 · 禁止 nearest-pixel 与插值</span><span className="text-amber-100/42">unavailable ≠ 0 · browser not run</span></footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "emerald" | "lime" | "amber" }>) { const color = tone === "emerald" ? "text-emerald-100/58" : tone === "lime" ? "text-lime-100/56" : "text-amber-100/54"; return <div className="bg-black/40 px-2.5 py-2"><div className="text-[5px] uppercase tracking-[.1em] text-white/23">{label}</div><div className={`mt-0.5 text-[7px] ${color}`}>{value}</div></div>; }
