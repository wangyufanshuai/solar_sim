"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  getKerrPolarimeterStokesEnsembleSnapshotV416,
  loadKerrPolarimeterStokesEnsembleSummaryV416,
  subscribeKerrPolarimeterStokesEnsembleV416,
} from "../lib/kerrPolarimeterStokesEnsembleClientV416";

const scientific = (value: number) => (value === 0 ? "0" : value.toExponential(2));
const STOKES = Object.freeze(["I", "Q", "U", "V"]);

export default function KerrPolarimeterStokesEnsembleSurfaceV416() {
  const state = useSyncExternalStore(
    subscribeKerrPolarimeterStokesEnsembleV416,
    getKerrPolarimeterStokesEnsembleSnapshotV416,
    getKerrPolarimeterStokesEnsembleSnapshotV416,
  );
  useEffect(() => {
    void loadKerrPolarimeterStokesEnsembleSummaryV416().catch(() => undefined);
  }, []);
  const summary = state.summary;
  return (
    <section
      className="relative mt-3 overflow-hidden border border-sky-100/14 bg-[radial-gradient(ellipse_at_18%_4%,rgba(125,211,252,.07),transparent_28%),radial-gradient(ellipse_at_84%_94%,rgba(244,114,182,.045),transparent_30%),linear-gradient(128deg,rgba(3,7,14,.99),rgba(5,5,9,.985)_55%,rgba(10,5,8,.97))] px-3 py-3 font-mono"
      data-atlas-kerr-polarimeter-stokes-ensemble-v416
      data-atlas-v416-status={state.status}
      data-atlas-v416-summary-only-in-react-state="true"
      data-atlas-v416-ray-matrices-in-react-state="false"
      data-atlas-v416-trial-vectors-in-react-state="false"
      data-atlas-v416-observed-counts="false"
      data-atlas-v416-measured-authority="false"
      data-atlas-v416-science-buffer-mutation="false"
      data-atlas-v416-cinematic-buffer-mutation="false"
      data-atlas-v416-canvas-created="false"
      aria-live="polite"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 [background-image:repeating-radial-gradient(circle_at_22%_48%,transparent_0_18px,rgba(186,230,253,.035)_19px,transparent_20px_37px)]"
      />
      <header className="relative grid gap-3 border-b border-white/7 pb-2.5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="text-[6px] uppercase tracking-[.27em] text-sky-100/45">V416 · streamed coverage authority</div>
          <h4 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[19px] font-light uppercase tracking-[.16em] text-sky-50/90">
            Stokes coverage interferometer
          </h4>
          <p className="mt-1 max-w-[100ch] text-[6px] leading-relaxed text-white/38">
            对每条 Kerr disk ray 构造光谱加权有效 Mueller 矩阵，流式执行 4096 次 counting 与 calibration 独立 ensemble。
            Welford 统计验证 I/Q/U/V pull、1σ 与 2σ coverage；synthetic recovery 不等于实测偏振。
          </p>
        </div>
        <div className="flex items-center gap-2 self-start border border-sky-100/14 bg-sky-100/[.025] px-2.5 py-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              state.status === "ready"
                ? "bg-sky-200/75 shadow-[0_0_14px_rgba(125,211,252,.32)]"
                : state.status === "loading"
                  ? "animate-pulse bg-fuchsia-200/55"
                  : "bg-amber-200/60"
            }`}
          />
          <div>
            <div className="text-[5px] uppercase tracking-[.12em] text-white/22">coverage channel</div>
            <div className="mt-0.5 text-[6px] uppercase text-sky-100/62">{state.status}</div>
          </div>
        </div>
      </header>
      {!summary ? (
        <div className="relative mt-2 border-l-2 border-sky-100/24 px-2 py-1.5 text-[6px] text-sky-50/48">
          {state.status === "loading" || state.status === "idle"
            ? "正在读取 Stokes ensemble 摘要…"
            : `Stokes coverage 不可用 · ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-3 grid gap-px bg-white/6 xl:grid-cols-[minmax(250px,.68fr)_minmax(0,1.32fr)]">
            <article className="bg-black/40 px-3 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[5px] uppercase tracking-[.14em] text-white/25">four-component pull field</span>
                <span className="text-[5px] text-fuchsia-100/42">4096 trials / ray</span>
              </div>
              <div className="relative mt-3 grid grid-cols-4 gap-3 border-y border-white/7 py-3">
                <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-sky-100/12" />
                {STOKES.map((component, index) => (
                  <div key={component} className="relative grid justify-items-center gap-1">
                    <div className="relative h-16 w-9 overflow-hidden border-x border-white/8">
                      <span className="absolute inset-x-1 top-1/2 h-px bg-white/20" />
                      <span
                        className="absolute left-1/2 w-1 -translate-x-1/2 bg-gradient-to-b from-sky-200/75 to-fuchsia-200/35"
                        style={{ top: `${30 + index * 6}%`, bottom: "50%" }}
                      />
                    </div>
                    <span className="font-['Bahnschrift_Condensed',sans-serif] text-[10px] text-sky-50/62">{component}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[5px] leading-relaxed text-white/29">
                矢量仅标示四个 Stokes 分量与零轴，不绘制 trial 样本。16384 trials 中只保留每条 ray 的首个诊断向量。
              </p>
            </article>
            <article className="grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="total trials" value="16 384" tone="sky" />
              <Metric label="retained trials" value="4" tone="lime" />
              <Metric label="effective M cond" value={summary.metrics.maximumResponseConditionNumber.toFixed(3)} tone="sky" />
              <Metric label="count pull μ" value={scientific(summary.metrics.maximumCountingPullMeanAbsolute)} tone="lime" />
              <Metric label="cal pull μ" value={scientific(summary.metrics.maximumCalibrationPullMeanAbsolute)} tone="lime" />
              <Metric label="measured recovery" value="UNAVAILABLE" tone="amber" />
            </article>
          </div>
          <div className="relative mt-px grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="noiseless Stokes Δ" value={scientific(summary.metrics.maximumNoiselessStokesRecoveryAbsolute)} tone="lime" />
            <Metric label="count 1σ coverage Δ" value={scientific(summary.metrics.maximumCountingCoverageOneSigmaError)} tone="sky" />
            <Metric label="cal 1σ coverage Δ" value={scientific(summary.metrics.maximumCalibrationCoverageOneSigmaError)} tone="sky" />
            <Metric label="Python oracle Δ" value={scientific(Math.max(...Object.values(summary.oracleComparison)))} tone="lime" />
          </div>
          <footer className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 text-[5px] text-white/29">
            <span>streaming Welford · counting/calibration isolated · four retained diagnostics · no measured authority</span>
            <a
              href="/api/atlas/relativity-evidence/v416/polarimeter-stokes-ensemble?download=1"
              download
              className="atlas-accessible-focus border border-sky-100/16 bg-sky-100/[.025] px-2 py-1 uppercase tracking-[.09em] text-sky-100/58"
            >
              下载完整 ensemble artifact
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "lime" | "sky" | "amber" }>) {
  const color = tone === "lime" ? "text-lime-100/58" : tone === "sky" ? "text-sky-100/56" : "text-amber-100/58";
  return (
    <div className="bg-black/40 px-2.5 py-2">
      <div className="text-[5px] uppercase tracking-[.11em] text-white/23">{label}</div>
      <div className={`mt-0.5 text-[7px] ${color}`}>{value}</div>
    </div>
  );
}
