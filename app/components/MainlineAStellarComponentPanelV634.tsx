"use client";

import { useMemo, useState } from "react";
import {
  isWdsRequestV634,
  summarizeComponentEvidenceV634,
  type ComponentAttemptV634,
  type ComponentEvidencePackV634,
  type ComponentIdV634,
  type WdsPairV634,
} from "../lib/mainlineAStellarComponentEvidenceV634";

const RELATION_LABEL = {
  "explicit-pair": "目录成对记录",
  "unlabelled-pair": "组件栏为空 · 未展开",
  "composite-or-unparsed": "复合／未展开的组件标签",
} as const;

function Value({ value, unit = "" }: { value: number | null; unit?: string }) {
  return <>{value === null ? "未提供或无效" : `${value}${unit ? ` ${unit}` : ""}`}</>;
}

export function ComponentAttemptRowsV634({ attempts }: { attempts: readonly ComponentAttemptV634[] }) {
  return (
    <details className="mt-2 text-[10px] text-slate-500" data-mainline-a-wds-attempt-history="true">
      <summary className="cursor-pointer">完整请求历史 · {attempts.length} 次</summary>
      {attempts.map((attempt, index) => (
        <article key={`${attempt.startedAt}:${index}`} className="mt-2 rounded border border-white/10 p-2" data-mainline-a-wds-attempt={index + 1}>
          <h5 className="text-slate-300">第 {index + 1} 次 · {attempt.responseCaptured === 1 ? "原始响应已保存" : "未保存响应"}</h5>
          <dl className="mt-1 space-y-1 break-all">
            <div><dt>开始 / 结束</dt><dd>{attempt.startedAt} → {attempt.endedAt}</dd></div>
            <div><dt>请求期限 / 超时 / 重试</dt><dd>{attempt.timeoutMs ?? "未记录"} ms / {String(attempt.timeout)} / {attempt.retryCount}</dd></div>
            <div><dt>HTTP / Content-Type</dt><dd>{attempt.httpStatus ?? "未收到"} / {attempt.contentType ?? "未收到"}</dd></div>
            <div><dt>请求 URL</dt><dd>{attempt.requestUrl ?? "未记录"}</dd></div>
            <div><dt>最终 URL</dt><dd>{attempt.finalUrl ?? "未收到"}</dd></div>
            <div><dt>错误分类</dt><dd>{attempt.errorCategory ?? "无"} / {attempt.errorClass ?? "无"}</dd></div>
            {attempt.errorMessage && <div><dt>错误消息</dt><dd>{attempt.errorMessage}</dd></div>}
            <div><dt>Fingerprint</dt><dd>{attempt.requestFingerprint ?? "未记录"}</dd></div>
            <div><dt>保存字节数</dt><dd>{attempt.responseBytes === null ? "未保存" : attempt.responseBytes}</dd></div>
          </dl>
          <p className="mt-1">重定向链</p>
          {attempt.redirectChain?.length ? (
            <ol className="mt-1 list-inside list-decimal break-all">
              {attempt.redirectChain.map((hop, hopIndex) => <li key={`${hopIndex}:${hop.from}`}>{hop.status} · {hop.from} → {hop.to}</li>)}
            </ol>
          ) : <p>无已记录重定向</p>}
          {attempt.rawArtifact && <p className="mt-1 break-all">raw SHA-256 {attempt.rawArtifact.sha256}</p>}
        </article>
      ))}
      {attempts.length === 0 && <p className="mt-1">没有请求记录。</p>}
    </details>
  );
}

export function WdsPairRowsV634({ rows }: { rows: readonly WdsPairV634[] }) {
  return (
    <div className="space-y-2" data-mainline-a-wds-pair-list="true">
      {rows.map((pair) => (
        <article key={`${pair.key}:${pair.source.line}`} className="rounded border border-white/10 p-2" data-mainline-a-wds-pair={pair.key}>
          <h5 className="text-xs text-slate-200">{pair.discoverer} · {pair.components || "组件栏为空"}</h5>
          <p className="mt-1 text-[10px] text-orange-100/80">{RELATION_LABEL[pair.relation]} · {pair.members.length ? pair.members.join(" ↔ ") : "不推断成员"}</p>
          <dl className="mt-2 grid gap-1 text-[10px] text-slate-400 sm:grid-cols-2">
            <div><dt>目录观测起止年</dt><dd><Value value={pair.firstObservationYear} /> → <Value value={pair.lastObservationYear} /></dd></div>
            <div><dt>记录观测数</dt><dd><Value value={pair.observationCount} /></dd></div>
            <div><dt>最近记录角间距</dt><dd><Value value={pair.separationArcsec} unit="arcsec" /></dd></div>
            <div><dt>目录备注</dt><dd>{pair.notes || "空"}</dd></div>
            <div><dt>主成员方向 RA / Dec</dt><dd><Value value={pair.position.raDeg} unit="deg" /> / <Value value={pair.position.decDeg} unit="deg" /></dd></div>
            <div><dt>坐标来源标记</dt><dd>{pair.position.derivedFromName ? "从 WDS 名称推导，不能作为精确位置" : "目录未标记为从名称推导"}</dd></div>
          </dl>
          {pair.warnings.length > 0 && <p className="mt-1 text-[10px] text-amber-100">字段提示：{pair.warnings.join(" · ")}</p>}
          <details className="mt-2 text-[10px] text-slate-500">
            <summary className="cursor-pointer">原始 TSV 行与字节位置</summary>
            <p className="mt-1">line {pair.source.line} · UTF-8 [{pair.source.byteStart}, {pair.source.byteEnd})</p>
            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all">{pair.source.rawText}</pre>
          </details>
        </article>
      ))}
    </div>
  );
}

