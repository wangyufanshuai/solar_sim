"use client";

import { useMemo, useState } from "react";
import {
  nebulaBatchAdmissionLabelV628,
  nebulaBatchArtifactLabelV628,
  nebulaBatchAttemptRowsV628,
  nebulaBatchBoundaryValidV628,
  nebulaBatchErrorLabelV628,
  nebulaBatchFilterLabelV628,
  nebulaBatchFingerprintLabelV628,
  nebulaBatchGateSummaryV628,
  nebulaBatchHistoricalLabelV628,
  nebulaBatchLatestAttemptV628,
  nebulaBatchNetworkLabelV628,
  nebulaBatchRedirectLabelV628,
  nebulaBatchRightsLabelV628,
  nebulaBatchSelectionV628,
  nebulaBatchSourceHostV628,
  nebulaBatchStatusLabelV628,
  nebulaBatchSummaryV628,
  nebulaBatchToneV628,
  nebulaBatchVisibleRowsV628,
  type NebulaBatchFilterV628,
  type NebulaBatchPackV628,
  type NebulaBatchRowV628,
} from "../lib/mainlineANebulaBatchV628";

const FILTERS: readonly NebulaBatchFilterV628[] = ["all", "captured", "failed", "not-run", "rights", "historical"];

function toneClass(tone: ReturnType<typeof nebulaBatchToneV628>): string {
  if (tone === "captured") return "border-emerald-200/30 text-emerald-100";
  if (tone === "failed") return "border-red-200/30 text-red-100";
  if (tone === "not-run") return "border-slate-200/20 text-slate-400";
  return "border-amber-100/30 text-amber-100";
}

function statusClass(status: string): string {
  return status === "pass" ? "text-emerald-100" : "text-amber-100";
}

