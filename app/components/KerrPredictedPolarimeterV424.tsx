"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getKerrPredictedPolarimeterSnapshotV424,
  loadKerrPredictedPolarimeterSummaryV424,
  subscribeKerrPredictedPolarimeterV424,
} from "../lib/kerrPredictedPolarimeterClientV424";

const COLORS = ["#67e8f9", "#5eead4", "#bef264", "#fbbf24"] as const;
const EXPORTS = [["PREDICTION JSON", "json"], ["MODULATION CSV", "csv"], ["TABLE FITS", "fits"], ["DIAGNOSTIC PNG", "png"]] as const;
const scientific = (value: number) => value === 0 ? "0" : value.toExponential(2);

export default function KerrPredictedPolarimeterV424() {
  const state = useSyncExternalStore(
    subscribeKerrPredictedPolarimeterV424,
    getKerrPredictedPolarimeterSnapshotV424,
    getKerrPredictedPolarimeterSnapshotV424,
  );
  useEffect(() => { void loadKerrPredictedPolarimeterSummaryV424().catch(() => undefined); }, []);
  const summary = state.summary;
  const grouped = summary ? ["disk-00", "disk-01", "disk-02", "disk-03"].map((rayId) =>
    summary.referenceModulationRows.filter((row) => row.rayId === rayId)) : [];
  return (
    <section
      className="relative mt-3 overflow-hidden border border-amber-100/15 bg-[radial-gradient(circle_at_18%_14%,rgba(251,191,36,.075),transparent_27%),radial-gradient(circle_at_87%_72%,rgba(34,211,238,.05),transparent_30%),linear-gradient(135deg,rgba(7,7,3,.995),rgba(2,10,12,.99)_56%,rgba(2,6,8,.99))] px-3 py-3 font-mono"
      data-atlas-kerr-predicted-polarimeter-v424
      data-atlas-v424-status={state.status}
      data-atlas-v424-model-prediction="qualified"
      data-atlas-v424-measurement-authority="false"
      data-atlas-v424-detector-authority="false"
      data-atlas-v424-counts-produced="false"
      data-atlas-v424-summary-only-in-react-state="true"
      data-atlas-v424-canvas-created="false"
      aria-live="polite"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(108deg,transparent_0_13px,rgba(251,191,36,.025)_14px,transparent_15px_28px)]" />
      <header className="relative grid gap-3 border-b border-white/7 pb-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="text-[6px] uppercase tracking-[.32em] text-amber-100/43">V424 · ideal instrument forward operator</div>
          <h4 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[20px] font-light uppercase tracking-[.17em] text-amber-50/92">HWP × Wollaston modulation vault</h4>
          <p className="mt-1 max-w-[112ch] text-[6px] leading-relaxed text-white/38">将 v423 的 24 条 WCS-linked 模型预测 Stokes 独立送入四角理想半波片与 Wollaston 双光束算子。这里发布的是预测光谱辐亮度，不是测量；未生成光子或电子计数，也没有 measured Mueller 标定、throughput、gain、read noise 或 detector covariance 权威。</p>
        </div>
        <div className="flex items-center gap-2 self-start border border-amber-100/14 bg-amber-100/[.025] px-2.5 py-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${state.status === "ready" ? "bg-amber-200/80 shadow-[0_0_14px_rgba(251,191,36,.32)]" : state.status === "loading" ? "animate-pulse bg-cyan-200/60" : "bg-rose-200/60"}`} />
          <div><div className="text-[5px] uppercase tracking-[.12em] text-white/22">model channel</div><div className="mt-0.5 text-[6px] uppercase text-amber-100/62">{state.status}</div></div>
        </div>
      </header>
      {!summary ? (
        <div className="relative mt-2 border-l-2 border-amber-100/24 px-2 py-1.5 text-[6px] text-amber-50/48">
          {state.status === "loading" || state.status === "idle" ? "正在读取理想双光束预测…" : `理想双光束预测不可用 · ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_310px]">
            <figure className="relative min-h-[300px] border border-amber-100/10 bg-black/25 px-3 pb-3 pt-8">
              <figcaption className="absolute left-3 top-2 text-[5px] uppercase tracking-[.14em] text-amber-100/38">F(θ) · 1e17 Hz · Walker–Penrose · four ideal HWP angles</figcaption>
              <svg viewBox="0 0 640 280" className="h-full min-h-[260px] w-full" role="img" aria-label="Four predicted dual-beam modulation curves">
                {[95, 245, 395, 545].map((x, index) => <g key={x}><line x1={x} y1="28" x2={x} y2="230" stroke="rgba(251,191,36,.10)" strokeWidth="1" /><text x={x - 18} y="256" fill="rgba(254,243,199,.42)" fontSize="8">{[0, 22.5, 45, 67.5][index]}°</text></g>)}
                <line x1="44" y1="130" x2="596" y2="130" stroke="rgba(103,232,249,.18)" strokeWidth="1" />
                {grouped.map((rows, rayIndex) => {
                  const points = rows.sort((left, right) => left.hwpIndex - right.hwpIndex).map((row, index) => `${[95, 245, 395, 545][index]},${130 - row.predictedNormalizedFluxDifference / .13 * 92}`).join(" ");
                  return <g key={rows[0]?.rayId}><polyline points={points} fill="none" stroke={COLORS[rayIndex]} strokeWidth="2.4" vectorEffect="non-scaling-stroke" />{rows.map((row, index) => <circle key={row.hwpIndex} cx={[95, 245, 395, 545][index]} cy={130 - row.predictedNormalizedFluxDifference / .13 * 92} r="4" fill={COLORS[rayIndex]} stroke="#fff7d6" strokeWidth=".6" />)}</g>;
                })}
              </svg>
              <div className="absolute bottom-2 left-3 flex flex-wrap gap-x-3 gap-y-1 text-[5px]">{grouped.map((rows, index) => <span key={rows[0]?.rayId} style={{ color: COLORS[index] }}>● {rows[0]?.rayId}</span>)}</div>
            </figure>
            <aside className="grid content-start gap-px bg-white/6 sm:grid-cols-2 xl:grid-cols-1">
              <Metric label="source predictions" value="24" tone="cyan" />
              <Metric label="modulation / beams" value="96 / 192" tone="amber" />
              <Metric label="measured / counts" value="0 / 0" tone="rose" />
              <Metric label="beam conservation" value={scientific(summary.maxima.beamSumRelative)} tone="lime" />
              <Metric label="flux-law residual" value={scientific(summary.maxima.normalizedFluxLawAbsolute)} tone="lime" />
              <Metric label="Python oracle Δ" value={scientific(summary.maxima.pythonOracleDifference)} tone="lime" />
              <Metric label="WP / KS paths" value="PRESERVED" tone="cyan" />
              <Metric label="dense authority" value="0 / 49" tone="rose" />
            </aside>
          </div>
          <div className="relative mt-3 grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-4">
            {EXPORTS.map(([label, format]) => <a key={format} href={`/api/atlas/relativity-evidence/v424/predicted-polarimeter?download=${format}`} download className="atlas-accessible-focus bg-black/42 px-2.5 py-2 transition-colors hover:bg-amber-100/[.05]"><div className="text-[7px] text-amber-100/60">{label}</div><div className="mt-0.5 text-[5px] text-white/25">{format === "fits" ? "预测双光束 Binary Table，无 image HDU" : format === "png" ? "调制诊断，不是探测器图像" : "96-row ideal-model provenance"}</div></a>)}
          </div>
          <footer className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 text-[5px] text-white/28"><span>{summary.operator.outputUnit} · fO + fE = I</span><span className="text-amber-100/42">prediction ≠ measurement · unavailable ≠ zero · browser not run</span></footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "cyan" | "amber" | "lime" | "rose" }>) {
  const color = tone === "cyan" ? "text-cyan-100/58" : tone === "amber" ? "text-amber-100/58" : tone === "lime" ? "text-lime-100/56" : "text-rose-100/54";
  return <div className="bg-black/40 px-2.5 py-2"><div className="text-[5px] uppercase tracking-[.1em] text-white/23">{label}</div><div className={`mt-0.5 text-[7px] ${color}`}>{value}</div></div>;
}
