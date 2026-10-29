"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrScatteringAtmosphereSnapshotV407,
  loadKerrScatteringAtmosphereSummaryV407,
  subscribeKerrScatteringAtmosphereV407,
} from "../lib/kerrScatteringAtmosphereClientV407";

const compact = (value: number) => value === 0 ? "0" : value.toExponential(2);

export default function KerrScatteringAtmosphereSurfaceV407() {
  const state = useSyncExternalStore(subscribeKerrScatteringAtmosphereV407, getKerrScatteringAtmosphereSnapshotV407, getKerrScatteringAtmosphereSnapshotV407);
  useEffect(() => { void loadKerrScatteringAtmosphereSummaryV407().catch(() => undefined); }, []);
  const summary = state.summary;
  return (
    <section
      className="relative mt-3 overflow-hidden border border-amber-100/12 bg-[radial-gradient(circle_at_12%_0%,rgba(251,191,36,.075),transparent_27%),linear-gradient(108deg,rgba(8,13,12,.96),rgba(0,0,0,.38)_48%,rgba(6,24,27,.42))] px-3 py-3 font-mono"
      data-atlas-kerr-scattering-atmosphere-v407
      data-atlas-v407-status={state.status}
      data-atlas-v407-summary-only-in-react-state="true"
      data-atlas-v407-angle-executions-in-react-state="false"
      data-atlas-v407-full-sample-array-in-react-state="false"
      data-atlas-v407-observer-inclination-substituted="false"
      data-atlas-v407-screen-beta-substituted="false"
      data-atlas-v407-science-buffer-mutation="false"
      data-atlas-v407-cinematic-buffer-mutation="false"
      data-atlas-v407-canvas-created="false"
      aria-live="polite"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(112deg,transparent_0_31px,rgba(253,230,138,.025)_32px,transparent_33px_64px)] [background-size:64px_100%]" />
      <header className="relative grid gap-3 border-b border-white/7 pb-2.5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="text-[6px] uppercase tracking-[.24em] text-amber-100/42">V407 · local emitter-frame atmosphere</div>
          <h4 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[19px] font-light uppercase tracking-[.17em] text-amber-50/88">Emission-angle polarimeter</h4>
          <p className="mt-1 max-w-[92ch] text-[6px] leading-relaxed text-white/32">盘面局部发射角 μ<sub>em</sub> 来自发射体四速度、光子方向与盘法向的协变内积。它不是观测者倾角，也不是 screen β。</p>
        </div>
        <div className="flex items-center gap-2 self-start border border-amber-100/13 bg-amber-100/[.025] px-2.5 py-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${state.status === "ready" ? "bg-lime-200/70 shadow-[0_0_12px_rgba(190,242,100,.35)]" : state.status === "loading" ? "animate-pulse bg-cyan-200/60" : "bg-amber-200/60"}`} />
          <div><div className="text-[5px] uppercase tracking-[.12em] text-white/22">approximation gate</div><div className="mt-0.5 text-[6px] uppercase text-amber-100/58">{state.status}</div></div>
        </div>
      </header>

      {!summary ? (
        <div className="relative mt-2 border-l-2 border-amber-100/20 px-2 py-1.5 text-[6px] text-amber-50/42">
          {state.status === "loading" || state.status === "idle" ? "读取 SHA 锁定的局部发射角摘要…" : `散射大气摘要不可用 · ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-2 grid gap-px bg-white/6 lg:grid-cols-[minmax(220px,.72fr)_minmax(0,1.28fr)]">
            <div className="bg-black/34 px-3 py-2.5">
              <div className="text-[5px] uppercase tracking-[.13em] text-white/24">closed-form boundary</div>
              <div className="mt-1.5 font-['Cambria_Math','Times_New_Roman',serif] text-[14px] tracking-[.025em] text-amber-50/78">p(μ) = 0.1171 (1 − μ) / (1 + 3.582 μ)</div>
              <div className="mt-2 grid grid-cols-2 gap-px bg-white/6 text-[5px]"><Metric label="p(1) · face-on" value="0" /><Metric label="p(0) · limb" value="0.1171" /><Metric label="curve samples" value={String(summary.angleAudit.curveSampleCount)} /><Metric label="exact H-table" value="NOT QUALIFIED" tone="amber" /></div>
            </div>
            <div className="grid gap-px bg-white/6 sm:grid-cols-2 xl:grid-cols-4">
              {summary.referenceRays.map((ray) => {
                const style = { "--atlas-v407-mu": `${ray.muEmission * 100}%`, "--atlas-v407-evpa": `${ray.walkerPenrose.evpaDeg}deg` } as CSSProperties;
                return (
                  <article key={ray.rayId} style={style} className="relative overflow-hidden bg-black/34 px-2.5 py-2" data-atlas-v407-scattering-ray={ray.rayId}>
                    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-amber-200/50 via-cyan-200/35 to-transparent" style={{ width: "var(--atlas-v407-mu)" }} />
                    <div className="flex items-center justify-between gap-2"><span className="text-[7px] text-amber-50/70">{ray.rayId}</span><span className="text-[5px] text-white/25">a {ray.spinA.toFixed(1)}</span></div>
                    <div className="mt-2 grid grid-cols-[34px_1fr] gap-2">
                      <div className="relative grid h-8 w-8 place-items-center rounded-full border border-cyan-100/12 bg-cyan-100/[.025]"><span className="absolute h-px w-6 rotate-[var(--atlas-v407-evpa)] bg-gradient-to-r from-transparent via-cyan-100/70 to-transparent" /><span className="h-1 w-1 rounded-full bg-amber-100/75" /></div>
                      <div className="grid grid-cols-2 gap-x-2 text-[5px]"><span className="text-white/24">μ<sub>em</sub></span><span className="text-cyan-100/55">{ray.muEmission.toFixed(5)}</span><span className="text-white/24">p(μ)</span><span className="text-amber-100/62">{(ray.linearPolarizationFraction * 100).toFixed(3)}%</span><span className="text-white/24">Q/I</span><span className="text-lime-100/48">{ray.walkerPenrose.qOverI.toFixed(5)}</span></div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="relative mt-px grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="max local-frame residual" value={compact(summary.angleAudit.maxLocalFrameResidual)} />
            <Metric label="max tolerance Δμ" value={compact(summary.angleAudit.maxToleranceMuDifference)} />
            <Metric label="max L/ν³ residual" value={compact(summary.maxima.linearAmplitudeInvariantRelative)} />
            <Metric label="max WP/PT ΔQ,U" value={compact(summary.maxima.normalizedStokesQuDifference)} />
          </div>
          <footer className="relative mt-2 flex flex-wrap items-center justify-between gap-2 text-[5px] text-white/26">
            <span>Chandrasekhar–Sobolev 风格闭式近似，不宣称精确 H-function 表精度 · Stokes V / Faraday / absorption 均 unavailable</span>
            <a href="/api/atlas/relativity-evidence/v407/scattering-atmosphere?download=1" download className="atlas-accessible-focus border border-amber-100/14 px-2 py-1 uppercase tracking-[.08em] text-amber-100/52">下载角度与 24-sample artifact</a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value, tone = "lime" }: Readonly<{ label: string; value: string; tone?: "lime" | "amber" }>) {
  return <div className="bg-black/34 px-2 py-1.5"><div className="text-[5px] uppercase tracking-[.1em] text-white/23">{label}</div><div className={`mt-0.5 text-[7px] ${tone === "amber" ? "text-amber-100/52" : "text-lime-100/52"}`}>{value}</div></div>;
}