function RowCard({ row, selected, onSelect }: { row: NebulaBatchRowV628; selected: boolean; onSelect: () => void }) {
  const latest = nebulaBatchLatestAttemptV628(row);
  const tone = nebulaBatchToneV628(row);
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} data-mainline-a-nebula-v628-record={row.id} data-mainline-a-nebula-v628-status={tone} className={`min-w-0 rounded border p-2 text-left ${selected ? "border-cyan-100/60 bg-cyan-100/[.08]" : "border-white/10 bg-black/15 hover:border-white/30"}`}>
      <div className="flex items-center justify-between gap-2"><span className="truncate text-xs text-slate-100">{row.title}</span><span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] ${toneClass(tone)}`}>{nebulaBatchStatusLabelV628(row)}</span></div>
      <div className="mt-1 truncate text-[10px] text-cyan-100/60">{nebulaBatchNetworkLabelV628(row)} · {nebulaBatchSourceHostV628(row)}</div>
      <div className="mt-1 grid grid-cols-2 gap-1 text-[10px] text-slate-500"><span>attempts {row.network.attempts.length}</span><span>HTTP {latest?.httpStatus ?? "—"}</span><span>source page {row.source.sourcePageStatus}</span><span>rights {row.rights.signoffStatus}</span></div>
    </button>
  );
}

function Detail({ row }: { row: NebulaBatchRowV628 }) {
  const latest = nebulaBatchLatestAttemptV628(row);
  const attemptRows = nebulaBatchAttemptRowsV628(row);
  return (
    <aside className="min-w-0 rounded border border-white/10 bg-[#07131d] p-3" data-mainline-a-nebula-v628-detail={row.id} aria-label="V628 星云批次选中详情">
      <div className="font-mono text-[9px] tracking-[.14em] text-cyan-100/50">R66 BETA NEXT SIX / V628 DETAIL</div>
      <h4 className="mt-1 text-sm text-cyan-50">{row.title}</h4>
      <dl className="mt-3 space-y-1.5 text-[10px] leading-4 text-slate-400">
        <div><dt className="text-slate-600">source</dt><dd className="break-all text-cyan-100/70"><a href={row.source.url} target="_blank" rel="noreferrer" className="underline">{row.source.url}</a></dd></div>
        <div><dt className="text-slate-600">NASA ID / credit</dt><dd>{row.source.nasaId ?? "—"} · {row.source.credit ?? "待补"}</dd></div>
        <div><dt className="text-slate-600">历史缓存</dt><dd className={row.historical.status === "verified" ? "text-emerald-100" : "text-amber-100"}>{nebulaBatchHistoricalLabelV628(row)} · {row.historical.bytes?.toLocaleString("zh-CN") ?? "—"} bytes · {row.historical.sha256?.slice(0, 18) ?? "—"}…</dd></div>
        <div><dt className="text-slate-600">raw artifact</dt><dd className={row.network.artifact ? "text-emerald-100" : "text-amber-100"}>{nebulaBatchArtifactLabelV628(row)}</dd></div>
        <div><dt className="text-slate-600">source/rights</dt><dd className="text-amber-100">{row.source.sourcePageStatus} · {nebulaBatchRightsLabelV628(row)}</dd></div>
      </dl>
      <div className="mt-3 rounded border border-white/10 bg-black/20 p-2" data-mainline-a-nebula-v628-attempts={row.id}>
        <div className="text-[10px] text-slate-500">attempt ledger · request telemetry</div>
        {attemptRows.map((attempt) => <div key={attempt.key} className="mt-1 font-mono text-[10px] text-slate-400">{attempt.label} · {attempt.value}</div>)}
        <div className="mt-2 space-y-1 break-all text-[9px] text-slate-500"><div>error: {nebulaBatchErrorLabelV628(latest?.errorClass)}</div><div>redirect: {nebulaBatchRedirectLabelV628(latest)}</div><div>fingerprint: {nebulaBatchFingerprintLabelV628(latest)}</div></div>
      </div>
      <ul className="mt-3 space-y-1 text-[10px] text-amber-100/70">{row.blockers.map((blocker) => <li key={blocker}>· {blocker}</li>)}</ul>
      <p className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-4 text-slate-500">{nebulaBatchAdmissionLabelV628(row)}</p>
    </aside>
  );
}

export default function MainlineANebulaBatchPanelV628({ pack }: { pack: NebulaBatchPackV628 }) {
  const [filter, setFilter] = useState<NebulaBatchFilterV628>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(pack.rows[0]?.id ?? "");
  const summary = useMemo(() => nebulaBatchSummaryV628(pack), [pack]);
  const gates = useMemo(() => nebulaBatchGateSummaryV628(pack), [pack]);
  const visible = useMemo(() => nebulaBatchVisibleRowsV628(pack, filter, query), [filter, pack, query]);
  const selected = nebulaBatchSelectionV628(visible, selectedId);
  const boundary = nebulaBatchBoundaryValidV628(pack);
  return (
    <section className="mb-4 rounded-lg border border-cyan-100/20 bg-cyan-100/[.035] p-3" data-mainline-a-nebula-batch="v628" data-mainline-a-nebula-v628-boundary={boundary ? "closed" : "invalid"} data-scientific-payload-writeback="false" aria-label="R66 Beta 星云后组六图真实 HTTPS 采集">
      <header className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-mono text-[10px] tracking-[.2em] text-cyan-100/55">REAL HTTPS RAW COLLECTOR / V628</div><h3 className="mt-1 text-sm text-cyan-50">Beta 后组六图采集与 attempt ledger <span className="ml-1 font-mono text-[10px] text-slate-500">{summary.total} candidates</span></h3><p className="mt-1 max-w-2xl text-[10px] leading-5 text-slate-400">每次请求保留时间、重试、HTTP、Content-Type、终点 URL、重定向链、错误分类和 fingerprint；失败只留 ledger，artifact 与科学载荷保持关闭。</p></div><div className="grid grid-cols-3 gap-1.5 text-center text-[10px]"><div className="rounded border border-white/10 bg-black/15 px-2 py-1"><strong className="block text-sm text-emerald-100">{summary.captured}</strong><span className="text-slate-500">raw captured</span></div><div className="rounded border border-white/10 bg-black/15 px-2 py-1"><strong className="block text-sm text-amber-100">{summary.failed + summary.notRun}</strong><span className="text-slate-500">ledger pending</span></div><div className="rounded border border-white/10 bg-black/15 px-2 py-1"><strong className="block text-sm text-cyan-50">{summary.historical}</strong><span className="text-slate-500">历史已核验</span></div></div></header>
      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4" data-mainline-a-nebula-v628-gates="true">{gates.map((gate) => <div key={gate.id} className="rounded border border-white/10 bg-black/15 px-2 py-1 text-[9px]"><span className="block text-slate-500">{gate.label}</span><strong className={statusClass(gate.status)}>{gate.status} · {gate.observed}/{gate.required}</strong></div>)}</div>
      <div className="mt-3 flex flex-wrap gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="搜索 V628 Beta 星云采集" placeholder="目标、NASA ID、错误或状态" className="min-h-10 w-full min-w-0 basis-full rounded border border-white/15 bg-black/20 px-2.5 text-[11px]" />{FILTERS.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className={`min-h-9 rounded border px-2 text-[10px] ${filter === item ? "border-cyan-100/50 bg-cyan-100/10 text-cyan-50" : "border-white/10 text-slate-500"}`}>{nebulaBatchFilterLabelV628(item)}</button>)}</div>
      <div className="mt-2 text-[10px] text-slate-500" role="status">显示 {visible.length} / {summary.total} · 网络执行 {summary.executed} · attempts {summary.attempts} · timeout {summary.timedOut} · rights pending {summary.rightsPending} · scientificPayloadWriteback=false</div>
      <div className="mt-3 grid gap-3"><div className="grid min-w-0 grid-cols-1 items-start gap-2 sm:grid-cols-2">{visible.map((row) => <RowCard key={row.id} row={row} selected={row.id === selected?.id} onSelect={() => setSelectedId(row.id)} />)}</div>{selected ? <Detail row={selected} /> : <p role="status" className="py-4 text-sm text-slate-300">没有匹配的 V628 记录，请调整搜索或筛选条件。</p>}</div>
      <p className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-4 text-slate-500">V628 是真实采集/离线回放证据面板；source page、item rights、visual signoff、runtime admission 均保持 pending，不能由此推导版权批准、科学有效性或生产性能。</p>
    </section>
  );
}
