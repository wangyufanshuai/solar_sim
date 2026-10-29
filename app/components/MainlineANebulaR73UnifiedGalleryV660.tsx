"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import catalogJson from "../data/mainlineANebulaR73CatalogV660.generated.json";
import { inspectR73CatalogV660, r73DisplayNameV660,
  visibleR73RowsV660, type R73CatalogV660,
  type R73GalleryFilterV660, type R73GalleryRowV660 } from
  "../lib/mainlineANebulaR73CatalogV660";
import { useMainlineANebulaR73ImageV660,
  type R73ImageErrorV660 } from "../lib/useMainlineANebulaR73ImageV660";

const catalog = catalogJson as R73CatalogV660;
const FILTERS: readonly R73GalleryFilterV660[] = [
  "all", "review-image", "policy-hold", "B1", "B2", "R71", "R72",
  "credit-limited",
];
const FILTER_NAMES: Record<R73GalleryFilterV660, string> = {
  all: "全部 24 条", "review-image": "已存原图链",
  "policy-hold": "缺图待审", B1: "首组六图", B2: "次组六图",
  R71: "基础补齐", R72: "扩展六图", "credit-limited": "署名证据有限",
};

function imageError(error: R73ImageErrorV660 | null) {
  if (error === "policy") return "逐项审核不允许请求此图。";
  if (error === "http") return "本机候选图接口未开放或图像不可用。";
  if (error === "origin" || error === "headers") {
    return "图片来源或候选边界校验失败。";
  }
  if (error === "bytes" || error === "sha") {
    return "图片字节与已保存证据不一致。";
  }
  if (error === "decode") return "图片无法按登记的尺寸解码。";
  return "本机加载失败，请检查审查服务。";
}

function StateMetric({ label, value, warn = false }: {
  label: string; value: string; warn?: boolean;
}) {
  return <div className="min-w-0 rounded border border-white/10 bg-black/15 px-2 py-1.5 text-center">
    <strong className={`block font-mono text-sm ${warn
      ? "text-amber-100" : "text-cyan-50"}`}>{value}</strong>
    <span className="block text-[9px] text-slate-500">{label}</span>
  </div>;
}

function ReviewCard({ row, selected, choose, next, previous }: {
  row: R73GalleryRowV660;
  selected: boolean;
  choose: () => void;
  next: () => void;
  previous: () => void;
}) {
  const reviewable = row.imageState === "review-image";
  return <button type="button" onClick={choose}
    onKeyDown={(event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault(); next();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault(); previous();
      }
    }}
    aria-pressed={selected}
    aria-label={`查看${r73DisplayNameV660(row)}来源与${reviewable
      ? "候选图" : "缺图原因"}`}
    data-mainline-a-r73-card={row.id}
    data-mainline-a-r73-card-state={row.imageState}
    className={`min-w-0 rounded border px-2.5 py-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-100 ${selected
      ? "border-cyan-100/55 bg-cyan-100/[.065]"
      : "border-white/10 bg-[#07151d] hover:border-cyan-100/25"}`}>
    <span className="flex items-center justify-between gap-1.5">
      <span className="truncate font-mono text-[9px] text-cyan-100/50">
        {String(row.rank).padStart(2, "0")} · {row.cohort}</span>
      <span className={`shrink-0 rounded px-1 py-0.5 text-[8px] ${reviewable
        ? "bg-cyan-100/10 text-cyan-100/80"
        : "bg-amber-100/10 text-amber-100/90"}`}>
        {reviewable ? "本机可预览" : "原图未请求"}</span>
    </span>
    <span className="mt-1 block truncate text-xs text-slate-100">
      {r73DisplayNameV660(row)}</span>
    <span className="mt-0.5 block truncate font-mono text-[9px] text-slate-500">
      {row.nasaId}</span>
    <span className="mt-1 block truncate text-[9px] text-slate-500">
      {row.sourcePageIdentity === "generic-shell"
        ? "网页仅通用壳 · API 身份可核"
        : "逐图页面可核"}</span>
  </button>;
}

