"use client";

import { useMemo, useState } from "react";
import { currentReadinessV663, filterReadinessV663,
  type ReadinessGroupV663 } from "../lib/mainlineAWebReadinessV663";
import { reviewNavigationV664, stepReviewNavigationV664,
  type ReviewDirectionV664 } from "../lib/mainlineAReviewNavigationV664";

type Group = ReadinessGroupV663 | "all";
const GROUPS: { key: Group; label: string }[] = [
  { key: "all", label: "全部 9 项" },
  { key: "stellar-component", label: "恒星组件 4" },
  { key: "nebula-image", label: "星云原图 5" },
];

export default function MainlineAWebReadinessPanelV663() {
  const readiness = useMemo(currentReadinessV663, []);
  const [expanded, setExpanded] = useState(false);
  const [group, setGroup] = useState<Group>("all");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState("star:acrux");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const visible = useMemo(() => filterReadinessV663(
    readiness.rows, group, query), [readiness.rows, group, query]);
  const visibleKeys = useMemo(() => visible.map((item) => item.key),
    [visible]);
  const navigation = reviewNavigationV664(visibleKeys, selectedKey);
  const selected = visible.find((item) =>
    item.key === navigation.currentKey) ?? null;

  function move(direction: ReviewDirectionV664) {
    const next = stepReviewNavigationV664(visibleKeys,
      navigation.currentKey, direction);
    if (next) setSelectedKey(next);
  }

  return <section className="mb-4 min-w-0 rounded-lg border border-amber-100/25 bg-amber-100/[.025] p-3"
    aria-label="网页版来源与发布门禁"
    data-mainline-a-r76-readiness="v663"
    data-mainline-a-r76-state={readiness.status}
    data-mainline-a-r76-release="blocked"
    data-mainline-a-r77-mobile-mode={mobileDetailOpen
      ? "detail" : "list"}
    data-scientific-payload-writeback="false">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-mono text-[9px] tracking-[.18em] text-amber-100/60">
          MAINLINE A / WEB RELEASE READINESS / V663</p>
        <h3 className="mt-1 text-sm text-amber-50">来源与发布门禁</h3>
        <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">
          四颗恒星已有结构化交叉标识，但尚未确认物理组件。
          五张星云图仅保存官方页面，现行逐项策略禁止请求原图。
        </p>
      </div>
      <button type="button" onClick={() => {
        setExpanded((value) => !value);
        setMobileDetailOpen(false);
      }}
        aria-expanded={expanded} aria-controls="mainline-a-r76-readiness-body"
        className="min-h-10 rounded border border-amber-100/30 px-3 text-xs text-amber-50"
        data-mainline-a-r76-toggle="true">
        {expanded ? "收起待审事项" : "查看待审事项"}
      </button>
    </header>
    <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6"
      aria-label="逐项发布门禁">
      {readiness.gates.map((gate) => <div key={gate.key}
        data-mainline-a-r76-gate={gate.key}
        data-mainline-a-r76-gate-status={gate.status}
        className="min-w-0 rounded border border-amber-100/10 bg-black/15 p-2">
        <strong className="block text-[11px] text-amber-50">
          {gate.value}</strong>
        <span className="mt-0.5 block text-[9px] text-slate-400">
          {gate.label}</span>
      </div>)}
    </div>
    <p className="mt-2 text-[10px] leading-5 text-amber-100/80"
      role="status" data-mainline-a-r76-summary="true">
      公开发布：blocked · candidate-only · hold · not-admitted ·
      scientificPayloadWriteback=false
    </p>
    {readiness.status === "invalid-all-held" && <p role="alert"
      className="mt-2 rounded border border-red-100/20 p-2 text-xs text-red-100">
      来源校验失败；全部对象保持 hold：{readiness.issues.join(" · ")}
    </p>}
    {expanded && readiness.status === "valid-candidate-hold" &&
      <div id="mainline-a-r76-readiness-body"
        data-mainline-a-r76-body="open"
        className="mt-3 border-t border-white/10 pt-3">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block text-[10px] text-slate-400">
            搜索对象或审核原因
            <input value={query} onChange={(event) => {
              setQuery(event.target.value);
              setMobileDetailOpen(false);
            }}
              aria-label="搜索待审事项"
              placeholder="例如 Polaris、M27 或版权"
              className="mt-1 min-h-10 w-full min-w-0 rounded border border-white/15 bg-black/20 px-3 text-xs text-slate-100" />
          </label>
          <div aria-label="待审类别" className="flex flex-wrap items-end gap-1">
            {GROUPS.map((item) => <button key={item.key}
              type="button" onClick={() => {
                setGroup(item.key);
                setMobileDetailOpen(false);
              }}
              aria-pressed={group === item.key}
              className={`min-h-10 rounded border px-2 text-[10px] ${
                group === item.key ? "border-amber-100/50 bg-amber-100/10 text-amber-50"
                  : "border-white/10 text-slate-400"}`}>
              {item.label}</button>)}
          </div>
        </div>
        <p className="mt-2 text-[10px] text-slate-500" role="status"
          data-mainline-a-r76-visible-count={visible.length}>
          显示 {visible.length}/{readiness.rows.length}；此面板不发起原图请求。
        </p>
        <div className="mt-3 grid min-w-0 gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className={`${mobileDetailOpen
            ? "hidden lg:grid" : "grid"} min-w-0 content-start grid-cols-1 gap-1.5 sm:grid-cols-2`}
            aria-label="待审对象">
            {visible.map((row) => <button key={row.key} type="button"
              onClick={() => {
                setSelectedKey(row.key);
                setMobileDetailOpen(true);
              }}
              aria-pressed={selected?.key === row.key}
              data-mainline-a-r76-item={row.key}
              data-mainline-a-r76-item-state={row.state}
              className={`min-h-11 min-w-0 rounded border p-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-100 ${ 
                selected?.key === row.key
                  ? "border-amber-100/50 bg-amber-100/10"
                  : "border-white/10 bg-[#07151d]"}`}>
              <span className="block truncate text-[11px] text-slate-100">
                {row.title}</span>
              <span className="mt-1 block truncate font-mono text-[9px] text-slate-500">
                {row.id}</span>
              <span className="mt-1 block text-[9px] text-amber-100/75">
                {row.group === "stellar-component"
                  ? "物理组件待审" : "原图获取被策略阻断"}</span>
            </button>)}
            {!visible.length && <p className="rounded border border-white/10 p-3 text-xs text-slate-400"
              role="status">没有匹配对象，未自动替换审核目标。</p>}
          </div>
          {selected && <aside className={`${mobileDetailOpen
            ? "block" : "hidden lg:block"} min-w-0 rounded border border-white/10 bg-[#07131d] p-3`}
            aria-label="待审对象详情"
            data-mainline-a-r76-detail={selected.key}>
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-white/10 pb-2 lg:hidden"
              data-mainline-a-r77-readiness-controls="true">
              <button type="button"
                onClick={() => setMobileDetailOpen(false)}
                className="min-h-11 rounded border border-amber-100/25 px-3 text-xs text-amber-50"
                aria-label="返回待审对象列表">
                返回列表
              </button>
              <span className="text-[10px] text-slate-400"
                role="status" aria-live="polite">
                {navigation.announcement}
              </span>
            </div>
            <p className="font-mono text-[9px] tracking-[.1em] text-amber-100/55">
              {selected.group.toUpperCase()} / {selected.id}</p>
            <h4 className="mt-1 break-words text-sm text-amber-50">
              {selected.title}</h4>
            <p className="mt-1 text-[10px] text-slate-400">
              {selected.subtitle}</p>
            <p className="mt-3 rounded border border-amber-100/15 bg-amber-100/[.035] p-2 text-[11px] leading-5 text-amber-50/85">
              {selected.reviewQuestion}</p>
            <div className="mt-3 grid gap-1.5 text-[10px] sm:grid-cols-2">
              <p className="rounded border border-white/10 p-2 text-slate-300">
                原始证据 {selected.rawEvidenceCount} 组</p>
              <p className="rounded border border-white/10 p-2 text-slate-300">
                {selected.group === "stellar-component"
                  ? "结构化响应" : "原图响应"} {selected.responseCaptured}/1</p>
              <p className="rounded border border-white/10 p-2 text-slate-300">
                {selected.group === "stellar-component"
                  ? "组件审核：pending" : "版权签署：pending"}</p>
              <p className="rounded border border-white/10 p-2 text-slate-300">
                运行时准入：candidate-only</p>
            </div>
            <a href={selected.sourceUrl} target="_blank"
              rel="noreferrer" className="mt-3 block break-all text-[10px] text-cyan-100/80 underline">
              查看官方来源</a>
            <div className="mt-3 flex flex-wrap gap-1">
              {selected.issueCodes.map((code, index) => <span
                key={`${code}-${index}`}
                className="rounded border border-amber-100/15 px-1.5 py-0.5 text-[9px] text-amber-100/70">
                {code}</span>)}
            </div>
            <p className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-4 text-slate-500">
              页面、交叉标识或截图均未自动转为科学确认、版权批准或发布许可。
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 lg:hidden">
              <button type="button" onClick={() => move("previous")}
                disabled={!navigation.canGoPrevious}
                className="min-h-11 rounded border border-white/15 px-3 text-xs text-amber-50 disabled:opacity-35"
                aria-label="上一个待审对象"
                data-mainline-a-r77-readiness-previous="true">
                上一个
              </button>
              <button type="button" onClick={() => move("next")}
                disabled={!navigation.canGoNext}
                className="min-h-11 rounded border border-white/15 px-3 text-xs text-amber-50 disabled:opacity-35"
                aria-label="下一个待审对象"
                data-mainline-a-r77-readiness-next="true">
                下一个
              </button>
            </div>
          </aside>}
        </div>
      </div>}
  </section>;
}
