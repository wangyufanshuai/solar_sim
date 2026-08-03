"use client";

import { useEffect, useSyncExternalStore } from "react";

import { getKerrScreenCoordinateSnapshotV419, loadKerrScreenCoordinateSummaryV419, subscribeKerrScreenCoordinateV419 } from "../lib/kerrScreenCoordinateProvenanceClientV419";

const EXPORTS = [["JSON", "json"], ["CSV", "csv"], ["FITS TABLE", "fits"], ["QUIVER PNG", "png"]] as const;
const scientific = (value: number) => value === 0 ? "0" : value.toExponential(2);

export default function KerrScreenCoordinatePlaneV419() {
  const state = useSyncExternalStore(subscribeKerrScreenCoordinateV419, getKerrScreenCoordinateSnapshotV419, getKerrScreenCoordinateSnapshotV419);
  useEffect(() => { void loadKerrScreenCoordinateSummaryV419().catch(() => undefined); }, []);
  const summary = state.summary;
  return (
    <section
      className="relative mt-3 overflow-hidden border border-cyan-100/15 bg-[radial-gradient(circle_at_50%_34%,rgba(45,212,191,.065),transparent_35%),linear-gradient(126deg,rgba(2,11,14,.99),rgba(3,7,11,.99)_60%,rgba(12,8,3,.97))] px-3 py-3 font-mono"
      data-atlas-kerr-screen-coordinate-v419
      data-atlas-v419-status={state.status}
      data-atlas-v419-coordinate-authority="finite-distance-zamo-qualified"
      data-atlas-v419-pixel-wcs="unavailable"
      data-atlas-v419-raster-image="unavailable"
      data-atlas-v419-dense-campaign="incomplete-0-of-49"
      data-atlas-v419-summary-only-in-react-state="true"
      data-atlas-v419-trajectories-in-react-state="false"
      data-atlas-v419-coordinate-mutation="false"
      data-atlas-v419-evpa-mutation="false"
      data-atlas-v419-canvas-created="false"
      aria-live="polite"
    >
      <header className="relative grid gap-3 border-b border-white/7 pb-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="text-[6px] uppercase tracking-[.28em] text-cyan-100/42">V419 · finite-ZAMO screen provenance</div>
          <h4 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[20px] font-light uppercase tracking-[.16em] text-cyan-50/92">Observer screen coordinate plane</h4>
          <p className="mt-1 max-w-[106ch] text-[6px] leading-relaxed text-white/38">四条 canonical disk rays 已恢复为有限距离 ZAMO 屏幕坐标，并通过 local、tetrad、BL covector 与 Kerr–Schild covector 独立回放。这里是稀疏 quiver 诊断；没有批准的像素 WCS，也不是 raster 或 dense 偏振图。</p>
        </div>
        <div className="flex items-center gap-2 self-start border border-cyan-100/14 bg-cyan-100/[.025] px-2.5 py-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${state.status === "ready" ? "bg-cyan-200/75 shadow-[0_0_14px_rgba(103,232,249,.3)]" : state.status === "loading" ? "animate-pulse bg-amber-200/60" : "bg-rose-200/60"}`} />
          <div><div className="text-[5px] uppercase tracking-[.12em] text-white/22">coordinate channel</div><div className="mt-0.5 text-[6px] uppercase text-cyan-100/62">{state.status}</div></div>
        </div>
      </header>
      {!summary ? (
        <div className="relative mt-2 border-l-2 border-cyan-100/24 px-2 py-1.5 text-[6px] text-cyan-50/48">{state.status === "loading" || state.status === "idle" ? "正在读取屏幕坐标 provenance…" : `坐标平面不可用 · ${state.reason ?? "request-failed"}`}</div>
      ) : (
        <>
          <div className="relative mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(250px,.55fr)]">
            <div className="relative min-h-64 border border-cyan-100/10 bg-[linear-gradient(rgba(34,211,238,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.045)_1px,transparent_1px)] bg-[size:12.5%_25%]">
              <div className="absolute inset-x-3 top-2 flex justify-between text-[5px] text-cyan-100/28"><span>α = −12M</span><span>β = 13M</span><span>α = +12M</span></div>
              <div className="absolute inset-x-3 bottom-2 flex justify-between text-[5px] text-cyan-100/24"><span>β = 5M</span><span>finite ZAMO · r=30M · i=70°</span><span>pixel WCS unavailable</span></div>
              <div className="absolute inset-x-[4%] bottom-[13%] top-[12%] border border-white/6">
                {summary.rows.map((row) => {
                  const left = `${((row.alphaM + 12) / 24) * 100}%`;
                  const top = `${((13 - row.betaM) / 8) * 100}%`;
                  return (
                    <article key={row.rayId} className="absolute" style={{ left, top }} data-atlas-v419-ray={row.rayId}>
                      <span className="absolute left-0 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-100/60 bg-amber-200/75 shadow-[0_0_12px_rgba(251,191,36,.26)]" />
                      <span className="absolute left-0 top-0 h-px w-16 -translate-x-1/2 origin-center bg-gradient-to-r from-transparent via-cyan-100/85 to-transparent shadow-[0_0_8px_rgba(103,232,249,.2)]" style={{ transform: `translate(-50%,-50%) rotate(${row.authorityEvpaDeg - 90}deg)` }} />
                      <div className="absolute left-2 top-2 w-28 border-l border-cyan-100/14 pl-1.5 text-[5px] leading-relaxed"><div className="text-cyan-50/58">{row.rayId}</div><div className="text-white/26">({row.alphaM.toFixed(1)}, {row.betaM.toFixed(1)}) M</div><div className="text-cyan-100/38">χ {row.authorityEvpaDeg.toFixed(4)}°</div></div>
                    </article>
                  );
                })}
              </div>
            </div>
            <aside className="grid gap-px bg-white/6 sm:grid-cols-2 xl:grid-cols-1">
              <Metric label="coordinate replay max" value={`${scientific(summary.maxima.coordinateReplayResidualM)} M`} tone="cyan" />
              <Metric label="BL/KS oracle Δ" value={scientific(summary.maxima.pythonOracleDifference)} tone="lime" />
              <Metric label="E / Lz / Q residual" value={scientific(summary.maxima.constantResidual)} tone="lime" />
              <Metric label="v313 ↔ v418 EVPA Δ" value={`${scientific(summary.maxima.crossVersionAxialEvpaDifferenceDeg)}°`} tone="amber" />
              <Metric label="dense authority" value="0 / 49" tone="amber" />
            </aside>
          </div>
          <div className="relative mt-3 grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-4">
            {EXPORTS.map(([label, format]) => <a key={format} href={`/api/atlas/relativity-evidence/v419/screen-coordinates?download=${format}`} download className="atlas-accessible-focus bg-black/42 px-2.5 py-2 transition-colors hover:bg-cyan-100/[.05]"><div className="text-[7px] text-cyan-100/60">{label}</div><div className="mt-0.5 text-[5px] text-white/25">{format === "fits" ? "Binary Table，不是图像 HDU" : format === "png" ? "稀疏 quiver，不是科学图像" : "screen-coordinate provenance"}</div></a>)}
          </div>
          <footer className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 text-[5px] text-white/28"><span>α = −R kφ / kt · β = R kθ / kt · inward optical axis</span><span className="text-amber-100/42">coordinates qualified · pixel WCS unavailable · browser not run</span></footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "cyan" | "lime" | "amber" }>) {
  const color = tone === "cyan" ? "text-cyan-100/58" : tone === "lime" ? "text-lime-100/56" : "text-amber-100/54";
  return <div className="bg-black/40 px-2.5 py-2"><div className="text-[5px] uppercase tracking-[.1em] text-white/23">{label}</div><div className={`mt-0.5 text-[7px] ${color}`}>{value}</div></div>;
}
