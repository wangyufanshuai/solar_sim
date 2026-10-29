"use client";

import { useMemo, useState } from "react";
import { auditNebulaBatchV624, exportNebulaAuditV624 } from "../lib/mainlineANebulaBatchAuditV624";
import {
  nebulaBatchAdmissionNoteV624,
  nebulaBatchArtifactLabelV624,
  nebulaBatchAttemptRowsV624,
  nebulaBatchBoundaryValidV624,
  nebulaBatchFilterLabelV624,
  nebulaBatchHistoricalLabelV624,
  nebulaBatchLatestAttemptV624,
  nebulaBatchNetworkLabelV624,
  nebulaBatchRightsLabelV624,
  nebulaBatchStatusLabelV624,
  nebulaBatchStatusToneV624,
  nebulaBatchSummaryV624,
  nebulaBatchSelectionV624,
  nebulaBatchVisibleRowsV624,
  type NebulaBatchFilterV624,
  type NebulaBatchPackV624,
  type NebulaBatchRowV624,
} from "../lib/mainlineANebulaBatchViewV624";

const FILTERS: readonly NebulaBatchFilterV624[] = ["all", "captured", "failed", "historical", "rights"];

function toneClass(tone: ReturnType<typeof nebulaBatchStatusToneV624>): string {
  if (tone === "captured") return "border-emerald-200/30 text-emerald-100";
  if (tone === "failed") return "border-red-200/25 text-red-100";
  return "border-amber-100/25 text-amber-100";
}

function RowCard({ row, selected, onSelect }: { row: NebulaBatchRowV624; selected: boolean; onSelect: () => void }) {
  const latest = nebulaBatchLatestAttemptV624(row);
  const tone = nebulaBatchStatusToneV624(row);
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} data-mainline-a-nebula-batch-record={row.id} data-mainline-a-nebula-batch-status={tone} className={`min-w-0 rounded border p-2 text-left ${selected ? "border-cyan-100/60 bg-cyan-100/[.08]" : "border-white/10 bg-black/15 hover:border-white/30"}`}>
      <div className="flex items-center justify-between gap-2"><span className="truncate text-xs text-slate-100">{row.title}</span><span className={`shrink-0 rounded border px-1.5 py-0.5 text-[11px] ${toneClass(tone)}`}>{nebulaBatchStatusLabelV624(row)}</span></div>
      <div className="mt-1 truncate text-[11px] text-cyan-100/60">{nebulaBatchNetworkLabelV624(row)} · {nebulaBatchSourceLink(row.source.url)}</div>
      <div className="mt-1 grid grid-cols-2 gap-1 text-[11px] text-slate-500"><span>attempts {row.network.attempts.length}</span><span>HTTP {latest?.httpStatus ?? "—"}</span><span>{nebulaBatchHistoricalLabelV624(row)}</span><span>{nebulaBatchRightsLabelV624(row)}</span></div>
    </button>
  );
}

function nebulaBatchSourceLink(url: string): string {
  try { return new URL(url).hostname; } catch { return "invalid source"; }
}

function Detail({ row }: { row: NebulaBatchRowV624 }) {
  return (
    <aside className="min-w-0 rounded border border-white/10 bg-[#07131d] p-3" data-mainline-a-nebula-batch-detail={row.id} aria-label="星云批次选中详情">
      <div className="font-mono text-[11px] tracking-[.14em] text-cyan-100/50">R64 RAW BATCH DETAIL</div>
      <h4 className="mt-1 text-sm text-cyan-50">{row.title}</h4>
      <dl className="mt-3 space-y-1.5 text-[11px] leading-4 text-slate-400">
        <div><dt className="text-slate-600">source</dt><dd className="break-all text-cyan-100/70"><a href={row.source.url} target="_blank" rel="noreferrer" className="underline">{row.source.url}</a></dd></div>
        <div><dt className="text-slate-600">credit / license</dt><dd>{row.source.credit} · {row.source.declaredLicense}</dd></div>
        <div><dt className="text-slate-600">historical cache</dt><dd className={row.historical.status === "verified" ? "text-emerald-100" : "text-amber-100"}>{nebulaBatchHistoricalLabelV624(row)} · {row.historical.bytes?.toLocaleString("zh-CN") ?? "—"} bytes · {row.historical.sha256?.slice(0, 20) ?? "—"}…</dd></div>
        <div><dt className="text-slate-600">new raw artifact</dt><dd className={row.network.artifact ? "text-emerald-100" : "text-amber-100"}>{nebulaBatchArtifactLabelV624(row)}{row.network.artifact ? ` · ${row.network.artifact.sha256.slice(0, 20)}…` : ""}</dd></div>
        <div><dt className="text-slate-600">rights</dt><dd className="text-amber-100">{nebulaBatchRightsLabelV624(row)}</dd></div>
      </dl>
      <div className="mt-3 rounded border border-white/10 bg-black/20 p-2" data-mainline-a-nebula-batch-attempts={row.id}><div className="text-[11px] text-slate-500">attempt ledger</div>{nebulaBatchAttemptRowsV624(row).map((attempt) => <div key={attempt.key} className="mt-1 font-mono text-[11px] text-slate-400">{attempt.label} · {attempt.value}</div>)}</div>
      <ul className="mt-3 space-y-1 text-[11px] text-amber-100/70">{row.blockers.map((blocker) => <li key={blocker}>· {blocker}</li>)}</ul>
      <p className="mt-3 border-t border-white/10 pt-2 text-[11px] leading-4 text-slate-500">{nebulaBatchAdmissionNoteV624(row)} · candidate-only · hold · not-admitted · science payload off</p>
    </aside>
  );
}

