"use client";

import { useMemo, useState } from "react";
import type {
  MainlineAIdentityBridgeReceiptV626,
  MainlineAIdentityGateV626,
  MainlineAIdentityGateStateV626,
} from "../lib/mainlineAReleaseIdentityBridgeV626";
import {
  classifyMainlineAIdentityDifferenceV626,
  summarizeMainlineAIdentityGatesV626,
} from "../lib/mainlineAReleaseIdentityBridgeV626";

type FilterState = "all" | MainlineAIdentityGateStateV626;

const stateLabel: Record<MainlineAIdentityGateStateV626, string> = {
  passed: "已通过",
  pending: "待补证",
  blocked: "阻塞",
  "not-run": "未运行",
};

const stateTone: Record<MainlineAIdentityGateStateV626, string> = {
  passed: "border-emerald-200/30 bg-emerald-300/10 text-emerald-100",
  pending: "border-amber-200/30 bg-amber-300/10 text-amber-100",
  blocked: "border-rose-200/30 bg-rose-300/10 text-rose-100",
  "not-run": "border-slate-200/20 bg-slate-300/5 text-slate-300",
};

function gateState(gate: MainlineAIdentityGateV626): MainlineAIdentityGateStateV626 {
  return gate.state;
}

function filterLabel(filter: FilterState): string {
  return filter === "all" ? "全部门禁" : stateLabel[filter];
}

function evidenceLabel(evidenceClass: string): string {
  const labels: Record<string, string> = {
    "root-package": "root 包",
    "next-web-package": "next-web 包",
    "source-digest": "源摘要",
    "build-receipt": "构建收据",
    manifest: "manifest",
    rollback: "回滚",
  };
  return labels[evidenceClass] ?? evidenceClass;
}

function blockerText(gate: MainlineAIdentityGateV626): string {
  if (gate.blockers.length === 0) return "没有开放阻塞项";
  return gate.blockers.join(" · ");
}

function statusDescription(receipt: MainlineAIdentityBridgeReceiptV626): string {
  if (receipt.status === "passed") return "身份桥接门禁已闭合，可继续接受人工发布审查。";
  if (receipt.mapping.runtimeNameDifferenceIntentional) return "运行时包名不同，但通过显式 release identity 映射保持候选状态。";
  return "身份或输入证据未闭合，继续保持 candidate-only / hold / not-admitted。";
}

