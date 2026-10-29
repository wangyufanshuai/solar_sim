"use client";

import { useEffect, useMemo, useState } from "react";
import overlayJson from "../data/mainlineANebulaR74AlternativesV661.generated.json";
import {
  inspectR74OverlayV661, r74NextActionV661, r74SourceStatusLabelV661,
  r74TargetLabelV661, visibleR74TargetsV661,
  type R74AlternativeV661, type R74FilterV661,
  type R74OverlayV661, type R74TargetV661,
} from "../lib/mainlineANebulaR74AlternativesV661";

const overlay = overlayJson as R74OverlayV661;

const FILTERS: ReadonlyArray<{ id: R74FilterV661; label: string }> = [
  { id: "all", label: "全部 5 项" },
  { id: "identity-conflict", label: "身份冲突" },
  { id: "page-candidate", label: "页面候选" },
];

function Metric({ value, label, warning = false }: {
  value: number; label: string; warning?: boolean;
}) {
  return <div className="rounded border border-white/10 bg-black/15 px-2 py-2 text-center">
    <strong className={`block font-mono text-base ${warning
      ? "text-amber-100" : "text-cyan-50"}`}>{value}</strong>
    <span className="block text-[9px] leading-4 text-slate-500">{label}</span>
  </div>;
}

function SourceCard({ source, preferred }: {
  source: R74AlternativeV661; preferred: boolean;
}) {
  const conflict = source.identityState === "identity-conflict";
  return <article className={`min-w-0 rounded border p-2.5 ${conflict
    ? "border-rose-200/30 bg-rose-100/[.035]"
    : "border-white/10 bg-black/15"}`}
    data-mainline-a-r74-source={source.sourceKey}
    data-mainline-a-r74-identity={source.identityState}
    data-mainline-a-r74-response-captured={source.responseCaptured}
    data-mainline-a-r74-image-requested="false">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <h5 className="break-words text-xs text-slate-100">
          {source.title ?? source.sourceKey}
        </h5>
        <span className="mt-0.5 block font-mono text-[9px] text-slate-500">
          {source.nasaId ?? "NASA Hubble asset"} · {source.kind}
        </span>
      </div>
      {preferred && <span className="shrink-0 rounded border border-cyan-100/25 px-1.5 py-0.5 text-[9px] text-cyan-100">
        身份优先核对
      </span>}
    </div>
    <p className={`mt-2 text-[11px] leading-5 ${conflict
      ? "text-rose-200" : "text-amber-100/80"}`}>
      {r74SourceStatusLabelV661(source)}
    </p>
    {conflict && <p className="mt-1 rounded border border-rose-200/20 bg-rose-100/5 p-2 text-[10px] leading-5 text-rose-100">
      页面标题写 Dumbbell，但 NASA Target 字段为 {source.target ?? "未提供"}。
      此页不得单独作为 Dumbbell 图像身份依据。
    </p>}
    <dl className="mt-2 grid min-w-0 gap-1.5 text-[10px] leading-5 sm:grid-cols-2">
      <div><dt className="text-slate-500">逐图对象字段</dt>
        <dd className="break-words text-slate-300">
          {source.target ?? source.objectName ?? "页面未提供独立对象字段"}
        </dd></div>
      <div><dt className="text-slate-500">HTTP 页面</dt>
        <dd className="text-slate-300">
          {source.responseCaptured === 1
            ? `${source.httpStatus} · ${(source.rawArtifact?.bytes ?? 0).toLocaleString("zh-CN")} bytes`
            : `失败 · ${source.errorClass ?? "unknown"}`}
        </dd></div>
      <div className="sm:col-span-2"><dt className="text-slate-500">页面署名</dt>
        <dd className="break-words text-slate-300">{source.credit ?? "未捕获"}</dd></div>
      <div className="sm:col-span-2"><dt className="text-slate-500">合作方标记</dt>
        <dd className="break-words text-amber-100/80">
          {source.partnerMarkers.length ? source.partnerMarkers.join(" · ")
            : "当前页面署名未检出预置合作方关键词，仍需逐项权利审核"}
        </dd></div>
    </dl>
    <div className="mt-2 rounded border border-white/10 bg-[#07131c] p-2">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-[10px] text-slate-200">页面列出的下载规格</strong>
        <span className="text-[9px] text-amber-100/65">仅元数据，未下载</span>
      </div>
      {source.downloads.length ? <ul className="mt-1 space-y-0.5 text-[10px] text-slate-400">
        {source.downloads.slice(0, 5).map((download) => <li key={download.url}
          className="break-words">
          · {download.size ?? download.name} · {download.format ?? "格式待核"}
        </li>)}
      </ul> : <p className="mt-1 text-[10px] text-slate-500">页面失败或无可核规格</p>}
    </div>
    <dl className="mt-2 min-w-0 space-y-1 text-[9px] leading-4 text-slate-500">
      <div><dt className="inline">原始页面 SHA-256 · </dt>
        <dd className="inline break-all font-mono text-slate-400">
          {source.rawArtifact?.sha256 ?? "responseCaptured=0"}
        </dd></div>
      <div><dt className="inline">请求指纹 · </dt>
        <dd className="inline break-all font-mono text-slate-400">
          {source.requestFingerprint}
        </dd></div>
      <div><dt className="inline">页面复核问题 · </dt>
        <dd className="inline break-words text-slate-400">
          {source.inspectionIssues.length ? source.inspectionIssues.join(" · ") : "无解析问题"}
        </dd></div>
    </dl>
    <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer"
      className="mt-3 inline-flex min-h-10 items-center rounded border border-cyan-100/25 px-3 text-[10px] text-cyan-100 underline">
      打开 NASA 官方页面 ↗
    </a>
  </article>;
}

