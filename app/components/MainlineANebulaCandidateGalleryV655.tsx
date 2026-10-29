"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  inspectCandidateReviewPackV655,
  type CandidateReviewPackV655,
  type CandidateReviewRowV655,
} from "../lib/mainlineANebulaReviewAssetV655";
import { useMainlineANebulaReviewImageV655,
  type ReviewImageStateV655,
} from "../lib/useMainlineANebulaReviewImageV655";

const NAMES: Readonly<Record<string, string>> = {
  "heart-nebula": "心脏星云",
  "soul-nebula": "灵魂星云",
  "witch-head-nebula": "女巫头星云",
  "flame-nebula": "火焰星云",
  "pacman-nebula": "吃豆人星云",
  "running-chicken-nebula": "奔鸡星云",
  "jellyfish-nebula": "水母星云",
  "cocoon-nebula": "茧星云",
  "rho-ophiuchi-cloud": "蛇夫座 ρ 星云",
  "cepheus-c-nebula": "仙王座 C 星云",
  "dragon-lair-nebula": "龙穴星云",
  "monkey-head-nebula": "猴头星云",
};

type Filter = "all" | "B1" | "B2" | "raw-variant";

export function candidateReviewNameV655(row: CandidateReviewRowV655): string {
  return NAMES[row.id] ?? row.title;
}

export function candidateReviewVisibleV655(
  rows: readonly CandidateReviewRowV655[], filter: Filter, query: string,
) {
  const needle = query.trim().toLocaleLowerCase();
  return rows.filter((row) => {
    if (filter === "raw-variant" && row.rawByteIdentical) return false;
    if (filter !== "all" && filter !== "raw-variant"
      && row.batchId !== filter) return false;
    return !needle || [row.id, row.nasaId,
      candidateReviewNameV655(row), row.sourceCredit].some((value) =>
      value.toLocaleLowerCase().includes(needle));
  });
}

function errorLabel(error: ReviewImageStateV655["error"]) {
  if (error === "http") return "本机预览未开放或文件不可用";
  if (error === "boundary") return "来源边界校验未通过";
  if (error === "bytes" || error === "sha") return "图片字节校验未通过";
  if (error === "decode") return "图片无法解码";
  return "图片载入失败";
}

function CandidateCard({ row, selected, choose }: {
  row: CandidateReviewRowV655;
  selected: boolean;
  choose: () => void;
}) {
  const image = useMainlineANebulaReviewImageV655(row, "thumb");
  const name = candidateReviewNameV655(row);
  return (
    <article className={`min-w-0 overflow-hidden rounded-lg border bg-[#081620] ${
      selected ? "border-cyan-100/60" : "border-white/10"}`}
      data-mainline-a-nebula-review-card={row.id}
      data-mainline-a-nebula-review-image-state={image.status}
      data-mainline-a-nebula-review-rights={row.rightsStatus}>
      <button type="button" onClick={choose} aria-pressed={selected}
        aria-label={`查看${name}候选图详情`}
        className="block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-100">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#06111c]">
          {image.status === "loaded" && image.objectUrl ? (
            <Image unoptimized src={image.objectUrl} alt={`${name} NASA 来源候选预览，版权待审`}
              width={image.width ?? undefined}
              height={image.height ?? undefined}
              className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center px-3 text-center text-[11px] text-slate-500"
              role="status">
              {image.status === "failed" ? errorLabel(image.error)
                : "正在载入已校验的候选预览…"}
            </div>
          )}
          <span className="absolute left-2 top-2 rounded bg-[#07131b]/85 px-1.5 py-0.5 font-mono text-[10px] text-cyan-50">{row.batchId} · {row.nasaId}</span>
          <span className="absolute right-2 top-2 rounded bg-[#422e15]/90 px-1.5 py-0.5 text-[10px] text-amber-100">版权待审</span>
        </div>
        <div className="p-2.5">
          <div className="truncate text-xs text-slate-100">{name}</div>
          <div className="mt-1 truncate text-[10px] text-slate-500">{row.sourceCredit}</div>
          <div className="mt-1 text-[10px] text-cyan-100/65">页面已核验 · 像素一致 · 原字节{row.rawByteIdentical ? "相同" : "不同"}</div>
        </div>
      </button>
      {image.status === "failed" && (
        <button type="button" onClick={image.retry}
          className="mx-2.5 mb-2.5 min-h-9 rounded border border-amber-100/25 px-2 text-[11px] text-amber-100"
          aria-label={`重试${name}缩略图`}>重试缩略图</button>
      )}
    </article>
  );
}