export default function MainlineAReleaseIdentityBridgePanelV626({
  receipt,
  onClose,
}: {
  receipt: MainlineAIdentityBridgeReceiptV626;
  onClose?: () => void;
}) {
  const [filter, setFilter] = useState<FilterState>("all");
  const [showNotes, setShowNotes] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const summary = useMemo(() => summarizeMainlineAIdentityGatesV626(receipt.gates), [receipt.gates]);
  const classification = classifyMainlineAIdentityDifferenceV626(receipt.mapping);
  const filtered = useMemo(() => receipt.gates.filter((gate) => {
    if (!showOptional && !gate.required) return false;
    return filter === "all" || gateState(gate) === filter;
  }), [filter, receipt.gates, showOptional]);

  return (
    <section
      aria-labelledby="mainline-a-identity-heading-v626"
      className="w-full rounded-2xl border border-cyan-100/15 bg-slate-950/80 p-4 text-slate-100 shadow-xl backdrop-blur"
      data-mainline-a-release-identity-bridge="v626"
      data-mainline-a-release-status={receipt.status}
      data-mainline-a-release-identity={receipt.nextWebPackage.releaseIdentity}
      data-mainline-a-runtime-name-difference={receipt.mapping.runtimeNameDifferenceIntentional ? "intentional" : "unresolved"}
      data-mainline-a-payload-writeback={receipt.boundary.scientificPayloadWriteback ? "enabled" : "disabled"}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-200/65">R66 identity bridge</p>
          <h2 id="mainline-a-identity-heading-v626" className="mt-1 text-lg font-semibold tracking-tight">Root / next-web 发布身份</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-300">{statusDescription(receipt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${stateTone[receipt.status]}`}>{stateLabel[receipt.status]}</span>
          {onClose ? <button type="button" onClick={onClose} className="rounded-md border border-white/15 px-2 py-1 text-xs text-slate-300 hover:border-cyan-100/35">关闭</button> : null}
        </div>
      </header>

      <div className="grid gap-3 py-4 sm:grid-cols-2 lg:grid-cols-4">
        <IdentityValue label="共同 release identity" value={receipt.nextWebPackage.releaseIdentity} detail={classification} />
        <IdentityValue label="root runtime" value={receipt.rootPackage.runtimeName} detail={receipt.rootPackage.path} />
        <IdentityValue label="next-web runtime" value={receipt.nextWebPackage.runtimeName} detail={receipt.nextWebPackage.path} />
        <IdentityValue label="source relation" value={receipt.mapping.sourceDigestRelation} detail={`${receipt.rootSource.entryCount}/${receipt.nextWebSource.entryCount} entries`} />
      </div>

      <div className="grid gap-2 border-y border-white/10 py-3 text-xs sm:grid-cols-4">
        <Metric label="通过" value={summary.passed} tone="text-emerald-200" />
        <Metric label="待补证" value={summary.pending} tone="text-amber-200" />
        <Metric label="阻塞" value={summary.blocked} tone="text-rose-200" />
        <Metric label="必需开放" value={summary.requiredOpen} tone="text-cyan-200" />
      </div>

      <div className="flex flex-wrap items-center gap-2 py-3">
        <span className="text-[11px] text-slate-400">筛选</span>
        {(["all", "passed", "pending", "blocked", "not-run"] as FilterState[]).map((value) => (
          <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`rounded-md border px-2 py-1 text-[11px] ${filter === value ? "border-cyan-100/45 bg-cyan-100/10 text-cyan-100" : "border-white/10 text-slate-400"}`}>
            {filterLabel(value)}
          </button>
        ))}
        <button type="button" onClick={() => setShowOptional((value) => !value)} className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-400">{showOptional ? "隐藏可选门禁" : "显示可选门禁"}</button>
        <button type="button" onClick={() => setShowNotes((value) => !value)} className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-400">{showNotes ? "隐藏说明" : "显示说明"}</button>
      </div>

      <div className="space-y-2" data-mainline-a-identity-gates="v626">
        {filtered.map((gate) => <GateRow key={gate.id} gate={gate} showNotes={showNotes} />)}
        {filtered.length === 0 ? <p className="rounded-lg border border-dashed border-white/10 p-4 text-xs text-slate-500">没有符合当前筛选的门禁。</p> : null}
      </div>

      <footer className="mt-4 grid gap-2 border-t border-white/10 pt-3 text-[11px] text-slate-400 sm:grid-cols-3">
        <span>candidate-only: {receipt.boundary.candidateOnly ? "是" : "否"}</span>
        <span>hold: {receipt.boundary.hold ? "是" : "否"}</span>
        <span>scientificPayloadWriteback: {receipt.boundary.scientificPayloadWriteback ? "是" : "否"}</span>
      </footer>
    </section>
  );
}

function IdentityValue({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p><p className="mt-1 break-all font-mono text-xs text-cyan-100">{value}</p><p className="mt-1 break-all text-[10px] text-slate-500">{detail}</p></div>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"><span className="text-slate-400">{label}</span><strong className={`font-mono ${tone}`}>{value}</strong></div>;
}

function GateRow({ gate, showNotes }: { gate: MainlineAIdentityGateV626; showNotes: boolean }) {
  const state = gateState(gate);
  return <article className="rounded-xl border border-white/10 bg-black/10 p-3" data-mainline-a-identity-gate={gate.id} data-state={state}>
    <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className={`rounded-full border px-2 py-0.5 text-[10px] ${stateTone[state]}`}>{stateLabel[state]}</span><h3 className="text-xs font-medium text-slate-200">{gate.label}</h3></div><span className="font-mono text-[10px] text-slate-500">{evidenceLabel(gate.evidenceClass)} · {gate.required ? "required" : "optional"}</span></div>
    <p className="mt-2 text-[11px] text-slate-400">{blockerText(gate)}</p>
    {showNotes && gate.notes.length > 0 ? <ul className="mt-2 space-y-1 text-[10px] text-slate-500">{gate.notes.map((note) => <li key={note}>· {note}</li>)}</ul> : null}
  </article>;
}