export default function MainlineAStellarComponentPanelV634({ pack, selectedId }: {
  pack: ComponentEvidencePackV634; selectedId: ComponentIdV634;
}) {
  const [query, setQuery] = useState("");
  const summary = useMemo(() => summarizeComponentEvidenceV634(pack), [pack]);
  const record = pack.records.find((row) => row.id === selectedId);
  const rows = record?.table?.rows ?? [];
  const filteredRows = rows.filter((row) => `${row.components} ${row.discoverer} ${row.notes}`.toLowerCase().includes(query.trim().toLowerCase()));
  const validUrl = record && isWdsRequestV634(record.requestUrl, record.wdsSystemId) ? record.requestUrl : null;
  const labelId = `wds-filter-${selectedId}`;
  if (!summary.valid || !record) {
    return <section className="mt-3 rounded border border-red-300/20 p-3" data-mainline-a-stellar-component-state="invalid"><h4>组件目录证据不可用</h4><p className="text-xs">{summary.errors.join(" · ") || "对象记录缺失"} · 保持 hold</p></section>;
  }
  return (
    <section className="mt-3 rounded border border-orange-200/15 bg-orange-100/[.025] p-3" data-mainline-a-stellar-components="v634" data-mainline-a-stellar-component-state={record.status} data-mainline-a-stellar-component-selected={record.id}>
      <h4 className="text-xs text-orange-100">独立组件目录 / WDS</h4>
      <p className="mt-1 text-[10px] text-slate-400">真实目录响应 {summary.captured}/4 · 可解析 {summary.parsed}/4 · 成对记录 {summary.pairs} · 身份确认 0/4</p>
      <p className="mt-2 text-[11px] leading-5 text-orange-100/80">WDS 同一系统可以包含多个层级的成对记录。角间距是相对观测，目录行不能直接赋给 Hero 单星。组件身份 unresolved，科学载荷写回关闭。</p>
      <dl className="mt-2 space-y-1 text-[10px] text-slate-400">
        <div><dt>当前对象与目录系统</dt><dd>{record.sourceQueryIdentifier} · WDS {record.wdsSystemId}</dd></div>
        <div><dt>SIMBAD 原始页面中的提示</dt><dd>{record.sourceHintIdentifiers.join(" · ")}</dd></div>
        <div><dt>查询来源</dt><dd className="break-all">{validUrl ? <a href={validUrl} target="_blank" rel="noreferrer" className="underline">CDS VizieR / B/wds/wds</a> : "来源 URL 校验失败"}</dd></div>
        <div><dt>捕获尝试</dt><dd>{record.attemptCount} 次 · HTTP {record.lastAttempt?.httpStatus ?? "未收到"} · timeout {String(record.lastAttempt?.timeout ?? false)} · {record.lastAttempt?.errorCategory ?? "未记录错误"}</dd></div>
        <div><dt>时间</dt><dd>{record.lastAttempt?.startedAt ?? "未开始"} → {record.lastAttempt?.endedAt ?? "未结束"}</dd></div>
        <div><dt>目录公开日期</dt><dd>{record.table?.metadata.publicationDate ?? "未提供"}，不是观测历元</dd></div>
      </dl>
      <ComponentAttemptRowsV634 attempts={record.attempts} />
      {record.artifact ? (
        <details className="mt-2 text-[10px] text-slate-500">
          <summary className="cursor-pointer">来源绑定与可重算文件</summary>
          <dl className="mt-1 space-y-1 break-all">
            <div><dt>raw artifact</dt><dd>{record.artifact.path}</dd></div>
            <div><dt>raw SHA-256 / bytes</dt><dd>{record.artifact.sha256} / {record.artifact.bytes}</dd></div>
            <div><dt>request fingerprint</dt><dd>{record.requestFingerprint}</dd></div>
            <div><dt>SIMBAD raw SHA-256</dt><dd>{record.sourceRawPageSha256}</dd></div>
            <div><dt>capture ledger SHA-256</dt><dd>{pack.captureLedger.sha256}</dd></div>
            <div><dt>目录定义 ReadMe</dt><dd>{pack.readme ? `${pack.readme.path} / ${pack.readme.sha256}` : "原始定义尚未捕获"}</dd></div>
            <div><dt>目录提供的版权链接</dt><dd>{record.table?.metadata.rightsUrl ?? "未提供"} · 仅来源提示，未批准</dd></div>
          </dl>
        </details>
      ) : <p className="mt-2 text-xs text-amber-100">尚无可回放 raw；失败尝试不会增加捕获计数。</p>}
      {record.status === "catalogue-candidate" ? (
        <div className="mt-3">
          <label htmlFor={labelId} className="block text-[10px] text-slate-400">筛选成对标签或发现者</label>
          <input id={labelId} value={query} onChange={(event) => setQuery(event.target.value)} className="mt-1 w-full rounded border border-white/15 bg-slate-950/60 px-2 py-1 text-xs" placeholder="例如 AB、Aa,Ab、DUN" />
          <p className="my-2 text-[10px] text-slate-500" aria-live="polite">当前 {filteredRows.length}/{rows.length} 条目录记录</p>
          <WdsPairRowsV634 rows={filteredRows} />
          {filteredRows.length === 0 && <p className="text-xs text-slate-400">没有匹配的目录记录。</p>}
        </div>
      ) : <p className="mt-2 text-xs text-amber-100">目录解析未通过，保留原始尝试供离线复核。</p>}
      <ul className="mt-2 text-[10px] text-amber-100/80">{record.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul>
      <p className="mt-2 text-[10px] text-slate-500">candidate-only · hold · not-admitted · scientificPayloadWriteback=false · 版权审核 pending</p>
    </section>
  );
}
