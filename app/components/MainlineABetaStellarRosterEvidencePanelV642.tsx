"use client";

import { useMemo, useState } from "react";
import {
  MAINLINE_A_BETA_STELLAR_EVIDENCE_CLASSES_V642,
  evidenceClassLabelV642,
  evidenceStateLabelV642,
  evidenceStateToneV642,
  type MainlineABetaStellarEvidenceClassV642,
  type MainlineABetaStellarEvidencePackV642,
  type MainlineABetaStellarEvidenceRecordV642,
} from "../lib/mainlineABetaStellarRosterEvidenceV642";
import {
  classProgressV642,
  evidenceClassRecordsV642,
  evidenceReplaySummaryV642,
  replayMainlineABetaStellarRosterEvidenceV642,
  reportBoundaryV642,
} from "../lib/mainlineABetaStellarRosterEvidenceReplayV642";

function Metric({ label, value, tone = "text-slate-200" }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/15 px-2 py-2">
      <dt className="text-[9px] uppercase tracking-[.12em] text-slate-600">{label}</dt>
      <dd className={`mt-1 font-mono text-sm ${tone}`}>{value}</dd>
    </div>
  );
}

function stateTone(state: MainlineABetaStellarEvidenceRecordV642["state"]): string {
  if (state === "passed") return "border-emerald-100/25 bg-emerald-100/[.04]";
  if (state === "observed") return "border-cyan-100/25 bg-cyan-100/[.04]";
  if (state === "blocked") return "border-amber-100/25 bg-amber-100/[.04]";
  if (state === "not-run") return "border-slate-100/15 bg-slate-100/[.02]";
  return "border-white/10 bg-black/15";
}

function RecordDetail({ record }: { record: MainlineABetaStellarEvidenceRecordV642 }) {
  return (
    <article className={`mt-3 rounded border p-3 ${stateTone(record.state)}`} data-mainline-a-beta-stellar-evidence-detail={record.id}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] text-fuchsia-100/80">{record.id}</p>
          <h4 className="mt-1 text-sm text-slate-200">{record.title}</h4>
        </div>
        <span className={`rounded border border-white/10 px-2 py-1 text-[10px] ${evidenceStateToneV642(record.state)}`}>{evidenceStateLabelV642(record.state)}</span>
      </div>
      <dl className="mt-3 grid gap-2 text-[10px] sm:grid-cols-2">
        <div><dt className="text-slate-600">证据类别</dt><dd className="mt-1 text-slate-300">{evidenceClassLabelV642(record.evidenceClass)}</dd></div>
        <div><dt className="text-slate-600">必需</dt><dd className="mt-1 text-slate-300">{record.required ? "yes" : "optional"}</dd></div>
        <div><dt className="text-slate-600">build identity</dt><dd className="mt-1 break-all font-mono text-slate-400">{record.buildId ?? "pending"}</dd></div>
        <div><dt className="text-slate-600">HTTP</dt><dd className="mt-1 font-mono text-slate-400">{record.httpStatus ?? "—"} · {record.contentType ?? "—"}</dd></div>
        <div><dt className="text-slate-600">开始 / 结束</dt><dd className="mt-1 break-all font-mono text-slate-500">{record.startedAt ?? "—"} / {record.endedAt ?? "—"}</dd></div>
        <div><dt className="text-slate-600">bytes / sha</dt><dd className="mt-1 break-all font-mono text-slate-500">{record.bytes ?? "—"} / {record.sha256 ?? "—"}</dd></div>
      </dl>
      {record.details.length > 0 && <ul className="mt-3 space-y-1 text-[10px] leading-5 text-amber-100/70">{record.details.map((detail) => <li key={detail}>· {detail}</li>)}</ul>}
      <p className="mt-3 text-[9px] text-slate-600">本条记录只说明 evidence 状态；不等于真实用户验证、生产性能、科学有效性或版权批准。</p>
    </article>
  );
}

function ClassButton({
  evidenceClass,
  selected,
  onSelect,
  pack,
}: {
  evidenceClass: MainlineABetaStellarEvidenceClassV642;
  selected: boolean;
  onSelect: () => void;
  pack: MainlineABetaStellarEvidencePackV642;
}) {
  const progress = classProgressV642(pack, evidenceClass);
  return (
    <button type="button" onClick={onSelect} data-mainline-a-beta-stellar-evidence-class={evidenceClass} data-mainline-a-beta-stellar-evidence-class-selected={selected ? "true" : "false"} className={`rounded border p-2 text-left ${selected ? "border-fuchsia-100/45 bg-fuchsia-100/10" : "border-white/10 bg-black/15 hover:border-fuchsia-100/25"}`}>
      <div className="flex items-center justify-between gap-2"><span className="text-[10px] text-slate-300">{progress.label}</span><span className={`font-mono text-[9px] ${progress.status === "closed" ? "text-emerald-200" : "text-amber-100"}`}>{progress.status}</span></div>
      <p className="mt-1 font-mono text-[9px] text-slate-600">{progress.observed}/{progress.required} observed</p>
      {progress.blockers?.length ? <p className="mt-1 truncate text-[9px] text-amber-100/55">{progress.blockers.join(" · ")}</p> : null}
    </button>
  );
}

