"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MAINLINE_A_CURRENT_STARS } from "../data/mainlineAMetadataV607";
import { MAINLINE_A_CONSTELLATION_FIGURES_V607 } from "../data/mainlineAConstellationFiguresV607";
import {
  filterWebSkyConstellationsV656, filterWebSkyStarsV656,
  focusWebSkyCatalogEntryV656, focusWebSkyConstellationV656,
  focusWebSkyStarV656,
  type WebSkyConstellationV656, type WebSkyKindV656,
  type WebSkyStarFilterV656, type WebSkyStarV656,
} from "../lib/mainlineAWebSkyV656";
import { useMainlineAWebSkyV656 } from "../lib/useMainlineAWebSkyV656";
import MainlineAConstellationChartV607 from "./MainlineAConstellationChartV607";
import MainlineAStellarPortraitV607 from "./MainlineAStellarPortraitV607";

type Props = Readonly<{
  onClose: () => void;
  onFocus: (direction: [number, number, number], catalogId?: string) => void;
}>;

const FILTER_LABELS: Readonly<Record<WebSkyStarFilterV656, string>> = {
  all: "全部 24 颗",
  "runtime-existing": "现有运行时 20",
  "candidate-hold": "身份待审 4",
};

function loadErrorLabel(error: string | null) {
  if (error === "http") return "候选目录接口暂不可用。";
  if (error === "timeout") return "候选目录载入超时。";
  if (error === "sha" || error === "bytes") return "候选目录字节校验失败。";
  if (error === "boundary") return "候选目录或准入边界校验失败。";
  return "候选目录载入失败。";
}

