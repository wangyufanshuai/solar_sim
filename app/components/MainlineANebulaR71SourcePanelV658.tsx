"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import overlayJson from "../data/mainlineANebulaR71SourceV658.generated.json";
import { inspectR71SourceOverlayV658, visibleR71SourceRowsV658,
  type R71SourceFilterV658, type R71SourceOverlayV658,
  type R71SourceRowV658 } from "../lib/mainlineAR71SourceV658";
import { useMainlineAR71SourceImageV658,
  type R71ImageFailureV658 } from
  "../lib/useMainlineAR71SourceImageV658";

const overlay = overlayJson as R71SourceOverlayV658;
const FILTERS: readonly R71SourceFilterV658[] = [
  "all", "raw-match", "raw-variant",
];
const FILTER_LABELS: Record<R71SourceFilterV658, string> = {
  all: "全部六图",
  "raw-match": "原字节相同",
  "raw-variant": "原字节不同",
};

function failureLabel(error: R71ImageFailureV658 | null) {
  if (error === "http") return "本机审查图片未开放或文件不可用";
  if (error === "origin") return "图片请求离开本机审查域";
  if (error === "headers") return "来源或候选边界响应头不符";
  if (error === "bytes") return "原图字节数不符";
  if (error === "sha") return "原图 SHA-256 不符";
  if (error === "decode") return "图片解码或原始尺寸不符";
  return "图片网络请求失败";
}

function EvidenceNumber({ value, label, tone = "cyan" }: {
  value: string;
  label: string;
  tone?: "cyan" | "amber";
}) {
  return <div className="rounded border border-white/10 bg-black/20 p-2 text-center">
    <strong className={`block font-mono text-base ${tone === "cyan"
      ? "text-cyan-50" : "text-amber-100"}`}>{value}</strong>
    <span className="text-[10px] text-slate-500">{label}</span>
  </div>;
}

function SourceRowButton({ row, selected, choose }: {
  row: R71SourceRowV658;
  selected: boolean;
  choose: () => void;
}) {
  return <button type="button" onClick={choose} aria-pressed={selected}
    data-mainline-a-r71-source-candidate={row.id}
    className={`min-w-0 rounded border p-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-100 ${
      selected ? "border-cyan-100/55 bg-cyan-100/10"
        : "border-white/10 bg-[#081720] hover:border-cyan-100/30"}`}>
    <span className="block truncate text-xs text-slate-100">{row.catalog}</span>
    <span className="mt-1 block truncate text-[10px] text-slate-400">{row.title}</span>
    <span className="mt-1 block font-mono text-[9px] text-slate-500">
      {row.nasaId} · {row.originalWidth}×{row.originalHeight}</span>
    <span className="mt-1 block text-[10px] text-cyan-100/70">
      官方直链已保存 · {row.rawByteIdentical ? "原字节一致" : "像素一致"}
    </span>
    <span className="mt-1 block text-[9px] text-amber-100/70">
      版权 pending · 未准入
    </span>
  </button>;
}

function SourceDetail({ row }: { row: R71SourceRowV658 }) {
  const image = useMainlineAR71SourceImageV658(row);
  return <aside className="min-w-0 rounded border border-white/10 bg-[#07151e] p-3"
    aria-label="R71 官方来源候选图详情"
    data-mainline-a-r71-source-detail={row.id}
    data-mainline-a-r71-image-state={image.status}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <div className="font-mono text-[9px] tracking-[.16em] text-cyan-100/55">
          NASA PHOTOJOURNAL / {row.nasaId}
        </div>
        <h4 className="mt-1 text-sm text-cyan-50">{row.title}</h4>
        <p className="text-[11px] text-slate-400">{row.catalog}</p>
      </div>
      <span className="rounded border border-amber-100/30 px-2 py-1 text-[10px] text-amber-100">
        版权待签
      </span>
    </div>
    <div className="mt-3 flex min-h-44 items-center justify-center overflow-hidden rounded border border-white/10 bg-black/30 sm:min-h-60">
      {image.status === "loaded" && image.objectUrl ? (
        <Image unoptimized src={image.objectUrl}
          alt={`${row.catalog} NASA 官方页面直链候选图；版权待审`}
          width={image.width ?? undefined}
          height={image.height ?? undefined}
          className="max-h-[58vh] w-full object-contain"
          data-mainline-a-r71-loaded-image={row.id} />
      ) : <div className="p-5 text-center text-xs text-slate-400" role="status">
        <p>{image.status === "failed" ? failureLabel(image.error)
          : "正在校验本地原图字节、SHA-256 和尺寸…"}</p>
        {image.status === "failed" && <button type="button" onClick={image.retry}
          className="mt-3 min-h-10 rounded border border-cyan-100/30 px-3 text-cyan-100">
          重试候选图
        </button>}
      </div>}
    </div>
    <p className="mt-2 text-[11px] leading-5 text-slate-400">
      官方页面和页面直链 JPEG 由本轮 HTTPS 采集并保存；与历史本地候选图解码像素一致。
      原始字节{row.rawByteIdentical ? "一致" : "不同"}，两份原图分别留档。
    </p>
    <dl className="mt-3 grid min-w-0 gap-2 text-[10px] leading-5 sm:grid-cols-2">
      <div><dt className="text-slate-500">原始尺寸</dt>
        <dd className="font-mono text-slate-300">
          {row.originalWidth}×{row.originalHeight}</dd></div>
      <div><dt className="text-slate-500">请求尝试</dt>
        <dd className="font-mono text-slate-300">
          页面 {row.pageAttemptCount} · 图片 {row.imageAttemptCount}</dd></div>
      <div><dt className="text-slate-500">署名</dt>
        <dd className="text-slate-300">{row.expectedCredit}</dd></div>
      <div><dt className="text-slate-500">来源</dt>
        <dd><a href={row.officialPageUrl} target="_blank" rel="noreferrer"
          className="break-all text-cyan-100 underline">
          NASA Photojournal ↗</a></dd></div>
      <div className="sm:col-span-2"><dt className="text-slate-500">本轮页面 SHA-256</dt>
        <dd className="break-all font-mono text-[9px] text-slate-400">
          {row.pageRaw?.sha256 ?? "未捕获"}</dd></div>
      <div className="sm:col-span-2"><dt className="text-slate-500">本轮图片 SHA-256</dt>
        <dd className="break-all font-mono text-[9px] text-slate-400">
          {row.imageRaw?.sha256 ?? "未捕获"}</dd></div>
      <div className="sm:col-span-2"><dt className="text-slate-500">历史候选 SHA-256</dt>
        <dd className="break-all font-mono text-[9px] text-slate-400">
          {row.historicalLocalRaw?.sha256 ?? "无历史文件"}</dd></div>
    </dl>
    <p className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-5 text-amber-100/70">
      candidate-only · hold · not-admitted · scientificPayloadWriteback=false。
      来源对应不等于版权批准、科学有效性或运行时接入。
    </p>
  </aside>;
}

