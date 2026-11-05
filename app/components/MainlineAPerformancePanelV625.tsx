"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { MAINLINE_A_PERFORMANCE_COMPACT_SIZE_V638, MAINLINE_A_PERFORMANCE_DOCK_SIZE_V638 } from "../lib/mainlineAPerformanceDockLayoutV638";
import {
  MAINLINE_A_PERFORMANCE_SCENARIOS_V625,
  appendMainlineAPerformanceRunV625,
  chooseMainlineAPerformanceDeviceV625,
  createMainlineAPerformanceBuildIdentityV625,
  createPendingMainlineAPerformanceReceiptV625,
  formatMainlineAPerformanceNumberV625,
  readMainlineAPerformanceBuildIdentityV625,
  readMainlineAPerformanceViewportV625,
  summarizeMainlineAPerformanceReceiptV625,
  verifyMainlineAPerformanceReceiptV625,
  type MainlineAPerformanceDeviceV625,
  type MainlineAPerformanceReceiptV625,
  type MainlineAPerformanceRunV625,
  type MainlineAPerformanceScenarioV625,
} from "../lib/mainlineAPerformanceEvidenceV625";
import {
  attachMainlineAPerformanceObserversV625,
  createMainlineAPerformanceSessionV625,
  selectMainlineAPerformanceIdentityRootV625,
  selectMainlineAPerformanceRootV625,
  type MainlineAPerformanceSessionControllerV625,
} from "../lib/mainlineAPerformanceSessionV625";
import { useAtlasResourceSnapshot } from "../lib/atlasResourceLifecycle";
import MainlineAResourceObservationPanelV633 from "./MainlineAResourceObservationPanelV633";
import MainlineAR65LongRunPanelV643 from "./MainlineAR65LongRunPanelV643";

type Props = Readonly<{
  onClose: () => void;
  dockedStyle?: CSSProperties;
  dockedMode?: "full" | "compact" | "inline";
  dockedTarget?: HTMLElement | null;
  selectedCatalogId?: string;
  onFocusCatalogObject?: (catalogId: string) => void;
  onClearFocus?: () => void;
}>;

const PENDING_BUILD = createMainlineAPerformanceBuildIdentityV625({ route: "/" });

function numberOrDash(value: number | null): string {
  return formatMainlineAPerformanceNumberV625(value, 1);
}

function statusTone(status: string): string {
  if (status === "measured" || status === "complete" || status === "baseline") return "text-emerald-100";
  if (status === "blocked" || status === "drift") return "text-rose-100";
  return "text-amber-100";
}

function SummaryCell({ label, value, tone = "text-slate-200" }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded border border-white/10 bg-white/[.025] p-2">
      <span className="block text-[9px] uppercase tracking-[.12em] text-slate-500">{label}</span>
      <strong className={`mt-1 block text-sm ${tone}`}>{value}</strong>
    </div>
  );
}

