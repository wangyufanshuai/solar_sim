"use client";

import { useEffect, useSyncExternalStore } from "react";

import { getKerrObserverPlaneWcsSnapshotV420, loadKerrObserverPlaneWcsSummaryV420, subscribeKerrObserverPlaneWcsV420 } from "../lib/kerrObserverPlaneWcsClientV420";

const EXPORTS = [["WCS JSON", "json"], ["SOURCE CSV", "csv"], ["FITS TABLE", "fits"], ["GRID PNG", "png"]] as const;
const scientific = (value: number) => value === 0 ? "0" : value.toExponential(2);

export default function KerrObserverWcsGridV420() {
  const state = useSyncExternalStore(subscribeKerrObserverPlaneWcsV420, getKerrObserverPlaneWcsSnapshotV420, getKerrObserverPlaneWcsSnapshotV420);
  useEffect(() => { void loadKerrObserverPlaneWcsSummaryV420().catch(() => undefined); }, []);
  const summary = state.summary;
  return (
    <section
      className="relative mt-3 overflow-hidden border border-sky-100/15 bg-[radial-gradient(ellipse_at_50%_18%,rgba(56,189,248,.07),transparent_36%),linear-gradient(135deg,rgba(2,9,14,.995),rgba(4,7,11,.99)_62%,rgba(11,8,3,.97))] px-3 py-3 font-mono"
      data-atlas-kerr-observer-wcs-v420
      data-atlas-v420-status={state.status}
      data-atlas-v420-grid="384x384-coordinate-contract"
      data-atlas-v420-raster-values="false"
      data-atlas-v420-interpolation="false"
      data-atlas-v420-fits-image="unavailable"
      data-atlas-v420-summary-only-in-react-state="true"
      data-atlas-v420-raster-array-in-react-state="false"
      data-atlas-v420-science-buffer-mutation="false"
      data-atlas-v420-canvas-created="false"
      aria-live="polite"
    >
      <header className="relative grid gap-3 border-b border-white/7 pb-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="text-[6px] uppercase tracking-[.28em] text-sky-100/42">V420 · observer-plane coordinate architecture</div>
          <h4 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[20px] font-light uppercase tracking-[.16em] text-sky-50/92">Linear WCS source grid</h4>
          <p className="mt-1 max-w-[106ch] text-[6px] leading-relaxed text-white/38">从 v314 的 41×41 uniform-field 世界边界建立 384² 连续 FITS WCS。四条 source 现在拥有可往返的连续像素坐标；没有 intensity、Stokes 或插值，因此坐标网格仍不是科学 raster。</p>
        </div>
        <div className="flex items-center gap-2 self-start border border-sky-100/14 bg-sky-100/[.025] px-2.5 py-1.5"><span className={`h-1.5 w-1.5 rounded-full ${state.status === "ready" ? "bg-sky-200/75 shadow-[0_0_14px_rgba(125,211,252,.3)]" : state.status === "loading" ? "animate-pulse bg-amber-200/60" : "bg-rose-200/60"}`} /><div><div className="text-[5px] uppercase tracking-[.12em] text-white/22">WCS channel</div><div className="mt-0.5 text-[6px] uppercase text-sky-100/62">{state.status}</div></div></div>
      </header>
      {!summary ? (
        <div className="relative mt-2 border-l-2 border-sky-100/24 px-2 py-1.5 text-[6px] text-sky-50/48">{state.status === "loading" || state.status === "idle" ? "正在读取 observer-plane WCS…" : `WCS 不可用 · ${state.reason ?? "request-failed"}`}</div>
      ) : (
        <>
          <div className="relative mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.38fr)_minmax(280px,.62fr)]">
            <div className="relative min-h-72 border border-sky-100/10 bg-[linear-gradient(rgba(125,211,252,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,.04)_1px,transparent_1px)] bg-[size:12.5%_12.5%]">
              <div className="absolute inset-x-3 top-2 flex justify-between text-[5px] text-sky-100/28"><span>world α −22M</span><span>384 × 384 · FITS origin 1</span><span>world α +22M</span></div>
              <div className="absolute inset-x-[4%] bottom-[13%] top-[12%] border border-white/6">
                <span className="absolute bottom-0 left-1/2 top-0 w-px bg-sky-100/10" />
                <span className="absolute left-0 right-0 top-1/2 h-px bg-sky-100/10" />
                {summary.rows.map((row) => {
                  const left = `${((row.continuousPixelX - 0.5) / 384) * 100}%`;
                  const top = `${(1 - (row.continuousPixelY - 0.5) / 384) * 100}%`;
                  return <article key={row.rayId} className="absolute" style={{ left, top }} data-atlas-v420-source={row.rayId}><span className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-amber-100/65 bg-amber-200/75 shadow-[0_0_12px_rgba(251,191,36,.25)]" /><span className="absolute h-px w-14 -translate-x-1/2 origin-center bg-gradient-to-r from-transparent via-sky-100/88 to-transparent" style={{ transform: `translate(-50%,-50%) rotate(${row.authorityEvpaDeg - 90}deg)` }} /><div className="absolute left-2 top-2 w-32 border-l border-sky-100/14 pl-1.5 text-[5px] leading-relaxed"><div className="text-sky-50/60">{row.rayId}</div><div className="text-white/27">px {row.continuousPixelX.toFixed(3)}, {row.continuousPixelY.toFixed(3)}</div><div className="text-amber-100/40">NO PIXEL VALUE</div></div></article>;
                })}
              </div>
              <div className="absolute inset-x-3 bottom-2 flex justify-between text-[5px] text-sky-100/24"><span>β −16M</span><span>continuous coordinates · no samples</span><span>β +16M</span></div>
            </div>
            <aside className="grid gap-px bg-white/6 sm:grid-cols-2 xl:grid-cols-1">
              <Metric label="world support" value="41 × 41 · 1681 planned" tone="sky" />
              <Metric label="WCS scale α" value={`${summary.wcs.cdelt1MPerPixel.toFixed(9)} M/px`} tone="sky" />
              <Metric label="WCS scale β" value={`${summary.wcs.cdelt2MPerPixel.toFixed(9)} M/px`} tone="sky" />
              <Metric label="TS roundtrip" value={`${scientific(summary.maxima.tsWorldPixelWorldRoundtripResidualM)} M`} tone="lime" />
              <Metric label="Astropy pixel Δ" value={scientific(summary.maxima.pythonAstropyPixelDifference)} tone="lime" />
              <Metric label="raster authority" value="UNAVAILABLE · 0/49" tone="amber" />
            </aside>
          </div>
          <div className="relative mt-3 grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-4">{EXPORTS.map(([label, format]) => <a key={format} href={`/api/atlas/relativity-evidence/v420/observer-wcs?download=${format}`} download className="atlas-accessible-focus bg-black/42 px-2.5 py-2 transition-colors hover:bg-sky-100/[.05]"><div className="text-[7px] text-sky-100/60">{label}</div><div className="mt-0.5 text-[5px] text-white/25">{format === "fits" ? "Primary WCS + table，无 image data" : format === "png" ? "坐标诊断，不是 raster" : "WCS provenance"}</div></a>)}</div>
          <footer className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 text-[5px] text-white/28"><span>CRPIX 192.5 · CTYPE LINEAR · GM/c² screen units · interpolation prohibited</span><span className="text-amber-100/42">coordinates qualified · image values unavailable · browser not run</span></footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "sky" | "lime" | "amber" }>) {
  const color = tone === "sky" ? "text-sky-100/58" : tone === "lime" ? "text-lime-100/56" : "text-amber-100/54";
  return <div className="bg-black/40 px-2.5 py-2"><div className="text-[5px] uppercase tracking-[.1em] text-white/23">{label}</div><div className={`mt-0.5 text-[7px] ${color}`}>{value}</div></div>;
}
