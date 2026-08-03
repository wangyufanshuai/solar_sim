"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getPolarimeterCalibrationSnapshotV411, loadPolarimeterCalibrationSummaryV411, subscribePolarimeterCalibrationV411 } from "../lib/kerrPolarimeterCalibrationClientV411";

const REQUIRED_RAILS = Object.freeze([
  "Measured identity + attestation",
  "Wavelength nodes ≥ 5",
  "HWP retardance + uncertainty",
  "Analyzer angle zero",
  "Ordinary / extraordinary throughput",
  "Extinction ratio",
  "4×4 Mueller response",
  "16×16 Mueller covariance",
] as const);

export default function KerrPolarimeterCalibrationSurfaceV411() {
  const state = useSyncExternalStore(subscribePolarimeterCalibrationV411, getPolarimeterCalibrationSnapshotV411, getPolarimeterCalibrationSnapshotV411);
  useEffect(() => { void loadPolarimeterCalibrationSummaryV411().catch(() => undefined); }, []);
  const summary = state.summary;
  return <section className="relative mt-3 overflow-hidden border border-amber-100/14 bg-[radial-gradient(circle_at_7%_12%,rgba(251,191,36,.08),transparent_29%),radial-gradient(circle_at_91%_77%,rgba(34,211,238,.055),transparent_30%),linear-gradient(118deg,rgba(13,8,3,.98),rgba(4,7,9,.97)_56%,rgba(4,12,13,.94))] px-3 py-3 font-mono" data-atlas-kerr-polarimeter-calibration-v411 data-atlas-v411-status={state.status} data-atlas-v411-summary-only-in-react-state="true" data-atlas-v411-measured-pack-present="false" data-atlas-v411-authority-granted="false" data-atlas-v411-science-buffer-mutation="false" data-atlas-v411-cinematic-buffer-mutation="false" data-atlas-v411-canvas-created="false" aria-live="polite">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(251,191,36,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.018)_1px,transparent_1px)] [background-size:28px_28px]" />
    <header className="relative grid gap-3 border-b border-white/7 pb-2.5 lg:grid-cols-[minmax(0,1fr)_auto]"><div><div className="text-[6px] uppercase tracking-[.27em] text-amber-100/43">V411 · wavelength-resolved calibration contract</div><h4 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[19px] font-light uppercase tracking-[.16em] text-amber-50/90">Polarimeter admission lattice</h4><p className="mt-1 max-w-[96ch] text-[6px] leading-relaxed text-white/36">仪器结构已经可编译、可审计，但当前没有真实测量标定包。系统保持 fail-closed：理想双束算子继续有效，实测偏振仪 authority、电子计数与科学图像仍不可用。</p></div><div className="flex items-center gap-2 self-start border border-amber-100/14 bg-amber-100/[.025] px-2.5 py-1.5"><span className={`h-1.5 w-1.5 rounded-full ${state.status === "ready" ? "bg-amber-200/75 shadow-[0_0_14px_rgba(251,191,36,.3)]" : state.status === "loading" ? "animate-pulse bg-cyan-200/60" : "bg-rose-200/60"}`} /><div><div className="text-[5px] uppercase tracking-[.12em] text-white/22">calibration channel</div><div className="mt-0.5 text-[6px] uppercase text-amber-100/62">{state.status}</div></div></div></header>
    {!summary ? <div className="relative mt-2 border-l-2 border-amber-100/24 px-2 py-1.5 text-[6px] text-amber-50/48">{state.status === "loading" || state.status === "idle" ? "读取标定合同摘要…" : `标定摘要不可用 · ${state.reason ?? "request-failed"}`}</div> : <>
      <div className="relative mt-2 grid gap-px bg-white/6 xl:grid-cols-[minmax(260px,.72fr)_minmax(0,1.28fr)]">
        <article className="bg-black/38 px-3 py-3"><div className="flex items-start justify-between gap-3"><div><div className="text-[5px] uppercase tracking-[.15em] text-white/24">admission state</div><div className="mt-1 text-[9px] uppercase tracking-[.08em] text-amber-100/68">BLOCKED · INPUT ABSENT</div></div><div className="grid h-12 w-12 place-items-center border border-amber-100/16 bg-amber-100/[.025]"><span className="text-[16px] font-light text-amber-100/58">∅</span></div></div><div className="mt-3 grid gap-px bg-white/6 sm:grid-cols-2"><Metric label="schema" value="READY" tone="lime" /><Metric label="measured rows" value="0" tone="amber" /><Metric label="compiler" value="NOT RUN" tone="cyan" /><Metric label="authority" value="BLOCKED" tone="amber" /></div><p className="mt-3 border-l border-amber-100/22 pl-2 text-[5px] leading-relaxed text-white/29">Compiler 只校验身份、单位、矩阵、协方差与 provenance；即使结构编译通过，也不会自行授予科学权威。</p></article>
        <article className="bg-black/38 px-3 py-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="text-[5px] uppercase tracking-[.15em] text-white/24">required measurement rails · 8 of 11 shown</div><div className="text-[5px] text-cyan-100/42">4×4 response · 16×16 covariance</div></div><div className="mt-3 grid gap-1 sm:grid-cols-2">{REQUIRED_RAILS.map((rail, index) => <div key={rail} className="flex items-center gap-2 border border-white/7 bg-white/[.018] px-2 py-1.5"><span className="grid h-4 w-4 shrink-0 place-items-center border border-amber-100/14 text-[5px] text-amber-100/44">{String(index + 1).padStart(2, "0")}</span><span className="text-[5px] text-white/36">{rail}</span><span className="ml-auto text-[5px] uppercase text-amber-100/34">absent</span></div>)}</div></article>
      </div>
      <div className="relative mt-px grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-4"><Metric label="minimum λ nodes" value={`${summary.schema.minimumWavelengthNodeCount}`} tone="cyan" /><Metric label="required inputs" value={`${summary.schema.requiredInputCount}`} tone="cyan" /><Metric label="ideal V410 operator" value="QUALIFIED" tone="lime" /><Metric label="detector electrons" value="UNAVAILABLE" tone="amber" /></div>
      <div className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 text-[5px] text-white/28"><span>Visible/EUV/soft-X-ray 不共享 HWP 假设 · 无示例测量值 · 无默认性能</span><a href="/api/atlas/relativity-evidence/v411/polarimeter-calibration?download=1" download className="atlas-accessible-focus border border-amber-100/16 bg-amber-100/[.025] px-2 py-1 uppercase tracking-[.09em] text-amber-100/58">下载 schema inspect</a></div>
    </>}
  </section>;
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "lime" | "cyan" | "amber" }>) { const color = tone === "lime" ? "text-lime-100/58" : tone === "cyan" ? "text-cyan-100/56" : "text-amber-100/58"; return <div className="bg-black/38 px-2.5 py-1.5"><div className="text-[5px] uppercase tracking-[.11em] text-white/23">{label}</div><div className={`mt-0.5 text-[7px] ${color}`}>{value}</div></div>; }