function DetailEvidence({ row }: { row: R73GalleryRowV660 }) {
  return <dl className="mt-3 grid min-w-0 gap-2 text-[10px] leading-5 sm:grid-cols-2">
    <div><dt className="text-slate-500">对象</dt><dd className="text-slate-300">
      {row.nasaId} · {row.cohort}</dd></div>
    <div><dt className="text-slate-500">逐图页面身份</dt>
      <dd className="text-slate-300">{row.sourcePageIdentity === "item-page"
        ? "已核对" : "通用页面壳，不能作逐图身份凭证"}</dd></div>
    <div className="sm:col-span-2"><dt className="text-slate-500">历史来源署名</dt>
      <dd className="text-slate-300">{row.credit}</dd></div>
    <div className="sm:col-span-2"><dt className="text-slate-500">本轮署名依据</dt>
      <dd className="text-slate-300">{row.creditEvidence === "structured-current"
        ? "当前结构化来源可核" : row.creditEvidence === "page-capture"
          ? "既有逐图页面捕获" : "仅历史记录；当前结构化来源未给逐项署名"}</dd>
    </div>
    <div><dt className="text-slate-500">本机展示形式</dt>
      <dd className="text-slate-300">{row.delivery?.variant === "derived-preview"
        ? "由候选原图缩放的审查图" : row.delivery
          ? "保存的原始 JPEG" : "无图片请求"}</dd></div>
    <div><dt className="text-slate-500">原始图片比较</dt>
      <dd className="text-slate-300">{row.decodedPixelMatch === true
        ? `解码像素一致 · 原字节${row.rawByteRelation === "identical"
          ? "相同" : "不同"}` : "未执行原图比较"}</dd></div>
    <div className="sm:col-span-2"><dt className="text-slate-500">
      来源页面</dt><dd><a href={row.sourcePageUrl} target="_blank"
        rel="noreferrer" className="break-all text-cyan-100/80 underline">
        {row.sourcePageUrl}</a></dd></div>
    <div className="sm:col-span-2"><dt className="text-slate-500">
      来源页面 SHA-256</dt><dd className="break-all font-mono text-[9px] text-slate-400">
      {row.sourcePageSha256}</dd></div>
    <div className="sm:col-span-2"><dt className="text-slate-500">
      候选原图 SHA-256</dt><dd className="break-all font-mono text-[9px] text-slate-400">
      {row.sourceRawSha256 ?? "无原图；请求未执行"}</dd></div>
  </dl>;
}

function ReviewDetail({ row }: { row: R73GalleryRowV660 }) {
  const image = useMainlineANebulaR73ImageV660(row);
  const held = row.imageState === "policy-hold";
  return <aside className="min-w-0 rounded border border-white/10 bg-[#07131d] p-3"
    aria-label="R73 星云候选详情"
    data-mainline-a-r73-detail={row.id}
    data-mainline-a-r73-image-state={image.status}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="font-mono text-[9px] tracking-[.15em] text-cyan-100/50">
          BETA NEBULAE / {row.cohort} / {row.nasaId}</div>
        <h4 className="mt-1 text-base text-cyan-50">
          {r73DisplayNameV660(row)}</h4>
        <p className="mt-1 text-[11px] text-slate-400">{row.title}</p>
      </div>
      <span className="rounded border border-amber-100/25 px-2 py-1 text-[10px] text-amber-100">
        版权 pending</span>
    </div>
    <div className="mt-3 flex min-h-48 items-center justify-center overflow-hidden rounded border border-white/10 bg-black/30 sm:min-h-60">
      {image.status === "loaded" && image.objectUrl ? <Image
        unoptimized src={image.objectUrl}
        alt={`${r73DisplayNameV660(row)}本机候选审查图，版权待审`}
        width={image.width ?? undefined} height={image.height ?? undefined}
        className="max-h-[55vh] w-full object-contain"
        data-mainline-a-r73-loaded-image={row.id} />
        : <div className="max-w-sm p-5 text-center text-xs leading-5 text-slate-400"
          role="status">
          <p>{held
            ? "该对象的原图请求未获现有逐项审核允许；这里只展示来源与阻塞信息。"
            : image.status === "failed" ? imageError(image.error)
              : "正在重算本机图片的字节、SHA-256 与尺寸…"}</p>
          {image.status === "failed" && !held && <button type="button"
            onClick={image.retry}
            className="mt-3 min-h-10 rounded border border-cyan-100/30 px-3 text-cyan-100">
            重试本机候选图</button>}
        </div>}
    </div>
    <p className="mt-2 text-[11px] leading-5 text-slate-400">
      {held ? "原图请求未执行，responseCaptured=0；当前记录不代表图片取得或使用许可。"
        : `本机受控审查 ${row.delivery?.width}×${row.delivery?.height}；加载时重新核对 ${row.delivery?.bytes} 字节及已存 SHA-256。`}
    </p>
    <DetailEvidence row={row} />
    <div className="mt-3 rounded border border-amber-100/15 bg-amber-100/[.025] p-2">
      <strong className="text-[10px] text-amber-100">仍未关闭</strong>
      <div className="mt-1 flex flex-wrap gap-1">
        {row.blockers.map((blocker) => <span key={blocker}
          className="rounded border border-amber-100/15 px-1.5 py-0.5 font-mono text-[9px] text-amber-100/70">
          {blocker}</span>)}
      </div>
    </div>
    <p className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-5 text-amber-100/70">
      candidate-only · hold · not-admitted · scientificPayloadWriteback=false。
      这份本机审查资料不构成版权、科学或公开发布批准。
    </p>
  </aside>;
}

