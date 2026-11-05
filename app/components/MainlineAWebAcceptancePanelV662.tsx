"use client";

import { useMemo, useRef, useState } from "react";
import canonical from "../data/mainlineACanonicalCoverageV622.generated.json";
import sky from "../data/mainlineAWebSkyAtlasV656.generated.json";
import nebula from "../data/mainlineANebulaR73CatalogV660.generated.json";
import alternatives from "../data/mainlineANebulaR74AlternativesV661.generated.json";
import { assembleMainlineAWebAcceptanceV662,
  filterMainlineAWebAcceptanceV662,
  type WebAcceptanceGroupV662,
  type WebAcceptanceStateV662 } from "../lib/mainlineAWebAcceptanceV662";
import { reviewNavigationV664, stepReviewNavigationV664,
  type ReviewDirectionV664 } from "../lib/mainlineAReviewNavigationV664";
import { assembleVisualReviewIndexV666 } from
  "../lib/mainlineAR79VisualReviewV666";
import MainlineAR79ReviewLanesV666 from
  "./MainlineAR79ReviewLanesV666";
import MainlineAR79VisualInspectionV666 from
  "./MainlineAR79VisualInspectionV666";
import { createVisualSessionV667, recordVisualCycleV667 } from
  "../lib/mainlineAR80VisualSessionV667";
import MainlineAR80VisualCoverageV667 from
  "./MainlineAR80VisualCoverageV667";

type GroupChoice = WebAcceptanceGroupV662 | "all";
type StateChoice = WebAcceptanceStateV662 | "all";

const GROUPS: readonly { key: GroupChoice; label: string }[] = [
  { key: "all", label: "全部 96" },
  { key: "a-star", label: "A 恒星 12" },
  { key: "a-constellation", label: "A 星座 12" },
  { key: "a-nebula", label: "A 星云 12" },
  { key: "beta-star", label: "Beta 恒星 24" },
  { key: "beta-constellation", label: "Beta 星座 12" },
  { key: "beta-nebula", label: "Beta 星云 24" },
];
const STATES: readonly { key: StateChoice; label: string }[] = [
  { key: "all", label: "全部状态" },
  { key: "reviewable", label: "本机可审查" },
  { key: "source-hold", label: "来源/原图 hold" },
  { key: "identity-hold", label: "身份 hold" },
  { key: "signoff-hold", label: "待签署" },
];
const STATE_LABELS: Record<WebAcceptanceStateV662, string> = {
  reviewable: "本机可审查 · 未准入",
  "source-hold": "来源或原图 hold",
  "identity-hold": "组件身份 hold",
  "signoff-hold": "逐项签署 hold",
};

function Metric({ label, value, warning = false }: {
  label: string; value: string; warning?: boolean;
}) {
  return <div className="min-w-0 rounded border border-white/10 bg-black/15 p-2 text-center">
    <strong className={`block font-mono text-sm ${warning
      ? "text-amber-100" : "text-cyan-50"}`}>{value}</strong>
    <span className="mt-0.5 block text-[9px] text-slate-500">{label}</span>
  </div>;
}

