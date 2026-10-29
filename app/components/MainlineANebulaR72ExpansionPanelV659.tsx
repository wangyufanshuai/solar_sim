"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import overlayJson from "../data/mainlineANebulaR72SourceV659.generated.json";
import { inspectR72SourceOverlayV659, visibleR72SourceRowsV659,
  type R72SourceFilterV659, type R72SourceOverlayV659,
  type R72SourceRowV659 } from "../lib/mainlineAR72ExpansionSourceV659";
import { useMainlineAR72SourceImageV659,
  type R72ImageErrorV659 } from "../lib/useMainlineAR72SourceImageV659";

const overlay = overlayJson as R72SourceOverlayV659;
const FILTERS: readonly R72SourceFilterV659[] = [
  "all", "image-available", "policy-hold", "credit-limited",
];
const FILTER_LABELS: Record<R72SourceFilterV659, string> = {
  all: "全部六条",
  "image-available": "原图已存",
  "policy-hold": "采集受阻",
  "credit-limited": "当前署名缺失",
};

function failureLabel(error: R72ImageErrorV659 | null) {
  if (error === "policy") return "现有审核阻止原图请求";
  if (error === "http") return "本机原图接口未开放或文件不可用";
  if (error === "origin") return "原图响应离开本机审查域";
  if (error === "headers") return "图片响应来源或候选边界不符";
  if (error === "bytes") return "原图字节数不符";
  if (error === "sha") return "原图 SHA-256 不符";
  if (error === "decode") return "图片解码或尺寸不符";
  return "图片请求失败";
}

function Metric({ count, label, warn = false }: {
  count: string; label: string; warn?: boolean;
}) {
  return <div className="rounded border border-white/10 bg-black/15 p-2 text-center">
    <strong className={`block font-mono text-sm ${warn
      ? "text-amber-100" : "text-cyan-50"}`}>{count}</strong>
    <span className="text-[10px] text-slate-500">{label}</span>
  </div>;
}

function ReviewCard({ row, selected, onChoose }: {
  row: R72SourceRowV659;
  selected: boolean;
  onChoose: () => void;
}) {
  return <button type="button" onClick={onChoose} aria-pressed={selected}
    data-mainline-a-r72-source-candidate={row.id}
    className={`min-w-0 rounded border p-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-100 ${
      selected ? "border-cyan-100/50 bg-cyan-100/10"
        : "border-white/10 bg-[#081720] hover:border-cyan-100/30"}`}>
    <span className="block truncate text-xs text-slate-100">{row.title}</span>
    <span className="mt-1 block truncate font-mono text-[9px] text-slate-500">
      {row.nasaId}
    </span>
    <span className={`mt-1 block text-[10px] ${row.imageRaw
      ? "text-cyan-100" : "text-amber-100/80"}`}>
      {row.imageRaw ? "原图已存 · 版权待审"
        : "图像请求未执行 · 审核阻塞"}
    </span>
    <span className="mt-1 block text-[9px] text-slate-500">
      {row.pageIdentityVerified ? "页面逐图身份可核"
        : "网页仅通用壳 · API 身份可核"}
    </span>
  </button>;
}

function Blockers({ row }: { row: R72SourceRowV659 }) {
  return <div className="mt-3 rounded border border-amber-100/15 bg-amber-100/[.03] p-2">
    <strong className="text-[10px] text-amber-100">仍未关闭的逐图审核</strong>
    <div className="mt-1 flex flex-wrap gap-1">
      {row.blockers.map((blocker) => <span key={blocker}
        className="rounded border border-amber-100/15 px-1.5 py-0.5 font-mono text-[9px] text-amber-100/70">
        {blocker}
      </span>)}
    </div>
  </div>;
}

