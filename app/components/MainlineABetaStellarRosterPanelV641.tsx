"use client";

import { useMemo, useState } from "react";
import {
  filterMainlineABetaStellarRosterV641,
  rosterAdmissionLabelV641,
  rosterPhaseLabelV641,
  rosterSourceLabelV641,
  rosterSummaryV641,
  type MainlineABetaStellarFieldLedgerV641,
  type MainlineABetaStellarRosterPackV641,
  type MainlineABetaStellarRosterRowV641,
} from "../lib/mainlineABetaStellarRosterV641";
import { explainRosterRowV641, replayMainlineABetaStellarRosterV641 } from "../lib/mainlineABetaStellarRosterReplayV641";

function SummaryCell({ label, value, tone = "text-slate-200" }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/20 p-2" data-mainline-a-beta-stellar-roster-summary-cell={label}>
      <dt className="text-[9px] uppercase tracking-[.12em] text-slate-500">{label}</dt>
      <dd className={`mt-1 font-mono text-lg ${tone}`}>{value}</dd>
    </div>
  );
}

function FieldValue({ entry }: { entry: MainlineABetaStellarFieldLedgerV641 }) {
  const value = entry.value === null || entry.value === "" ? "未提供" : String(entry.value);
  return <>{value}{entry.unit ? ` ${entry.unit}` : ""}</>;
}