function RunRow({ run }: { run: MainlineAPerformanceRunV625 }) {
  return (
    <div className="grid gap-1 rounded border border-white/10 bg-black/15 p-2 text-[10px] sm:grid-cols-[1.2fr_.7fr_.8fr_1fr_1fr]" data-mainline-a-performance-run={run.runId} data-run-id={run.runId} data-device={run.device} data-scenario={run.scenario} data-viewport-width={run.viewport.width} data-viewport-height={run.viewport.height} data-viewport-dpr={run.viewport.devicePixelRatio} data-viewport-orientation={run.viewport.orientation} data-frame-samples={run.frame.sampleCount} data-frame-duration-ms={run.frame.durationMs} data-frame-p50-ms={run.frame.p50Ms ?? ""} data-frame-p95-ms={run.frame.p95Ms ?? ""} data-frame-max-ms={run.frame.maxMs ?? ""} data-median-fps={run.frame.medianFps ?? ""} data-under-50-ms-ratio={run.frame.under50MsRatio ?? ""} data-long-task-count={run.frame.longTaskCount} data-long-task-max-ms={run.frame.longTaskMaxMs ?? ""} data-duration-ms={run.durationMs} data-started-at={run.startedAt} data-ended-at={run.endedAt ?? ""} data-heap-used-bytes={run.memory.jsHeapUsedBytes ?? ""} data-heap-total-bytes={run.memory.jsHeapTotalBytes ?? ""} data-heap-limit-bytes={run.memory.jsHeapLimitBytes ?? ""} data-memory-source={run.memory.source} data-resource-status={run.resources.status} data-resource-before={run.resources.before.identityDigest} data-resource-after={run.resources.after.identityDigest} data-resource-before-revision={run.resources.before.revision} data-resource-after-revision={run.resources.after.revision} data-resource-diff-total={run.resources.diff.total} data-resource-diff-estimated-bytes={run.resources.diff.estimatedBytes} data-resource-repeated-index={run.resources.repeatedRunIndex} data-run-status={run.status} data-console-errors={run.consoleErrors} data-page-errors={run.pageErrors} data-build-id={run.build.buildId} data-build-branch={run.build.branch} data-build-head={run.build.head} data-document-visibility={run.visibility.documentVisibility} data-root-visible={String(run.visibility.rootVisible)} data-canvas-count={run.visibility.canvasCount} data-panel-visible={String(run.visibility.panelVisible)}>
      <div>
        <span className="block font-mono text-slate-200">{run.runId}</span>
        <span className="text-slate-500">{run.device} · {run.scenario}</span>
      </div>
      <div><span className="text-slate-500">viewport</span><div className="text-slate-300">{run.viewport.width}×{run.viewport.height} · {run.viewport.devicePixelRatio}x</div></div>
      <div><span className="text-slate-500">frames</span><div className="text-slate-300">{run.frame.sampleCount} · p95 {numberOrDash(run.frame.p95Ms)}ms</div></div>
      <div><span className="text-slate-500">fps / heap</span><div className="text-slate-300">{numberOrDash(run.frame.medianFps)} · {run.memory.jsHeapUsedBytes === null ? "unavailable" : `${Math.round(run.memory.jsHeapUsedBytes / 1024 / 1024)}MB`}</div></div>
      <div><span className="text-slate-500">lifecycle</span><div className={statusTone(run.resources.status)}>{run.resources.status} · {run.status}</div></div>
    </div>
  );
}