export default function MainlineANebulaR71SourcePanelV658({
  onSelectCandidate,
}: { onSelectCandidate?: (id: string) => void }) {
  const checked = useMemo(() => inspectR71SourceOverlayV658(overlay), []);
  const [filter, setFilter] = useState<R71SourceFilterV658>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(overlay.rows[0]?.id ?? "");
  const visible = useMemo(() => visibleR71SourceRowsV658(
    overlay.rows, filter, query), [filter, query]);
  const selected = visible.find((row) => row.id === selectedId)
    ?? visible[0] ?? null;
  useEffect(() => {
    if (checked.ok && selected) onSelectCandidate?.(selected.id);
  }, [checked.ok, onSelectCandidate, selected]);
  return <section className="mb-4 min-w-0 rounded-lg border border-cyan-100/20 bg-cyan-100/[.03] p-3"
    aria-label="R71 六张星云官方来源审查"
    data-mainline-a-r71-source-panel="v658"
    data-mainline-a-r71-source-status={checked.ok ? "verified" : "blocked"}
    data-mainline-a-r71-rights="pending"
    data-scientific-payload-writeback="false">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="font-mono text-[9px] tracking-[.18em] text-cyan-100/55">
          MAINLINE A / R71 / SIX OFFICIAL SOURCE LINKS
        </div>
        <h3 className="mt-1 text-sm text-cyan-50">六张基础星云来源补链</h3>
        <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">
          本轮重新抓取六个 NASA 官方页面与页面直链原图，保留原始字节、请求记录和离线像素对应。
          审查图只在本机受控接口打开。
        </p>
      </div>
      <span className="rounded border border-amber-100/25 px-2 py-1 text-[10px] text-amber-100">
        发布 blocked
      </span>
    </header>
    <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
      <EvidenceNumber value={`${overlay.counts.officialPages}/6`} label="官方页" />
      <EvidenceNumber value={`${overlay.counts.officialImages}/6`} label="直链原图" />
      <EvidenceNumber value={`${overlay.counts.pixelMatches}/6`} label="像素对应" />
      <EvidenceNumber value="0/6" label="版权签署" tone="amber" />
    </div>
    {!checked.ok && <p role="alert"
      className="mt-3 rounded border border-red-200/25 p-2 text-xs text-red-100">
      来源叠加数据校验失败，所有图保持 hold：{checked.issues.join(" · ")}
    </p>}
    <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      <input value={query} onChange={(event) => setQuery(event.target.value)}
        aria-label="搜索 R71 星云来源" placeholder="名称、NASA ID 或署名"
        className="col-span-2 min-h-10 min-w-0 w-full rounded border border-white/15 bg-black/20 px-3 text-xs sm:min-w-48 sm:flex-1" />
      {FILTERS.map((item) => <button key={item} type="button"
        onClick={() => setFilter(item)} aria-pressed={filter === item}
        className={`min-h-10 rounded border px-2 text-[11px] ${filter === item
          ? "border-cyan-100/50 text-cyan-50"
          : "border-white/10 text-slate-400"}`}>
        {FILTER_LABELS[item]}</button>)}
    </div>
    <p role="status" className="mt-2 text-[10px] text-slate-500">
      显示 {visible.length}/6 · 原字节一致 {overlay.counts.rawByteMatches}/6 ·
      本机静态资料 {checked.ok ? "有效" : "无效"}
    </p>
    <div className="mt-3 grid min-w-0 items-start gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid min-w-0 content-start self-start grid-cols-2 gap-1.5"
        data-mainline-a-r71-source-list="true">
        {visible.map((row) => <SourceRowButton key={row.id} row={row}
          selected={selected?.id === row.id}
          choose={() => setSelectedId(row.id)} />)}
        {!visible.length && <p className="col-span-full p-3 text-xs text-slate-400">
          没有匹配的六图来源记录。</p>}
      </div>
      {checked.ok && selected ? <SourceDetail key={selected.id} row={selected} /> : null}
    </div>
  </section>;
}