function TargetDetail({ row }: { row: R74TargetV661 }) {
  return <div className="mt-3 min-w-0" data-mainline-a-r74-detail={row.id}>
    <div className="rounded border border-amber-100/20 bg-amber-100/[.035] p-2.5">
      <strong className="text-xs text-amber-50">{r74TargetLabelV661(row.id)}</strong>
      <p className="mt-1 text-[10px] leading-5 text-amber-100/75">
        {r74NextActionV661(row)}。逐图版权 0 签署，原图请求 0，运行时准入 0。
      </p>
    </div>
    <div className="mt-2 grid min-w-0 gap-2" data-mainline-a-r74-alternative-count={row.alternatives.length}>
      {row.alternatives.map((source) => <SourceCard key={source.sourceKey}
        source={source} preferred={source.sourceKey === row.preferredSourceKey} />)}
    </div>
  </div>;
}

export default function MainlineANebulaR74AlternativePanelV661({
  onSelectionChange,
}: { onSelectionChange?: (row: R74TargetV661 | null) => void }) {
  const checked = useMemo(() => inspectR74OverlayV661(overlay), []);
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState("dumbbell-nebula");
  const [filter, setFilter] = useState<R74FilterV661>("all");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => visibleR74TargetsV661(
    overlay.rows, filter, query), [filter, query]);
  const selected = visible.find((row) => row.id === selectedId)
    ?? visible[0] ?? null;

  useEffect(() => {
    onSelectionChange?.(expanded && checked.ok ? selected : null);
  }, [expanded, checked.ok, selected, onSelectionChange]);

  return <section className="mb-4 min-w-0 rounded-lg border border-amber-100/20 bg-amber-100/[.025] p-3"
    aria-label="R74 五项受阻星云官方替代页面"
    data-mainline-a-r74-panel="v661"
    data-mainline-a-r74-status={checked.ok ? "verified-candidate-hold" : "blocked"}
    data-mainline-a-r74-image-requests="0">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="font-mono text-[9px] tracking-[.18em] text-amber-100/60">
          R74 / OFFICIAL PAGE ARBITRATION
        </div>
        <h3 className="mt-1 text-sm text-amber-50">五项受阻星云的官方替代来源</h3>
        <p className="mt-1 max-w-xl text-[10px] leading-5 text-slate-400">
          六个真实 HTTPS 页面已留存并离线重算；页面身份与下载规格只供候选审查。
          五张原图均未请求，版权与人工视觉签署仍 pending。
        </p>
      </div>
      <button type="button" onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded} aria-controls="r74-alternative-content"
        className="min-h-10 shrink-0 rounded border border-amber-100/25 px-3 text-[11px] text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-100">
        {expanded ? "收起来源核对" : "展开来源核对"}
      </button>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
      <Metric value={overlay.counts.heldTargets} label="仍保持 hold" warning />
      <Metric value={overlay.counts.officialPagesCaptured} label="原始页面" />
      <Metric value={overlay.counts.conflictingPages} label="字段冲突" warning />
      <Metric value={overlay.counts.imageRequestsExecuted} label="原图请求" warning />
      <Metric value={overlay.counts.rightsSigned} label="版权签署" warning />
    </div>
    {!checked.ok && <p role="alert" className="mt-3 rounded border border-rose-200/30 p-2 text-xs text-rose-200">
      来源覆盖记录校验失败：{checked.issues.join(" · ")}。请勿使用页面候选判断。
    </p>}
    {expanded && checked.ok && <div id="r74-alternative-content" className="mt-3 min-w-0">
      <p className="rounded border border-rose-200/20 bg-rose-100/[.035] p-2 text-[10px] leading-5 text-rose-100"
        data-mainline-a-r74-known-conflict="dumbbell-spitzer">
        Dumbbell 的一条 NASA Photojournal 页面标题与 Target 字段互相矛盾。
        本轮保留冲突，另列 Hubble M27 页面继续核对。
      </p>
      <div className="mt-3 flex min-w-0 flex-wrap gap-2">
        <input type="search" aria-label="搜索 R74 星云官方来源"
          value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder="星云、NASA ID 或署名"
          className="min-h-10 min-w-[200px] flex-1 rounded border border-white/15 bg-black/20 px-3 text-xs text-slate-100" />
        {FILTERS.map((item) => <button key={item.id} type="button"
          aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}
          className={`min-h-10 rounded border px-2 text-[10px] ${filter === item.id
            ? "border-cyan-100/50 bg-cyan-100/10 text-cyan-100"
            : "border-white/10 text-slate-400"}`}>
          {item.label}
        </button>)}
      </div>
      <p role="status" className="mt-2 text-[10px] text-slate-500">
        显示 {visible.length} / {overlay.rows.length} 项 · 页面候选不等于图像准入
      </p>
      <div className="mt-2 grid min-w-0 grid-cols-1 gap-1.5 sm:grid-cols-2"
        data-mainline-a-r74-visible-count={visible.length}>
        {visible.map((row) => <button key={row.id} type="button"
          onClick={() => setSelectedId(row.id)}
          aria-pressed={selected?.id === row.id}
          data-mainline-a-r74-target={row.id}
          className={`min-w-0 rounded border p-2 text-left text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-100 ${
            selected?.id === row.id
              ? "border-cyan-100/50 bg-cyan-100/10 text-cyan-50"
              : "border-white/10 bg-black/10 text-slate-300"}`}>
          <span className="block break-words">{r74TargetLabelV661(row.id)}</span>
          <span className="mt-1 block text-[10px] text-amber-100/70">
            {row.conflicts.length ? `${row.conflicts.length} 条来源冲突 · ` : ""}
            原图未请求 · 版权待审
          </span>
        </button>)}
      </div>
      {selected ? <TargetDetail row={selected} />
        : <p className="mt-3 text-xs text-slate-500">没有匹配的来源。</p>}
      <p className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-5 text-slate-500">
        candidate-only · hold · not-admitted · scientificPayloadWriteback=false。
        本地页面重算不构成 NASA 身份独立认证、版权许可或科学有效性证明。
      </p>
    </div>}
  </section>;
}
