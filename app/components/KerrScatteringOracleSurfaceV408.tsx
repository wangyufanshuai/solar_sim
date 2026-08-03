"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrScatteringOracleSnapshotV408,
  loadKerrScatteringOracleSummaryV408,
  subscribeKerrScatteringOracleV408,
} from "../lib/kerrScatteringOracleClientV408";

const scientific = (value: number) => value === 0 ? "0" : value.toExponential(2);
const percent = (value: number) => `${(value * 100).toFixed(3)}%`;

export default function KerrScatteringOracleSurfaceV408() {
  const state = useSyncExternalStore(subscribeKerrScatteringOracleV408, getKerrScatteringOracleSnapshotV408, getKerrScatteringOracleSnapshotV408);
  useEffect(() => { void loadKerrScatteringOracleSummaryV408().catch(() => undefined); }, []);
  const summary = state.summary;

  return (
    <section
      className="relative mt-3 overflow-hidden border border-rose-100/12 bg-[radial-gradient(circle_at_88%_0%,rgba(251,113,133,.08),transparent_26%),radial-gradient(circle_at_0%_90%,rgba(34,211,238,.055),transparent_34%),linear-gradient(112deg,rgba(12,10,13,.97),rgba(2,9,12,.94)_58%,rgba(12,5,8,.9))] px-3 py-3 font-mono"
      data-atlas-kerr-scattering-oracle-v408
      data-atlas-v408-status={state.status}
      data-atlas-v408-summary-only-in-react-state="true"
      data-atlas-v408-curve-samples-in-react-state="false"
      data-atlas-v408-exact-h-function-table-authority="false"
      data-atlas-v408-limb-endpoint-qualified="false"
      data-atlas-v408-face-on-endpoint-qualified="false"
      data-atlas-v408-science-buffer-mutation="false"
      data-atlas-v408-cinematic-buffer-mutation="false"
      data-atlas-v408-canvas-created="false"
      aria-live="polite"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(90deg,transparent_0_39px,rgba(251,113,133,.035)_40px,transparent_41px_80px)] [background-size:80px_100%]" />
      <header className="relative grid gap-3 border-b border-white/7 pb-2.5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="text-[6px] uppercase tracking-[.25em] text-rose-100/43">V408 · independent transport oracle</div>
          <h4 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[19px] font-light uppercase tracking-[.16em] text-rose-50/88">Numerical error envelope</h4>
          <p className="mt-1 max-w-[94ch] text-[6px] leading-relaxed text-white/34">Siewert 两分量 Rayleigh 散射方程的独立离散纵标参考。四条权威盘射线表明，v407 闭式近似系统性低估约 6.77%–9.02%；历史 v407 artifact 保持不变。</p>
        </div>
        <div className="flex items-center gap-2 self-start border border-rose-100/14 bg-rose-100/[.025] px-2.5 py-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${state.status === "ready" ? "bg-lime-200/70 shadow-[0_0_14px_rgba(190,242,100,.34)]" : state.status === "loading" ? "animate-pulse bg-cyan-200/60" : "bg-rose-200/60"}`} />
          <div><div className="text-[5px] uppercase tracking-[.12em] text-white/22">oracle channel</div><div className="mt-0.5 text-[6px] uppercase text-rose-100/60">{state.status}</div></div>
        </div>
      </header>

      {!summary ? (
        <div className="relative mt-2 border-l-2 border-rose-100/22 px-2 py-1.5 text-[6px] text-rose-50/44">
          {state.status === "loading" || state.status === "idle" ? "读取 SHA 锁定的数值误差包络…" : `数值散射包络不可用 · ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-2 grid gap-px bg-white/6 xl:grid-cols-[minmax(0,1.4fr)_minmax(235px,.6fr)]">
            <div className="grid gap-px bg-white/6 sm:grid-cols-2 xl:grid-cols-4">
              {summary.rayComparisons.map((ray) => {
                const underestimate = Math.abs(ray.relativeApproximationError);
                const style = { "--atlas-v408-error": `${Math.min(100, underestimate * 1000)}%` } as CSSProperties;
                return (
                  <article key={ray.rayId} style={style} className="relative overflow-hidden bg-black/36 px-2.5 py-2.5" data-atlas-v408-ray={ray.rayId}>
                    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-rose-300/70 via-amber-200/45 to-transparent" style={{ width: "var(--atlas-v408-error)" }} />
                    <div className="flex items-center justify-between gap-2"><span className="text-[7px] text-rose-50/72">{ray.rayId}</span><span className="text-[5px] text-white/24">μ {ray.muEmission.toFixed(4)}</span></div>
                    <div className="mt-3 text-[18px] font-light tracking-[-.035em] text-rose-100/82">−{(underestimate * 100).toFixed(2)}%</div>
                    <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[5px]"><span className="text-white/22">v407</span><span className="text-amber-100/55">{percent(ray.v407ApproximationFraction)}</span><span className="text-white/22">oracle</span><span className="text-cyan-100/58">{percent(ray.v408DiscreteOrdinatesFraction)}</span><span className="text-white/22">u linear</span><span className="text-lime-100/50">{scientific(ray.numericalUncertainty.linearSumAbsolute)}</span></div>
                  </article>
                );
              })}
            </div>
            <aside className="grid gap-px bg-white/6 sm:grid-cols-2 xl:grid-cols-1">
              <Metric label="qualified μ domain" value="0.05 — 0.95" tone="cyan" />
              <Metric label="angular × depth" value="80 × 121" tone="rose" />
              <Metric label="finite slab" value="τmax 20 · budgeted" tone="lime" />
              <Metric label="exact H-table" value="NOT QUALIFIED" tone="amber" />
            </aside>
          </div>
          <div className="relative mt-px grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="linear residual" value={scientific(summary.maxima.linearSystemResidual)} tone="lime" />
            <Metric label="flux drift" value={scientific(summary.maxima.relativeFluxDrift)} tone="lime" />
            <Metric label="kernel balance" value={scientific(summary.maxima.kernelEquilibriumResidual)} tone="cyan" />
            <Metric label="ray u linear max" value={scientific(summary.maxima.rayNumericalUncertaintyLinearSumAbsolute)} tone="rose" />
          </div>
          <footer className="relative mt-2 flex flex-wrap items-center justify-between gap-2 text-[5px] text-white/27">
            <span>181 点曲线仅存在于下载 artifact · μ=0/1 端点未资格 · 不宣称 exact Chandrasekhar H-function table authority</span>
            <a href="/api/atlas/relativity-evidence/v408/scattering-oracle?download=1" download className="atlas-accessible-focus border border-rose-100/15 bg-rose-100/[.025] px-2 py-1 uppercase tracking-[.08em] text-rose-100/55">下载 portable envelope</a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "lime" | "cyan" | "rose" | "amber" }>) {
  const color = tone === "lime" ? "text-lime-100/54" : tone === "cyan" ? "text-cyan-100/56" : tone === "rose" ? "text-rose-100/58" : "text-amber-100/54";
  return <div className="bg-black/36 px-2.5 py-1.5"><div className="text-[5px] uppercase tracking-[.11em] text-white/23">{label}</div><div className={`mt-0.5 text-[7px] ${color}`}>{value}</div></div>;
}
