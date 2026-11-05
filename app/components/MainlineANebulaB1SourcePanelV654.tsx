"use client";

import { useMemo, useState } from "react";
import {
  filterB1SourceRowsV654, inspectB1SourceOverlayV654,
  selectB1SourceRowV654, type B1SourceOverlayV654,
  type B1SourceRowV654,
} from "../lib/mainlineANebulaB1SourceV654";

type ImageBatch = Parameters<typeof inspectB1SourceOverlayV654>[1];

function SourceItem({ row, selected, choose }: {
  row: B1SourceRowV654; selected: boolean; choose: () => void;
}) {
  return (
    <button type="button" onClick={choose} aria-pressed={selected}
      data-mainline-a-b1-source-row={row.id}
      data-mainline-a-b1-source-rights={row.rightsStatus}
      className={`min-w-0 rounded border p-2.5 text-left ${selected
        ? "border-cyan-100/55 bg-cyan-100/[.08]"
        : "border-white/10 bg-black/20 hover:border-white/30"}`}>
      <span className="flex min-w-0 items-center justify-between gap-2">
        <span className="truncate text-xs text-slate-100">{row.title}</span>
        <span className="shrink-0 rounded border border-amber-100/25 px-1.5 py-0.5 text-[10px] text-amber-100">版权待审</span>
      </span>
      <span className="mt-1 block font-mono text-[10px] text-cyan-100/55">{row.nasaId} · {row.width}×{row.height}</span>
      <span className="mt-1 block text-[10px] text-slate-400">官方页面 / JPEG 已采集 · 像素对应 · 原字节{row.rawByteIdentical ? "相同" : "不同"}</span>
    </button>
  );
}

function Detail({ row }: { row: B1SourceRowV654 }) {
  return (
    <aside className="min-w-0 rounded border border-white/10 bg-[#081720] p-3"
      aria-label="B1 官方来源与像素对应详情"
      data-mainline-a-b1-source-detail={row.id}>
      <div className="font-mono text-[10px] tracking-[.14em] text-cyan-100/50">OFFICIAL SOURCE / CANDIDATE</div>
      <h4 className="mt-1 text-sm text-cyan-50">{row.title} <span className="font-mono text-[10px] text-slate-500">{row.nasaId}</span></h4>
      <p className="mt-2 text-[11px] leading-5 text-slate-400">官方页面与图片各有独立的原始捕获和 SHA-256。本站候选图片与页面下载图片的解码像素相同；原始字节{row.rawByteIdentical ? "也相同" : "不同，属于两份版本"}。</p>
      <dl className="mt-3 grid gap-2 text-[11px] leading-5 sm:grid-cols-2">
        <div className="min-w-0"><dt className="text-slate-500">NASA 官方页</dt><dd className="break-all"><a href={row.officialPageUrl} target="_blank" rel="noreferrer" className="text-cyan-100/75 underline">{row.officialPageUrl}</a></dd></div>
        <div className="min-w-0"><dt className="text-slate-500">页面直链 JPEG</dt><dd className="break-all"><a href={row.officialJpegUrl} target="_blank" rel="noreferrer" className="text-cyan-100/75 underline">{row.officialJpegUrl}</a></dd></div>
        <div><dt className="text-slate-500">官方署名</dt><dd className="text-slate-300">{row.officialCredit}</dd></div>
        <div><dt className="text-slate-500">尺寸 / 解码像素</dt><dd className="text-emerald-100">{row.width}×{row.height} · 6 图批次逐图重算一致</dd></div>
        <div className="min-w-0"><dt className="text-slate-500">页面 SHA-256</dt><dd className="break-all font-mono text-[10px] text-slate-400">{row.pageRawSha256}</dd></div>
        <div className="min-w-0"><dt className="text-slate-500">页面 JPEG SHA-256</dt><dd className="break-all font-mono text-[10px] text-slate-400">{row.officialRawSha256}</dd></div>
        <div className="min-w-0"><dt className="text-slate-500">候选原图 SHA-256</dt><dd className="break-all font-mono text-[10px] text-slate-400">{row.candidateRawSha256}</dd></div>
        <div><dt className="text-slate-500">版权 / 准入</dt><dd className="text-amber-100">pending · candidate-only · hold · not-admitted</dd></div>
      </dl>
      <p className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-4 text-slate-500">来源和像素对应只属于本地候选证据；不代表逐图版权许可、科学有效性、真实用户验收或公开发布批准。scientificPayloadWriteback=false</p>
    </aside>
  );
}

