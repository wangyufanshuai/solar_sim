"use client";

import { useMemo, useState } from "react";
import batchV624 from "../data/mainlineANebulaBatchV624.generated.json";
import ledgerV623 from "../data/mainlineANebulaImageAttemptLedgerV623.generated.json";
import {
  buildNebulaRightsClosureV627,
  nebulaClosureAssessmentV627,
  nebulaClosureBlockerLabelV627,
  nebulaClosurePhaseLabelV627,
  nebulaClosureSortV627,
  nebulaClosureStatusLabelV627,
  rightsClosureBoundaryValidV627,
  rightsClosureGateLabelV627,
  rightsClosureNextActionV627,
  summarizeNebulaRightsClosureV627,
  type NebulaRightsClosurePackV627,
  type NebulaRightsClosureRecordV627,
} from "../lib/mainlineANebulaRightsClosureV627";

type ClosureFilter = "all" | "source" | "payload" | "rights" | "blocked";

type ClosureGate = Readonly<{
  id: string;
  label: string;
  state: "verified" | "pending" | "rejected" | "closed";
  detail: string;
}>;

const DEFAULT_BATCH = buildNebulaRightsClosureV627(batchV624, ledgerV623);
const FILTERS: readonly ClosureFilter[] = ["all", "source", "payload", "rights", "blocked"];

function gateTone(state: ClosureGate["state"]): string {
  if (state === "verified" || state === "closed") return "border-emerald-200/30 text-emerald-100";
  if (state === "rejected") return "border-red-200/30 text-red-100";
  return "border-amber-100/25 text-amber-100";
}

function gateLabel(state: ClosureGate["state"]): string {
  return ({ verified: "verified", pending: "pending", rejected: "rejected", closed: "closed" })[state];
}

function closureGateState(value: "verified" | "pending" | "invalid"): ClosureGate["state"] {
  return value === "invalid" ? "rejected" : value;
}

function signoffState(record: NebulaRightsClosureRecordV627): ClosureGate["state"] {
  if (record.rights.signoff === "rejected" || record.visualSignoff === "rejected") return "rejected";
  if (record.rights.signoff === "signed" && record.visualSignoff === "signed") return "verified";
  return "pending";
}

function recordGates(record: NebulaRightsClosureRecordV627): readonly ClosureGate[] {
  const assessment = nebulaClosureAssessmentV627(record);
  return [
    { id: "source", label: "source", state: closureGateState(record.sourceClosure), detail: assessment.sourceVerified ? "source URL/page/credit present" : "source page or evidence pending" },
    { id: "artifact", label: "raw artifact", state: closureGateState(record.artifactClosure), detail: record.artifact.path ?? "artifact path pending" },
    { id: "payload", label: "payload", state: closureGateState(record.payloadIntegrity), detail: record.artifact.sha256 ? `SHA ${record.artifact.sha256.slice(0, 16)}…` : "SHA-256 pending" },
    { id: "rights", label: "rights", state: record.rightsClosure, detail: record.rights.status },
    { id: "signoff", label: "signoff", state: signoffState(record), detail: `rights ${record.rights.signoff} · visual ${record.visualSignoff}` },
    { id: "runtime", label: "runtime", state: record.candidateOnly && record.runtimeAdmission === "candidate-only" ? "closed" : "rejected", detail: record.runtimeAdmission },
    { id: "writeback", label: "scientific writeback", state: record.scientificPayloadWriteback ? "rejected" : "closed", detail: record.scientificPayloadWriteback ? "boundary error" : "false" },
  ];
}

function nextAction(record: NebulaRightsClosureRecordV627): string {
  return rightsClosureNextActionV627(record);
}

function matches(record: NebulaRightsClosureRecordV627, filter: ClosureFilter, query: string): boolean {
  const byFilter = filter === "all"
    || (filter === "source" && record.sourceClosure !== "verified")
    || (filter === "payload" && (record.artifactClosure !== "verified" || record.payloadIntegrity !== "verified"))
    || (filter === "rights" && (record.rightsClosure !== "verified" || record.rights.signoff !== "signed"))
    || (filter === "blocked" && record.status === "blocked");
  if (!byFilter) return false;
  const needle = query.trim().toLocaleLowerCase();
  return !needle || [record.id, record.title, record.sourceUrl, record.status, ...record.blockers].join(" ").toLocaleLowerCase().includes(needle);
}

function filterLabel(filter: ClosureFilter): string {
  return ({ all: "全部", source: "来源 pending", payload: "payload pending", rights: "版权 pending", blocked: "blocked" })[filter];
}

