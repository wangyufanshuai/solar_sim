"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import reviewPack from "../data/mainlineANebulaReviewPackV612.generated.json";
import rightsPack from "../data/mainlineANebulaRightsPackV613.generated.json";
import expansionPack from "../data/mainlineABetaNebulaExpansionV617.generated.json";
import nebulaBatchPack from "../data/mainlineANebulaBatchV624.generated.json";
import b1SourceOverlay from "../data/mainlineANebulaB1SourceV654.generated.json";
import candidateReviewPack from "../data/mainlineANebulaCandidateReviewV655.generated.json";
import nebulaBatchV628Pack from "../data/mainlineANebulaBatchV628.generated.json";
import MainlineANebulaB1SourcePanelV654 from "./MainlineANebulaB1SourcePanelV654";
import MainlineANebulaR71SourcePanelV658 from "./MainlineANebulaR71SourcePanelV658";
import MainlineANebulaR72ExpansionPanelV659 from "./MainlineANebulaR72ExpansionPanelV659";
import MainlineANebulaR73UnifiedGalleryV660 from "./MainlineANebulaR73UnifiedGalleryV660";
import MainlineANebulaR74AlternativePanelV661 from "./MainlineANebulaR74AlternativePanelV661";
import MainlineAWebAcceptancePanelV662 from "./MainlineAWebAcceptancePanelV662";
import MainlineAWebReadinessPanelV663 from "./MainlineAWebReadinessPanelV663";
import type { R72SourceRowV659 } from "../lib/mainlineAR72ExpansionSourceV659";
import type { R74TargetV661 } from "../lib/mainlineANebulaR74AlternativesV661";
import { r73DisplayNameV660,
  type R73GalleryRowV660 } from "../lib/mainlineANebulaR73CatalogV660";
import MainlineANebulaCandidateGalleryV655 from "./MainlineANebulaCandidateGalleryV655";
import MainlineAWebStageFreezePanelV657 from "./MainlineAWebStageFreezePanelV657";
import MainlineANebulaBatchPanelV624 from "./MainlineANebulaBatchPanelV624";
import MainlineANebulaBatchPanelV628 from "./MainlineANebulaBatchPanelV628";
import MainlineANebulaRightsClosurePanelV627 from "./MainlineANebulaRightsClosurePanelV627";
import { receiptLinkageStatusLabel } from "../lib/mainlineANebulaReceiptLinkageV614";
import { nebulaCandidateReviewRows, nebulaReviewSummary, reviewRiskLabel } from "../lib/mainlineANebulaReviewV610";
import { betaNebulaExpansionAcquisitionLabelV617, betaNebulaExpansionBlockerLabelV617, betaNebulaExpansionNextActionV617, betaNebulaExpansionMetadataStateLabelV617, betaNebulaExpansionPayloadLabelV617, betaNebulaExpansionReceiptLabelV617, betaNebulaExpansionRightsLabelV617, betaNebulaExpansionSourceSummaryV617, betaNebulaExpansionStatusLabelV617, betaNebulaExpansionSummaryV617, type BetaNebulaExpansionPackV617 } from "../lib/mainlineABetaNebulaExpansionV617";
import { normalizeNebulaBatchV628 } from "../lib/mainlineANebulaBatchV628";
import type { B1SourceOverlayV654 } from "../lib/mainlineANebulaB1SourceV654";
import type { CandidateReviewPackV655 } from "../lib/mainlineANebulaReviewAssetV655";

type ReviewState = "source-verified" | "rights-review" | "visual-review" | "admission-ready";
type ReviewRecord = (typeof reviewPack.records)[number];

const STATE_LABELS: Record<ReviewState, string> = {
  "source-verified": "来源待补齐",
  "rights-review": "权利待复核",
  "visual-review": "视觉待复核",
  "admission-ready": "可申请准入",
};

const STATE_TONES: Record<ReviewState, string> = {
  "source-verified": "border-slate-200/20 text-slate-300",
  "rights-review": "border-amber-100/30 text-amber-100",
  "visual-review": "border-cyan-100/30 text-cyan-100",
  "admission-ready": "border-emerald-200/35 text-emerald-100",
};

const expansionData = expansionPack as unknown as BetaNebulaExpansionPackV617;
const betaNextSixData = normalizeNebulaBatchV628(nebulaBatchV628Pack);

