"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  getKerrPolarimeterDetectorSnapshotV414,
  loadKerrPolarimeterDetectorSummaryV414,
  subscribeKerrPolarimeterDetectorV414,
} from "../lib/kerrPolarimeterDetectorClientV414";

const scientific = (value: number) => (value === 0 ? "0" : value.toExponential(2));
const CHANNELS = Object.freeze(["A₀", "A₁", "A₂", "A₃"]);

export default function KerrPolarimeterDetectorSurfaceV414() {
  const state = useSyncExternalStore(
    subscribeKerrPolarimeterDetectorV414,
    getKerrPolarimeterDetectorSnapshotV414,
    getKerrPolarimeterDetectorSnapshotV414,
  );
  useEffect(() => {
    void loadKerrPolarimeterDetectorSummaryV414().catch(() => undefined);
  }, []);
  const summary = state.summary;
  return (
    <section
      className="relative mt-3 overflow-hidden border border-lime-100/14 bg-[radial-gradient(circle_at_12%_10%,rgba(190,242,100,.065),transparent_27%),radial-gradient(circle_at_88%_90%,rgba(56,189,248,.05),transparent_31%),linear-gradient(118deg,rgba(5,11,3,.98),rgba(4,7,8,.97)_56%,rgba(9,6,2,.95))] px-3 py-3 font-mono"
      data-atlas-kerr-polarimeter-detector-v414
      data-atlas-v414-status={state.status}
      data-atlas-v414-summary-only-in-react-state="true"
      data-atlas-v414-count-rows-in-react-state="false"
      data-atlas-v414-observed-counts="false"
      data-atlas-v414-measured-authority="false"
      data-atlas-v414-science-buffer-mutation="false"
      data-atlas-v414-cinematic-buffer-mutation="false"
      data-atlas-v414-canvas-created="false"
      aria-live="polite"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(90deg,transparent_0_31px,rgba(217,249,157,.025)_32px,transparent_33px_64px)]"
      />
      <header className="relative grid gap-3 border-b border-white/7 pb-2.5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="text-[6px] uppercase tracking-[.27em] text-lime-100/43">
            V414 · detector-count forward model
          </div>
          <h4 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[19px] font-light uppercase tracking-[.16em] text-lime-50/90">
            Electron expectation chamber
          </h4>
          <p className="mt-1 max-w-[96ch] text-[6px] leading-relaxed text-white/36">
            将可见光子、v413 Mueller 响应、曝光与探测器噪声连接为四通道电子期望。Poisson/counting 与 calibration
            covariance 分层保存；缺少实测探测器 authority 时不生成观测计数。
          </p>
        </div>
        <div className="flex items-center gap-2 self-start border border-lime-100/14 bg-lime-100/[.025] px-2.5 py-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              state.status === "ready"
                ? "bg-lime-200/75 shadow-[0_0_14px_rgba(190,242,100,.3)]"
                : state.status === "loading"
                  ? "animate-pulse bg-sky-200/60"
                  : "bg-amber-200/60"
            }`}
          />
          <div>
            <div className="text-[5px] uppercase tracking-[.12em] text-white/22">detector channel</div>
            <div className="mt-0.5 text-[6px] uppercase text-lime-100/62">{state.status}</div>
          </div>
        </div>
      </header>
      {!summary ? (
        <div className="relative mt-2 border-l-2 border-lime-100/24 px-2 py-1.5 text-[6px] text-lime-50/48">
          {state.status === "loading" || state.status === "idle"
            ? "正在读取电子计数预算…"
            : `计数预算不可用 · ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-3 grid gap-px bg-white/6 xl:grid-cols-[minmax(230px,.58fr)_minmax(0,1.42fr)]">
            <article className="bg-black/38 px-3 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[5px] uppercase tracking-[.14em] text-white/24">four analyzer exposures</span>
                <span className="text-[5px] text-amber-100/43">expectation only</span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {CHANNELS.map((channel, index) => (
                  <div key={channel} className="grid justify-items-center gap-1">
                    <div className="relative h-16 w-7 overflow-hidden border border-lime-100/14 bg-black/45">
                      <span
                        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-lime-300/45 via-cyan-200/24 to-transparent"
                        style={{ height: `${58 + index * 9}%` }}
                      />
                    </div>
                    <span className="text-[5px] text-lime-100/48">{channel}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[5px] leading-relaxed text-white/28">
                柱高仅表达通道结构，不渲染科学计数值。完整 16-row expectation 与 4×4 covariance 只存在于可下载 artifact。
              </p>
            </article>
            <article className="grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="expectation rows" value="16" tone="sky" />
              <Metric label="max electrons" value={scientific(summary.maxima.expectedElectron)} tone="lime" />
              <Metric label="max expected ADU" value={scientific(summary.maxima.expectedAdu)} tone="lime" />
              <Metric label="counting σ / N" value={scientific(summary.maxima.countingRelativeSigma)} tone="sky" />
              <Metric label="calibration σ / N" value={scientific(summary.maxima.calibrationRelativeSigma)} tone="sky" />
              <Metric label="observed counts" value="UNAVAILABLE" tone="amber" />
            </article>
          </div>
          <div className="relative mt-px grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="quadrature Δ" value={scientific(summary.maxima.photonQuadratureRelativeDifference)} tone="lime" />
            <Metric label="budget closure Δ" value={scientific(summary.maxima.componentSumRelativeDifference)} tone="lime" />
            <Metric label="cov symmetry Δ" value={scientific(summary.maxima.calibrationCovarianceSymmetryAbsolute)} tone="lime" />
            <Metric label="Python oracle Δ" value={scientific(Math.max(...Object.values(summary.oracleComparison)))} tone="lime" />
          </div>
          <footer className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 text-[5px] text-white/28">
            <span>fixture geometry/noise · well capacity unavailable · no random sampling · no observed counts</span>
            <a
              href="/api/atlas/relativity-evidence/v414/polarimeter-detector-counts?download=1"
              download
              className="atlas-accessible-focus border border-lime-100/16 bg-lime-100/[.025] px-2 py-1 uppercase tracking-[.09em] text-lime-100/58"
            >
              下载完整 detector artifact
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
    <div className="bg-black/38 px-2.5 py-2">
      <div className="text-[5px] uppercase tracking-[.11em] text-white/23">{label}</div>
      <div className={`mt-0.5 text-[7px] ${color}`}>{value}</div>
    </div>
  );
}
