"use client";

import { useMemo, useState } from "react";
import reviewData from "../data/mainlineANebulaCandidateReviewV655.generated.json";
import skyData from "../data/mainlineAWebSkyAtlasV656.generated.json";
import canonicalData from "../data/mainlineACanonicalCoverageV622.generated.json";
import { buildWebStageFreezeDataV657,
  type WebStageCandidateV657 } from "../lib/mainlineAWebStageFreezeV657";
import type { CandidateReviewPackV655 } from "../lib/mainlineANebulaReviewAssetV655";
import type { WebSkyAtlasPackV656 } from "../lib/mainlineAWebSkyV656";
import type { CoveragePackV622 } from "../lib/mainlineACanonicalCoverageV622";

type BatchFilter = "all" | "B1" | "B2" | "byte-variant";
const FILTERS: Readonly<Record<BatchFilter, string>> = {
  all: "全部 12",
  B1: "首组六图",
  B2: "次组六图",
  "byte-variant": "原字节不同",
};

function PhaseMark({ label, value, tone }: {
  label: string;
  value: string;
  tone: "cyan" | "amber" | "slate";
}) {
  const color = tone === "cyan" ? "text-cyan-50"
    : tone === "amber" ? "text-amber-100" : "text-slate-300";
  return <div className="rounded border border-white/10 bg-black/20 px-2 py-1.5">
    <strong className={`block font-mono text-base ${color}`}>{value}</strong>
    <span className="text-[10px] text-slate-500">{label}</span>
  </div>;
}

function CandidateSourceDetail({ row }: { row: WebStageCandidateV657 }) {
  return <aside className="min-w-0 rounded border border-white/10 bg-[#07151e] p-3"
    aria-label="阶段候选来源详情" data-mainline-a-stage-detail={row.id}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <div className="font-mono text-[9px] tracking-[.16em] text-cyan-100/55">
          {row.batchId} / {row.nasaId} / WEB CANDIDATE
        </div>
        <h4 className="mt-1 text-sm text-cyan-50">{row.title}</h4>
      </div>
      <span className="rounded border border-amber-100/30 px-2 py-1 text-[10px] text-amber-100">
        版权待签
      </span>
    </div>
    <p className="mt-2 text-[11px] leading-5 text-slate-400">
      已保存的来源页、页面直链 JPEG 和本地候选图可重算；当前只证明来源及像素对应，
      不代表逐图版权、科学有效性或运行时准入。
    </p>
    <dl className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
      <div><dt className="text-slate-500">官方页面</dt>
        <dd><a href={row.sourcePageUrl} target="_blank" rel="noreferrer"
          className="break-all text-cyan-100 underline">NASA Photojournal ↗</a></dd></div>
      <div><dt className="text-slate-500">署名</dt>
        <dd className="text-slate-300">{row.sourceCredit}</dd></div>
      <div><dt className="text-slate-500">原始尺寸</dt>
        <dd className="font-mono text-slate-300">
          {row.originalDimensions[0]}×{row.originalDimensions[1]}
        </dd></div>
      <div><dt className="text-slate-500">文件对应</dt>
        <dd className="text-amber-100">像素一致 · 原字节
          {row.rawByteIdentical ? "一致" : "不同"}</dd></div>
      <div className="sm:col-span-2"><dt className="text-slate-500">候选原图 SHA-256</dt>
        <dd className="break-all font-mono text-[9px] text-slate-400">
          {row.candidateRawSha256}</dd></div>
      <div className="sm:col-span-2"><dt className="text-slate-500">页面直链图 SHA-256</dt>
        <dd className="break-all font-mono text-[9px] text-slate-400">
          {row.officialRawSha256}</dd></div>
    </dl>
    <p className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-5 text-amber-100/70">
      candidate-only · hold · not-admitted · scientificPayloadWriteback=false
    </p>
  </aside>;
}