export default function MainlineANebulaR73UnifiedGalleryV660({
  onSelectionChange,
}: { onSelectionChange?: (row: R73GalleryRowV660 | null) => void }) {
  const checked = useMemo(() => inspectR73CatalogV660(catalog), []);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<R73GalleryFilterV660>("all");
  const [selectedId, setSelectedId] = useState(catalog.rows[0]?.id ?? "");
  const visible = useMemo(() => visibleR73RowsV660(catalog.rows,
    filter, query), [filter, query]);
  const selected = visible.find((row) => row.id === selectedId)
    ?? visible[0] ?? null;
  useEffect(() => {
    onSelectionChange?.(expanded && checked.ok ? selected : null);
  }, [expanded, checked.ok, selected, onSelectionChange]);

  return <section className="mb-4 min-w-0 rounded-lg border border-cyan-100/25 bg-cyan-100/[.025] p-3"
    aria-label="R73 Beta 星云二十四项统一候选审查"
    data-mainline-a-r73-gallery="v660"
    data-mainline-a-r73-status={checked.ok ? "verified" : "invalid"}
    data-scientific-payload-writeback="false">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="font-mono text-[9px] tracking-[.18em] text-cyan-100/55">
          MAINLINE A / R73 / SOURCE-LINKED REVIEW</div>
        <h3 className="mt-1 text-sm text-cyan-50">24 项星云候选总览</h3>
        <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">
          19 项有可比原图链可在本机审查；5 项只保留可核对的来源与未请求原图状态。
          全部仍待逐图版权与视觉审核。</p>
      </div>
      <button type="button" onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded} aria-controls="mainline-a-r73-gallery-body"
        data-mainline-a-r73-toggle="true"
        className="min-h-10 shrink-0 rounded border border-cyan-100/30 px-3 text-xs text-cyan-100">
        {expanded ? "收起 24 项总览" : "展开 24 项总览"}</button>
    </header>
    <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
      <StateMetric label="候选对象" value="24/24" />
      <StateMetric label="可审查原图链" value="19/24" />
      <StateMetric label="原图未请求" value="5/24" warn />
      <StateMetric label="逐图版权签署" value="0/24" warn />
    </div>
    {!checked.ok && <p role="alert"
      className="mt-3 rounded border border-red-200/25 p-2 text-xs text-red-100">
      总览数据校验失败，全部保持 hold：{checked.issues.join(" · ")}</p>}
    {expanded && checked.ok && <div id="mainline-a-r73-gallery-body"
      data-mainline-a-r73-gallery-body="open">
      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <input aria-label="搜索 24 项星云候选" value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="名称、NASA ID 或来源署名"
          className="col-span-2 min-h-10 min-w-0 w-full rounded border border-white/15 bg-black/20 px-3 text-xs sm:min-w-52 sm:flex-1" />
        {FILTERS.map((item) => <button type="button" key={item}
          onClick={() => setFilter(item)} aria-pressed={filter === item}
          className={`min-h-9 rounded border px-2 text-[10px] ${filter === item
            ? "border-cyan-100/50 bg-cyan-100/10 text-cyan-50"
            : "border-white/10 text-slate-500"}`}>
          {FILTER_NAMES[item]}</button>)}
      </div>
      <p className="mt-2 text-[10px] text-slate-500" role="status"
        data-mainline-a-r73-visible-count={visible.length}>
        显示 {visible.length}/24 · 原图链 19 · 请求未执行 5 · 版权 pending</p>
      <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
        {visible.map((row, index) => <ReviewCard key={row.id} row={row}
          selected={row.id === selected?.id}
          choose={() => setSelectedId(row.id)}
          next={() => setSelectedId(visible[(index + 1) % visible.length].id)}
          previous={() => setSelectedId(visible[(index + visible.length - 1)
            % visible.length].id)} />)}
      </div>
      {selected ? <div className="mt-3"><ReviewDetail key={selected.id}
        row={selected} /></div>
        : <p className="mt-3 rounded border border-white/10 p-4 text-xs text-slate-400"
          role="status">没有匹配的候选项。</p>}
    </div>}
  </section>;
}