function SourceDetail({ row }: { row: R72SourceRowV659 }) {
  const image = useMainlineAR72SourceImageV659(row);
  const requestUrl = `https://images-api.nasa.gov/search?nasa_id=${row.nasaId}`;
  return <aside className="min-w-0 rounded border border-white/10 bg-[#07151e] p-3"
    aria-label="R72 六图扩展来源详情"
    data-mainline-a-r72-source-detail={row.id}
    data-mainline-a-r72-image-state={image.status}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="font-mono text-[9px] tracking-[.15em] text-cyan-100/55">
          NASA IMAGE LIBRARY / {row.nasaId}
        </div>
        <h4 className="mt-1 text-sm text-cyan-50">{row.title}</h4>
      </div>
      <span className="rounded border border-amber-100/30 px-2 py-1 text-[10px] text-amber-100">
        版权 pending
      </span>
    </div>
    <div className="mt-3 flex min-h-44 items-center justify-center overflow-hidden rounded border border-white/10 bg-black/30 sm:min-h-60">
      {image.status === "loaded" && image.objectUrl ? <Image
        unoptimized src={image.objectUrl}
        alt={`California 星云的 NASA 原图候选，仅供本机审查；版权未签`}
        width={image.width ?? undefined} height={image.height ?? undefined}
        className="max-h-[56vh] w-full object-contain"
        data-mainline-a-r72-loaded-image={row.id} />
        : <div className="max-w-sm p-5 text-center text-xs leading-5 text-slate-400"
          role="status">
          <p>{image.status === "policy-hold"
            ? "逐图审核尚未允许下载原图。本轮只保存官方结构化来源，不展示替代图。"
            : image.status === "failed" ? failureLabel(image.error)
              : "正在核对本机原图字节、SHA-256 和尺寸…"}</p>
          {image.status === "failed" && <button type="button"
            onClick={image.retry}
            className="mt-3 min-h-10 rounded border border-cyan-100/30 px-3 text-cyan-100">
            重试本机候选图
          </button>}
        </div>}
    </div>
    <p className="mt-2 text-[11px] leading-5 text-slate-400">
      {row.imageRaw
        ? `本轮仅此条允许单次原图请求；保存 ${row.imageRaw.bytes} 字节，${row.originalWidth}×${row.originalHeight}。与历史原图的原始字节及解码像素均一致。`
        : "本轮未对该条发起原图请求，responseCaptured=0。来源记录不等于图片准入或版权批准。"}
    </p>
    <dl className="mt-3 grid min-w-0 gap-2 text-[10px] leading-5 sm:grid-cols-2">
      <div><dt className="text-slate-500">结构化身份</dt>
        <dd className="text-slate-300">NASA ID、标题和原图清单已核对</dd></div>
      <div><dt className="text-slate-500">详情页身份</dt>
        <dd className="text-slate-300">{row.pageIdentityVerified
          ? "逐图可核" : "仅通用页面壳，不作身份凭证"}</dd></div>
      <div className="sm:col-span-2"><dt className="text-slate-500">
        历史来源署名</dt><dd className="text-slate-300">{row.expectedCredit}</dd></div>
      <div className="sm:col-span-2"><dt className="text-slate-500">
        本轮结构化署名</dt><dd className="text-slate-300">
          {row.currentStructuredCreditVerified ? "与历史记录一致"
            : "NASA 当前 API 未逐项提供署名；仍需逐图核对"}
        </dd></div>
      <div><dt className="text-slate-500">官方记录</dt><dd>
        <a href={requestUrl} target="_blank" rel="noreferrer"
          className="break-all text-cyan-100 underline">NASA API ↗</a></dd></div>
      <div><dt className="text-slate-500">来源页面</dt><dd>
        <a href={row.pageUrl} target="_blank" rel="noreferrer"
          className="break-all text-cyan-100 underline">NASA 页面 ↗</a></dd></div>
      <div className="sm:col-span-2"><dt className="text-slate-500">
        结构化记录 SHA-256</dt><dd
          className="break-all font-mono text-[9px] text-slate-400">
          {row.searchRaw?.sha256 ?? "未捕获"}</dd></div>
      <div className="sm:col-span-2"><dt className="text-slate-500">
        原图 SHA-256</dt><dd
          className="break-all font-mono text-[9px] text-slate-400">
          {row.imageRaw?.sha256 ?? "未发起原图请求"}</dd></div>
    </dl>
    <Blockers row={row} />
    <p className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-5 text-amber-100/70">
      candidate-only · hold · not-admitted · scientificPayloadWriteback=false。
      此处的本机预览与结构化记录均不构成版权、科学或发布批准。
    </p>
  </aside>;
}

