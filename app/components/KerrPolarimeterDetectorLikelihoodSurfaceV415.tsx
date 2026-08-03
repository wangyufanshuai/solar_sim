"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  getKerrPolarimeterDetectorLikelihoodSnapshotV415,
  loadKerrPolarimeterDetectorLikelihoodSummaryV415,
  subscribeKerrPolarimeterDetectorLikelihoodV415,
} from "../lib/kerrPolarimeterDetectorLikelihoodClientV415";

const scientific = (value: number) => (value === 0 ? "0" : value.toExponential(2));
const LAYERS = Object.freeze([
  { id: "source", label: "源电子", model: "高计数率近似", tone: "from-cyan-300/70 to-cyan-100/10" },
  { id: "dark", label: "暗电流", model: "小 λ Poisson", tone: "from-lime-300/65 to-lime-100/10" },
  { id: "background", label: "背景", model: "小 λ Poisson", tone: "from-amber-300/65 to-amber-100/10" },
  { id: "read", label: "读出", model: "Gaussian", tone: "from-rose-300/60 to-rose-100/10" },
] as const);

export default function KerrPolarimeterDetectorLikelihoodSurfaceV415() {
  const state = useSyncExternalStore(
    subscribeKerrPolarimeterDetectorLikelihoodV415,
    getKerrPolarimeterDetectorLikelihoodSnapshotV415,
    getKerrPolarimeterDetectorLikelihoodSnapshotV415,
  );
  useEffect(() => {
    void loadKerrPolarimeterDetectorLikelihoodSummaryV415().catch(() => undefined);
  }, []);
  const summary = state.summary;
  return (
    <section
      className="relative mt-3 overflow-hidden border border-cyan-100/14 bg-[radial-gradient(circle_at_8%_18%,rgba(34,211,238,.07),transparent_25%),radial-gradient(circle_at_92%_82%,rgba(163,230,53,.05),transparent_28%),linear-gradient(122deg,rgba(2,9,12,.985),rgba(3,5,7,.98)_58%,rgba(10,7,2,.97))] px-3 py-3 font-mono"
      data-atlas-kerr-polarimeter-detector-likelihood-v415
      data-atlas-v415-status={state.status}
      data-atlas-v415-summary-only-in-react-state="true"
      data-atlas-v415-likelihood-rows-in-react-state="false"
      data-atlas-v415-observed-counts="false"
      data-atlas-v415-exact-source-poisson-integer="false"
      data-atlas-v415-measured-authority="false"
      data-atlas-v415-science-buffer-mutation="false"
      data-atlas-v415-cinematic-buffer-mutation="false"
      data-atlas-v415-canvas-created="false"
      aria-live="polite"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(103,232,249,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,.025)_1px,transparent_1px)] [background-size:23px_23px]"
      />
      <header className="relative grid gap-3 border-b border-white/7 pb-2.5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="text-[6px] uppercase tracking-[.27em] text-cyan-100/45">
            V415 · detector stochastic contract
          </div>
          <h4 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[19px] font-light uppercase tracking-[.16em] text-cyan-50/90">
            Residual metrology bench
          </h4>
          <p className="mt-1 max-w-[100ch] text-[6px] leading-relaxed text-white/38">
            将超过安全整数范围的期望基值与噪声残差分开保存。源电子采用明确标注的高计数率近似；暗电流与背景使用小 λ
            Poisson；读出噪声和标定偏差独立报告，不合并成未经证明的总似然。
          </p>
        </div>
        <div className="flex items-center gap-2 self-start border border-cyan-100/14 bg-cyan-100/[.025] px-2.5 py-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              state.status === "ready"
                ? "bg-cyan-200/75 shadow-[0_0_14px_rgba(103,232,249,.32)]"
                : state.status === "loading"
                  ? "animate-pulse bg-lime-200/60"
                  : "bg-amber-200/60"
            }`}
          />
          <div>
            <div className="text-[5px] uppercase tracking-[.12em] text-white/22">likelihood channel</div>
            <div className="mt-0.5 text-[6px] uppercase text-cyan-100/62">{state.status}</div>
          </div>
        </div>
      </header>
      {!summary ? (
        <div className="relative mt-2 border-l-2 border-cyan-100/24 px-2 py-1.5 text-[6px] text-cyan-50/48">
          {state.status === "loading" || state.status === "idle"
            ? "正在读取分层噪声与似然摘要…"
            : `噪声似然不可用 · ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-3 grid gap-px bg-white/6 xl:grid-cols-[minmax(260px,.72fr)_minmax(0,1.28fr)]">
            <article className="bg-black/40 px-3 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[5px] uppercase tracking-[.14em] text-white/25">base + residual ledger</span>
                <span className="text-[5px] text-amber-100/45">synthetic fixture only</span>
              </div>
              <div className="mt-3 grid gap-1.5">
                {LAYERS.map((layer, index) => (
                  <div key={layer.id} className="grid grid-cols-[58px_minmax(0,1fr)_86px] items-center gap-2">
                    <span className="text-[5px] text-white/35">{layer.label}</span>
                    <span className="h-1.5 overflow-hidden border border-white/8 bg-black/60">
                      <span
                        className={`block h-full bg-gradient-to-r ${layer.tone}`}
                        style={{ width: `${88 - index * 13}%` }}
                      />
                    </span>
                    <span className="text-right text-[5px] text-cyan-50/38">{layer.model}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 border-t border-white/7 pt-2 text-[5px] leading-relaxed text-white/29">
                条带只表达模型分层，不编码观测值。完整 16-row residual、NLL 与 calibration 向量仅存在于可下载 artifact。
              </p>
            </article>
            <article className="grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="likelihood rows" value="16" tone="cyan" />
              <Metric
                label="max 1/√λ"
                value={scientific(summary.maxima.sourceHighCountApproximationIndicator)}
                tone="lime"
              />
              <Metric
                label="base + Δ loss"
                value={scientific(summary.maxima.absoluteAdditionLossRelativeToResidual)}
                tone="amber"
              />
              <Metric
                label="max |count z|"
                value={summary.maxima.absoluteStandardizedCountingResidual.toFixed(3)}
                tone="cyan"
              />
              <Metric
                label="counting NLL"
                value={summary.maxima.countingComponentNegativeLogLikelihood.toFixed(3)}
                tone="cyan"
              />
              <Metric label="observed counts" value="UNAVAILABLE" tone="amber" />
            </article>
          </div>
          <div className="relative mt-px grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Cholesky Δ"
              value={scientific(summary.maxima.calibrationCholeskyReconstructionRelative)}
              tone="lime"
            />
            <Metric
              label="calibration NLL"
              value={summary.maxima.calibrationGaussianNegativeLogLikelihood.toFixed(3)}
              tone="cyan"
            />
            <Metric
              label="Python oracle Δ"
              value={scientific(Math.max(...Object.values(summary.oracleComparison)))}
              tone="lime"
            />
            <Metric label="exact source integer" value="UNAVAILABLE" tone="amber" />
          </div>
          <footer className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 text-[5px] text-white/29">
            <span>固定 SHA seed · no Math.random · counting/calibration 分离 · measured authority unavailable</span>
            <a
              href="/api/atlas/relativity-evidence/v415/polarimeter-detector-likelihood?download=1"
              download
              className="atlas-accessible-focus border border-cyan-100/16 bg-cyan-100/[.025] px-2 py-1 uppercase tracking-[.09em] text-cyan-100/58"
            >
              下载完整 likelihood artifact
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  tone,
}: Readonly<{ label: string; value: string; tone: "lime" | "cyan" | "amber" }>) {
  const color =
    tone === "lime" ? "text-lime-100/58" : tone === "cyan" ? "text-cyan-100/56" : "text-amber-100/58";
  return (
    <div className="bg-black/40 px-2.5 py-2">
      <div className="text-[5px] uppercase tracking-[.11em] text-white/23">{label}</div>
      <div className={`mt-0.5 text-[7px] ${color}`}>{value}</div>
    </div>
  );
}
