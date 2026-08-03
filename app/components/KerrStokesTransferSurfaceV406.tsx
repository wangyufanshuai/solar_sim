"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import { getKerrStokesTransferSnapshotV406, loadKerrStokesTransferSummaryV406, subscribeKerrStokesTransferV406 } from "../lib/kerrStokesTransferClientV406";

const compact = (value: number) => value === 0 ? "0" : value.toExponential(2);
export default function KerrStokesTransferSurfaceV406() {
  const state = useSyncExternalStore(subscribeKerrStokesTransferV406, getKerrStokesTransferSnapshotV406, getKerrStokesTransferSnapshotV406);
  useEffect(() => { void loadKerrStokesTransferSummaryV406().catch(() => undefined); }, []);
  const summary = state.summary;
  return (
    <section
      className="relative mt-3 overflow-hidden border border-cyan-100/10 bg-[linear-gradient(105deg,rgba(6,182,212,.045),rgba(0,0,0,.24)_42%,rgba(163,230,53,.035))] px-3 py-2.5 font-mono"
      data-atlas-kerr-stokes-transfer-v406
      data-atlas-v406-status={state.status}
      data-atlas-v406-summary-only-in-react-state="true"
      data-atlas-v406-full-sample-array-in-react-state="false"
      data-atlas-v406-science-buffer-mutation="false"
      data-atlas-v406-cinematic-buffer-mutation="false"
      data-atlas-v406-canvas-created="false"
      aria-live="polite"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(90deg,transparent_0_47px,rgba(165,243,252,.04)_48px)] [background-size:48px_100%]" />
      <header className="relative flex flex-wrap items-start justify-between gap-3 border-b border-white/6 pb-2">
        <div><div className="text-[5px] uppercase tracking-[.22em] text-cyan-100/42">V406 vacuum polarimetric transfer</div><h4 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[17px] uppercase tracking-[.16em] text-cyan-50/82">Stokes interferometer</h4><p className="mt-1 max-w-[78ch] text-[5px] leading-relaxed text-white/28">WP constant and independent KS parallel transport share intensity authority, never polarization evolution. Screen Q/U rotate; I/ν³ and L/ν³ remain invariant.</p></div>
        <div className={`border px-2 py-1 text-[6px] uppercase tracking-[.1em] ${state.status === "ready" ? "border-lime-100/14 bg-lime-100/[.035] text-lime-100/56" : "border-amber-100/14 bg-amber-100/[.025] text-amber-100/50"}`}>{state.status}</div>
      </header>
      {!summary ? <div className="relative mt-2 border-l-2 border-amber-100/20 px-2 py-1.5 text-[6px] text-amber-50/42">{state.status === "loading" || state.status === "idle" ? "Reading SHA-locked Stokes summary…" : `Stokes summary unavailable · ${state.reason ?? "request-failed"}`}</div> : <>
        <div className="relative mt-2 flex flex-wrap items-center gap-1.5 text-[5px] uppercase tracking-[.09em]">
          {summary.observedFrequenciesHz.map((frequency) => <span key={frequency} className={`border px-2 py-1 ${frequency === summary.referenceBandHz ? "border-cyan-100/18 bg-cyan-100/[.055] text-cyan-50/58" : "border-white/7 text-white/27"}`}>{frequency.toExponential(0)} Hz</span>)}
          <span className="ml-auto text-white/23">24 samples · 12 path comparisons</span>
        </div>
        <div className="relative mt-2 grid gap-px bg-white/6 md:grid-cols-2 xl:grid-cols-4">
          {summary.referenceRays.map((ray) => {
            const q = ray.walkerPenrose.q / ray.walkerPenrose.i;
            const u = ray.walkerPenrose.u / ray.walkerPenrose.i;
            const indicatorStyle = { "--atlas-v406-evpa": `${ray.walkerPenrose.evpaDeg}deg` } as CSSProperties;
            return <article key={ray.rayId} className="grid grid-cols-[42px_1fr] gap-2 bg-black/30 px-2 py-2" data-atlas-v406-stokes-ray={ray.rayId}>
              <div style={indicatorStyle} className="relative grid h-10 w-10 place-items-center rounded-full border border-cyan-100/12 bg-cyan-100/[.025]"><span className="absolute h-px w-7 rotate-[var(--atlas-v406-evpa)] bg-gradient-to-r from-transparent via-cyan-100/70 to-transparent shadow-[0_0_8px_rgba(103,232,249,.28)]" /><span className="h-1 w-1 rounded-full bg-lime-100/70" /></div>
              <div className="min-w-0"><div className="flex items-center justify-between gap-2"><span className="text-[7px] text-cyan-50/65">{ray.rayId}</span><span className="text-[5px] text-white/24">a {ray.spinA.toFixed(1)}</span></div><div className="mt-1 grid grid-cols-2 gap-x-2 text-[5px]"><span className="text-white/25">Q/I</span><span className="text-cyan-100/48">{q.toFixed(5)}</span><span className="text-white/25">U/I</span><span className="text-lime-100/48">{u.toFixed(5)}</span></div><div className="mt-1 truncate border-t border-white/6 pt-1 text-[5px] text-white/22">Δχ {compact(ray.evpaDifferenceDeg)}° · ΔQU {compact(ray.normalizedStokesQuDifference)}</div></div>
            </article>;
          })}
        </div>
        <div className="relative mt-px grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="max I/ν³ residual" value={compact(summary.maxima.intensityInvariantRelative)} />
          <Metric label="max L/ν³ residual" value={compact(summary.maxima.linearAmplitudeInvariantRelative)} />
          <Metric label="max WP/PT ΔQU" value={compact(summary.maxima.normalizedStokesQuDifference)} />
          <Metric label="A/B canonical" value={String(summary.maxima.abCanonicalDifference)} />
        </div>
        <footer className="relative mt-2 flex flex-wrap items-center justify-between gap-2 text-[5px] text-white/25"><span>Stokes V unavailable · Faraday unavailable · no plasma/absorption/scattering claim</span><a href="/api/atlas/relativity-evidence/v406/stokes-transfer?download=1" download className="atlas-accessible-focus border border-cyan-100/13 px-2 py-1 uppercase tracking-[.08em] text-cyan-100/48">Download 24-sample artifact</a></footer>
      </>}
    </section>
  );
}
function Metric({ label, value }: Readonly<{ label: string; value: string }>) { return <div className="bg-black/30 px-2 py-1.5"><div className="text-[5px] uppercase tracking-[.1em] text-white/23">{label}</div><div className="mt-0.5 text-[7px] text-lime-100/52">{value}</div></div>; }
