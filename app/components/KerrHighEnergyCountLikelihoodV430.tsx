"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getKerrHighEnergyCountLikelihoodSnapshotV430,
  loadKerrHighEnergyCountLikelihoodSummaryV430,
  subscribeKerrHighEnergyCountLikelihoodV430,
} from "../lib/kerrHighEnergyCountLikelihoodClientV430";

const EXPORTS = [
  ["SUMMARY JSON", "json", "有界似然、残差与 authority 边界"],
  ["FULL ORACLE", "oracle", "固定种子模拟计数、协方差与完整诊断"],
  ["LIKELIHOOD CONTRACT", "contract", "未来实测计数的预注册假设与准入合同"],
  ["RESIDUAL CSV", "csv", "24 路模拟残差；不含实测观测"],
  ["DIAGNOSTIC FITS", "fits", "模拟计数、残差与预测协方差 fixture"],
  ["ARCHITECTURE PNG", "png", "似然架构图；不是探测器科学图像"],
] as const;

export default function KerrHighEnergyCountLikelihoodV430() {
  const state = useSyncExternalStore(
    subscribeKerrHighEnergyCountLikelihoodV430,
    getKerrHighEnergyCountLikelihoodSnapshotV430,
    getKerrHighEnergyCountLikelihoodSnapshotV430,
  );
  useEffect(() => { void loadKerrHighEnergyCountLikelihoodSummaryV430().catch(() => undefined); }, []);
  const summary = state.summary;
  const metrics = summary?.fixture.metrics;
  return (
    <section
      className="relative mt-3 overflow-hidden border border-amber-100/14 bg-[radial-gradient(circle_at_12%_10%,rgba(34,211,238,.07),transparent_27%),radial-gradient(circle_at_88%_12%,rgba(251,191,36,.07),transparent_25%),linear-gradient(138deg,rgba(3,7,12,.995),rgba(8,7,12,.99)_58%,rgba(12,7,3,.985))] p-3 font-mono text-white/52"
      data-atlas-kerr-high-energy-count-likelihood-v430
      data-atlas-v430-status={state.status}
      data-atlas-v430-measured-observed-counts="0"
      data-atlas-v430-measured-holdouts="0"
      data-atlas-v430-measured-residual-metrics="0"
      data-atlas-v430-measured-validation-runs="0"
      data-atlas-v430-measured-response-authority="false"
      data-atlas-v430-science-response-applications="0"
      data-atlas-v430-summary-only-in-react-state="true"
      data-atlas-v430-canvas-created="false"
      aria-live="polite"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(90deg,transparent_49.8%,rgba(251,191,36,.04)_50%,transparent_50.2%),repeating-linear-gradient(0deg,transparent_0_15px,rgba(34,211,238,.018)_16px,transparent_17px_32px)]" />
      <header className="relative flex flex-wrap items-start justify-between gap-3 border-b border-white/7 pb-3">
        <div>
          <div className="text-[6px] uppercase tracking-[.34em] text-amber-100/44">V430 · detector-count likelihood chamber</div>
          <h4 className="mt-1 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[21px] font-light uppercase tracking-[.18em] text-amber-50/92">Residual &amp; whitening interferometer</h4>
          <p className="mt-1 max-w-[116ch] text-[6px] leading-relaxed text-white/38">以固定种子模拟计数验证 Poisson、deviance、Pearson、预测协方差白化及角度／通道 closure。这里签发的是数学实现资格，不是仪器性能，也不替代未来实测 holdout。</p>
        </div>
        <Status status={state.status} />
      </header>

      {!summary ? (
        <div className="relative mt-3 border-l-2 border-amber-100/24 bg-amber-100/[.025] px-3 py-2 text-[6px] text-amber-50/48">
          {state.status === "loading" || state.status === "idle" ? "正在读取计数似然证据…" : `计数似然证据不可用 · ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_320px]">
            <div className="grid gap-3">
              <div className="grid gap-px bg-white/6 md:grid-cols-4">
                {[["PREDICTION", "24 路期望计数", "v429 forward model"], ["FIXTURE", "24 路模拟计数", "PCG64 · seed 43020260730"], ["RESIDUALS", "5 类诊断向量", "raw / Pearson / deviance / white"], ["CLOSURE", "4 角度 + 6 通道", "10 groups"]].map(([title, value, detail], index) => (
                  <article key={title} className="min-h-24 bg-black/42 p-2.5">
                    <div className="flex justify-between"><span className="text-[7px] text-amber-100/58">0{index + 1}</span><span className="text-[5px] text-cyan-100/40">SIMULATED FIXTURE</span></div>
                    <div className="mt-3 text-[7px] tracking-[.1em] text-amber-50/65">{title}</div><div className="mt-1 text-[6px] text-white/38">{value}</div><div className="mt-2 text-[5px] text-cyan-100/40">{detail}</div>
                  </article>
                ))}
              </div>
              <div className="grid gap-3 lg:grid-cols-[1.1fr_.9fr]">
                <div className="border border-cyan-100/10 bg-black/28 p-3"><div className="text-[5px] uppercase tracking-[.16em] text-cyan-100/42">Whitening identity</div><div className="mt-3 grid gap-2 text-[6px] text-white/40"><Formula>r = n_sim − μ_pred</Formula><Formula>C_pred = diag(μ) + C_response</Formula><Formula>r_white = C_pred⁻¹ᐟ² r</Formula><Formula>‖r_white‖² = rᵀ C_pred⁺ r</Formula></div></div>
                <div className="border border-amber-100/12 bg-amber-100/[.025] p-3"><div className="text-[5px] uppercase tracking-[.16em] text-amber-100/42">Measured admission</div><div className="mt-3 grid gap-px bg-white/6">{[["likelihood contract", "READY"], ["observed counts", "0"], ["holdout datasets", "0"], ["measured residuals", "0"], ["instrument authority", "UNAVAILABLE"]].map(([label, value]) => <div key={label} className="flex justify-between bg-black/35 px-2 py-1.5 text-[5px]"><span className="text-white/27">{label}</span><span className={value === "READY" ? "text-lime-100/55" : "text-amber-100/52"}>{value}</span></div>)}</div></div>
              </div>
            </div>
            <aside className="grid content-start gap-px bg-white/6 sm:grid-cols-2 xl:grid-cols-1">
              <Metric label="Poisson deviance" value={metrics?.poissonDeviance.toFixed(6) ?? "—"} tone="amber" />
              <Metric label="Pearson χ²" value={metrics?.pearsonChiSquare.toFixed(6) ?? "—"} tone="amber" />
              <Metric label="Mahalanobis²" value={metrics?.predictiveMahalanobisSquared.toFixed(6) ?? "—"} tone="cyan" />
              <Metric label="whitened norm²" value={metrics?.whitenedNormSquared.toFixed(6) ?? "—"} tone="cyan" />
              <Metric label="identity Δ" value={metrics?.maximumMahalanobisIdentityDifference.toExponential(2) ?? "—"} tone="lime" />
              <Metric label="effective rank" value={metrics ? `${metrics.effectiveCovarianceRank} / 24` : "—"} tone="lime" />
              <Metric label="angle closure |z|max" value={metrics?.maximumAbsoluteAngleClosureZ.toFixed(4) ?? "—"} tone="violet" />
              <Metric label="channel closure |z|max" value={metrics?.maximumAbsoluteChannelClosureZ.toFixed(4) ?? "—"} tone="violet" />
              <Metric label="measured authority" value="UNAVAILABLE" tone="rose" />
              <Metric label="dense campaign" value="0 / 49" tone="rose" />
            </aside>
          </div>
          <div className="relative mt-3 grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-3">{EXPORTS.map(([label, format, detail]) => <a key={format} href={`/api/atlas/relativity-evidence/v430/high-energy-count-likelihood?download=${format}`} download className="atlas-accessible-focus bg-black/42 px-2.5 py-2 transition-colors hover:bg-amber-100/[.05]"><div className="text-[7px] text-amber-100/62">{label}</div><div className="mt-0.5 text-[5px] leading-relaxed text-white/27">{detail}</div></a>)}</div>
          <footer className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 text-[5px] text-white/28"><span>Poisson · deviance · Pearson · covariance whitening · deterministic replay</span><span className="text-amber-100/45">fixture goodness-of-fit ≠ instrument performance</span></footer>
        </>
      )}
    </section>
  );
}

function Status({ status }: Readonly<{ status: string }>) { return <div className="flex items-center gap-2 border border-amber-100/14 bg-amber-100/[.025] px-2.5 py-1.5"><span className={`h-1.5 w-1.5 rounded-full ${status === "ready" ? "bg-lime-200/75 shadow-[0_0_14px_rgba(190,242,100,.3)]" : status === "loading" ? "animate-pulse bg-amber-200/65" : "bg-rose-200/65"}`} /><div><div className="text-[5px] uppercase tracking-[.12em] text-white/22">likelihood channel</div><div className="mt-0.5 text-[6px] uppercase text-amber-100/62">{status}</div></div></div>; }
function Formula({ children }: Readonly<{ children: string }>) { return <div className="border-l-2 border-cyan-100/18 bg-cyan-100/[.02] px-2 py-1.5 text-cyan-50/52">{children}</div>; }
function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "amber" | "cyan" | "lime" | "violet" | "rose" }>) { const colors = { amber: "text-amber-100/60", cyan: "text-cyan-100/60", lime: "text-lime-100/60", violet: "text-violet-100/60", rose: "text-rose-100/60" } as const; return <div className="bg-black/42 px-2.5 py-2"><div className="text-[5px] uppercase tracking-[.1em] text-white/23">{label}</div><div className={`mt-0.5 text-[7px] ${colors[tone]}`}>{value}</div></div>; }