export default function MainlineAWebStageFreezePanelV657() {
  const stage = useMemo(() => buildWebStageFreezeDataV657(
    reviewData as CandidateReviewPackV655,
    skyData as WebSkyAtlasPackV656,
    canonicalData as CoveragePackV622,
  ), []);
  const [filter, setFilter] = useState<BatchFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(stage.rows[0]?.id ?? "");
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return stage.rows.filter((row) => {
      const batchMatches = filter === "all"
        || filter === row.batchId
        || filter === "byte-variant" && !row.rawByteIdentical;
      const nameMatches = !needle || [row.id, row.title, row.nasaId,
        row.sourceCredit].join(" ").toLocaleLowerCase().includes(needle);
      return batchMatches && nameMatches;
    });
  }, [filter, query, stage.rows]);
  const selected = visible.find((row) => row.id === selectedId)
    ?? visible[0] ?? null;
  return <section className="mb-4 min-w-0 rounded-lg border border-cyan-100/20 bg-cyan-100/[.03] p-3"
    aria-label="网页版阶段冻结候选清单"
    data-mainline-a-web-stage-freeze="v657"
    data-mainline-a-stage-data={stage.status}
    data-mainline-a-stage-technical="pending-runtime-evidence"
    data-mainline-a-stage-release="blocked"
    data-scientific-payload-writeback="false">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="font-mono text-[9px] tracking-[.18em] text-cyan-100/55">
          MAINLINE A / WEB STAGE CANDIDATE / V657
        </div>
        <h3 className="mt-1 text-sm text-cyan-50">当前十二图网页技术验收板</h3>
        <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">
          这里核对来源与候选路径。生产构建、HTTP、浏览器和长跑证据由独立收据确认；
          本面板的静态状态不会自行批准发布。
        </p>
      </div>
      <span className="rounded border border-amber-100/25 px-2 py-1 text-[10px] text-amber-100">
        发布 blocked
      </span>
    </header>
    <div className="mt-3 grid grid-cols-3 gap-1.5 text-center sm:grid-cols-6">
      <PhaseMark label="候选图" value={`${stage.counts.candidateImages}/12`} tone="cyan" />
      <PhaseMark label="来源页" value={`${stage.counts.sourcePages}/12`} tone="cyan" />
      <PhaseMark label="像素对应" value={`${stage.counts.decodedPixelMatches}/12`} tone="cyan" />
      <PhaseMark label="A 线清单" value={`${stage.counts.canonicalStars}/${stage.counts.canonicalNebulae}/${stage.counts.canonicalConstellations}`} tone="slate" />
      <PhaseMark label="恒星身份" value={`${stage.counts.componentIdentitySigned}/4`} tone="amber" />
      <PhaseMark label="图片签署" value={`${stage.counts.imageRightsSigned}/12`} tone="amber" />
    </div>
    {stage.status === "invalid" && <p role="alert"
      className="mt-3 rounded border border-red-200/25 p-2 text-xs text-red-100">
      候选数据校验失败，所有路径保持 hold：{stage.issues.join(" · ")}
    </p>}
    <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      <input value={query} onChange={(event) => setQuery(event.target.value)}
        aria-label="搜索阶段候选" placeholder="名称、NASA ID 或署名"
        className="col-span-2 min-h-10 min-w-0 w-full rounded border border-white/15 bg-black/20 px-3 text-xs sm:min-w-48 sm:flex-1" />
      {(["all", "B1", "B2", "byte-variant"] as const).map((item) =>
        <button key={item} type="button" onClick={() => setFilter(item)}
          aria-pressed={filter === item}
          className={`min-h-10 rounded border px-2 text-[11px] ${filter === item
            ? "border-cyan-100/50 text-cyan-50" : "border-white/10 text-slate-400"}`}>
          {FILTERS[item]}
        </button>)}
    </div>
    <p role="status" className="mt-2 text-[10px] text-slate-500">
      显示 {visible.length}/12 · 静态资料 {stage.status} · 技术长跑待当前构建验收
    </p>
    <div className="mt-3 grid min-w-0 gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid min-w-0 content-start self-start grid-cols-2 gap-1.5 sm:grid-cols-3"
        data-mainline-a-stage-list="true">
        {visible.map((row) => <button key={row.id} type="button"
          onClick={() => setSelectedId(row.id)}
          aria-pressed={selected?.id === row.id}
          data-mainline-a-stage-candidate={row.id}
          className={`min-w-0 rounded border p-2 text-left ${selected?.id === row.id
            ? "border-cyan-100/50 bg-cyan-100/10" : "border-white/10 bg-black/15"}`}>
          <span className="block truncate text-[11px] text-slate-100">{row.title}</span>
          <span className="mt-1 block font-mono text-[9px] text-slate-500">
            {row.batchId} · {row.nasaId}</span>
          <span className="mt-1 block text-[9px] text-amber-100/75">
            版权待签 · {row.rawByteIdentical ? "原字节同一" : "像素同一"}</span>
        </button>)}
        {!visible.length && <p className="col-span-full p-3 text-xs text-slate-400"
          role="status">没有匹配的候选图。</p>}
      </div>
      {selected && <CandidateSourceDetail row={selected} />}
    </div>
  </section>;
}
