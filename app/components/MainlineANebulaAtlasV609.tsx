"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useReducer, useRef, type CSSProperties } from "react";
import {
  MAINLINE_A_NEBULA_ATLAS_ENTRIES,
  NEBULA_ATLAS_FILTERS,
  nebulaAtlasAspect,
  nebulaAtlasSourceLabel,
  nebulaAtlasSummary,
  type NebulaAtlasEntry,
  type NebulaAtlasOrder,
} from "../lib/mainlineANebulaAtlasV609";
import {
  NEBULA_KIND_LABELS,
  createNebulaAtlasState,
  createNebulaPreviewState,
  formatNebulaMeasurement,
  formatNebulaSourceBytes,
  nebulaAtlasResultsAnnouncement,
  nebulaAtlasView,
  nebulaCatalogMeasurements,
  nebulaEntryMatchesFilter,
  nebulaHttpsLink,
  nebulaKnownMeasurementCount,
  nebulaLocalPreviewPath,
  reduceNebulaAtlasState,
  reduceNebulaPreviewState,
  type NebulaAtlasCompleteness,
  type NebulaAtlasScope,
} from "../lib/mainlineANebulaPresentationV637";

type Props = { onClose: () => void };

function previewStyle(color: string, aspect: number): CSSProperties {
  return {
    aspectRatio: `${aspect}`,
    background: `radial-gradient(ellipse at 45% 46%, #fff7 0%, ${color}cc 20%, ${color}55 42%, #061019 76%), radial-gradient(circle at 70% 30%, #9df4 0 3%, transparent 20%)`,
  };
}

function statusTone(entry: { tier: string; rights: string }): string {
  if (entry.tier === "current" && entry.rights === "review") return "text-amber-100/80";
  if (entry.rights === "review") return "text-amber-100/80";
  return "text-slate-400";
}

function SummaryStat({ label, value, tone = "text-cyan-50" }: { label: string; value: number; tone?: string }) {
  return <div className="rounded border border-white/10 bg-white/[.03] p-2">
    <span className="block text-[10px] text-slate-400">{label}</span>
    <strong className={`text-lg ${tone}`}>{value}</strong>
  </div>;
}

