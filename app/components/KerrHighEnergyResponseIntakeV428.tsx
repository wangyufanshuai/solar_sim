"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getKerrHighEnergyResponseIntakeSnapshotV428, loadKerrHighEnergyResponseIntakeSummaryV428, subscribeKerrHighEnergyResponseIntakeV428 } from "../lib/kerrHighEnergyResponseIntakeClientV428";

const MUTATIONS = ["../ path", "absolute path", "backslash path", "duplicate member", "unexpected member", "missing member", "symlink", "SHA mismatch", "CSV header", "invalid UTF-8", "attestation", "unit contract"] as const;
const EXPORTS = [["FIREWALL JSON", "json", "跨语言 intake 资格与 authority 边界"], ["SUBMISSION SCHEMA", "schema", "ZIP、CSV、单位、大小和 provenance 合同"], ["FIXTURE REPORT", "report", "12 项对抗性变异拒绝记录"], ["TEST FIXTURE ZIP", "fixture", "仅用于 validator；明确非实测、不可发布"], ["ARCHITECTURE PNG", "png", "导入防火墙图；不是探测器图像"]] as const;

export default function KerrHighEnergyResponseIntakeV428() {
  const state = useSyncExternalStore(subscribeKerrHighEnergyResponseIntakeV428, getKerrHighEnergyResponseIntakeSnapshotV428, getKerrHighEnergyResponseIntakeSnapshotV428);
  useEffect(() => { void loadKerrHighEnergyResponseIntakeSummaryV428().catch(() => undefined); }, []);
  const summary = state.summary;
  return (
    <section className="relative mt-3 overflow-hidden border border-emerald-100/14 bg-[linear-gradient(128deg,rgba(2,10,9,.995),rgba(2,13,12,.99)_54%,rgba(12,8,2,.985))] p-3 font-mono text-white/52" data-atlas-kerr-high-energy-response-intake-v428 data-atlas-v428-status={state.status} data-atlas-v428-measured-submission-count="0" data-atlas-v428-measured-import-attempt-count="0" data-atlas-v428-measured-response-authority="false" data-atlas-v428-science-response-applications="0" data-atlas-v428-summary-only-in-react-state="true" data-atlas-v428-canvas-created="false" aria-live="polite">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(135deg,transparent_0_13px,rgba(52,211,153,.025)_14px,transparent_15px_28px)]" />
      <header className="relative flex flex-wrap items-start justify-between gap-3 border-b border-white/7 pb-3">
        <div><div className="text-[6px] uppercase tracking-[.34em] text-emerald-100/42">V428 · measured-response quarantine airlock</div><h4 className="mt-1 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[21px] font-light uppercase tracking-[.18em] text-emerald-50/92">Response intake firewall</h4><p className="mt-1 max-w-[116ch] text-[6px] leading-relaxed text-white/38">对显式提交的本地 ZIP 执行路径、成员、大小、压缩比、SHA、UTF-8、CSV、单位与 provenance 检查，再由 TypeScript v427 validator 独立复核科研矩阵。结构通过仍不等于实测权威。</p></div>
        <div className="flex items-center gap-2 border border-emerald-100/14 bg-emerald-100/[.025] px-2.5 py-1.5"><span className={`h-1.5 w-1.5 rounded-full ${state.status === "ready" ? "bg-lime-200/75 shadow-[0_0_14px_rgba(190,242,100,.3)]" : state.status === "loading" ? "animate-pulse bg-amber-200/65" : "bg-rose-200/65"}`} /><div><div className="text-[5px] uppercase tracking-[.12em] text-white/22">intake channel</div><div className="mt-0.5 text-[6px] uppercase text-emerald-100/62">{state.status}</div></div></div>
      </header>
      {!summary ? <div className="relative mt-3 border-l-2 border-emerald-100/24 bg-emerald-100/[.02] px-3 py-2 text-[6px] text-emerald-50/48">{state.status === "loading" || state.status === "idle" ? "正在读取响应导入防火墙…" : `导入防火墙不可用 · ${state.reason ?? "request-failed"}`}</div> : <>
        <div className="relative mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_310px]">
          <div className="grid gap-3">
            <div className="grid gap-px bg-white/6 md:grid-cols-5">{[["01", "CONTAINER", "路径、成员、大小"], ["02", "INTEGRITY", "manifest + 6 SHA"], ["03", "NORMALIZE", "UTF-8、CSV、单位"], ["04", "CROSS-CHECK", "Python × TypeScript"], ["05", "ADMISSION", "独立科研验证"]].map(([index, label, detail], itemIndex) => <article key={index} className="min-h-24 bg-black/42 p-2.5"><div className="flex justify-between"><span className="text-[7px] text-emerald-100/62">{index}</span><span className={`text-[5px] ${itemIndex < 4 ? "text-lime-100/48" : "text-amber-100/48"}`}>{itemIndex < 4 ? "QUALIFIED" : "NOT RUN"}</span></div><div className="mt-4 text-[7px] tracking-[.1em] text-emerald-50/62">{label}</div><div className="mt-1 text-[5px] text-white/27">{detail}</div></article>)}</div>
            <div className="border border-emerald-100/10 bg-black/28 p-3"><div className="flex items-center justify-between"><span className="text-[5px] uppercase tracking-[.16em] text-emerald-100/38">Adversarial archive matrix</span><span className="text-[5px] text-lime-100/48">12 / 12 rejected</span></div><div className="mt-3 grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-3">{MUTATIONS.map((label) => <div key={label} className="flex items-center justify-between bg-black/40 px-2 py-1.5 text-[5px]"><span className="text-white/31">{label}</span><span className="text-lime-100/52">REJECT</span></div>)}</div></div>
          </div>
          <aside className="grid content-start gap-px bg-white/6 sm:grid-cols-2 xl:grid-cols-1"><Metric label="archive cap" value={`${summary.limits.archiveMaximumBytes / 1024 / 1024} MiB`} tone="emerald" /><Metric label="member cap" value={`${summary.limits.memberMaximumBytes / 1024 / 1024} MiB`} tone="emerald" /><Metric label="files / CSV" value={`${summary.counts.expectedArchiveFileCount} / ${summary.counts.measurementCsvCount}`} tone="cyan" /><Metric label="fixture rows" value={`${summary.counts.fixtureDataRowCount} · TEST ONLY`} tone="amber" /><Metric label="Python / TS Δ" value={summary.fixture.pythonTypeScriptMaximumDifference.toExponential(2)} tone="lime" /><Metric label="measured submissions" value="0" tone="amber" /><Metric label="import attempts" value="0" tone="amber" /><Metric label="measured authority" value="UNAVAILABLE" tone="rose" /><Metric label="dense campaign" value="0 / 49" tone="amber" /></aside>
        </div>
        <div className="relative mt-3 grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-5">{EXPORTS.map(([label, format, detail]) => <a key={format} href={`/api/atlas/relativity-evidence/v428/high-energy-response-intake?download=${format}`} download className="atlas-accessible-focus bg-black/42 px-2.5 py-2 transition-colors hover:bg-emerald-100/[.05]"><div className="text-[7px] text-emerald-100/62">{label}</div><div className="mt-0.5 text-[5px] leading-relaxed text-white/26">{detail}</div></a>)}</div>
        <footer className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 text-[5px] text-white/28"><span>secure local intake · no browser upload · no raw rows in React state</span><span className="text-amber-100/45">measured response / independent validation / science projection unavailable</span></footer>
      </>}
    </section>
  );
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "emerald" | "cyan" | "lime" | "amber" | "rose" }>) {
  const color = tone === "emerald" ? "text-emerald-100/58" : tone === "cyan" ? "text-cyan-100/58" : tone === "lime" ? "text-lime-100/58" : tone === "amber" ? "text-amber-100/58" : "text-rose-100/58";
  return <div className="bg-black/42 px-2.5 py-2"><div className="text-[5px] uppercase tracking-[.1em] text-white/23">{label}</div><div className={`mt-0.5 text-[7px] ${color}`}>{value}</div></div>;
}