function Summary({ batch }: { batch: NebulaRightsClosurePackV627 }) {
  const summary = summarizeNebulaRightsClosureV627(batch);
  const cards = [
    ["source", `${summary.sourceVerified}/${summary.total}`, "来源 verified"],
    ["payload", `${summary.payloadVerified}/${summary.total}`, "payload verified"],
    ["rights", `${summary.rightsVerified}/${summary.total}`, "rights cleared"],
    ["signoff", String(summary.signoffPending), "signoff pending"],
    ["runtime", rightsClosureBoundaryValidV627(batch) ? "closed" : "open", "runtime gate"],
    ["writeback", batch.boundary.scientificPayloadWriteback || batch.records.some((record) => record.scientificPayloadWriteback) ? "open" : "closed", "scientific writeback"],
  ] as const;
  return <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6" data-mainline-a-nebula-rights-summary="v627">{cards.map(([id, value, label]) => <div key={id} className="rounded border border-white/10 bg-black/15 px-2 py-1.5 text-center" data-mainline-a-nebula-rights-gate={id} data-mainline-a-nebula-rights-gate-state={value}><strong className="block text-sm text-cyan-50">{value}</strong><span className="text-[10px] text-slate-500">{label}</span></div>)}</div>;
}

function RecordCard({ record, selected, onSelect }: { record: NebulaRightsClosureRecordV627; selected: boolean; onSelect: () => void }) {
  const assessment = nebulaClosureAssessmentV627(record);
  return <button type="button" onClick={onSelect} aria-pressed={selected} data-mainline-a-nebula-rights-record={record.id} data-mainline-a-nebula-rights-status={record.status} className={`min-w-0 rounded border p-2 text-left ${selected ? "border-cyan-100/55 bg-cyan-100/[.08]" : "border-white/10 bg-black/15 hover:border-white/30"}`}>
    <div className="flex items-center justify-between gap-2"><span className="truncate text-xs text-slate-100">{record.title}</span><span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] ${record.status === "blocked" ? "border-red-200/25 text-red-100" : "border-amber-100/25 text-amber-100"}`}>{nebulaClosureStatusLabelV627(record.status)}</span></div>
    <div className="mt-1 truncate text-[10px] text-cyan-100/60">{record.id} · source {assessment.sourceClosure} · rights {assessment.rightsClosure} · {rightsClosureGateLabelV627(record)}</div>
    <div className="mt-1 grid grid-cols-2 gap-1 text-[10px] text-slate-500"><span>artifact {assessment.artifactClosure}</span><span>payload {assessment.payloadIntegrity}</span><span>signoff {record.rights.signoff}/{record.visualSignoff}</span><span>blockers {record.blockers.length}</span></div>
  </button>;
}

function Detail({ record }: { record: NebulaRightsClosureRecordV627 }) {
  const gates = recordGates(record);
  return <aside className="min-w-0 rounded border border-white/10 bg-[#07131d] p-3" data-mainline-a-nebula-rights-detail={record.id} aria-label="星云权利闭包详情">
    <div className="font-mono text-[10px] tracking-[.16em] text-cyan-100/50">RIGHTS CLOSURE / V627</div><h4 className="mt-1 text-sm text-cyan-50">{record.title}</h4><p className="mt-1 text-[10px] text-slate-500">fingerprint {record.fingerprint.slice(0, 20)}…</p>
    <div className="mt-3 grid grid-cols-2 gap-1.5" data-mainline-a-nebula-rights-gates={record.id}>{gates.map((gate) => <div key={gate.id} className="rounded border border-white/10 p-1.5" data-mainline-a-nebula-rights-gate={gate.id} data-mainline-a-nebula-rights-gate-state={gate.state}><div className="flex items-center justify-between gap-1"><span className="text-[10px] text-slate-500">{gate.label}</span><span className={`rounded border px-1 text-[9px] ${gateTone(gate.state)}`}>{gateLabel(gate.state)}</span></div><p className="mt-1 break-all text-[9px] text-slate-500">{gate.detail}</p></div>)}</div>
    <dl className="mt-3 space-y-1.5 text-[10px] leading-4 text-slate-400"><div><dt className="text-slate-600">source</dt><dd className="break-all text-cyan-100/70">{record.sourceUrl}</dd></div><div><dt className="text-slate-600">source page / credit</dt><dd className="break-all">{record.sourcePageUrl ?? "待补"} · {record.sourceCredit ?? "待补"}</dd></div><div><dt className="text-slate-600">artifact</dt><dd className="break-all">{record.artifact.path ?? "待落盘"} · {record.artifact.bytes ?? "—"} bytes · {record.artifact.width ?? "—"}×{record.artifact.height ?? "—"}</dd></div><div><dt className="text-slate-600">rights evidence</dt><dd className="break-all">{record.rights.evidencePath ?? "待审核"} · {record.rights.reviewer ?? "待审核"}</dd></div></dl>
    <div className="mt-3 rounded border border-amber-100/15 bg-amber-100/[.035] p-2 text-[10px] text-amber-100/75"><strong>下一步</strong><p className="mt-1 leading-4">{nextAction(record)}</p></div>
    <div className="mt-3"><div className="text-[10px] text-slate-500">pending reasons / blockers</div><ul className="mt-1 space-y-1 text-[10px] text-amber-100/70">{record.blockers.length ? record.blockers.map((blocker) => <li key={blocker}>· {nebulaClosureBlockerLabelV627(blocker)}</li>) : <li className="text-emerald-100">· none</li>}</ul></div>
    <div className="mt-3 border-t border-white/10 pt-2 text-[10px] text-slate-500">{nebulaClosurePhaseLabelV627("admission")}：{record.runtimeAdmission} · candidate-only · hold · not-admitted · scientificPayloadWriteback=false</div>
  </aside>;
}

export default function MainlineANebulaRightsClosurePanelV627({ batch = DEFAULT_BATCH }: { batch?: NebulaRightsClosurePackV627 }) {
  const [filter, setFilter] = useState<ClosureFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(batch.records[0]?.id ?? "");
  const records = useMemo(() => nebulaClosureSortV627(batch.records), [batch.records]);
  const visible = useMemo(() => records.filter((record) => matches(record, filter, query)), [filter, query, records]);
  const selected = visible.find((record) => record.id === selectedId) ?? visible[0] ?? null;
  const boundaryClosed = rightsClosureBoundaryValidV627(batch);
  return <section className="mb-4 rounded-lg border border-amber-100/20 bg-amber-100/[.035] p-3" data-mainline-a-nebula-rights-closure="v627" data-mainline-a-nebula-rights-boundary={boundaryClosed ? "closed" : "invalid"} data-scientific-payload-writeback="false" aria-label="R63-R64 星云来源权利闭包">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-mono text-[10px] tracking-[.2em] text-amber-100/55">SOURCE / PAYLOAD / RIGHTS CLOSURE / V627</div><h3 className="mt-1 text-sm text-amber-50">星云来源与版权闭包 <span className="ml-1 font-mono text-[10px] text-slate-500">{records.length} records</span></h3><p className="mt-1 max-w-2xl text-[10px] leading-5 text-slate-400">V627 合并 V624 原始批次和 V623 待采集记录；来源、payload、权利和 signoff 分层显示，任何 pending 都保持 candidate-only、hold 和 not-admitted。</p></div><div className="rounded border border-amber-100/20 px-2 py-1 text-[10px] text-amber-100" data-mainline-a-nebula-rights-boundary-state={boundaryClosed ? "closed" : "invalid"}>{boundaryClosed ? "candidate boundary closed" : "boundary invalid"}</div></header>
    <div className="mt-3"><Summary batch={batch} /></div>
    <div className="mt-3 flex flex-wrap gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="搜索 V627 星云权利闭包" placeholder="目标、来源、状态或 blocker" className="min-h-10 w-full min-w-0 basis-full rounded border border-white/15 bg-black/20 px-2.5 text-[11px]" />{FILTERS.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className={`min-h-9 rounded border px-2 text-[10px] ${filter === item ? "border-amber-100/50 bg-amber-100/10 text-amber-50" : "border-white/10 text-slate-500"}`}>{filterLabel(item)}</button>)}</div>
    <div className="mt-2 text-[10px] text-slate-500" role="status">显示 {visible.length} / {records.length} · source/payload/rights/signoff/runtime/writeback gates · writeback=false</div>
    <div className="mt-3 grid gap-3"><div className="grid min-w-0 grid-cols-1 items-start gap-2 sm:grid-cols-2">{visible.map((record) => <RecordCard key={record.id} record={record} selected={record.id === selected?.id} onSelect={() => setSelectedId(record.id)} />)}</div>{selected ? <Detail record={selected} /> : <p role="status" className="py-4 text-sm text-slate-300">没有匹配的闭包记录，请调整搜索或筛选条件。</p>}</div>
    <p className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-4 text-slate-500">V627 contract schema {batch.schema} · source {batch.source.path ?? "V624 adapter"} · replay rows {batch.replay.rows.length} · 不执行运行时写入，不写回科学载荷。</p>
  </section>;
}

export { DEFAULT_BATCH, nextAction, recordGates };