export default function MainlineANebulaBatchPanelV624({ pack }: { pack: NebulaBatchPackV624 }) {
  const [filter, setFilter] = useState<NebulaBatchFilterV624>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(pack.rows[0]?.id ?? "");
  const summary = useMemo(() => nebulaBatchSummaryV624(pack), [pack]);
  const audit = useMemo(() => auditNebulaBatchV624(pack), [pack]);
  const visible = useMemo(() => nebulaBatchVisibleRowsV624(pack, filter, query), [filter, pack, query]);
  const selected = nebulaBatchSelectionV624(visible, selectedId);
  return (
    <section className="mb-4 rounded-lg border border-cyan-100/20 bg-cyan-100/[.035] p-3" data-mainline-a-nebula-batch="v624" data-mainline-a-nebula-batch-boundary={nebulaBatchBoundaryValidV624(pack) ? "closed" : "invalid"} data-scientific-payload-writeback={String(pack.boundary.scientificPayloadWriteback)} aria-label="R64 星云原始采集批次">
      <header className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-mono text-[11px] tracking-[.2em] text-cyan-100/55">RAW IMAGE ACQUISITION / R64</div><h3 className="mt-1 text-sm text-cyan-50">第二组六图原始采集批次 <span className="ml-1 font-mono text-[11px] text-slate-500">{summary.total} candidates</span></h3><p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">历史缓存与本轮 HTTPS 响应分开显示；新图像只有在实际响应、SHA、尺寸和逐图版权证据闭合后才可申请接入。</p></div><div className="grid grid-cols-3 gap-1.5 text-center text-[11px]"><div className="rounded border border-white/10 bg-black/15 px-2 py-1"><strong className="block text-sm text-emerald-100">{summary.captured}</strong><span className="text-slate-500">raw captured</span></div><div className="rounded border border-white/10 bg-black/15 px-2 py-1"><strong className="block text-cyan-50">{summary.historical}</strong><span className="text-slate-500">历史已核对</span></div><div className="rounded border border-white/10 bg-black/15 px-2 py-1"><strong className="block text-amber-100">{summary.rightsPending}</strong><span className="text-slate-500">版权 pending</span></div></div></header>
      <div className="mt-3 flex flex-wrap gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="搜索 R64 星云批次" placeholder="目标、NASA ID、来源或状态" className="min-h-10 w-full min-w-0 basis-full rounded border border-white/15 bg-black/20 px-2.5 text-[11px]" />{FILTERS.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className={`min-h-9 rounded border px-2 text-[11px] ${filter === item ? "border-cyan-100/50 bg-cyan-100/10 text-cyan-50" : "border-white/10 text-slate-500"}`}>{nebulaBatchFilterLabelV624(item)}</button>)}</div>
       <div className="mt-2 text-[11px] text-slate-500" role="status">显示 {visible.length} / {summary.total} · 网络执行 {summary.executed} · ledger attempts {summary.attempts} · scientificPayloadWriteback=false</div>
      <div className="mt-3 grid gap-3"><div className="grid min-w-0 grid-cols-1 items-start gap-2 sm:grid-cols-2">{visible.map((row) => <RowCard key={row.id} row={row} selected={row.id === selected?.id} onSelect={() => setSelectedId(row.id)} />)}</div>{selected ? <Detail row={selected} /> : <p role="status" className="py-4 text-sm text-slate-300">没有匹配的记录，请调整搜索或筛选条件。</p>}</div>
      <details className="mt-3 rounded border border-white/10 p-3 text-xs text-slate-400" data-mainline-a-nebula-batch-audit={audit.counts.blockingFindings ? "invalid" : "consistent"}>
        <summary className="cursor-pointer text-cyan-100">采集记录核对与原始文件保留</summary>
        <p className="mt-2">检查记录间是否一致；磁盘文件重算与版权签署另行核验。保留 {audit.retention.length} 份文件，共 {audit.retainedBytes.toLocaleString("zh-CN")} bytes；不执行删除。</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2" aria-label="R64 记录审计门禁">
          {audit.gates.map((gate) => (
            <li key={gate.id} className="rounded border border-white/10 p-2">
              <span>{gate.id}</span><strong className={gate.status === "pass" ? "ml-2 text-emerald-200" : "ml-2 text-amber-100"}>{gate.status} · {gate.observed}/{gate.required}</strong>
            </li>
          ))}
        </ul>
        {audit.counts.blockingFindings > 0 && <p role="alert" className="mt-2 text-red-200">{audit.counts.blockingFindings} 条记录错误，保持 hold。</p>}
        <ul className="mt-2 space-y-1">
          {audit.findings.map((finding, index) => <li key={index}>{finding.candidateId ?? "batch"} · {finding.code}</li>)}
        </ul>
        <details className="mt-2">
          <summary className="cursor-pointer">查看审计 JSON</summary>
          <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-all text-[11px]">{exportNebulaAuditV624(audit)}</pre>
        </details>
      </details>
    </section>
  );
}