export default function MainlineAWebAcceptancePanelV662({
  onExpandedChange,
}: { onExpandedChange?: (expanded: boolean) => void } = {}) {
  const matrix = useMemo(() => assembleMainlineAWebAcceptanceV662(
    canonical, sky, nebula, alternatives), []);
  const visualIndex = useMemo(() => assembleVisualReviewIndexV666(
    matrix, nebula), [matrix]);
  const [expanded, setExpanded] = useState(false);
  const [group, setGroup] = useState<GroupChoice>("all");
  const [state, setState] = useState<StateChoice>("all");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState("a:star:alpha-centauri-a");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [visualSession, setVisualSession] = useState(() =>
    createVisualSessionV667(visualIndex));
  const listRef = useRef<HTMLDivElement>(null);
  const visible = useMemo(() => filterMainlineAWebAcceptanceV662(
    matrix.rows, group, state, query), [matrix.rows, group, state, query]);
  const visibleKeys = useMemo(() => visible.map((row) => row.key),
    [visible]);
  const navigation = reviewNavigationV664(visibleKeys, selectedKey);
  const selected = visible.find((row) =>
    row.key === navigation.currentKey) ?? null;
  const selectedVisual = selected && visualIndex.status === "valid-candidate-hold"
    ? visualIndex.plans.find((plan) => plan.key === selected.key) ?? null
    : null;

  function choose(key: string) {
    setSelectedKey(key);
    setMobileDetailOpen(true);
  }
  function move(direction: ReviewDirectionV664) {
    const next = stepReviewNavigationV664(visibleKeys,
      navigation.currentKey, direction);
    if (next) setSelectedKey(next);
  }
  function navigate(index: number, key: string) {
    const next = key === "Home" ? 0 : key === "End" ? visible.length - 1
      : key === "ArrowRight" || key === "ArrowDown"
        ? Math.min(visible.length - 1, index + 1)
        : Math.max(0, index - 1);
    const row = visible[next];
    if (!row) return;
    setSelectedKey(row.key);
    listRef.current?.querySelector<HTMLElement>(
      `[data-mainline-a-r75-choice-index="${next}"]`)?.focus();
  }

  return <section className="mb-4 min-w-0 rounded-lg border border-cyan-100/25 bg-cyan-100/[.025] p-3"
    aria-label="Mainline A 网页跨入口验收矩阵"
    data-mainline-a-r75-acceptance="v662"
    data-mainline-a-r75-data={matrix.status}
    data-mainline-a-r75-release="blocked"
    data-mainline-a-r77-mobile-mode={mobileDetailOpen
      ? "detail" : "list"}
    data-scientific-payload-writeback="false">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-mono text-[9px] tracking-[.18em] text-cyan-100/55">
          MAINLINE A / WEB ACCEPTANCE MATRIX / V662</p>
        <h3 className="mt-1 text-sm text-cyan-50">A 线与 Beta 跨入口验收总览</h3>
        <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">
          汇总 36 项 A 线清单、24 星、12 星座与 24 项星云候选。
          数据校验只确定待测路径；浏览器、长跑和人工签署仍须独立完成。
        </p>
      </div>
      <button type="button" onClick={() => {
        const next = !expanded;
        setExpanded(next);
        onExpandedChange?.(next);
        setMobileDetailOpen(false);
      }}
        aria-expanded={expanded} aria-controls="mainline-a-r75-matrix-body"
        className="min-h-10 shrink-0 rounded border border-cyan-100/30 px-3 text-xs text-cyan-100"
        data-mainline-a-r75-toggle="true">
        {expanded ? "收起跨入口矩阵" : "展开跨入口矩阵"}
      </button>
    </header>
    <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-8">
      <Metric label="A 恒星" value={`${matrix.counts.aStars}/12`} />
      <Metric label="A 星座" value={`${matrix.counts.aConstellations}/12`} />
      <Metric label="A 星云" value={`${matrix.counts.aNebulae}/12`} />
      <Metric label="Beta 恒星" value={`${matrix.counts.betaStars}/24`} />
      <Metric label="Beta 星座" value={`${matrix.counts.betaConstellations}/12`} />
      <Metric label="Beta 原图链" value={`${matrix.counts.reviewImages}/24`} />
      <Metric label="身份待审" value={`${matrix.counts.identityHolds}/4`} warning />
      <Metric label="发布准入" value="0" warning />
    </div>
    <p className="mt-2 text-[10px] leading-5 text-amber-100/80"
      role="status" data-mainline-a-r75-static-state={matrix.status}>
      {matrix.status === "valid" ? "清单结构可核 · 权利待签 · 运行时未准入"
        : "清单校验失败 · 所有跨入口对象保持 hold"}
      {" · "}candidate-only · hold · not-admitted · scientificPayloadWriteback=false
    </p>
    {matrix.status === "invalid" && <p role="alert"
      className="mt-2 rounded border border-red-100/20 p-2 text-xs text-red-100">
      {matrix.issues.join(" · ")}
    </p>}
    {expanded && matrix.status === "valid" && <div id="mainline-a-r75-matrix-body"
      data-mainline-a-r75-body="open" className="mt-3 border-t border-white/10 pt-3">
      <MainlineAR79ReviewLanesV666 index={visualIndex}
        group={group} state={state}
        onChoose={(nextGroup, nextState) => {
          setGroup(nextGroup);
          setState(nextState);
          setQuery("");
          setMobileDetailOpen(false);
        }} />
      <MainlineAR80VisualCoverageV667 index={visualIndex}
        session={visualSession} onJump={(key) => {
          const plan = visualIndex.plans.find((item) =>
            item.key === key && item.requestAllowed);
          if (!plan) return;
          setGroup(plan.group);
          setState("all");
          setQuery("");
          setSelectedKey(key);
          setMobileDetailOpen(true);
        }} />
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <label className="block text-[10px] text-slate-400">搜索对象、路径或来源
          <input value={query} onChange={(event) => {
            setQuery(event.target.value);
            setMobileDetailOpen(false);
          }}
            aria-label="搜索跨入口验收对象"
            placeholder="例如 Acrux、M27 或 source URL"
            className="mt-1 min-h-10 w-full min-w-0 rounded border border-white/15 bg-black/20 px-3 text-xs text-slate-100" />
        </label>
        <label className="block text-[10px] text-slate-400">审核状态
          <select value={state} onChange={(event) =>
            { setState(event.target.value as StateChoice);
              setMobileDetailOpen(false); }}
            aria-label="筛选跨入口审核状态"
            className="mt-1 min-h-10 w-full rounded border border-white/15 bg-[#07131d] px-3 text-xs text-slate-100">
            {STATES.map((item) => <option value={item.key} key={item.key}>
              {item.label}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="跨入口类别">
        {GROUPS.map((item) => <button key={item.key} type="button"
          onClick={() => {
            setGroup(item.key);
            setMobileDetailOpen(false);
          }} aria-pressed={group === item.key}
          className={`min-h-9 rounded border px-2 text-[10px] ${group === item.key
            ? "border-cyan-100/50 bg-cyan-100/10 text-cyan-50"
            : "border-white/10 text-slate-400"}`}>
          {item.label}</button>)}
      </div>
      <p role="status" className="mt-2 text-[10px] text-slate-500"
        data-mainline-a-r75-visible-count={visible.length}>
        显示 {visible.length}/{matrix.rows.length} · 此处不发起外部图片请求
      </p>
      <div className="mt-3 grid min-w-0 gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div ref={listRef} className={`${mobileDetailOpen
          ? "hidden lg:grid" : "grid"} min-w-0 content-start grid-cols-1 gap-1.5 sm:grid-cols-3`}
          aria-label="跨入口待测对象列表">
          {visible.map((row, index) => <button key={row.key} type="button"
            onClick={() => choose(row.key)}
            onKeyDown={(event) => {
              if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"]
                .includes(event.key)) {
                event.preventDefault(); navigate(index, event.key);
              }
            }}
            aria-pressed={selected?.key === row.key}
            data-mainline-a-r75-row={row.key}
            data-mainline-a-r75-state={row.state}
            data-mainline-a-r75-choice-index={index}
            className={`min-h-11 min-w-0 rounded border p-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-100 ${ 
              selected?.key === row.key
                ? "border-cyan-100/50 bg-cyan-100/10" : "border-white/10 bg-[#07151d]"}`}>
            <span className="block truncate text-[11px] text-slate-100">{row.title}</span>
            <span className="mt-1 block truncate font-mono text-[9px] text-slate-500">
              {row.group} · {row.id}</span>
            <span className={`mt-1 block text-[9px] ${row.state === "reviewable"
              ? "text-cyan-100/70" : "text-amber-100/75"}`}>
              {STATE_LABELS[row.state]}</span>
          </button>)}
          {!visible.length && <p role="status"
            className="col-span-full rounded border border-white/10 p-4 text-xs text-slate-400">
            没有匹配的对象；未自动选择其他候选。</p>}
        </div>
        {selected && <aside className={`${mobileDetailOpen
          ? "block" : "hidden lg:block"} min-w-0 rounded border border-white/10 bg-[#07131d] p-3`}
          aria-label="跨入口对象详情"
          data-mainline-a-r75-detail={selected.key}>
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-white/10 pb-2 lg:hidden"
            data-mainline-a-r77-mobile-controls="true">
            <button type="button" onClick={() => setMobileDetailOpen(false)}
              className="min-h-11 rounded border border-cyan-100/20 px-3 text-xs text-cyan-50"
              aria-label="返回跨入口对象列表">
              返回列表
            </button>
            <span className="text-[10px] text-slate-400"
              role="status" aria-live="polite">
              {navigation.announcement}
            </span>
          </div>
          <p className="font-mono text-[9px] tracking-[.12em] text-cyan-100/55">
            {selected.group.toUpperCase()} / {selected.id}</p>
          <h4 className="mt-1 text-base text-cyan-50">{selected.title}</h4>
          <p className="mt-1 text-[11px] text-amber-100">
            {STATE_LABELS[selected.state]} · 版权 pending</p>
          <dl className="mt-3 grid gap-2 text-[10px] leading-5 sm:grid-cols-2">
            <div><dt className="text-slate-500">运行时参考路径</dt>
              <dd className="break-all text-slate-300">{selected.route ?? "未开放"}</dd></div>
            <div><dt className="text-slate-500">本机图片路径</dt>
              <dd className="break-all text-slate-300">
                {selected.imageRoute ?? "无可请求原图"}</dd></div>
            <div><dt className="text-slate-500">组件身份</dt>
              <dd className="text-slate-300">{selected.componentIdentity}</dd></div>
            <div><dt className="text-slate-500">来源页面</dt><dd>
              <a href={selected.sourceUrl} target="_blank" rel="noreferrer"
                className="break-all text-cyan-100/80 underline">查看来源</a></dd></div>
          </dl>
          <p className="mt-3 break-all font-mono text-[9px] leading-4 text-slate-500">
            来源 SHA-256 {selected.sourceSha256}</p>
          {selected.imageSha256 && <p className="mt-1 break-all font-mono text-[9px] leading-4 text-slate-500">
            候选图片 SHA-256 {selected.imageSha256}</p>}
          {selectedVisual && <MainlineAR79VisualInspectionV666
            key={selectedVisual.key} plan={selectedVisual}
            onCycle={(cycle) => setVisualSession((current) =>
              recordVisualCycleV667(current, visualIndex, cycle).state)} />}
          {selected.alternatives.length > 0 && <div className="mt-3 rounded border border-amber-100/15 p-2">
            <p className="text-[10px] text-amber-100">替代官方页面，仅供身份核对</p>
            {selected.alternatives.map((item) => <div key={item.key}
              data-mainline-a-r75-alternative={item.key}
              className="mt-2 text-[10px] text-slate-300">
              <a href={item.url} target="_blank" rel="noreferrer"
                className="break-all text-cyan-100/75 underline">{item.key}</a>
              <span className="ml-2 text-amber-100/80">{item.pageIdentity}</span>
              <span className="ml-2">原图未请求</span>
            </div>)}
          </div>}
          {selected.notes.length > 0 && <div className="mt-3 flex flex-wrap gap-1">
            {selected.notes.slice(0, 5).map((note) => <span key={note}
              className="rounded border border-amber-100/15 px-1.5 py-0.5 text-[9px] text-amber-100/75">
              {note}</span>)}
          </div>}
          <p className="mt-3 border-t border-white/10 pt-2 text-[10px] text-slate-500">
            candidate-only · hold · not-admitted · scientificPayloadWriteback=false。
            静态验收矩阵不代表科学、版权、性能或公开发布批准。</p>
          <div className="mt-3 grid grid-cols-2 gap-2 lg:hidden">
            <button type="button" onClick={() => move("previous")}
              disabled={!navigation.canGoPrevious}
              className="min-h-11 rounded border border-white/15 px-3 text-xs text-cyan-50 disabled:opacity-35"
              aria-label="上一个跨入口对象"
              data-mainline-a-r77-previous="true">
              上一个
            </button>
            <button type="button" onClick={() => move("next")}
              disabled={!navigation.canGoNext}
              className="min-h-11 rounded border border-white/15 px-3 text-xs text-cyan-50 disabled:opacity-35"
              aria-label="下一个跨入口对象"
              data-mainline-a-r77-next="true">
              下一个
            </button>
          </div>
        </aside>}
      </div>
    </div>}
  </section>;
}