export default function MainlineAPerformancePanelV625({ onClose, dockedStyle, dockedMode = "full", dockedTarget, selectedCatalogId, onFocusCatalogObject, onClearFocus }: Props) {
  const resourceSnapshot = useAtlasResourceSnapshot();
  const [device, setDevice] = useState<MainlineAPerformanceDeviceV625>("desktop");
  const [scenario, setScenario] = useState<MainlineAPerformanceScenarioV625>("atlas");
  const [receipt, setReceipt] = useState<MainlineAPerformanceReceiptV625>(() => createPendingMainlineAPerformanceReceiptV625(PENDING_BUILD));
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ frameSamples: 0, elapsedMs: 0, longTasks: 0 });
  const [notice, setNotice] = useState("等待浏览器采样；物理设备与真实用户性能仍未运行。");
  const [repeatCount, setRepeatCount] = useState(0);
  const [repeatMode, setRepeatMode] = useState(false);
  const [fullObservation, setFullObservation] = useState(true);
  const [resourceObserving, setResourceObserving] = useState(false);
  const [longRunObserving, setLongRunObserving] = useState(false);
  const [docked, setDocked] = useState(false);
  const controllerRef = useRef<MainlineAPerformanceSessionControllerV625 | null>(null);
  const observerRef = useRef<{ stop: () => void } | null>(null);
  const timerRef = useRef<number | null>(null);
  const sequenceRef = useRef(0);

  useEffect(() => () => {
    observerRef.current?.stop();
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    controllerRef.current?.abort("panel-unmounted");
    observerRef.current = null;
    controllerRef.current = null;
    timerRef.current = null;
  }, []);

  useEffect(() => {
    const root = selectMainlineAPerformanceRootV625((selector) => document.querySelector<HTMLElement>(selector));
    const identityRoot = selectMainlineAPerformanceIdentityRootV625(
      (selector) => document.querySelector<HTMLElement>(selector),
      root,
    );
    const build = readMainlineAPerformanceBuildIdentityV625(identityRoot);
    if (build.buildId !== "unknown-build" && build.branch !== "unknown-branch" && build.head !== "unknown-head") {
      setReceipt((previous) => previous.runs.length === 0 ? createPendingMainlineAPerformanceReceiptV625(build) : previous);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as Window & { __mainlineAPerformanceReceiptV625?: MainlineAPerformanceReceiptV625 }).__mainlineAPerformanceReceiptV625 = receipt;
    }
  }, [receipt]);

  const summary = useMemo(() => summarizeMainlineAPerformanceReceiptV625(receipt), [receipt]);
  const receiptCheck = useMemo(() => verifyMainlineAPerformanceReceiptV625(receipt), [receipt]);
  const currentViewport = typeof window === "undefined" ? null : readMainlineAPerformanceViewportV625(window);
  const currentDevice = currentViewport ? chooseMainlineAPerformanceDeviceV625(currentViewport) : "desktop";

  const startRun = () => {
    if (running) return;
    const root = selectMainlineAPerformanceRootV625((selector) => document.querySelector<HTMLElement>(selector));
    const identityRoot = selectMainlineAPerformanceIdentityRootV625(
      (selector) => document.querySelector<HTMLElement>(selector),
      root,
    );
    const build = readMainlineAPerformanceBuildIdentityV625(identityRoot);
    const selectedScenario = repeatMode ? "repeat-cycle" : scenario;
    const controller = createMainlineAPerformanceSessionV625({
      device,
      scenario: selectedScenario,
      sequence: ++sequenceRef.current,
      root,
      build,
      repeatedRunIndex: repeatCount,
    });
    controllerRef.current = controller;
    observerRef.current = attachMainlineAPerformanceObserversV625(controller);
    setRunning(true);
    setNotice(`正在采样 ${device} / ${selectedScenario}；结束后只写入浏览器运行时证据。`);
    timerRef.current = window.setInterval(() => {
      const snapshot = controller.snapshot();
      setProgress(snapshot);
      if (snapshot.elapsedMs < 4_000) return;
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      timerRef.current = null;
      observerRef.current?.stop();
      const run = controller.finish({ notes: ["interactive-four-second-sample"] });
      observerRef.current = null;
      controllerRef.current = null;
      setRunning(false);
      if (!run) {
        setNotice("采样未产生完整 run；请保持页面可见后重试。");
        return;
      }
      setReceipt((previous) => appendMainlineAPerformanceRunV625(previous, run));
      setRepeatCount((previous) => previous + (selectedScenario === "repeat-cycle" ? 1 : 0));
      setNotice(`已记录 ${run.runId}；生命周期 ${run.resources.status}，证据类型为 browser-runtime-observation。`);
      setProgress({ frameSamples: 0, elapsedMs: 0, longTasks: 0 });
    }, 100);
  };

  const stopRun = () => {
    if (!running) return;
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    observerRef.current?.stop();
    const run = controllerRef.current?.abort("user-stopped") ?? null;
    observerRef.current = null;
    controllerRef.current = null;
    setRunning(false);
    if (run) {
      setReceipt((previous) => appendMainlineAPerformanceRunV625(previous, run));
      setNotice("采样已中止；该 run 保留为 blocked 证据，不会被解释为性能通过。");
    }
  };

  const clearRuns = () => {
    if (running) return;
    const root = selectMainlineAPerformanceRootV625((selector) => document.querySelector<HTMLElement>(selector));
    const identityRoot = selectMainlineAPerformanceIdentityRootV625(
      (selector) => document.querySelector<HTMLElement>(selector),
      root,
    );
    setReceipt(createPendingMainlineAPerformanceReceiptV625(readMainlineAPerformanceBuildIdentityV625(identityRoot)));
    setRepeatCount(0);
    setRepeatMode(false);
    setNotice("交互采样已清空；静态 contract 仍保持 candidate-only / hold / not-admitted。");
  };

  const compact = dockedMode !== "full";
  const restoreControl = <button
    type="button"
    hidden={!docked || (dockedMode === "inline" && !dockedTarget)}
    onClick={() => setDocked(false)}
    aria-label="展开性能观察面板"
    title={resourceObserving || running ? "采集中 · 不会暂停" : "记录保留在本面板"}
    data-mainline-a-performance-restore="true"
    data-mainline-a-performance-restore-mode={dockedMode}
    style={compact ? MAINLINE_A_PERFORMANCE_COMPACT_SIZE_V638 : MAINLINE_A_PERFORMANCE_DOCK_SIZE_V638}
    className={`pointer-events-auto shrink-0 max-w-full rounded-lg border border-violet-100/30 bg-[#050a10]/95 text-left text-[11px] text-violet-100 shadow-xl ${compact ? "px-2 py-1" : "px-3 py-2"}`}
  >
    {compact ? "观察" : "展开观察面板"}
    {!compact ? <span className="block text-[9px] text-slate-400">{resourceObserving || running ? "采集中 · 不会暂停" : "记录保留在本面板"}</span> : null}
  </button>;

  return (
    <section
      className={docked
        ? "pointer-events-none fixed right-3 z-[130] flex max-w-[calc(100vw-24px)] justify-end overflow-hidden font-mono"
        : "pointer-events-auto absolute right-2 top-12 z-[130] w-[min(620px,calc(100vw-16px))] max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-lg border border-violet-100/20 bg-[#050a10]/96 p-3 font-mono shadow-2xl backdrop-blur-xl"}
      style={docked ? {
        bottom: "calc(var(--ui-dock-height, 82px) + 12px + env(safe-area-inset-bottom))",
        maxHeight: "max(0px, calc(100dvh - var(--mainline-a-header-bottom, 0px) - var(--ui-dock-height, 82px) - 24px - env(safe-area-inset-bottom)))",
        ...dockedStyle,
      } : undefined}
      data-mainline-a-performance="v625"
      data-mainline-a-performance-visible={String(!docked)}
      data-mainline-a-performance-docked={String(docked)}
      data-mainline-a-performance-status={receipt.status}
      data-mainline-a-performance-device={device}
      data-mainline-a-performance-candidate-only="true"
      data-mainline-a-performance-hold="true"
      data-mainline-a-performance-not-admitted="true"
      data-mainline-a-performance-scientific-payload-writeback="false"
      data-mainline-a-performance-build-id={receipt.build.buildId}
      data-mainline-a-performance-build-branch={receipt.build.branch}
      data-mainline-a-performance-build-head={receipt.build.head}
    >
      {docked && dockedMode === "inline" && dockedTarget ? createPortal(restoreControl, dockedTarget) : restoreControl}
      <div hidden={docked} data-mainline-a-performance-expanded-content="true">
      <header className="flex items-start justify-between gap-3 border-b border-white/10 pb-2">
        <div>
          <div className="text-[10px] uppercase tracking-[.16em] text-violet-100/80">Mainline A / performance & lifecycle · V625</div>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">桌面与移动 viewport 的浏览器运行时观察。该面板不代表真实用户性能、物理设备性能或生产资格。</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={() => setDocked(true)} className="min-h-9 rounded border border-violet-100/25 px-2 text-[10px] text-violet-100">收起以选择对象</button>
          <button type="button" onClick={onClose} disabled={resourceObserving || longRunObserving} title={resourceObserving || longRunObserving ? "先完成或中止观察" : undefined} className="rounded border border-white/15 px-2 py-1 text-[10px] text-slate-300 disabled:opacity-35">关闭</button>
        </div>
      </header>
      <p className="mt-2 text-[10px] leading-4 text-slate-400">观察时可收起面板，再通过应用入口切换对象。收起保留当前采集和记录，不改变窗口尺寸。</p>
      <MainlineAR65LongRunPanelV643 compact onRunningChange={setLongRunObserving} selectedCatalogId={selectedCatalogId} onFocusCatalogObject={onFocusCatalogObject} onClearFocus={onClearFocus} />
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => setFullObservation(true)} disabled={running || resourceObserving} aria-pressed={fullObservation} className="min-h-9 rounded border border-white/20 px-2 text-xs text-cyan-100">完整资源观察</button>
        <button type="button" onClick={() => setFullObservation(false)} disabled={running || resourceObserving} aria-pressed={!fullObservation} className="min-h-9 rounded border border-white/20 px-2 text-xs text-slate-300">短时帧采样</button>
      </div>
      <div hidden={!fullObservation}><MainlineAResourceObservationPanelV633 onRunningChange={setResourceObserving} /></div>
      <div hidden={fullObservation}>
      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4" data-mainline-a-performance-summary="true">
        <SummaryCell label="receipt" value={receipt.status} tone={statusTone(receipt.status)} />
        <SummaryCell label="runs" value={summary.runCount} />
        <SummaryCell label="desktop / mobile" value={`${summary.desktopRuns} / ${summary.mobileRuns}`} />
        <SummaryCell label="lifecycle" value={summary.lifecycle} tone={statusTone(summary.lifecycle)} />
        <SummaryCell label="mean p95" value={`${numberOrDash(summary.meanP95Ms)} ms`} />
        <SummaryCell label="mean median fps" value={numberOrDash(summary.meanMedianFps)} />
        <SummaryCell label="resources now" value={`${resourceSnapshot.total} · ${Math.round(resourceSnapshot.estimatedBytes / 1024)}KB`} />
        <SummaryCell label="static digest" value={receiptCheck.ok ? "valid" : "failed"} tone={receiptCheck.ok ? "text-emerald-100" : "text-rose-100"} />
      </div>
      <div className="mt-3 grid gap-2 rounded border border-white/10 bg-white/[.02] p-2 sm:grid-cols-[1fr_1fr_auto]">
        <label className="text-[10px] text-slate-400">device<select value={device} onChange={(event) => setDevice(event.target.value as MainlineAPerformanceDeviceV625)} disabled={running} className="mt-1 block w-full rounded border border-white/15 bg-[#081017] px-2 py-1.5 text-[10px] text-slate-200"><option value="desktop">desktop viewport</option><option value="mobile">mobile viewport</option></select></label>
        <label className="text-[10px] text-slate-400">scenario<select value={scenario} onChange={(event) => setScenario(event.target.value as MainlineAPerformanceScenarioV625)} disabled={running} className="mt-1 block w-full rounded border border-white/15 bg-[#081017] px-2 py-1.5 text-[10px] text-slate-200">{MAINLINE_A_PERFORMANCE_SCENARIOS_V625.filter((value) => value !== "repeat-cycle").map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <div className="flex flex-wrap items-end gap-1"><button type="button" onClick={running ? stopRun : startRun} className={`min-h-8 rounded border px-2 text-[10px] ${running ? "border-rose-100/35 text-rose-100" : "border-violet-100/35 text-violet-100"}`}>{running ? "停止采样" : repeatMode ? "开始重复 4s" : "开始 4s"}</button><button type="button" onClick={() => setRepeatMode((value) => !value)} disabled={running} aria-pressed={repeatMode} className={`min-h-8 rounded border px-2 text-[10px] ${repeatMode ? "border-emerald-100/35 text-emerald-100" : "border-white/15 text-slate-400"}`}>重复模式</button><button type="button" onClick={clearRuns} disabled={running} className="min-h-8 rounded border border-white/15 px-2 text-[10px] text-slate-400">清空</button></div>
      </div>
      <div className="mt-2 grid gap-1 text-[9px] text-slate-500 sm:grid-cols-2" data-mainline-a-performance-runtime-state="true">
        <span>当前 viewport · {currentViewport ? `${currentViewport.width}×${currentViewport.height} · ${currentViewport.devicePixelRatio}x` : "unknown"}</span>
        <span>分类 · {currentDevice} · document {typeof document === "undefined" ? "unknown" : document.visibilityState}</span>
        <span>采样状态 · {running ? `${progress.frameSamples} frames / ${Math.round(progress.elapsedMs)}ms` : "idle"} · repeat {repeatCount}</span>
        <span>长任务 · {progress.longTasks} · physical mobile · not-run</span>
      </div>
      <p className="mt-2 rounded border border-amber-100/10 bg-amber-100/[.025] px-2 py-1.5 text-[10px] leading-4 text-amber-100/70" data-mainline-a-performance-notice="true">{notice}</p>
      {receipt.runs.length > 0 ? <div className="mt-3 space-y-1.5" data-mainline-a-performance-runs="true">{receipt.runs.map((run) => <RunRow key={run.runId} run={run} />)}</div> : <div className="mt-3 rounded border border-dashed border-white/10 px-2 py-3 text-[10px] text-slate-600">尚无本轮运行时样本；开始后会记录帧时间、可用堆指标（若浏览器提供）和资源生命周期前后快照。</div>}
      <footer className="mt-3 grid gap-1 border-t border-white/10 pt-2 text-[9px] leading-4 text-slate-600 sm:grid-cols-2" data-mainline-a-performance-boundary="true">
        <span>candidate-only · hold · not-admitted</span>
        <span>scientificPayloadWriteback=false</span>
        <span>resource identity uses runtime registry digest</span>
        <span>screenshots/tests are separate evidence classes</span>
      </footer>
      </div>
      </div>
    </section>
  );
}