function displayName(record: ReviewRecord): string {
  return record.catalogName.replace(/\s*\/.*$/, "");
}

function aspect(record: ReviewRecord): number {
  return Math.min(2.5, Math.max(0.7, record.source.width / record.source.height));
}

function preview(record: ReviewRecord): React.CSSProperties {
  const hue = (record.id.length * 37) % 360;
  return {
    aspectRatio: `${aspect(record)}`,
    background: `radial-gradient(ellipse at 44% 48%, hsla(${hue},100%,95%,.92) 0 3%, hsla(${hue},92%,70%,.72) 12%, hsla(${hue},75%,45%,.36) 32%, #07131e 76%), radial-gradient(circle at 76% 28%, hsla(${(hue + 80) % 360},90%,78%,.7) 0 2%, transparent 18%)`,
  };
}

function stateFor(record: ReviewRecord): ReviewState {
  return record.state as ReviewState;
}

export default function MainlineANebulaReviewPanelV610({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<Element | null>(null);
  const headingId = useId();
  const [selectedId, setSelectedId] = useState(reviewPack.records[0]?.id ?? "");
  const [selectedExpansion, setSelectedExpansion] = useState<R72SourceRowV659 | null>(null);
  const [selectedUnified, setSelectedUnified] = useState<R73GalleryRowV660 | null>(null);
  const [selectedAlternative, setSelectedAlternative] = useState<R74TargetV661 | null>(null);
  const selectBaseCandidate = useCallback((id: string) => {
    setSelectedId(id);
    setSelectedExpansion(null);
    setSelectedUnified(null);
    setSelectedAlternative(null);
  }, []);
  const selectExpansion = useCallback((row: R72SourceRowV659 | null) => {
    setSelectedExpansion(row);
    if (row) {
      setSelectedUnified(null);
      setSelectedAlternative(null);
    }
  }, []);
  const selectUnified = useCallback((row: R73GalleryRowV660 | null) => {
    setSelectedUnified(row);
    if (row) {
      setSelectedExpansion(null);
      setSelectedAlternative(null);
    }
  }, []);
  const selectAlternative = useCallback((row: R74TargetV661 | null) => {
    setSelectedAlternative(row);
    if (row) {
      setSelectedExpansion(null);
      setSelectedUnified(null);
    }
  }, []);
  const [stateFilter, setStateFilter] = useState<ReviewState | "all">("all");
  const [query, setQuery] = useState("");
  const [showBlockers, setShowBlockers] = useState(true);
  const [matrixExpanded, setMatrixExpanded] = useState(false);
  const reviewRows = useMemo(() => nebulaCandidateReviewRows(), []);
  const reviewSummary = useMemo(() => nebulaReviewSummary(reviewRows), [reviewRows]);
  const expansionSummary = useMemo(() => betaNebulaExpansionSummaryV617(expansionData), []);

  useEffect(() => {
    previousFocus.current = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previousFocus.current instanceof HTMLElement && previousFocus.current.isConnected) previousFocus.current.focus();
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return reviewPack.records.filter((record) => {
      const matchesState = stateFilter === "all" || stateFor(record) === stateFilter;
      const haystack = [record.id, record.target, record.catalogName, record.nasaId, record.source.credit].join(" ").toLocaleLowerCase();
      return matchesState && (!needle || haystack.includes(needle));
    });
  }, [query, stateFilter]);

  const selected = reviewPack.records.find((record) => record.id === selectedId) ?? filtered[0] ?? reviewPack.records[0];
  const selectedRights = rightsPack.records.find((record) => record.candidateId === selected.id);
  const selectedReview = reviewRows.find((row) => row.id === selected.id.replace(/-nebula$/, "")) ?? reviewRows.find((row) => row.catalogName === selected.catalogName);
  const counts = reviewPack.states.map((state) => ({ state: state as ReviewState, count: reviewPack.records.filter((record) => record.state === state).length }));

  function choose(id: string) {
    selectBaseCandidate(id);
    if (window.matchMedia("(max-width: 1023px)").matches) document.querySelector(`[data-nebula-review-detail="${id}"]`)?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  if (!selected) return null;
  return (
    <dialog ref={dialogRef} onCancel={onClose} aria-labelledby={headingId}
      className="fixed m-auto h-[min(850px,94dvh)] max-h-[94dvh] w-[min(1180px,96vw)] max-w-[96vw] overflow-hidden rounded-xl border border-amber-100/20 bg-[#061019] p-0 text-slate-200 shadow-2xl backdrop:bg-black/75"
      data-mainline-a-nebula-review="true" data-mainline-a-nebula-review-schema={reviewPack.schema}>
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
          <div>
            <div className="font-mono text-[9px] tracking-[.3em] text-amber-100/55">PROVENANCE REVIEW / V612</div>
            <h2 id={headingId} className="mt-1 text-lg text-amber-50">星云清权审查台 <span className="ml-2 font-mono text-xs text-slate-500">{reviewPack.candidateCount} 条候选</span></h2>
            <p className="mt-1 max-w-2xl text-[10px] leading-5 text-slate-400">这里管理逐图来源、权利和视觉 signoff。审查记录不会直接写入科学载荷，也不会自动改变 Mainline A 运行时。</p>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 shrink-0 rounded border border-white/10 px-3 text-sm hover:bg-white/10" aria-label="关闭星云清权审查台">关闭 ×</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
          <div className={`grid min-h-full lg:h-full ${matrixExpanded
            ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_360px]"}`}
            data-mainline-a-r79-matrix-focus={String(matrixExpanded)}>
            <section className="min-w-0 p-4 sm:p-6 lg:overflow-y-auto" aria-label="候选审查记录列表">
              <MainlineAWebAcceptancePanelV662
                onExpandedChange={setMatrixExpanded} />
              <MainlineAWebReadinessPanelV663 />
              <MainlineAWebStageFreezePanelV657 />
              <MainlineANebulaR73UnifiedGalleryV660 onSelectionChange={selectUnified} />
              <MainlineANebulaR74AlternativePanelV661 onSelectionChange={selectAlternative} />
              <MainlineANebulaCandidateGalleryV655 pack={candidateReviewPack as CandidateReviewPackV655} onSelectCandidate={selectBaseCandidate} />
              <MainlineANebulaB1SourcePanelV654 overlay={b1SourceOverlay as B1SourceOverlayV654} imageBatch={nebulaBatchPack} />
              <MainlineANebulaR71SourcePanelV658 onSelectCandidate={selectBaseCandidate} />
              <MainlineANebulaR72ExpansionPanelV659 onSelectionChange={selectExpansion} />
              <MainlineANebulaBatchPanelV624 pack={nebulaBatchPack as unknown as Parameters<typeof MainlineANebulaBatchPanelV624>[0]["pack"]} />
              <MainlineANebulaBatchPanelV628 pack={betaNextSixData} />
              <MainlineANebulaRightsClosurePanelV627 />
              <section className="mb-4 rounded-lg border border-cyan-100/15 bg-cyan-100/[.035] p-3" data-mainline-a-nebula-expansion="v617" aria-label="Beta 星云扩展候选">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><div className="font-mono text-[9px] tracking-[.18em] text-cyan-100/55">BETA NEBULA EXPANSION / V617</div><h3 className="mt-1 text-sm text-cyan-50">24 条候选目标板 <span className="ml-1 font-mono text-[10px] text-slate-500">18 base + 6 expansion</span></h3><p className="mt-1 text-[10px] leading-5 text-slate-400">V617 只登记封存元数据和可追溯来源状态；它不会把 metadata 当成图像，也不会打开运行时或科学载荷。</p></div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[9px]"><div className="rounded border border-white/10 bg-black/15 px-2 py-1"><strong className="block text-sm text-cyan-50">{expansionSummary.candidateTotal}</strong><span className="text-slate-500">候选总数</span></div><div className="rounded border border-white/10 bg-black/15 px-2 py-1"><strong className="block text-sm text-emerald-100">{expansionSummary.localPayloadPresent}</strong><span className="text-slate-500">已有 payload</span></div><div className="rounded border border-white/10 bg-black/15 px-2 py-1"><strong className="block text-sm text-amber-100">{expansionSummary.payloadAcquisitionPending}</strong><span className="text-slate-500">待采集</span></div></div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2" data-mainline-a-nebula-expansion-count={expansionData.records.length}>
                  {expansionData.records.map((record) => <article key={record.candidateId} className="rounded border border-white/10 bg-black/15 px-2.5 py-2" data-mainline-a-nebula-expansion-record={record.candidateId} data-mainline-a-nebula-expansion-state={record.status} data-mainline-a-nebula-expansion-payload={record.payload.state} data-mainline-a-nebula-expansion-rights={betaNebulaExpansionRightsLabelV617(record)}><div className="flex items-center justify-between gap-2"><span className="truncate text-[11px] text-slate-100">{record.candidateId}</span><span className="shrink-0 rounded border border-amber-100/20 px-1.5 py-0.5 text-[8px] text-amber-100">{betaNebulaExpansionStatusLabelV617(record.status)}</span></div><div className="mt-1 truncate text-[9px] text-slate-500">{betaNebulaExpansionSourceSummaryV617(record)}</div><dl className="mt-1 space-y-0.5 text-[8px] text-slate-500"><div><dt className="inline text-slate-600">source/license · </dt><dd className="inline break-all">{record.source.sourceUrl} · {record.source.declaredLicenseState}</dd></div><div><dt className="inline text-slate-600">artifact · </dt><dd className="inline">{record.payload.localPath ?? "未落盘"} · {record.payload.sha256?.slice(0, 12) ?? "SHA 待补"} · {record.payload.bytes ?? 0} bytes</dd></div><div><dt className="inline text-slate-600">metadata · </dt><dd className="inline">{betaNebulaExpansionMetadataStateLabelV617(record)}</dd></div></dl><div className="mt-1 text-[9px] text-amber-100/65">下一步：{betaNebulaExpansionNextActionV617(record)}</div><div className="mt-1 truncate text-[8px] text-slate-600">{record.blockers.map(betaNebulaExpansionBlockerLabelV617).join(" · ")}</div><div className="mt-1 text-[8px] text-slate-500">{betaNebulaExpansionPayloadLabelV617(record.payload.state)} · {betaNebulaExpansionRightsLabelV617(record)} · {betaNebulaExpansionAcquisitionLabelV617(record)} · candidate-only · science payload off</div><div className="mt-1 truncate font-mono text-[8px] text-slate-600">receipts {betaNebulaExpansionReceiptLabelV617(record)}</div></article>)}
                </div>
              </section>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-mainline-a-review-summary="true">
                {counts.map(({ state, count }) => <button key={state} type="button" onClick={() => setStateFilter(stateFilter === state ? "all" : state)} aria-pressed={stateFilter === state} className={`rounded border p-2 text-left ${stateFilter === state ? "bg-white/10" : "bg-white/[.03]"}`}><span className="block text-[9px] text-slate-500">{STATE_LABELS[state]}</span><strong className="text-lg text-amber-50">{count}</strong></button>)}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <input aria-label="搜索清权审查记录" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="目标、目录号、NASA ID 或署名" className="min-h-10 min-w-0 flex-1 rounded border border-white/15 bg-black/20 px-3 text-xs" />
                <button type="button" onClick={() => setStateFilter("all")} className="min-h-10 rounded border border-white/15 px-3 text-xs text-slate-300">全部</button>
              </div>
              <div className="my-3 flex items-center justify-between text-[10px] text-slate-500"><span role="status">显示 {filtered.length} / {reviewPack.candidateCount} 条 · 风险记录 {reviewSummary.withRisks}</span><button type="button" onClick={() => setShowBlockers((value) => !value)} className="underline">{showBlockers ? "隐藏" : "显示"}阻塞项</button></div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" data-mainline-a-nebula-review-result-count={filtered.length}>
                {filtered.map((record) => { const state = stateFor(record); return <button key={record.id} type="button" onClick={() => choose(record.id)} aria-pressed={record.id === selected.id} data-mainline-a-nebula-review-record={record.id} className={`min-w-0 rounded-lg border p-2 text-left ${record.id === selected.id ? "border-amber-100/50 bg-[#1d211d]" : "border-white/10 bg-[#09151e] hover:border-slate-500"}`}><div className="w-full rounded border border-white/10" style={preview(record)} aria-hidden="true" /><div className="mt-2 flex items-center justify-between gap-2"><span className="truncate text-xs text-slate-100">{displayName(record)}</span><span className={`shrink-0 rounded border px-1.5 py-0.5 text-[8px] ${STATE_TONES[state]}`}>{STATE_LABELS[state]}</span></div><span className="mt-1 block truncate font-mono text-[9px] text-slate-500">{record.catalogName} · {record.nasaId}</span></button>; })}
              </div>
              {!filtered.length ? <p className="py-8 text-center text-sm text-slate-400">没有匹配的审查记录。</p> : null}
            </section>
            {!matrixExpanded && (selectedAlternative ? <aside
              className="min-w-0 border-t border-white/10 bg-[#0a1720] p-4 lg:overflow-y-auto lg:border-l lg:border-t-0"
              data-nebula-review-r74-detail={selectedAlternative.id}
              aria-label="选中 R74 官方替代来源审查详情">
              <div className="font-mono text-[9px] tracking-[.18em] text-amber-100/50">OFFICIAL PAGE REVIEW / R74</div>
              <h3 className="mt-1 text-base text-amber-50">{selectedAlternative.id}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                已捕获 {selectedAlternative.alternatives.length} 个官方页面候选。
                本轮没有取得任何原图；页面列出的下载地址只用于规格核对。
              </p>
              {selectedAlternative.conflicts.length > 0 && <div className="mt-3 rounded border border-rose-200/25 bg-rose-100/[.035] p-2.5 text-xs leading-5 text-rose-100">
                {selectedAlternative.conflicts.join(" · ")} 的 Target 字段与页面标题冲突，禁止用作该对象的单独身份依据。
              </div>}
              <dl className="mt-4 space-y-2 text-xs leading-5 text-slate-400">
                <div><dt className="text-slate-500">待核官方页面</dt>
                  <dd>{selectedAlternative.alternatives.map((item) => item.title ?? item.sourceKey).join(" / ")}</dd></div>
                <div><dt className="text-slate-500">可继续核对的页面</dt>
                  <dd>{selectedAlternative.preferredSourceKey ?? "无"}</dd></div>
                <div><dt className="text-slate-500">原图</dt><dd>请求 0 · 捕获 0</dd></div>
                <div><dt className="text-slate-500">逐图版权</dt><dd>pending · 签署 0</dd></div>
                <div><dt className="text-slate-500">视觉审核</dt><dd>pending</dd></div>
                <div><dt className="text-slate-500">运行时准入</dt><dd>candidate-only · hold · not-admitted</dd></div>
              </dl>
              <p className="mt-4 border-t border-white/10 pt-3 text-[10px] leading-5 text-amber-100/70">
                scientificPayloadWriteback=false。当前页面证据不会写入科学载荷或改变 canonical 图像。
              </p>
            </aside> : selectedUnified ? <aside
              className="min-w-0 border-t border-white/10 bg-[#0a1720] p-4 lg:overflow-y-auto lg:border-l lg:border-t-0"
              data-nebula-review-detail={selectedUnified.id}
              data-nebula-review-unified-detail="v660"
              aria-label="选中统一星云候选审查详情">
              <div className="font-mono text-[9px] tracking-[.18em] text-cyan-100/50">BETA NEBULAE / R73</div>
              <h3 className="mt-1 text-base text-cyan-50">{r73DisplayNameV660(selectedUnified)}</h3>
              <p className="mt-1 font-mono text-[10px] text-slate-400">{selectedUnified.nasaId} · {selectedUnified.cohort}</p>
              <div className="mt-4 rounded border border-amber-100/20 bg-amber-100/[.035] p-3 text-xs leading-5 text-amber-50/80">
                <strong>{selectedUnified.imageState === "review-image"
                  ? "已有可比原图链，可在左侧受控预览"
                  : "原图请求未执行，保持 hold"}</strong>
                <p className="mt-1">逐图版权仍 pending；此项不进入 canonical 运行时或科学图像载荷。</p>
              </div>
              <dl className="mt-4 space-y-2 text-xs leading-5 text-slate-400">
                <div><dt className="text-slate-500">逐图页面</dt><dd>{selectedUnified.sourcePageIdentity === "item-page" ? "身份可核" : "通用页面壳"}</dd></div>
                <div><dt className="text-slate-500">署名依据</dt><dd>{selectedUnified.creditEvidence === "historical-only" ? "仅历史记录" : selectedUnified.creditEvidence === "structured-current" ? "当前结构化记录" : "逐图页面捕获"}</dd></div>
                <div><dt className="text-slate-500">来源署名</dt><dd>{selectedUnified.credit}</dd></div>
                <div><dt className="text-slate-500">本机资源</dt><dd>{selectedUnified.delivery ? `${selectedUnified.delivery.width}×${selectedUnified.delivery.height} · ${selectedUnified.delivery.bytes} bytes` : "未请求原图，responseCaptured=0"}</dd></div>
              </dl>
              <div className="mt-4 border-t border-white/10 pt-3 text-[10px] leading-5 text-amber-100/70">candidate-only · hold · not-admitted · scientificPayloadWriteback=false。左侧给出本轮文件哈希、失败状态与阻塞项。</div>
            </aside> : selectedExpansion ? <aside
              className="min-w-0 border-t border-white/10 bg-[#0a1720] p-4 lg:overflow-y-auto lg:border-l lg:border-t-0"
              data-nebula-review-detail={selectedExpansion.id}
              data-nebula-review-expansion-detail="v659"
              aria-label="选中扩展星云审查详情">
              <div className="font-mono text-[9px] tracking-[.18em] text-cyan-100/50">BETA EXPANSION REVIEW / R72</div>
              <h3 className="mt-1 text-base text-cyan-50">{selectedExpansion.title}</h3>
              <p className="mt-1 font-mono text-[10px] text-slate-400">{selectedExpansion.nasaId}</p>
              <div className="mt-4 rounded border border-amber-100/20 bg-amber-100/[.035] p-3 text-xs leading-5 text-amber-50/80">
                <strong>当前状态：{selectedExpansion.imageRaw ? "一份原图已存" : "原图请求未执行"}</strong>
                <p className="mt-1">逐图版权未签；仅供本机候选审查，运行时与科学图像载荷均未准入。</p>
              </div>
              <dl className="mt-4 space-y-2 text-xs leading-5 text-slate-400">
                <div><dt className="text-slate-500">来源身份</dt><dd>NASA 结构化记录与原图清单已核对</dd></div>
                <div><dt className="text-slate-500">网页身份</dt><dd>{selectedExpansion.pageIdentityVerified ? "逐图可核" : "仅通用页面壳"}</dd></div>
                <div><dt className="text-slate-500">署名状态</dt><dd>{selectedExpansion.currentStructuredCreditVerified ? "当前来源记录已核对" : "当前 API 缺少逐项署名"}</dd></div>
                <div><dt className="text-slate-500">历史来源署名</dt><dd>{selectedExpansion.expectedCredit}</dd></div>
                <div><dt className="text-slate-500">原图请求</dt><dd>{selectedExpansion.imageRequestExecuted ? "已执行并保存原始字节" : "审核阻塞，responseCaptured=0"}</dd></div>
              </dl>
              <div className="mt-4 border-t border-white/10 pt-3 text-[10px] leading-5 text-amber-100/70">
                candidate-only · hold · not-admitted · scientificPayloadWriteback=false。
                左侧审查板提供本轮来源哈希、图片状态及逐项阻塞信息。
              </div>
            </aside> : <aside className="min-w-0 border-t border-white/10 bg-[#0a1720] p-4 lg:overflow-y-auto lg:border-l lg:border-t-0" data-nebula-review-detail={selected.id} aria-label="选中候选审查详情">
              <div className="font-mono text-[9px] tracking-[.18em] text-amber-100/50">CANDIDATE REVIEW RECORD</div>
              <h3 className="mt-1 text-base text-amber-50">{displayName(selected)}</h3>
              <p className="mt-1 text-xs text-slate-400">{selected.catalogName} · {selected.target}</p>
              <div className="mt-4 w-full rounded border border-white/10" style={preview(selected)} role="img" aria-label={`${displayName(selected)} 参数化审查预览；不是科学观测图`} />
              <p className="mt-1 text-[10px] text-slate-500">此处是参数化审查示意，不是观测图；左侧候选图集展示已采集原图的本地缩放预览。</p>
              <div className="mt-4 rounded border border-amber-100/15 bg-amber-100/[.035] p-3 text-xs leading-5 text-amber-50/75"><strong className="text-amber-50">当前状态：{STATE_LABELS[stateFor(selected)]}</strong><p className="mt-1">运行时准入为 false；审查通过后仍需要独立的发布门禁批准。</p></div>
              <dl className="mt-4 space-y-2 text-xs leading-5 text-slate-400"><div><dt className="text-slate-500">来源页面</dt><dd className="break-all text-cyan-100/70">{selected.source.url}</dd></div><div><dt className="text-slate-500">本地证据</dt><dd className="break-all font-mono text-[10px]">{selected.localEvidence.path}</dd></div><div><dt className="text-slate-500">本地校验</dt><dd className={selected.localEvidence.status === "verified" ? "text-emerald-100" : "text-red-200"}>{selected.localEvidence.status} · {selected.localEvidence.bytes.toLocaleString("zh-CN")} bytes · {selected.localEvidence.dimensions.width}×{selected.localEvidence.dimensions.height}</dd></div><div><dt className="text-slate-500">图像声明</dt><dd>源文件字节与 manifest SHA-256 一致；不是科学观测载荷准入</dd></div><div><dt className="text-slate-500">SHA-256</dt><dd className="break-all font-mono text-[9px]">{selected.localEvidence.sha256}</dd></div><div><dt className="text-slate-500">署名</dt><dd>{selected.source.credit}</dd></div></dl>
               {selectedRights ? <div className="mt-4 rounded border border-amber-100/15 bg-black/15 p-3 text-xs leading-5" data-mainline-a-rights-evidence="v613"><div className="flex items-center justify-between gap-2"><h4 className="text-[10px] uppercase tracking-[.14em] text-slate-500">逐图权利证据 / V613</h4><span className="rounded border border-amber-100/25 px-1.5 py-0.5 text-[9px] text-amber-100">{selectedRights.evidence.status}</span></div><dl className="mt-2 space-y-1 text-slate-400"><div><dt className="text-slate-500">逐图决定</dt><dd className="text-amber-100">{selectedRights.evidence.decision}</dd></div><div><dt className="text-slate-500">许可政策</dt><dd className="break-all text-cyan-100/70">{selectedRights.evidence.sourceLicenseUrl}</dd></div><div><dt className="text-slate-500">图片权利页</dt><dd className="break-all">{selectedRights.evidence.rightsPage ?? "待逐图提供"}</dd></div><div><dt className="text-slate-500">政策证据</dt><dd className="break-all font-mono text-[10px]">{selectedRights.evidence.evidencePath ?? "待逐图提供"}</dd></div><div><dt className="text-slate-500">审核人 / 时间</dt><dd>{selectedRights.evidence.reviewer ?? "待审核"} · {selectedRights.evidence.reviewedAt ?? "待审核"}</dd></div><div><dt className="text-slate-500">receipt 链路</dt><dd className="text-emerald-100">{receiptLinkageStatusLabel(selectedRights.receiptLinkage.links[0]?.status ?? "missing-reference")} · payload {selectedRights.receiptLinkage.payloadLinked} · identity {selectedRights.receiptLinkage.identityLinked}</dd></div></dl><p className="mt-2 text-[10px] text-amber-100/60">V613 仅记录逐图权利证据，不会自动打开视觉 signoff、运行时白名单或科学图像载荷。</p></div> : null}
              {showBlockers ? <div className="mt-4"><h4 className="text-[10px] uppercase tracking-[.14em] text-slate-500">阻塞项</h4><ul className="mt-2 space-y-1 text-xs text-amber-100/70">{selected.blockers.map((blocker) => <li key={blocker}>· {blocker}</li>)}{selectedReview?.risks.map((risk) => <li key={risk}>· {reviewRiskLabel(risk)}</li>)}</ul></div> : null}
              <div className="mt-4 border-t border-white/10 pt-3 text-[10px] leading-5 text-slate-500">manifest {selected.provenance.manifestPath}<br />projection {selected.provenance.projectionSha256.slice(0, 16)}…<br />rights pack {rightsPack.schema} · {rightsPack.evidenceStatusCounts.pending}/{rightsPack.candidateCount} 条待逐图证据<br />receipt linkage {rightsPack.receiptLinkage.validCandidates}/{rightsPack.receiptLinkage.candidates} candidates valid · {rightsPack.receiptLinkage.payloadLinked} payload links<br />本地证据 18/18 已验证；逐图权利、视觉 signoff 和运行时准入仍为空。</div>
              <a href={selected.source.url} target="_blank" rel="noreferrer" className="mt-4 block min-h-10 rounded border border-cyan-100/20 px-3 py-2 text-center text-xs text-cyan-100/75 underline">打开来源页面 ↗</a>
            </aside>)}
          </div>
        </div>
      </div>
    </dialog>
  );
}
