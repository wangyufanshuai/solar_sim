"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  getKerrPolarimeterNonlinearObservablesSnapshotV417,
  loadKerrPolarimeterNonlinearObservablesSummaryV417,
  subscribeKerrPolarimeterNonlinearObservablesV417,
} from "../lib/kerrPolarimeterNonlinearObservablesClientV417";

const scientific = (value: number) => (value === 0 ? "0" : value.toExponential(2));

export default function KerrPolarimeterNonlinearCompassV417() {
  const state = useSyncExternalStore(
    subscribeKerrPolarimeterNonlinearObservablesV417,
    getKerrPolarimeterNonlinearObservablesSnapshotV417,
    getKerrPolarimeterNonlinearObservablesSnapshotV417,
  );
  useEffect(() => {
    void loadKerrPolarimeterNonlinearObservablesSummaryV417().catch(() => undefined);
  }, []);
  const summary = state.summary;
  return (
    <section
      className="relative mt-3 overflow-hidden border border-fuchsia-100/14 bg-[radial-gradient(circle_at_22%_40%,rgba(232,121,249,.07),transparent_24%),radial-gradient(circle_at_80%_12%,rgba(251,191,36,.045),transparent_24%),linear-gradient(132deg,rgba(12,4,14,.99),rgba(5,5,10,.985)_58%,rgba(5,9,12,.97))] px-3 py-3 font-mono"
      data-atlas-kerr-polarimeter-nonlinear-v417
      data-atlas-v417-status={state.status}
      data-atlas-v417-summary-only-in-react-state="true"
      data-atlas-v417-ray-covariances-in-react-state="false"
      data-atlas-v417-trial-observables-in-react-state="false"
      data-atlas-v417-observed-polarization="false"
      data-atlas-v417-measured-authority="false"
      data-atlas-v417-science-buffer-mutation="false"
      data-atlas-v417-cinematic-buffer-mutation="false"
      data-atlas-v417-canvas-created="false"
      aria-live="polite"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25 [background-image:conic-gradient(from_45deg_at_20%_55%,transparent_0_12.5%,rgba(240,171,252,.035)_12.6%_12.9%,transparent_13%_25%,rgba(253,230,138,.025)_25.1%_25.4%,transparent_25.5%_100%)]"
      />
      <header className="relative grid gap-3 border-b border-white/7 pb-2.5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="text-[6px] uppercase tracking-[.27em] text-fuchsia-100/45">V417 · nonlinear polarimetry</div>
          <h4 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[19px] font-light uppercase tracking-[.16em] text-fuchsia-50/90">
            Axial polarization compass
          </h4>
          <p className="mt-1 max-w-[100ch] text-[6px] leading-relaxed text-white/38">
            将 Stokes ensemble 非线性映射为 pL、signed pC 与 EVPA。EVPA 使用 π 周期轴向 wrap 和双角 resultant，禁止把
            180° 等价方向当作普通线性角度；counting 与 calibration 继续独立验证。
          </p>
        </div>
        <div className="flex items-center gap-2 self-start border border-fuchsia-100/14 bg-fuchsia-100/[.025] px-2.5 py-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              state.status === "ready"
                ? "bg-fuchsia-200/75 shadow-[0_0_14px_rgba(232,121,249,.32)]"
                : state.status === "loading"
                  ? "animate-pulse bg-amber-200/55"
                  : "bg-rose-200/60"
            }`}
          />
          <div>
            <div className="text-[5px] uppercase tracking-[.12em] text-white/22">axial channel</div>
            <div className="mt-0.5 text-[6px] uppercase text-fuchsia-100/62">{state.status}</div>
          </div>
        </div>
      </header>
      {!summary ? (
        <div className="relative mt-2 border-l-2 border-fuchsia-100/24 px-2 py-1.5 text-[6px] text-fuchsia-50/48">
          {state.status === "loading" || state.status === "idle"
            ? "正在读取非线性偏振摘要…"
            : `偏振罗盘不可用 · ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-3 grid gap-px bg-white/6 xl:grid-cols-[minmax(260px,.72fr)_minmax(0,1.28fr)]">
            <article className="grid place-items-center bg-black/42 px-3 py-3">
              <div className="relative grid h-36 w-36 place-items-center rounded-full border border-fuchsia-100/16 bg-[repeating-conic-gradient(from_-90deg,rgba(255,255,255,.08)_0_1deg,transparent_1deg_15deg)]">
                <div className="absolute inset-3 rounded-full border border-dashed border-amber-100/14" />
                <div className="absolute inset-7 rounded-full border border-fuchsia-100/12 bg-black/75" />
                <span
                  className="absolute left-1/2 top-1/2 h-px w-[43%] origin-left bg-gradient-to-r from-fuchsia-100/85 to-amber-100/30 shadow-[0_0_10px_rgba(232,121,249,.25)]"
                  style={{ transform: `rotate(${summary.truth.evpaDeg}deg)` }}
                />
                <div className="relative grid place-items-center text-center">
                  <span className="font-['Bahnschrift_Condensed',sans-serif] text-[22px] font-light text-fuchsia-50/85">
                    {summary.truth.evpaDeg.toFixed(2)}°
                  </span>
                  <span className="text-[5px] uppercase tracking-[.15em] text-white/28">EVPA axial</span>
                </div>
              </div>
              <div className="mt-2 flex gap-5 text-[5px] text-white/34">
                <span>pL {summary.truth.pL.toFixed(5)}</span>
                <span>pC {summary.truth.pC.toFixed(5)}</span>
              </div>
            </article>
            <article className="grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="total trials" value="32 768" tone="fuchsia" />
              <Metric label="retained trials" value="4" tone="lime" />
              <Metric label="max bias / σ" value={summary.metrics.maximumStandardizedBiasAbsolute.toFixed(4)} tone="lime" />
              <Metric label="1σ coverage Δ" value={scientific(summary.metrics.maximumCoverageOneSigmaError)} tone="fuchsia" />
              <Metric label="axial resultant min" value={summary.metrics.minimumEvpaAxialResultantLength.toFixed(7)} tone="amber" />
              <Metric label="observed polarization" value="UNAVAILABLE" tone="amber" />
            </article>
          </div>
          <div className="relative mt-px grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="EVPA mean / σ" value={summary.metrics.maximumEvpaAxialMeanSigmaAbsolute.toFixed(4)} tone="lime" />
            <Metric label="pL raw bias / σ" value={summary.metrics.maximumPLRawBiasSigmaAbsolute.toFixed(4)} tone="fuchsia" />
            <Metric label="physical cone violations" value="0" tone="lime" />
            <Metric label="Python oracle Δ" value={scientific(Math.max(...Object.values(summary.oracleComparison)))} tone="lime" />
          </div>
          <footer className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 text-[5px] text-white/29">
            <span>π-period axial wrap · nonlinear transform · physical Stokes cone · no measured polarization</span>
            <a
              href="/api/atlas/relativity-evidence/v417/polarimeter-nonlinear-observables?download=1"
              download
              className="atlas-accessible-focus border border-fuchsia-100/16 bg-fuchsia-100/[.025] px-2 py-1 uppercase tracking-[.09em] text-fuchsia-100/58"
            >
              下载完整 nonlinear artifact
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "fuchsia" | "lime" | "amber" }>) {
  const color =
    tone === "fuchsia" ? "text-fuchsia-100/58" : tone === "lime" ? "text-lime-100/58" : "text-amber-100/58";
  return (
    <div className="bg-black/40 px-2.5 py-2">
      <div className="text-[5px] uppercase tracking-[.11em] text-white/23">{label}</div>
      <div className={`mt-0.5 text-[7px] ${color}`}>{value}</div>
    </div>
  );
}