function StarCardV656({ row, active, onSelect, index, onNavigate }: {
  row: WebSkyStarV656; active: boolean;
  onSelect: () => void; index: number;
  onNavigate: (index: number, key: string) => void;
}) {
  const hold = row.phase === "candidate-hold";
  return <button type="button" onClick={onSelect}
    onKeyDown={(event) => {
      if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        onNavigate(index, event.key);
      }
    }}
    aria-pressed={active}
    aria-label={`${row.displayName}，${hold ? "身份待审，不能进入运行时" : "现有运行时参考"}`}
    data-mainline-a-web-sky-choice-index={index}
    data-mainline-a-web-sky-star={row.id}
    data-mainline-a-web-sky-star-phase={row.phase}
    data-mainline-a-web-sky-star-selected={String(active)}
    className={`min-w-0 rounded-lg border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-100 ${
      active ? "border-cyan-100/55 bg-cyan-100/10"
        : "border-white/10 bg-[#0b1823] hover:border-cyan-100/25"}`}>
    <span className="flex items-start justify-between gap-2">
      <span className="min-w-0 break-words text-sm leading-5 text-slate-100">{row.displayName}</span>
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] ${hold
        ? "bg-amber-100/10 text-amber-100" : "bg-emerald-100/10 text-emerald-100"}`}>
        {hold ? "HOLD" : "RUNTIME"}
      </span>
    </span>
    <span className="mt-2 block truncate font-mono text-[10px] text-slate-500">{row.id}</span>
    <span className="mt-1 block text-[10px] text-slate-400">{hold
      ? "物理组件身份待审 · 无运行时入口"
      : "既有参数化光球 · 可定位场景"}</span>
  </button>;
}

function ConstellationCardV656({ row, active, onSelect, index, onNavigate }: {
  row: WebSkyConstellationV656; active: boolean;
  onSelect: () => void; index: number;
  onNavigate: (index: number, key: string) => void;
}) {
  const figure = MAINLINE_A_CONSTELLATION_FIGURES_V607[row.code];
  return <button type="button" onClick={onSelect}
    onKeyDown={(event) => {
      if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        onNavigate(index, event.key);
      }
    }}
    aria-pressed={active}
    aria-label={`查看${figure?.nameCn ?? row.displayName}星座图，签署待审`}
    data-mainline-a-web-sky-choice-index={index}
    data-mainline-a-web-sky-constellation={row.code}
    data-mainline-a-web-sky-constellation-selected={String(active)}
    className={`min-w-0 rounded-lg border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-100 ${
      active ? "border-cyan-100/55 bg-cyan-100/10"
        : "border-white/10 bg-[#0b1823] hover:border-cyan-100/25"}`}>
    <span className="flex items-start justify-between gap-2">
      <span className="text-sm text-slate-100">{figure?.nameCn ?? row.displayName}</span>
      <span className="shrink-0 rounded bg-amber-100/10 px-1.5 py-0.5 text-[9px] text-amber-100">待签</span>
    </span>
    <span className="mt-1 block text-[11px] text-slate-400">{row.displayName}</span>
    <span className="mt-2 block font-mono text-[10px] text-cyan-100/55">{row.routeCatalogId}</span>
    <span className="mt-1 block text-[10px] text-slate-500">{figure?.segments.length ?? 0} 条图示连线 · {figure?.stars.length ?? 0} 个实名锚点</span>
  </button>;
}

function StarDetailV656({ row, onFocus, onClose }: {
  row: WebSkyStarV656; onFocus: Props["onFocus"];
  onClose: Props["onClose"];
}) {
  const metadata = MAINLINE_A_CURRENT_STARS.find((star) => star.id === row.id);
  const target = focusWebSkyStarV656(row);
  const hold = row.phase === "candidate-hold";
  return <aside className="min-w-0 rounded-lg border border-white/10 bg-[#08131d] p-3"
    aria-label="恒星导览详情"
    data-mainline-a-web-sky-detail={`star:${row.id}`}
    data-mainline-a-web-sky-focus-available={String(Boolean(target))}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><p className="font-mono text-[10px] tracking-[.15em] text-cyan-100/55">BETA HERO / {row.id.toUpperCase()}</p>
        <h3 className="mt-1 text-lg text-slate-100">{row.displayName}</h3></div>
      <span className={`rounded border px-2 py-1 text-[10px] ${hold
        ? "border-amber-100/25 text-amber-100" : "border-emerald-100/25 text-emerald-100"}`}>
        {hold ? "candidate hold" : "现有运行时参考"}
      </span>
    </div>
    {hold ? <div className="mt-4 flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-amber-100/20 bg-amber-100/[.025] px-5 text-center">
      <span aria-hidden="true" className="text-4xl text-amber-100/40">✧</span>
      <p className="mt-3 text-sm text-amber-50">组件身份尚未确认</p>
      <p className="mt-2 max-w-xs text-xs leading-5 text-slate-400">{row.componentReason}。此处只显示候选身份状态，不合成观测图，也不进入现有恒星运行时。</p>
    </div> : metadata ? <MainlineAStellarPortraitV607 key={row.id}
      objectId={row.id} title={row.displayName} profile={metadata.artDirection} />
      : <p role="alert" className="mt-4 rounded border border-red-100/20 p-3 text-xs text-red-100">运行时美术资料缺失，已停止此对象的场景定位。</p>}
    <dl className="mt-3 grid gap-2 text-[11px] leading-5 sm:grid-cols-2">
      <div><dt className="text-slate-500">来源类别</dt><dd className="text-slate-300">{row.sourceClass}</dd></div>
      <div><dt className="text-slate-500">权利/条款</dt><dd className="text-amber-100">{row.rightsStatus}</dd></div>
      <div><dt className="text-slate-500">组件审核</dt><dd className="text-slate-300">{row.componentReview}</dd></div>
      <div><dt className="text-slate-500">来源页面</dt><dd><a href={row.sourcePageUrl}
        target="_blank" rel="noreferrer" className="break-all text-cyan-100/80 underline">查看外部来源</a></dd></div>
    </dl>
    <p className="mt-3 break-all font-mono text-[9px] text-slate-500">来源快照 SHA-256 {row.sourceSnapshotSha256}</p>
    <p className="mt-2 text-[10px] leading-4 text-slate-500">candidate-only · not-admitted · scientificPayloadWriteback=false。现有 20 颗的场景定位沿用原运行时，不提升四颗待证恒星。</p>
    <button type="button" disabled={!target} onClick={() => {
      if (!target) return;
      onFocus(target.direction, target.catalogId);
      onClose();
    }} className="mt-3 min-h-11 rounded border border-cyan-100/30 px-3 text-xs text-cyan-50 enabled:hover:bg-cyan-100/10 disabled:cursor-not-allowed disabled:opacity-40"
      data-mainline-a-web-sky-focus-star={row.id}>
      {target ? "定位现有运行时恒星 →" : "身份待审，不能定位"}
    </button>
  </aside>;
}

function ConstellationDetailV656({ row, onFocus, onClose }: {
  row: WebSkyConstellationV656; onFocus: Props["onFocus"];
  onClose: Props["onClose"];
}) {
  const figure = MAINLINE_A_CONSTELLATION_FIGURES_V607[row.code];
  const target = focusWebSkyConstellationV656(row);
  const [feedback, setFeedback] = useState("");
  return <aside className="min-w-0 rounded-lg border border-white/10 bg-[#08131d] p-3"
    aria-label="星座导览详情"
    data-mainline-a-web-sky-detail={`constellation:${row.code}`}
    data-mainline-a-web-sky-focus-available={String(Boolean(target))}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><p className="font-mono text-[10px] tracking-[.15em] text-cyan-100/55">CANONICAL CONSTELLATION / {row.code}</p>
        <h3 className="mt-1 text-lg text-slate-100">{figure?.nameCn ?? row.displayName}</h3>
        <p className="text-xs text-slate-400">{row.displayName}</p></div>
      <span className="rounded border border-amber-100/25 px-2 py-1 text-[10px] text-amber-100">图示待签</span>
    </div>
    {figure ? <MainlineAConstellationChartV607 key={row.code} code={row.code}
      onSelectObject={(catalogId) => {
        const member = focusWebSkyCatalogEntryV656(catalogId);
        if (!member) { setFeedback("该成员缺少可定位目录记录，保持在审查页。"); return; }
        onFocus(member.direction, member.catalogId);
        onClose();
      }} /> : <p role="alert" className="mt-3 rounded border border-red-100/20 p-3 text-xs text-red-100">星图资料缺失，未绘制替代连线。</p>}
    {feedback && <p role="status" className="mt-2 text-xs text-amber-100">{feedback}</p>}
    <dl className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
      <div><dt className="text-slate-500">运行时路由</dt><dd className="font-mono text-cyan-100/75">{row.routeCatalogId}</dd></div>
      <div><dt className="text-slate-500">图示来源</dt><dd className="text-slate-300">{row.sourceCredit}</dd></div>
      <div><dt className="text-slate-500">来源页面</dt><dd><a href={row.sourcePageUrl} target="_blank" rel="noreferrer" className="break-all text-cyan-100/80 underline">查看 IAU 来源</a></dd></div>
      <div><dt className="text-slate-500">审核状态</dt><dd className="text-amber-100">{row.reviewState}</dd></div>
    </dl>
    <p className="mt-3 text-[10px] leading-4 text-slate-500">星点、图示连线与边界按现有目录展示；它们不是恒星间的物理结构。candidate-only · not-admitted · scientificPayloadWriteback=false。</p>
    <button type="button" disabled={!target} onClick={() => {
      if (!target) return;
      onFocus(target.direction, target.catalogId);
      onClose();
    }} className="mt-3 min-h-11 rounded border border-cyan-100/30 px-3 text-xs text-cyan-50 enabled:hover:bg-cyan-100/10 disabled:cursor-not-allowed disabled:opacity-40"
      data-mainline-a-web-sky-focus-constellation={row.code}>
      {target ? "定位现有星座图示 →" : "实名锚点待补，不能定位"}
    </button>
  </aside>;
}

export default function MainlineAWebSkyExplorerV656({ onClose, onFocus }: Props) {
  const headingId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const { status, pack, error, sha256, bytes, retry, attempts } = useMainlineAWebSkyV656();
  const [kind, setKind] = useState<WebSkyKindV656>("stars");
  const [query, setQuery] = useState("");
  const [starFilter, setStarFilter] = useState<WebSkyStarFilterV656>("all");
  const [selectedId, setSelectedId] = useState("sirius-a");
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  const starRows = useMemo(() => pack ? filterWebSkyStarsV656(
    pack.stars, query, starFilter) : [], [pack, query, starFilter]);
  const constellationRows = useMemo(() => pack
    ? filterWebSkyConstellationsV656(pack.constellations, query) : [], [pack, query]);
  const rows = kind === "stars" ? starRows : constellationRows;
  const selectedStar = kind === "stars"
    ? starRows.find((row) => row.id === selectedId) ?? starRows[0] : null;
  const selectedConstellation = kind === "constellations"
    ? constellationRows.find((row) => row.code === selectedId)
      ?? constellationRows[0] : null;
  function switchKind(next: WebSkyKindV656) {
    setKind(next);
    setQuery("");
    setStarFilter("all");
    setSelectedId(next === "stars" ? "sirius-a" : "Ori");
  }
  function select(id: string) {
    setSelectedId(id);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      detailRef.current?.scrollIntoView({ block: "start", behavior:
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto" : "smooth" });
    }
  }
  function navigate(index: number, key: string) {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(key)) return;
    const next = key === "Home" ? 0 : key === "End" ? rows.length - 1
      : key === "ArrowRight" || key === "ArrowDown" ? Math.min(rows.length - 1, index + 1)
        : Math.max(0, index - 1);
    const element = listRef.current?.querySelector<HTMLElement>(
      `[data-mainline-a-web-sky-choice-index="${next}"]`);
    element?.focus();
    if (element) setSelectedId(kind === "stars"
      ? (rows[next] as WebSkyStarV656).id
      : (rows[next] as WebSkyConstellationV656).code);
  }
  return <dialog ref={dialogRef} onCancel={onClose} aria-labelledby={headingId}
    className="fixed m-auto h-[min(870px,94dvh)] max-h-[94dvh] w-[min(1180px,96vw)] max-w-[96vw] overflow-hidden rounded-xl border border-cyan-100/20 bg-[#061019] p-0 text-slate-200 shadow-2xl backdrop:bg-black/75"
    data-mainline-a-web-sky="v656"
    data-mainline-a-web-sky-load={status}
    data-mainline-a-web-sky-boundary="candidate-hold"
    data-scientific-payload-writeback="false">
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
        <div><p className="font-mono text-[9px] tracking-[.25em] text-cyan-100/55">MAINLINE A / WEB SKY GUIDE / V656</p>
          <h2 id={headingId} className="mt-1 text-lg text-cyan-50">星空导览 <span className="ml-2 font-mono text-xs text-slate-500">24 恒星 · 12 星座</span></h2>
          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">浏览已有运行时参考与待证候选。四颗待证恒星不提供场景定位；星座图仍等待逐项签署。</p>
        </div>
        <button type="button" onClick={onClose} aria-label="关闭星空导览"
          className="min-h-11 shrink-0 rounded border border-white/10 px-3 text-sm hover:bg-white/10">关闭 ×</button>
      </header>
      {status === "loading" ? <div role="status" className="flex flex-1 items-center justify-center p-8 text-sm text-slate-400">正在校验 24 星与 12 星座候选目录…</div>
        : status === "failed" || !pack ? <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center text-sm text-amber-100">
          <p>{loadErrorLabel(error)}</p><p className="text-xs text-slate-400">目录保持 hold，未载入任何替代资料。</p>
          <button type="button" onClick={retry} className="min-h-11 rounded border border-cyan-100/30 px-4 text-cyan-50">重试载入</button>
        </div> : <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
          <div className="grid min-h-full lg:h-full lg:grid-cols-[minmax(0,1fr)_390px]">
            <section className="min-w-0 p-4 sm:p-6 lg:overflow-y-auto" aria-label="星空导览对象列表">
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="rounded border border-white/10 bg-black/20 p-2"><strong className="block text-lg text-emerald-100">20</strong><span className="text-slate-400">现有运行时</span></div>
                <div className="rounded border border-white/10 bg-black/20 p-2"><strong className="block text-lg text-amber-100">4</strong><span className="text-slate-400">身份 hold</span></div>
                <div className="rounded border border-white/10 bg-black/20 p-2"><strong className="block text-lg text-cyan-100">12</strong><span className="text-slate-400">canonical 星座</span></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2" aria-label="星空导览类别">
                <button type="button" onClick={() => switchKind("stars")} aria-pressed={kind === "stars"}
                  className={`min-h-10 rounded border px-3 text-xs ${kind === "stars" ? "border-cyan-100/50 bg-cyan-100/10 text-cyan-50" : "border-white/10 text-slate-400"}`}>恒星 24</button>
                <button type="button" onClick={() => switchKind("constellations")} aria-pressed={kind === "constellations"}
                  className={`min-h-10 rounded border px-3 text-xs ${kind === "constellations" ? "border-cyan-100/50 bg-cyan-100/10 text-cyan-50" : "border-white/10 text-slate-400"}`}>星座 12</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <input aria-label="搜索星空导览" value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={kind === "stars" ? "恒星名称或 ID" : "星座名称或 IAU 代码"}
                  className="min-h-10 min-w-0 flex-1 rounded border border-white/15 bg-black/20 px-3 text-xs" />
                <button type="button" onClick={() => setQuery("")}
                  className="min-h-10 rounded border border-white/10 px-3 text-xs text-slate-400">清空</button>
              </div>
              {kind === "stars" && <div className="mt-3 flex flex-wrap gap-1.5" aria-label="恒星状态筛选">
                {(["all", "runtime-existing", "candidate-hold"] as const).map((filter) =>
                  <button key={filter} type="button" onClick={() => setStarFilter(filter)}
                    aria-pressed={starFilter === filter}
                    className={`min-h-9 rounded border px-2.5 text-[11px] ${starFilter === filter
                      ? "border-amber-100/40 text-amber-50" : "border-white/10 text-slate-500"}`}>
                    {FILTER_LABELS[filter]}
                  </button>)}
              </div>}
              <p role="status" className="mt-2 text-[11px] text-slate-500">显示 {rows.length}/{kind === "stars" ? 24 : 12} · candidate-only · hold · not-admitted · writeback off</p>
              <div ref={listRef} className="mt-3 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3"
                data-mainline-a-web-sky-list={kind}>
                {kind === "stars" ? starRows.map((row, index) =>
                  <StarCardV656 key={row.id} row={row} index={index}
                    active={row.id === selectedStar?.id} onSelect={() => select(row.id)}
                    onNavigate={navigate} />)
                  : constellationRows.map((row, index) =>
                    <ConstellationCardV656 key={row.code} row={row} index={index}
                      active={row.code === selectedConstellation?.code}
                      onSelect={() => select(row.code)} onNavigate={navigate} />)}
              </div>
              {!rows.length && <p role="status" className="mt-3 rounded border border-white/10 p-4 text-xs text-slate-400">没有匹配对象；请清空搜索或切换筛选。</p>}
            </section>
            <div ref={detailRef} className="min-w-0 border-t border-white/10 p-4 sm:p-6 lg:overflow-y-auto lg:border-l lg:border-t-0">
              {selectedStar && <StarDetailV656 key={selectedStar.id} row={selectedStar}
                onFocus={onFocus} onClose={onClose} />}
              {selectedConstellation && <ConstellationDetailV656 key={selectedConstellation.code}
                row={selectedConstellation} onFocus={onFocus} onClose={onClose} />}
              {!selectedStar && !selectedConstellation && <p role="status" className="text-xs text-slate-400">选择一个对象查看候选详情。</p>}
              <p className="mt-3 break-all font-mono text-[9px] text-slate-600">目录 SHA-256 {sha256} · {bytes} bytes · 第 {attempts} 次载入</p>
            </div>
          </div>
        </div>}
    </div>
  </dialog>;
}