function CandidateDetail({ row }: { row: CandidateReviewRowV655 }) {
  const image = useMainlineANebulaReviewImageV655(row, "detail");
  const name = candidateReviewNameV655(row);
  return (
    <aside className="min-w-0 rounded-lg border border-white/10 bg-[#07131d] p-3"
      aria-label="星云候选图详情"
      data-mainline-a-nebula-review-detail={row.id}
      data-mainline-a-nebula-review-detail-state={image.status}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><div className="font-mono text-[10px] tracking-[.14em] text-cyan-100/50">{row.batchId} SOURCE-LINKED REVIEW</div>
          <h4 className="mt-1 text-base text-cyan-50">{name} <span className="font-mono text-[10px] text-slate-500">{row.nasaId}</span></h4>
        </div>
        <span className="rounded border border-amber-100/25 px-2 py-1 text-[11px] text-amber-100">候选 · 版权待审</span>
      </div>
      <div className="mt-3 flex min-h-48 items-center justify-center overflow-hidden rounded border border-white/10 bg-black/30 sm:min-h-64">
        {image.status === "loaded" && image.objectUrl ? (
          <Image unoptimized src={image.objectUrl} alt={`${name} NASA 来源候选大图，版权待审`}
            width={image.width ?? undefined}
            height={image.height ?? undefined}
            className="max-h-[58vh] w-full object-contain" />
        ) : (
          <div className="p-5 text-center text-xs text-slate-400" role="status">
            <p>{image.status === "failed" ? errorLabel(image.error)
              : "正在载入已校验的候选详情图…"}</p>
            {image.status === "failed" && (
              <button type="button" onClick={image.retry}
                className="mt-3 min-h-10 rounded border border-cyan-100/30 px-3 text-cyan-100">
                重试加载
              </button>
            )}
          </div>
        )}
      </div>
      <p className="mt-2 text-[11px] leading-5 text-slate-400">本地审查图由已保存的原始候选图缩放生成，不作为新的科学观测图。原图 {row.originalWidth}×{row.originalHeight}；页面直链图与候选原图解码像素一致，原始文件字节{row.rawByteIdentical ? "相同" : "不同"}。</p>
      <dl className="mt-3 grid gap-2 text-[11px] leading-5 sm:grid-cols-2">
        <div><dt className="text-slate-500">官方来源</dt><dd className="break-all"><a href={row.sourcePageUrl}
          target="_blank" rel="noreferrer" className="text-cyan-100/80 underline">NASA Photojournal · {row.nasaId}</a></dd></div>
        <div><dt className="text-slate-500">署名</dt><dd className="text-slate-300">{row.sourceCredit}</dd></div>
        <div><dt className="text-slate-500">候选原图 SHA-256</dt><dd className="break-all font-mono text-[10px] text-slate-400">{row.candidateRaw.sha256}</dd></div>
        <div><dt className="text-slate-500">页面直链图 SHA-256</dt><dd className="break-all font-mono text-[10px] text-slate-400">{row.officialRaw.sha256}</dd></div>
      </dl>
      <p className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-4 text-amber-100/70">candidate-only · hold · not-admitted · scientificPayloadWriteback=false。版权逐图审核未完成，图片不会自动接入 canonical 运行时。</p>
    </aside>
  );
}

export default function MainlineANebulaCandidateGalleryV655({ pack,
  onSelectCandidate }: {
  pack: CandidateReviewPackV655;
  onSelectCandidate?: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState(pack.rows[0]?.id ?? "");
  const checked = useMemo(() => inspectCandidateReviewPackV655(pack), [pack]);
  const visible = useMemo(() => candidateReviewVisibleV655(pack.rows,
    filter, query), [filter, pack.rows, query]);
  const selected = visible.find((row) => row.id === selectedId)
    ?? visible[0] ?? null;
  useEffect(() => {
    if (selected) onSelectCandidate?.(selected.id);
  }, [onSelectCandidate, selected]);
  return (
    <section className="mb-4 min-w-0 rounded-lg border border-cyan-100/20 bg-cyan-100/[.035] p-3"
      aria-label="Beta 星云十二图本地审查图集"
      data-mainline-a-nebula-review-gallery="v655"
      data-mainline-a-nebula-review-boundary={checked.ok ? "closed" : "invalid"}
      data-scientific-payload-writeback="false">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="font-mono text-[10px] tracking-[.18em] text-cyan-100/55">BETA NEBULAE / LOCAL CANDIDATE REVIEW</div>
          <h3 className="mt-1 text-sm text-cyan-50">十二张星云候选审查图集</h3>
          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">图片只在本机审查时按需载入；关闭审查台后释放临时图片地址。来源核验、版本差异和版权状态逐项显示。</p>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
          <div className="rounded border border-white/10 bg-black/20 px-2 py-1"><strong className="block text-sm text-cyan-50">12/12</strong><span className="text-slate-500">候选图</span></div>
          <div className="rounded border border-white/10 bg-black/20 px-2 py-1"><strong className="block text-sm text-emerald-100">12/12</strong><span className="text-slate-500">像素对应</span></div>
          <div className="rounded border border-white/10 bg-black/20 px-2 py-1"><strong className="block text-sm text-amber-100">0/12</strong><span className="text-slate-500">版权签署</span></div>
        </div>
      </header>
      {!checked.ok ? (
        <p role="alert" className="mt-3 rounded border border-red-200/25 p-3 text-xs text-red-100">候选图数据未通过校验，保持 hold：{checked.issues.join(" · ")}</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input aria-label="搜索十二张星云候选" value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="名称、NASA ID 或署名"
              className="min-h-10 w-full rounded border border-white/15 bg-black/20 px-3 text-xs sm:w-64" />
            {(["all", "B1", "B2", "raw-variant"] as const).map((item) => (
              <button key={item} type="button" onClick={() => setFilter(item)}
                aria-pressed={filter === item}
                className={`min-h-9 rounded border px-2.5 text-[11px] ${filter === item
                  ? "border-cyan-100/50 bg-cyan-100/10 text-cyan-50"
                  : "border-white/10 text-slate-500"}`}>
                {{ all: "全部", B1: "首组六图", B2: "次组六图",
                  "raw-variant": "原字节不同" }[item]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500" role="status">显示 {visible.length}/12 · 原始字节同一 {pack.counts.rawByteIdentical}/12 · 版权 pending · 本机审查限定</p>
          <div className="mt-3 grid min-w-0 gap-3">
            <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
              {visible.map((row) => <CandidateCard key={row.id} row={row}
                selected={row.id === selected?.id}
                choose={() => setSelectedId(row.id)} />)}
            </div>
            {selected ? <CandidateDetail key={selected.id} row={selected} />
              : <p role="status" className="p-4 text-xs text-slate-400">没有匹配的候选图。</p>}
          </div>
        </>
      )}
    </section>
  );
}