export default function MainlineANebulaB1SourcePanelV654({ overlay,
  imageBatch }: { overlay: B1SourceOverlayV654; imageBatch: ImageBatch }) {
  const [selectedId, setSelectedId] = useState(overlay.rows[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const audit = useMemo(() => inspectB1SourceOverlayV654(overlay,
    imageBatch), [overlay, imageBatch]);
  const visible = useMemo(() => filterB1SourceRowsV654(audit.rows,
    query), [audit.rows, query]);
  const selected = selectB1SourceRowV654(visible, selectedId);
  return (
    <section className="mb-4 min-w-0 rounded-lg border border-cyan-100/20 bg-cyan-100/[.035] p-3"
      aria-label="B1 六图官方来源技术核验"
      data-mainline-a-b1-source="v654"
      data-mainline-a-b1-source-status={audit.status}
      data-scientific-payload-writeback="false">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><div className="font-mono text-[10px] tracking-[.17em] text-cyan-100/55">B1 OFFICIAL SOURCE / R67</div>
          <h3 className="mt-1 text-sm text-cyan-50">首组六图官方来源与版本对应</h3>
          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">本地离线重算的技术证据；官方页、页面 JPEG 和现有候选图分开保存。版权签署仍待人工逐图审核。</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-center text-[10px] sm:grid-cols-4">
          <div className="rounded border border-white/10 bg-black/20 px-2 py-1"><strong className="block text-sm text-emerald-100">{audit.counts.officialPagesVerified}/6</strong><span className="text-slate-500">官方页面</span></div>
          <div className="rounded border border-white/10 bg-black/20 px-2 py-1"><strong className="block text-sm text-emerald-100">{audit.counts.decodedPixelIdentical}/6</strong><span className="text-slate-500">解码像素</span></div>
          <div className="rounded border border-white/10 bg-black/20 px-2 py-1"><strong className="block text-sm text-cyan-50">{audit.counts.rawByteIdentical}/6</strong><span className="text-slate-500">原字节同一</span></div>
          <div className="rounded border border-white/10 bg-black/20 px-2 py-1"><strong className="block text-sm text-amber-100">{audit.counts.rightsSigned}/6</strong><span className="text-slate-500">版权签署</span></div>
        </div>
      </header>
      {audit.status === "invalid" ? (
        <p role="alert" className="mt-3 rounded border border-red-200/25 p-3 text-xs text-red-100">来源 overlay 校验失败，保持 hold：{audit.issues.join(" · ")}</p>
      ) : (
        <>
          <input aria-label="搜索 B1 官方来源" value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="星云、NASA ID 或署名"
            className="mt-3 min-h-10 w-full rounded border border-white/15 bg-black/20 px-3 text-xs sm:max-w-sm" />
          <div className="mt-2 text-[11px] text-slate-500" role="status">显示 {visible.length}/6 · 6/6 技术对应 · 版权 0/6 pending · scientificPayloadWriteback=false</div>
          <div className="mt-3 grid min-w-0 gap-3">
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
              {visible.map((row) => <SourceItem key={row.id} row={row}
                selected={row.id === selected?.id}
                choose={() => setSelectedId(row.id)} />)}
            </div>
            {selected ? <Detail row={selected} /> : <p role="status" className="p-3 text-xs text-slate-400">没有匹配的来源记录。</p>}
          </div>
        </>
      )}
    </section>
  );
}