export default function MainlineABetaStellarRosterEvidencePanelV642({ pack }: { pack: MainlineABetaStellarEvidencePackV642 }) {
  const [selectedClass, setSelectedClass] = useState<MainlineABetaStellarEvidenceClassV642>("static");
  const [selectedId, setSelectedId] = useState("static-v641-roster");
  const replay = useMemo(() => replayMainlineABetaStellarRosterEvidenceV642(pack), [pack]);
  const summary = useMemo(() => evidenceReplaySummaryV642(pack), [pack]);
  const records = useMemo(() => evidenceClassRecordsV642(pack, selectedClass), [pack, selectedClass]);
  const selected = records.find((record) => record.id === selectedId) ?? records[0];
  const boundary = useMemo(() => reportBoundaryV642(pack), [pack]);
  return (
    <section className="mt-4 rounded border border-fuchsia-100/15 bg-fuchsia-100/[.02] p-3" data-mainline-a-beta-stellar-evidence="v642" data-mainline-a-beta-stellar-evidence-state={summary.buildBound ? "build-bound" : "plan-only"} data-mainline-a-beta-stellar-evidence-reportable="false">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-[10px] uppercase tracking-[.14em] text-fuchsia-100/80">V642 evidence plan / build observation</h3><p className="mt-1 max-w-3xl text-[10px] leading-5 text-slate-500">B3 把静态、HTTP、视觉、浏览器、性能和外部来源分开。当前面板展示封存计划；构建后的观测另存会话收据，外部来源仍需真实审查。</p></div>
        <span className="rounded border border-fuchsia-100/20 px-2 py-1 font-mono text-[9px] text-fuchsia-100/70">{summary.observed}/{summary.required} required observed</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5" data-mainline-a-beta-stellar-evidence-summary="true">
        <Metric label="总记录" value={summary.total} />
        <Metric label="必需" value={summary.required} />
        <Metric label="已观测" value={summary.observed} tone="text-cyan-200" />
        <Metric label="blocked" value={summary.blocked} tone="text-amber-100" />
        <Metric label="build" value={summary.buildBound ? "bound" : "pending"} tone={summary.buildBound ? "text-emerald-200" : "text-slate-400"} />
      </dl>
      <div className="mt-3 grid gap-1 sm:grid-cols-3" data-mainline-a-beta-stellar-evidence-gates="true">
        {MAINLINE_A_BETA_STELLAR_EVIDENCE_CLASSES_V642.map((evidenceClass) => <ClassButton key={evidenceClass} evidenceClass={evidenceClass} selected={evidenceClass === selectedClass} onSelect={() => { setSelectedClass(evidenceClass); setSelectedId(""); }} pack={pack} />)}
      </div>
      <div className="mt-3 grid gap-1 sm:grid-cols-2" data-mainline-a-beta-stellar-evidence-records={selectedClass}>
        {records.map((record) => <button key={record.id} type="button" onClick={() => setSelectedId(record.id)} data-mainline-a-beta-stellar-evidence-row={record.id} data-mainline-a-beta-stellar-evidence-row-state={record.state} className={`rounded border p-2 text-left ${record.id === selected?.id ? "border-fuchsia-100/45 bg-fuchsia-100/10" : stateTone(record.state)}`}><span className="font-mono text-[9px] text-fuchsia-100/75">{record.id}</span><span className="ml-2 text-[10px] text-slate-400">{evidenceStateLabelV642(record.state)}</span><span className="mt-1 block truncate text-[9px] text-slate-600">{record.title}</span></button>)}
      </div>
      {selected && <RecordDetail record={selected} />}
      <div className="mt-3 rounded border border-white/5 bg-black/15 p-2" data-mainline-a-beta-stellar-evidence-boundary="true">
        <p className="text-[9px] uppercase tracking-[.12em] text-slate-600">report boundary</p>
        <p className="mt-1 text-[10px] leading-5 text-slate-500">{boundary.join(" · ")}</p>
        <p className="mt-2 font-mono text-[9px] text-slate-600">replay {replay.schema} · reportable=false · scientificPayloadWriteback=false</p>
      </div>
    </section>
  );
}