export default function MainlineANebulaR72ExpansionPanelV659({
  onSelectionChange,
}: { onSelectionChange?: (row: R72SourceRowV659 | null) => void }) {
  const checked = useMemo(() => inspectR72SourceOverlayV659(overlay), []);
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState(overlay.rows[0]?.id ?? "");
  const [filter, setFilter] = useState<R72SourceFilterV659>("all");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => visibleR72SourceRowsV659(
    overlay.rows, filter, query), [filter, query]);
  const selected = visible.find((row) => row.id === selectedId)
    ?? visible[0] ?? null;
  useEffect(() => {
    onSelectionChange?.(expanded && checked.ok ? selected : null);
  }, [expanded, checked.ok, selected, onSelectionChange]);
  return <section className="mb-4 min-w-0 rounded-lg border border-cyan-100/20 bg-cyan-100/[.025] p-3"
    aria-label="R72 Beta 扩展星云来源与版权状态"
    data-mainline-a-r72-source-panel="v659"
    data-mainline-a-r72-source-status={checked.ok ? "verified" : "blocked"}
    data-mainline-a-r72-image-count={overlay.counts.imagesCaptured}
    data-scientific-payload-writeback="false">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="font-mono text-[9px] tracking-[.18em] text-cyan-100/55">
          MAINLINE A / R72 / SIX EXPANSION SOURCE RECORDS
        </div>
        <h3 className="mt-1 text-sm text-cyan-50">扩展六图：来源已核，图片依逐项审核</h3>
        <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">
          六条结构化记录和原图清单已保存。California 有一份本机候选原图；
          其余五条的原图请求被既有审核规则拦截，版权仍未签。
        </p>
      </div>
      <button type="button" onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded} aria-controls="mainline-a-r72-source-body"
        data-mainline-a-r72-toggle="true"
        className="min-h-10 shrink-0 rounded border border-cyan-100/30 px-3 text-xs text-cyan-100">
        {expanded ? "收起六图审查" : "展开六图审查"}
      </button>
    </header>
    <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
      <Metric count="6/6" label="结构化身份" />
      <Metric count="3/6" label="网页逐图身份" />
      <Metric count="1/6" label="原图已存" />
      <Metric count="5/6" label="请求未执行" warn />
      <Metric count="0/6" label="版权签署" warn />
    </div>
    {!checked.ok && <p role="alert"
      className="mt-3 rounded border border-red-200/25 p-2 text-xs text-red-100">
      R72 来源叠加数据无效，全部保持 hold：{checked.issues.join(" · ")}
    </p>}
    {expanded && <div id="mainline-a-r72-source-body"
      data-mainline-a-r72-source-body="open">
      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <input value={query} onChange={(event) => setQuery(event.target.value)}
          aria-label="搜索 R72 扩展星云" placeholder="名称、NASA ID 或署名"
          className="col-span-2 min-h-10 min-w-0 w-full rounded border border-white/15 bg-black/20 px-3 text-xs sm:min-w-48 sm:flex-1" />
        {FILTERS.map((item) => <button key={item} type="button"
          onClick={() => setFilter(item)} aria-pressed={filter === item}
          className={`min-h-10 rounded border px-2 text-[11px] ${filter === item
            ? "border-cyan-100/50 text-cyan-50"
            : "border-white/10 text-slate-400"}`}>
          {FILTER_LABELS[item]}</button>)}
      </div>
      <p role="status" className="mt-2 text-[10px] text-slate-500">
        显示 {visible.length}/6 · 当前 API 未逐图提供署名 {checked.creditLimited}/6 ·
        图片保持 candidate-only
      </p>
      <div className="mt-3 grid min-w-0 items-start gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 content-start self-start grid-cols-2 gap-1.5"
          data-mainline-a-r72-source-list="true">
          {visible.map((row) => <ReviewCard key={row.id} row={row}
            selected={selected?.id === row.id}
            onChoose={() => setSelectedId(row.id)} />)}
          {!visible.length && <p className="col-span-full p-3 text-xs text-slate-400">
            没有匹配的扩展星云记录。</p>}
        </div>
        {checked.ok && selected
          ? <SourceDetail key={selected.id} row={selected} /> : null}
      </div>
    </div>}
  </section>;
}