function FieldTable({ row }: { row: MainlineABetaStellarRosterRowV641 }) {
  return (
    <div className="mt-3 overflow-x-auto rounded border border-white/10" data-mainline-a-beta-stellar-roster-fields="true">
      <table className="w-full min-w-[520px] text-left text-[10px]">
        <thead className="border-b border-white/10 text-slate-500"><tr><th className="px-2 py-2 font-normal">字段</th><th className="px-2 py-2 font-normal">状态</th><th className="px-2 py-2 font-normal">值</th><th className="px-2 py-2 font-normal">置信边界</th><th className="px-2 py-2 font-normal">原始证据</th></tr></thead>
        <tbody>
          {row.fieldLedger.map((entry) => (
            <tr key={entry.field} className="border-b border-white/5 align-top last:border-b-0" data-mainline-a-beta-stellar-roster-field={entry.field}>
              <th className="px-2 py-2 font-mono font-normal text-sky-100/80">{entry.field}</th>
              <td className="px-2 py-2 text-slate-400">{entry.state}</td>
              <td className="px-2 py-2 text-slate-200"><FieldValue entry={entry} /></td>
              <td className="px-2 py-2 text-amber-100/80">{entry.confidence}</td>
              <td className="max-w-[250px] break-words px-2 py-2 text-slate-500">{entry.rawEvidence ?? "未保存字段级原文"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourceList({ row }: { row: MainlineABetaStellarRosterRowV641 }) {
  return (
    <div className="mt-3 rounded border border-white/10 bg-black/15 p-2" data-mainline-a-beta-stellar-roster-sources="true">
      <h5 className="text-[10px] uppercase tracking-[.12em] text-slate-500">字段来源与可重算绑定</h5>
      <ul className="mt-2 space-y-2 text-[10px] text-slate-400">
        {row.sourceRefs.map((source) => (
          <li key={source.id} className="break-words rounded border border-white/5 p-2" data-mainline-a-beta-stellar-roster-source={source.id}>
            <div className="flex flex-wrap gap-x-2 gap-y-1"><span className="font-mono text-sky-100/80">{source.id}</span><span>{source.role}</span><span>{source.evidenceClass}</span></div>
            <a href={source.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-slate-500 underline">{source.url}</a>
            {source.path && <div className="mt-1 break-all text-slate-600">artifact path: {source.path}</div>}
            <div className="mt-1 break-all text-slate-600">SHA-256: {source.sha256 ?? "未捕获"}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Detail({ row }: { row: MainlineABetaStellarRosterRowV641 }) {
  const component = row.componentReview;
  const explanation = explainRosterRowV641(row);
  return (
    <article className="mt-3 rounded border border-orange-100/15 bg-orange-100/[.025] p-3" data-mainline-a-beta-stellar-roster-detail={row.id}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h4 className="text-sm text-orange-50">{row.displayName}</h4><p className="mt-1 font-mono text-[10px] text-slate-500">{row.id} · {rosterSourceLabelV641(row.sourceClass)}</p></div>
        <span className={row.phase === "candidate-hold" ? "rounded border border-amber-100/20 px-2 py-1 text-[10px] text-amber-100" : "rounded border border-emerald-100/20 px-2 py-1 text-[10px] text-emerald-100"}>{rosterPhaseLabelV641(row.phase)}</span>
      </div>
      <p className="mt-2 text-[10px] leading-5 text-slate-400">{rosterAdmissionLabelV641(row)}</p>
      <dl className="mt-3 grid gap-2 text-[10px] text-slate-400 sm:grid-cols-2">
        <div><dt className="text-slate-600">运行时路由</dt><dd>{row.runtimeRoute}</dd></div>
        <div><dt className="text-slate-600">决定</dt><dd>{row.decision}</dd></div>
        <div><dt className="text-slate-600">组件身份</dt><dd>{component.status} · {component.reason}</dd></div>
        <div><dt className="text-slate-600">版权/条款</dt><dd>{row.rightsStatus}</dd></div>
        <div><dt className="text-slate-600">源快照 SHA-256</dt><dd className="break-all">{row.sourceSnapshotSha256}</dd></div>
        <div><dt className="text-slate-600">行指纹</dt><dd className="break-all">{row.fingerprint}</dd></div>
      </dl>
      {component.hints.length > 0 && <p className="mt-2 text-[10px] text-amber-100/80">组件提示（仅 identifier-only）：{component.hints.join(" · ")}</p>}
      <ul className="mt-2 space-y-1 text-[10px] text-amber-100/70" data-mainline-a-beta-stellar-roster-replay-reasons="true">{explanation.map((reason) => <li key={reason}>{reason}</li>)}</ul>
      <FieldTable row={row} />
      <SourceList row={row} />
      <p className="mt-3 text-[10px] text-slate-600">scientificPayloadWriteback=false · 组件确认 {component.sourceArtifactSha256 ? "0（artifact 仅用于候选复核）" : "0"}</p>
    </article>
  );
}

export default function MainlineABetaStellarRosterPanelV641({ pack }: { pack: MainlineABetaStellarRosterPackV641 }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(pack.records[0]?.id ?? "sirius-a");
  const summary = useMemo(() => rosterSummaryV641(pack), [pack]);
  const replay = useMemo(() => replayMainlineABetaStellarRosterV641(pack), [pack]);
  const rows = useMemo(() => filterMainlineABetaStellarRosterV641(pack, query), [pack, query]);
  const selected = pack.records.find((row) => row.id === selectedId) ?? rows[0] ?? pack.records[0];
  return (
    <section className="mt-4 rounded border border-fuchsia-100/15 bg-fuchsia-100/[.02] p-3" data-mainline-a-beta-stellar-roster="v641" data-mainline-a-beta-stellar-roster-state="candidate-only" data-mainline-a-beta-stellar-roster-count={summary.total}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-[10px] uppercase tracking-[.14em] text-fuchsia-100/80">Beta 24 恒星结构化 roster / V641</h3><p className="mt-1 max-w-3xl text-[10px] leading-5 text-slate-500">统一呈现现有运行时参考与四颗待补星的字段级来源。V621/V634 的真实 raw 只产生候选，组件身份与权利仍保持 hold。</p></div>
        <span className="rounded border border-fuchsia-100/20 px-2 py-1 font-mono text-[9px] text-fuchsia-100/70">24 total · writeback off</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5" data-mainline-a-beta-stellar-roster-summary="true">
        <SummaryCell label="总数" value={summary.total} />
        <SummaryCell label="现有运行时" value={summary.runtimeExisting} tone="text-emerald-200" />
        <SummaryCell label="candidate hold" value={summary.candidateHold} tone="text-amber-100" />
        <SummaryCell label="raw artifact" value={summary.sourceArtifactBacked} tone="text-cyan-100" />
        <SummaryCell label="组件确认" value={summary.componentConfirmed} tone="text-orange-100" />
      </dl>
      <div className="mt-3 flex gap-2">
        <label htmlFor="mainline-a-beta-stellar-roster-filter-v641" className="sr-only">筛选 Beta 恒星</label>
        <input id="mainline-a-beta-stellar-roster-filter-v641" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID、字段、来源或状态" className="min-h-9 min-w-0 flex-1 rounded border border-white/10 bg-black/20 px-2 text-xs" />
        <button type="button" onClick={() => setQuery("")} className="min-h-9 rounded border border-white/10 px-3 text-xs text-slate-400">清空</button>
      </div>
      <p className="mt-2 text-[10px] text-slate-600" role="status">显示 {rows.length} / {summary.total} · candidate-only · hold · not-admitted · scientificPayloadWriteback=false</p>
      <div className="mt-2 grid gap-1 sm:grid-cols-3" data-mainline-a-beta-stellar-roster-gates="true">
        {replay.gates.map((gate) => <div key={gate.id} className="rounded border border-white/5 px-2 py-1 text-[9px] text-slate-500"><span className="font-mono text-slate-400">{gate.id}</span><span className="ml-2">{gate.status}</span><span className="ml-2">{gate.observed}/{gate.required}</span>{gate.blockers.length > 0 && <span className="mt-1 block truncate text-amber-100/55">{gate.blockers.join(" · ")}</span>}</div>)}
      </div>
      <div className="mt-3 grid gap-1 sm:grid-cols-3" data-mainline-a-beta-stellar-roster-list="true">
        {rows.map((row) => <button key={row.id} type="button" onClick={() => setSelectedId(row.id)} data-mainline-a-beta-stellar-roster-row={row.id} data-mainline-a-beta-stellar-roster-selected={row.id === selected?.id ? "true" : "false"} className={`rounded border p-2 text-left text-[10px] ${row.id === selected?.id ? "border-fuchsia-100/50 bg-fuchsia-100/10" : "border-white/10 bg-black/15 hover:border-fuchsia-100/30"}`}><span className="font-mono text-fuchsia-100/80">{row.id}</span><span className="ml-2 text-slate-400">{row.phase === "candidate-hold" ? "hold" : "runtime"}</span><span className="mt-1 block truncate text-slate-600">{row.displayName} · {row.componentReview.status}</span></button>)}
      </div>
      {selected && <Detail row={selected} />}
    </section>
  );
}