function NebulaEvidencePreview({ entry }: { entry: NebulaAtlasEntry }) {
  const path = nebulaLocalPreviewPath(entry);
  const [state, dispatch] = useReducer(reduceNebulaPreviewState, path, createNebulaPreviewState);
  const aspect = nebulaAtlasAspect(entry);
  if (!path) {
    return <figure className="mt-4" data-mainline-a-nebula-image-state="unavailable">
      <div className="w-full rounded border border-white/10" style={previewStyle(entry.color, aspect)}
        role="img" aria-label={`${entry.subtitleCn} 参数化预览；不代表科学观测图`} />
      <figcaption className="mt-2 text-[10px] leading-5 text-slate-400">
        {entry.tier === "candidate" ? "候选参数化示意。原图保持在来源审阅流程内，未作为运行时纹理加载。" : "本地展示图暂不可用；此处为参数化示意。"}
      </figcaption>
    </figure>;
  }
  return <figure className="mt-4" data-mainline-a-nebula-image-state={state.status}>
    <div className="relative w-full overflow-hidden rounded border border-white/10 bg-black/30"
      style={{ aspectRatio: `${aspect}` }} aria-busy={state.status === "loading"}>
      {state.status !== "failed" ? <Image key={state.attempt} src={path} fill unoptimized
        sizes="(max-width: 1023px) 90vw, 308px" alt={`${entry.subtitleCn}，当前 A 线观测合成图`}
        className={`object-contain transition-opacity motion-reduce:transition-none ${state.status === "loaded" ? "opacity-100" : "opacity-0"}`}
        onLoad={(event) => dispatch({ type: "loaded", path, attempt: state.attempt, width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
        onError={() => dispatch({ type: "failed", path, attempt: state.attempt })} /> : null}
      {state.status === "loading" ? <span role="status" className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">正在加载本地观测图…</span> : null}
      {state.status === "failed" ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
        <p role="status" className="text-xs leading-5 text-amber-100">观测图加载失败。来源记录仍可查看。</p>
        <button type="button" onClick={() => dispatch({ type: "retry" })}
          className="min-h-11 rounded border border-white/20 px-3 text-xs hover:bg-white/10">重试加载观测图</button>
      </div> : null}
    </div>
    <figcaption className="mt-2 text-[10px] leading-5 text-slate-400">
      当前 A 线本地观测合成图；颜色体现波段映射，不能当作肉眼颜色或三维结构。
    </figcaption>
  </figure>;
}

function NebulaCatalogParameters({ entry }: { entry: NebulaAtlasEntry }) {
  const measurements = nebulaCatalogMeasurements(entry);
  const known = measurements.filter((field) => field.state === "known").length;
  return <section className="mt-4 rounded border border-white/10 bg-black/10 p-3" aria-label="星云目录参数">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="text-xs text-slate-300">目录参数</h4>
      <span className="font-mono text-[10px] text-slate-400">{known} / {measurements.length} 项已提供</span>
    </div>
    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
      {measurements.map((field) => <div key={field.field} data-mainline-a-nebula-field={field.field} data-value-state={field.state}>
        <dt className="text-[10px] text-slate-400">{field.label}</dt>
        <dd className={`mt-1 text-xs ${field.state === "known" ? "text-slate-200" : "text-amber-100/80"}`}>{field.formatted}</dd>
      </div>)}
    </dl>
    <p className="mt-3 text-[10px] leading-5 text-slate-400">
      {entry.catalogMatchedId ? `对应既有目录 ${entry.catalogMatchedId}；整理值仅供展示。` : "尚未绑定既有目录条目；缺失参数不按零值处理。"}
      {known < measurements.length ? " 缺项保留待补，不能据此推断对象距离或尺度。" : ""}
    </p>
  </section>;
}

export default function MainlineANebulaAtlasV609({ onClose }: Props) {
  const [state, dispatch] = useReducer(
    (previous: ReturnType<typeof createNebulaAtlasState>, action: Parameters<typeof reduceNebulaAtlasState>[1]) =>
      reduceNebulaAtlasState(previous, action, MAINLINE_A_NEBULA_ATLAS_ENTRIES),
    MAINLINE_A_NEBULA_ATLAS_ENTRIES,
    createNebulaAtlasState,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const queryRef = useRef<HTMLInputElement>(null);
  const focusDetailOnChange = useRef(false);
  const headingId = useId();
  const queryHelpId = useId();
  const resultStatusId = useId();
  const view = useMemo(() => nebulaAtlasView(MAINLINE_A_NEBULA_ATLAS_ENTRIES, state), [state]);
  const { selected } = view;
  const summary = useMemo(() => nebulaAtlasSummary(MAINLINE_A_NEBULA_ATLAS_ENTRIES), []);
  const sourcePage = nebulaHttpsLink(selected?.sourcePage);
  const licensePage = nebulaHttpsLink(selected?.sourceLicenseUrl);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);

  useEffect(() => {
    if (!focusDetailOnChange.current || !selected) return;
    focusDetailOnChange.current = false;
    detailHeadingRef.current?.focus({ preventScroll: true });
    detailRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [selected]);

  function choose(id: string) {
    const moveToDetail = window.matchMedia("(max-width: 1023px)").matches;
    focusDetailOnChange.current = moveToDetail;
    dispatch({ type: "select", id });
    if (id === selected?.id && moveToDetail) {
      focusDetailOnChange.current = false;
      detailHeadingRef.current?.focus({ preventScroll: true });
      detailRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }

  function returnToList() {
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>("[data-mainline-a-nebula-entry]");
    const button = Array.from(buttons ?? []).find((item) => item.dataset.mainlineANebulaEntry === selected?.id);
    (button ?? queryRef.current)?.focus({ preventScroll: true });
    if (button) button.scrollIntoView({ block: "nearest" });
    else listRef.current?.scrollIntoView({ block: "start" });
  }

  function resetFilters() {
    dispatch({ type: "reset" });
    queryRef.current?.focus({ preventScroll: true });
  }

  return (
    <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); onClose(); }} aria-labelledby={headingId}
      className="fixed m-auto h-[min(850px,94dvh)] max-h-[94dvh] w-[min(1180px,96vw)] max-w-[96vw] overflow-hidden rounded-xl border border-cyan-100/20 bg-[#061019] p-0 text-slate-200 shadow-2xl backdrop:bg-black/75"
      data-mainline-a-nebula-atlas="true" data-mainline-a-nebula-filter={state.filter}
      data-mainline-a-nebula-scope={state.scope} data-mainline-a-scientific-payload-writeback="false"
      data-mainline-a-nebula-web-release="blocked-rights-pending">
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
          <div>
            <div className="font-mono text-[9px] tracking-[.3em] text-cyan-100/50">NEBULA ATLAS / MAINLINE A</div>
            <h2 id={headingId} className="mt-1 text-lg text-cyan-50">星云候选图集 <span className="ml-2 font-mono text-xs text-slate-500">{summary.total} 条证据记录</span></h2>
            <p className="mt-1 text-[10px] text-amber-100/65">本地 A 线图片用于视觉审阅；逐图版权签署尚未完成，公开网页版发布仍被阻断。Beta 候选同样保持 hold。</p>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭星云候选图集"
            className="min-h-11 shrink-0 whitespace-nowrap rounded px-3 text-sm hover:bg-white/10">
            <span className="hidden sm:inline">关闭 </span><span aria-hidden="true">×</span>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
          <div className="grid min-h-full lg:h-full lg:grid-cols-[minmax(0,1fr)_340px]">
            <section ref={listRef} aria-label="星云候选对照" className="min-w-0 p-4 sm:p-6 lg:overflow-y-auto">
              <p className="mb-4 max-w-2xl text-xs leading-6 text-slate-400">本地 A 线可展示 {summary.current} 张星云，另有 {summary.candidates} 条来源候选。许可标记和署名是复核输入，不等于逐图版权签署或公开发布准入；记录数也不等于 Beta 已接入对象数。</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-mainline-a-nebula-summary="true">
                <SummaryStat label="本地 A 线展示" value={summary.current} />
                <SummaryStat label="候选来源记录" value={summary.candidates} />
                <SummaryStat label="逐图版权已签署" value={summary.cleared} tone="text-amber-100" />
                <SummaryStat label="待复核或补全" value={summary.review + summary.missing} tone="text-amber-100" />
              </div>
              <p className="mt-2 text-[10px] leading-5 text-slate-400" data-mainline-a-nebula-license-recorded={summary.licenseRecorded}>
                A 线 {summary.licenseRecorded} 张有来源许可标记；全部 {summary.candidateOnly} 条仍为网页版发布候选，科学载荷写回关闭。
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5" aria-label="星云证据筛选">
                {NEBULA_ATLAS_FILTERS.map((item) => <button key={item.id} type="button" onClick={() => dispatch({ type: "filter", value: item.id })} aria-pressed={state.filter === item.id}
                  className={`min-h-11 rounded border px-2.5 text-[11px] ${state.filter === item.id ? "border-cyan-100/40 bg-cyan-100/10 text-cyan-50" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>
                  {item.label}<span className="ml-1 text-[10px] opacity-70">{view.scoped.filter((entry) => nebulaEntryMatchesFilter(entry, item.id)).length}</span>
                </button>)}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <input ref={queryRef} type="search" aria-label="搜索星云候选" aria-describedby={queryHelpId}
                  value={state.query} onChange={(event) => dispatch({ type: "query", value: event.target.value })}
                  placeholder="名称、目录号或来源 ID" className="min-h-11 min-w-0 flex-1 rounded border border-white/15 bg-black/20 px-3 text-xs" />
                <button type="button" onClick={resetFilters} disabled={!view.filtered && state.order === "catalog"}
                  className="min-h-11 rounded border border-white/15 px-3 text-xs disabled:opacity-40">清除筛选</button>
              </div>
              <p id={queryHelpId} className="mt-2 text-[10px] leading-5 text-slate-400">可组合名称和目录号；M 42 与 M42 等价。不同词同时匹配。</p>
              <div className="my-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <label className="text-[10px] text-slate-400">记录范围
                  <select aria-label="星云记录范围" value={state.scope} onChange={(event) => dispatch({ type: "scope", value: event.target.value as NebulaAtlasScope })}
                    className="mt-1 block min-h-11 w-full rounded border border-white/15 bg-[#101c29] px-2 text-xs text-slate-200">
                    <option value="all">全部记录</option><option value="current">当前 A 线</option><option value="candidate">仅候选</option>
                  </select>
                </label>
                <label className="text-[10px] text-slate-400">目录信息
                  <select aria-label="星云目录完整性" value={state.completeness} onChange={(event) => dispatch({ type: "completeness", value: event.target.value as NebulaAtlasCompleteness })}
                    className="mt-1 block min-h-11 w-full rounded border border-white/15 bg-[#101c29] px-2 text-xs text-slate-200">
                    <option value="all">全部参数状态</option><option value="complete">四项均有值</option><option value="incomplete">目录参数缺项</option>
                  </select>
                </label>
                <label className="text-[10px] text-slate-400">排序
                  <select aria-label="星云排序" value={state.order} onChange={(event) => dispatch({ type: "order", value: event.target.value as NebulaAtlasOrder })}
                    className="mt-1 block min-h-11 w-full rounded border border-white/15 bg-[#101c29] px-2 text-xs text-slate-200">
                    <option value="catalog">目录顺序</option><option value="name">目录名称</option><option value="angular-size">角径从大到小</option><option value="distance">距离从近到远</option>
                  </select>
                </label>
              </div>
              <p id={resultStatusId} role="status" aria-live="polite" aria-atomic="true" className="mb-3 text-xs leading-5 text-slate-400">
                {nebulaAtlasResultsAnnouncement(MAINLINE_A_NEBULA_ATLAS_ENTRIES, state)}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-describedby={resultStatusId} data-mainline-a-nebula-result-count={view.visible.length}>
                {view.visible.map((entry) => <button key={entry.id} type="button" onClick={() => choose(entry.id)} aria-pressed={entry.id === selected?.id}
                  data-mainline-a-nebula-entry={entry.id} className={`min-w-0 overflow-hidden rounded-lg border p-2 text-left ${entry.id === selected?.id ? "border-cyan-100/45 bg-[#152631]" : "border-white/10 bg-[#09151e] hover:border-slate-500"}`}>
                  <div className="relative w-full rounded border border-white/10" style={previewStyle(entry.color, nebulaAtlasAspect(entry))} aria-hidden="true">
                    <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1 text-[9px] text-slate-300">目录示意</span>
                  </div>
                  <span className="mt-2 block truncate text-xs text-slate-100">{entry.subtitleCn}</span>
                  <span className="mt-1 block truncate font-mono text-[9px] text-slate-400">{entry.catalogName}</span>
                  <span className="mt-1 block text-[10px] text-slate-400">角径 {formatNebulaMeasurement(entry.sizeArcmin, "sizeArcmin")}</span>
                  <span className="mt-1 block text-[10px] text-slate-400">{NEBULA_KIND_LABELS[entry.kind]} · 参数 {nebulaKnownMeasurementCount(entry)}/4</span>
                  <span className={`mt-1 block text-[9px] leading-4 ${statusTone(entry)}`}>{nebulaAtlasSourceLabel(entry)}</span>
                </button>)}
              </div>
              {!view.visible.length ? <div className="rounded border border-dashed border-white/15 px-4 py-8 text-center">
                <h3 className="text-sm text-slate-200">没有匹配的星云候选</h3>
                <p className="mt-2 text-xs leading-6 text-slate-400">尝试缩短关键词，或清除记录范围、类型和参数筛选。</p>
                <button type="button" onClick={resetFilters} className="mt-4 min-h-11 rounded border border-cyan-100/30 px-4 text-xs text-cyan-50">显示全部星云记录</button>
              </div> : null}
            </section>
            <aside ref={detailRef} aria-label="已选星云证据" className="min-w-0 border-t border-white/10 bg-[#0a1720] p-4 lg:overflow-y-auto lg:border-l lg:border-t-0" data-mainline-a-nebula-selected={selected?.id ?? "none"}>
              <button type="button" onClick={returnToList} className="mb-3 min-h-11 rounded border border-white/15 px-3 text-xs text-slate-300 lg:hidden">← 返回星云列表</button>
              {selected ? <>
              <div className="font-mono text-[9px] tracking-[.18em] text-cyan-100/45">{selected.tier === "current" ? "LOCAL A-LINE DISPLAY" : "BETA CANDIDATE"}</div>
              <h3 ref={detailHeadingRef} tabIndex={-1} className="mt-1 text-base text-cyan-50 outline-offset-4">{selected.subtitleCn}</h3>
              <p className="mt-1 text-xs text-slate-400">{selected.catalogName} · {NEBULA_KIND_LABELS[selected.kind]}</p>
              <nav aria-label="已筛选星云逐项查看" className="mt-3 flex items-center justify-between gap-2">
                <button type="button" disabled={!view.canGoPrevious} onClick={() => dispatch({ type: "step", direction: -1 })}
                  className="min-h-11 rounded border border-white/15 px-2 text-xs disabled:opacity-30">上一条</button>
                <span className="font-mono text-[10px] text-slate-400">{view.selectedIndex + 1} / {view.visible.length}</span>
                <button type="button" disabled={!view.canGoNext} onClick={() => dispatch({ type: "step", direction: 1 })}
                  className="min-h-11 rounded border border-white/15 px-2 text-xs disabled:opacity-30">下一条</button>
              </nav>
              <NebulaEvidencePreview key={`${selected.id}:${selected.sourceImagePath}`} entry={selected} />
              <NebulaCatalogParameters entry={selected} />
              <div className="mt-4 space-y-2 text-xs leading-5 text-slate-400">
                <p><span className="text-slate-500">来源状态：</span><strong className={statusTone(selected)}>{nebulaAtlasSourceLabel(selected)}</strong></p>
                <p><span className="text-slate-500">本地展示：</span>{selected.runtimeAdmission === "current" ? "当前 A 线视觉预览" : "来源候选，未加载原图"}</p>
                <p data-mainline-a-nebula-release-admission={selected.releaseAdmission}><span className="text-slate-500">网页版发布准入：</span>{selected.releaseAdmission === "approved" ? "已批准" : "candidate-only · hold · not-admitted"}</p>
                <p data-mainline-a-nebula-rights-review={selected.rightsReviewState}><span className="text-slate-500">逐图版权审核：</span>{selected.humanRightsSignoff === "pending" ? "pending（未签署）" : "已签署"}</p>
                <p><span className="text-slate-500">{selected.tier === "current" ? "本地展示文件：" : "来源文件："}</span>{formatNebulaSourceBytes(selected.sourceBytes)}{selected.sourceDimensions ? ` · ${selected.sourceDimensions.width}×${selected.sourceDimensions.height}` : " · 尺寸未提供"}</p>
                <p><span className="text-slate-500">科学写回：</span>关闭；此面板仅用于视觉和来源审阅。</p>
              </div>
              {sourcePage ? <a href={sourcePage} target="_blank" rel="noopener noreferrer" className="mt-4 block break-all text-xs text-cyan-100/70 underline">打开原始来源页面（新窗口）</a>
                : <p className="mt-4 text-xs text-amber-100/70">尚无可用的 HTTPS 来源链接。</p>}
              {licensePage ? <a href={licensePage} target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-cyan-100/70 underline">查看来源使用条款（新窗口）</a> : null}
              <p className="mt-3 rounded border border-amber-100/15 p-2 text-[10px] leading-5 text-amber-100/75">
                使用条款和署名均为审核输入；当前记录仍为 hold / not-admitted，未由许可文字自动签署或准入。
              </p>
              {selected.rightsIssues.length ? <p role="alert" className="mt-2 text-[10px] text-red-200">来源对照异常：{selected.rightsIssues.join("、")}</p> : null}
              {selected.sourceCredit ? <p className="mt-3 text-[10px] leading-5 text-slate-500">署名：{selected.sourceCredit}</p> : null}
              {selected.sourceLicense ? <p className="mt-3 break-words text-[10px] leading-5 text-slate-500">来源许可标记：{selected.sourceLicense}</p> : null}
              {selected.sourceSha256 ? <p className="mt-3 break-all font-mono text-[9px] text-slate-600">SHA-256 {selected.sourceSha256}</p> : null}
              </> : <div className="py-6 text-sm leading-7 text-slate-400">
                <h3 className="text-slate-200">当前筛选下没有选中记录</h3>
                <p className="mt-2 text-xs">详情随可见列表更新；清除筛选后可重新选择星云。</p>
              </div>}
            </aside>
          </div>
        </div>
      </div>
    </dialog>
  );
}
