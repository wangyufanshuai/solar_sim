"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643,
  MAINLINE_A_R65_LONGRUN_SCENARIOS_V643,
  appendMainlineAR65LongRunObservationV643,
  createMainlineAR65LongRunBuildIdentityV643,
  createMainlineAR65LongRunObservationV643,
  createMainlineAR65LongRunResourceCheckpointV643,
  createMainlineAR65LongRunViewportV643,
  createPendingMainlineAR65LongRunReceiptV643,
  finalizeMainlineAR65LongRunReceiptV643,
  verifyMainlineAR65LongRunReceiptV643,
  type MainlineAR65LongRunDeviceV643,
  type MainlineAR65LongRunFrameSampleV643,
  type MainlineAR65LongRunMemorySampleV643,
  type MainlineAR65LongRunObservationV643,
  type MainlineAR65LongRunReceiptV643,
  type MainlineAR65LongRunScenarioV643,
} from "../lib/mainlineAR65LongRunV643";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot, useAtlasResourceSnapshot } from "../lib/atlasResourceLifecycle";
import { atlasRuntimeStore } from "../lib/atlasRuntimeStore";
import {
  MAINLINE_A_R65_GUIDED_CATALOG_ID_V645,
  MAINLINE_A_R65_GUIDED_OBJECT_ID_V645,
  describeMainlineAR65SceneActivityV645,
  evaluateMainlineAR65SceneActivityV645,
} from "../lib/mainlineAR65SceneActivityV645";
import {
  createMainlineAR65IndexedDbPortV644,
  restoreMainlineAR65ObservationsV644,
  saveMainlineAR65ObservationV644,
} from "../lib/mainlineAR65LongRunArchiveV644";

type Props = Readonly<{
  compact?: boolean;
  onRunningChange?: (running: boolean) => void;
  selectedCatalogId?: string;
  onFocusCatalogObject?: (catalogId: string) => void;
  onClearFocus?: () => void;
}>;
type ActiveSession = {
  sessionId: string;
  independenceKey: string;
  device: MainlineAR65LongRunDeviceV643;
  scenario: MainlineAR65LongRunScenarioV643;
  startedAt: string;
  startedAtMs: number;
  startedVisible: boolean;
  startedViewport: ReturnType<typeof createMainlineAR65LongRunViewportV643>;
  startedBuild: ReturnType<typeof createMainlineAR65LongRunBuildIdentityV643>;
  baseline: ReturnType<typeof getAtlasResourceSnapshot>;
  active: ReturnType<typeof getAtlasResourceSnapshot> | null;
  activeAtMs: number | null;
  activeCapturedAt: string | null;
  frames: MainlineAR65LongRunFrameSampleV643[];
  memory: MainlineAR65LongRunMemorySampleV643[];
  frameId: number;
  finishTimer: number;
  sampleTimer: number;
  observer: PerformanceObserver | null;
  previousFrameMs: number;
  interruptions: number;
  consoleErrors: number;
  pageErrors: number;
  onError: EventListener;
  onPageError: EventListener;
  onVisibilityChange: EventListener;
};

const SAMPLE_INTERVAL_MS = 1_000;

function stopSession(active: ActiveSession): void {
  window.cancelAnimationFrame(active.frameId);
  window.clearTimeout(active.finishTimer);
  window.clearInterval(active.sampleTimer);
  active.observer?.disconnect();
  window.removeEventListener("error", active.onError);
  window.removeEventListener("unhandledrejection", active.onPageError);
  document.removeEventListener("visibilitychange", active.onVisibilityChange);
}

function readViewport(device: MainlineAR65LongRunDeviceV643): ReturnType<typeof createMainlineAR65LongRunViewportV643> {
  return createMainlineAR65LongRunViewportV643({
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    device,
    class: currentViewportClass(device),
  });
}

function makeId(prefix: string): string {
  const randomUuid = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${randomUuid}`;
}

function buildIdentity(): ReturnType<typeof createMainlineAR65LongRunBuildIdentityV643> {
  const root = document.querySelector<HTMLElement>("[data-atlas-app-shell]")
    ?? document.querySelector<HTMLElement>("[data-atlas-browser-acceptance-version]");
  const dataset = root?.dataset ?? {};
  return createMainlineAR65LongRunBuildIdentityV643({
    buildId: dataset.mainlineBuildId ?? dataset.buildId ?? dataset.atlasMainlineBuildId,
    runtimeBuildId: dataset.mainlineRuntimeBuildId ?? dataset.runtimeBuildId ?? dataset.atlasRuntimeBuildId,
    branch: dataset.mainlineBranch ?? dataset.branch ?? dataset.atlasMainlineBranch,
    head: dataset.mainlineHead ?? dataset.head ?? dataset.atlasMainlineHead,
    route: dataset.mainlineRoute ?? dataset.route ?? window.location.pathname,
    source: "runtime-marker",
  });
}

function currentDevice(): MainlineAR65LongRunDeviceV643 {
  return window.innerWidth < 700 ? "mobile" : "desktop";
}

function currentViewportClass(device: MainlineAR65LongRunDeviceV643): "desktop-browser" | "mobile-viewport" {
  return device === "mobile" ? "mobile-viewport" : "desktop-browser";
}

function memorySample(atMs: number): MainlineAR65LongRunMemorySampleV643 {
  const performanceMemory = (performance as Performance & {
    memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number; jsHeapSizeLimit?: number };
  }).memory;
  const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };
  const hasHeap = typeof performanceMemory?.usedJSHeapSize === "number" && Number.isFinite(performanceMemory.usedJSHeapSize);
  return {
    atMs,
    usedBytes: hasHeap ? Math.max(0, Math.trunc(performanceMemory?.usedJSHeapSize ?? 0)) : null,
    totalBytes: hasHeap && typeof performanceMemory?.totalJSHeapSize === "number" ? Math.max(0, Math.trunc(performanceMemory.totalJSHeapSize)) : null,
    limitBytes: hasHeap && typeof performanceMemory?.jsHeapSizeLimit === "number" ? Math.max(0, Math.trunc(performanceMemory.jsHeapSizeLimit)) : null,
    source: hasHeap ? "performance-memory" : typeof navigatorWithMemory.deviceMemory === "number" ? "navigator-device-memory" : "unavailable",
  };
}

function rowTone(status: string): string {
  if (status === "complete" || status === "qualified") return "text-emerald-100";
  if (status === "blocked" || status === "aborted") return "text-rose-100";
  return "text-amber-100";
}

function formatDuration(value: number): string {
  const seconds = Math.max(0, Math.floor(value / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function CheckpointRow({ label, checkpoint }: { label: string; checkpoint: MainlineAR65LongRunObservationV643["resources"]["baseline"] }) {
  return <div className="rounded border border-white/10 bg-black/15 p-2" data-mainline-a-r65-checkpoint={checkpoint.phase}>
    <span className="block text-[9px] uppercase tracking-[.12em] text-slate-500">{label}</span>
    <span className="mt-1 block text-[10px] text-slate-300">{checkpoint.phase} · rev {checkpoint.revision} · {checkpoint.total} resources</span>
    <span className="block truncate text-[9px] text-slate-500">{checkpoint.identityDigest}</span>
  </div>;
}

function ObservationRow({ observation, check }: { observation: MainlineAR65LongRunObservationV643; check: { status: "valid" | "invalid"; issues: readonly string[] } | undefined }) {
  return <article className="rounded border border-white/10 bg-white/[.02] p-2" data-mainline-a-r65-observation={observation.sessionId} data-session-id={observation.sessionId} data-independence-key={observation.independenceKey} data-device={observation.device} data-duration-ms={observation.observedDurationMs} data-status={observation.status} data-source={observation.source} data-verification={check?.status ?? "unknown"}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <span className="block font-mono text-[10px] text-slate-200">{observation.sessionId}</span>
        <span className="text-[9px] text-slate-500">{observation.device} · {observation.scenario} · {formatDuration(observation.observedDurationMs)}</span>
      </div>
      <strong className={`text-[10px] ${rowTone(check?.status === "valid" ? observation.status : "blocked")}`}>{observation.status} · {check?.status ?? "unknown"}</strong>
    </div>
    {check?.issues.length ? <p className="mt-1 break-words text-[9px] text-rose-100/75">{check.issues.slice(0, 4).join(" · ")}{check.issues.length > 4 ? ` · +${check.issues.length - 4}` : ""}</p> : null}
    <div className="mt-2 grid grid-cols-2 gap-1 text-[9px] text-slate-500 sm:grid-cols-4">
      <span>frames {observation.frameSummary.sampleCount}</span>
      <span>p95 {observation.frameSummary.p95Ms === null ? "—" : `${observation.frameSummary.p95Ms.toFixed(1)}ms`}</span>
      <span>heap {observation.memorySummary.lastUsedBytes === null ? "—" : `${Math.round(observation.memorySummary.lastUsedBytes / 1024 / 1024)}MB`}</span>
      <span>errors {observation.consoleErrors + observation.pageErrors}</span>
    </div>
    <div className="mt-2 grid gap-1 sm:grid-cols-3">
      <CheckpointRow label="baseline" checkpoint={observation.resources.baseline} />
      <CheckpointRow label="active" checkpoint={observation.resources.active} />
      <CheckpointRow label="final" checkpoint={observation.resources.final} />
    </div>
  </article>;
}

export default function MainlineAR65LongRunPanelV643({ compact = false, onRunningChange, selectedCatalogId = "", onFocusCatalogObject, onClearFocus }: Props) {
  const liveResources = useAtlasResourceSnapshot();
  const [device, setDevice] = useState<MainlineAR65LongRunDeviceV643>(() => typeof window === "undefined" ? "desktop" : currentDevice());
  const [scenario, setScenario] = useState<MainlineAR65LongRunScenarioV643>("atlas");
  const [receipt, setReceipt] = useState<MainlineAR65LongRunReceiptV643>(() => createPendingMainlineAR65LongRunReceiptV643(createMainlineAR65LongRunBuildIdentityV643()));
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [notice, setNotice] = useState("需要两次独立、每次至少 30 分钟的浏览器运行时观察；当前没有物理移动设备声明。");
  const [archiveState, setArchiveState] = useState<"loading" | "empty" | "saving" | "available" | "corrupt" | "unavailable">("loading");
  const [archiveCount, setArchiveCount] = useState(0);
  const activeRef = useRef<ActiveSession | null>(null);
  const receiptRef = useRef(receipt);
  const archivePortRef = useRef(createMainlineAR65IndexedDbPortV644());

  useEffect(() => {
    let mounted = true;
    const build = buildIdentity();
    void restoreMainlineAR65ObservationsV644(archivePortRef.current, build).then((restored) => {
      if (!mounted) return;
      setArchiveState(restored.status === "restored" ? "available" : restored.status);
      setArchiveCount(restored.records);
      if (restored.receipt && !activeRef.current && receiptRef.current.observations.length === 0) {
        receiptRef.current = restored.receipt;
        setReceipt(restored.receipt);
        setNotice(`已从当前构建的浏览器存档恢复 ${restored.records} 条原始观察；仍需离线导出和重算。`);
      } else if (restored.status === "corrupt") {
        setNotice(`浏览器存档有 ${restored.issues.length} 项校验失败；未自动恢复或晋级，请保留原始数据。`);
      } else if (restored.status === "unavailable") {
        setNotice("浏览器存档不可用；完成后请立即导出 JSON，页面内存不会跨重启保留。");
      }
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    receiptRef.current = receipt;
    (window as Window & { __mainlineAR65LongRunReceiptV643?: MainlineAR65LongRunReceiptV643 }).__mainlineAR65LongRunReceiptV643 = receipt;
  }, [receipt]);

  useEffect(() => {
    onRunningChange?.(running);
  }, [onRunningChange, running]);

  useEffect(() => () => {
    const active = activeRef.current;
    if (!active) return;
    stopSession(active);
    activeRef.current = null;
  }, []);

  const verification = useMemo(() => verifyMainlineAR65LongRunReceiptV643(receipt), [receipt]);
  const current = typeof window === "undefined" ? "desktop" : currentDevice();
  const liveSession = activeRef.current;
  const liveActivity = liveSession ? evaluateMainlineAR65SceneActivityV645(liveSession.baseline, liveResources) : null;
  const liveReturn = liveSession && liveSession.active
    ? diffAtlasResourceSnapshotsV300(liveSession.baseline, liveResources)
    : null;

  const finish = (reason: "completed" | "aborted") => {
    const active = activeRef.current;
    if (!active) return;
    stopSession(active);
    const endedAt = new Date().toISOString();
    const observedDurationMs = Math.max(0, performance.now() - active.startedAtMs);
    const finalSnapshot = getAtlasResourceSnapshot();
    const final = createMainlineAR65LongRunResourceCheckpointV643(finalSnapshot, "final", observedDurationMs, endedAt);
    const visibility = {
      startedVisible: active.startedVisible,
      endedVisible: document.visibilityState === "visible",
      interruptions: active.interruptions,
      canvasCount: document.querySelectorAll("canvas").length,
      rootVisible: Boolean(document.querySelector("[data-atlas-app-shell]")?.getClientRects().length),
      documentVisibility: document.visibilityState === "visible" || document.visibilityState === "hidden" || document.visibilityState === "prerender" ? document.visibilityState : "unknown" as const,
    };
    const observation = createMainlineAR65LongRunObservationV643({
      sessionId: active.sessionId,
      independenceKey: active.independenceKey,
      device: active.device,
      scenario: active.scenario,
      viewport: active.startedViewport,
      endedViewport: readViewport(currentDevice()),
      build: active.startedBuild,
      endedBuild: buildIdentity(),
      startedAt: active.startedAt,
      endedAt,
      observedDurationMs,
      requestedDurationMs: MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643,
      frameSamples: active.frames,
      memorySamples: active.memory,
      resources: {
        baseline: createMainlineAR65LongRunResourceCheckpointV643(active.baseline, "baseline", 0, active.startedAt),
        active: createMainlineAR65LongRunResourceCheckpointV643(active.active ?? active.baseline, "active", active.activeAtMs ?? 0, active.activeCapturedAt ?? active.startedAt),
        final,
      },
      visibility,
      consoleErrors: active.consoleErrors,
      pageErrors: active.pageErrors,
      physicalDevice: false,
      source: "browser-runtime",
      notes: [reason === "aborted" ? "user-aborted-observation" : "duration-complete-observation", active.active ? "resource-switch-captured" : "resource-switch-not-captured", `observed-duration-ms:${Math.round(observedDurationMs)}`],
    });
    const next = finalizeMainlineAR65LongRunReceiptV643(appendMainlineAR65LongRunObservationV643(receiptRef.current, observation));
    receiptRef.current = next;
    setReceipt(next);
    setRunning(false);
    setElapsedMs(0);
    activeRef.current = null;
    setNotice(reason === "aborted" ? "已保留中止记录；它会保持 blocked，不会缩短 30 分钟门禁。" : next.status === "blocked" ? `已记录 ${observation.sessionId}，但证据仍 blocked；请检查时间、资源切换和恢复。` : `已记录 ${observation.sessionId}；请用新的独立会话完成第二次观察。`);
    setArchiveState("saving");
    void saveMainlineAR65ObservationV644(archivePortRef.current, observation, active.startedBuild).then(() => {
      setArchiveState("available");
      setArchiveCount((count) => count + 1);
    }).catch((error: unknown) => {
      setArchiveState("unavailable");
      setNotice(`观察已保留在当前页面，但浏览器存档失败：${error instanceof Error ? error.message : String(error)}。请立即导出 JSON。`);
    });
  };

  const captureActive = () => {
    const active = activeRef.current;
    if (!active) return;
    const snapshot = getAtlasResourceSnapshot();
    const activity = evaluateMainlineAR65SceneActivityV645(active.baseline, snapshot);
    if (activity.status !== "ready") {
      setNotice(describeMainlineAR65SceneActivityV645(activity));
      return;
    }
    if (selectedCatalogId === MAINLINE_A_R65_GUIDED_CATALOG_ID_V645) {
      const image = document.querySelector<HTMLElement>(`[data-mainline-a-scene-nebula="${MAINLINE_A_R65_GUIDED_OBJECT_ID_V645}"]`);
      if (image?.dataset.mainlineASceneImageStatus !== "ready") {
        setNotice(`猎户座星云观测图仍为 ${image?.dataset.mainlineASceneImageStatus ?? "unmounted"}；等图像实际绘制后再记录活动资源。`);
        return;
      }
    }
    if (active.active) {
      setNotice("本次观察已经有活动快照。先返回起点，不覆盖已记录的原始检查点。");
      return;
    }
    active.active = snapshot;
    active.activeAtMs = Math.max(0, performance.now() - active.startedAtMs);
    active.activeCapturedAt = new Date().toISOString();
    setNotice(`${describeMainlineAR65SceneActivityV645(activity)} 活动快照 rev ${snapshot.revision}；现在退出聚焦并等待 registry 回到起点。`);
  };

  const focusGuidedNebula = () => {
    if (!activeRef.current || !onFocusCatalogObject) return;
    if (activeRef.current.active) {
      setNotice("活动快照已记录；请先退出聚焦，不能在同一次观察里覆盖它。");
      return;
    }
    onFocusCatalogObject(MAINLINE_A_R65_GUIDED_CATALOG_ID_V645);
    setNotice("已请求应用聚焦猎户座星云。等待本地图像完成哈希校验、解码并实际绘制，再记录活动资源。");
  };

  const returnToBaseline = () => {
    if (!activeRef.current || !onClearFocus) return;
    onClearFocus();
    setNotice("已请求应用退出聚焦。等待场景卸载资源并确认 registry 恢复到起点；不自动宣称释放通过。");
  };

  const start = () => {
    if (running) return;
    if (archiveState === "loading" || archiveState === "saving") {
      setNotice("浏览器存档仍在读取或写入；完成后再开始下一次独立观察。");
      return;
    }
    const observedDevice = currentDevice();
    if (device !== observedDevice) {
      setNotice(`当前 viewport 被识别为 ${observedDevice}；先切换选择项或调整 viewport，避免把桌面样本标成移动样本。`);
      return;
    }
    if (document.visibilityState !== "visible") {
      setNotice("页面不可见，不能开始长跑观察。请先显示浏览器页面。");
      return;
    }
    const runtime = atlasRuntimeStore.getSnapshot();
    if (runtime.selectedObjectId || selectedCatalogId || !["atlas", "inspect"].includes(runtime.sceneMode) || runtime.experienceMode === "research") {
      setNotice("请先退出对象聚焦并回到探索中的 atlas/inspect 场景，再以稳定资源状态作为起点。研究模式不会加载引导观测图。");
      return;
    }
    const startedBuild = buildIdentity();
    if (startedBuild.buildId.startsWith("unknown-") || startedBuild.branch.startsWith("unknown-") || !/^[0-9a-f]{40}$/iu.test(startedBuild.head)) {
      setNotice("当前生产构建标识不完整；请使用带分支、HEAD 和 build ID 的保留构建后再开始。");
      return;
    }
    if (receiptRef.current.observations.some((entry) => entry.build.buildId !== startedBuild.buildId || entry.build.head !== startedBuild.head)) {
      setNotice("已有观察绑定另一构建；请先导出旧记录，再为当前构建建立新的 receipt。");
      return;
    }
    const startedAt = new Date().toISOString();
    const startedAtMs = performance.now();
    const baseline = getAtlasResourceSnapshot();
    const session: ActiveSession = {
      sessionId: makeId("r65-v643"),
      independenceKey: makeId("independent"),
      device,
      scenario,
      startedAt,
      startedAtMs,
      startedVisible: true,
      startedViewport: readViewport(device),
      startedBuild,
      baseline,
      active: null,
      activeAtMs: null,
      activeCapturedAt: null,
      frames: [],
      memory: [memorySample(0)],
      frameId: 0,
      finishTimer: 0,
      sampleTimer: 0,
      observer: null,
      previousFrameMs: startedAtMs,
      interruptions: 0,
      consoleErrors: 0,
      pageErrors: 0,
      onError: () => { session.consoleErrors += 1; },
      onPageError: () => { session.pageErrors += 1; },
      onVisibilityChange: () => { if (document.visibilityState !== "visible") session.interruptions += 1; },
    };
    if (receiptRef.current.observations.length === 0 && receiptRef.current.build.buildId !== startedBuild.buildId) {
      const next = createPendingMainlineAR65LongRunReceiptV643(startedBuild);
      receiptRef.current = next;
      setReceipt(next);
    }
    activeRef.current = session;
    const tick = (atMs: number) => {
      const currentSession = activeRef.current;
      if (!currentSession || currentSession !== session) return;
      const deltaMs = Math.max(0, atMs - currentSession.previousFrameMs);
      currentSession.frames.push({ atMs: Math.max(0, atMs - startedAtMs), deltaMs, longTaskMs: 0 });
      currentSession.previousFrameMs = atMs;
      currentSession.frameId = window.requestAnimationFrame(tick);
    };
    session.frameId = window.requestAnimationFrame(tick);
    session.sampleTimer = window.setInterval(() => {
      const currentSession = activeRef.current;
      if (!currentSession) return;
      const atMs = Math.max(0, performance.now() - startedAtMs);
      currentSession.memory.push(memorySample(atMs));
      setElapsedMs(atMs);
    }, SAMPLE_INTERVAL_MS);
    session.finishTimer = window.setTimeout(() => finish("completed"), MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643 + 2_000);
    window.addEventListener("error", session.onError);
    window.addEventListener("unhandledrejection", session.onPageError);
    document.addEventListener("visibilitychange", session.onVisibilityChange);
    session.observer = typeof PerformanceObserver === "undefined" ? null : new PerformanceObserver((list) => {
      const last = session.frames[session.frames.length - 1];
      const duration = Math.max(0, ...list.getEntries().map((entry) => entry.duration));
      if (last) session.frames[session.frames.length - 1] = { ...last, longTaskMs: duration };
    });
    try { session.observer?.observe({ type: "longtask", buffered: true }); } catch { session.observer = null; }
    setRunning(true);
    setElapsedMs(0);
    setNotice(`正在记录 ${device} / ${scenario}；页面保持可见，完成后才会形成 complete observation。`);
  };

  const clear = () => {
    if (running) return;
    if (receiptRef.current.observations.length > 0) {
      setNotice("原始观察已留账；请导出当前 receipt。失败尝试不会参与合格计数，但不能从留账中抹除。");
      return;
    }
    setReceipt(createPendingMainlineAR65LongRunReceiptV643(buildIdentity()));
    setNotice("已清空本地运行时记录；尚无任何长跑通过结论。" );
  };

  const exportReceipt = () => {
    const current = receiptRef.current;
    const blob = new Blob([`${JSON.stringify(current, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mainline-a-r65-longrun-${current.build.head.slice(0, 8)}-${new Date().toISOString().replaceAll(":", "-")}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    setNotice("已导出当前原始 receipt；仍须用离线 verifier 重算，下载本身不是性能或生命周期通过证据。");
  };

  return <section className={`${compact ? "mt-2" : "mt-3"} rounded border border-amber-100/20 bg-[#050a10]/95 p-3 font-mono shadow-xl`} data-mainline-a-r65-longrun="v643" data-mainline-a-r65-longrun-status={verification.status} data-mainline-a-r65-longrun-candidate-only="true" data-mainline-a-r65-longrun-hold="true" data-mainline-a-r65-longrun-not-admitted="true" data-mainline-a-r65-longrun-scientific-payload-writeback="false">
    <header className="flex items-start justify-between gap-3 border-b border-white/10 pb-2">
      <div>
        <div className="text-[10px] uppercase tracking-[.16em] text-amber-100/80">R65 / independent long-run · V643</div>
        <p className="mt-1 text-[10px] leading-4 text-slate-500">每次 30 分钟。开始后切换真实场景或对象，记录活动资源，再回到起始场景；帧时间和资源恢复缺一不可。</p>
      </div>
      <span className={`text-[10px] ${rowTone(verification.status)}`} data-mainline-a-r65-longrun-verification={verification.status}>{verification.status}</span>
    </header>
    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4" data-mainline-a-r65-longrun-summary="true">
      <div className="rounded border border-white/10 bg-white/[.025] p-2"><span className="block text-[9px] text-slate-500">complete</span><strong className="text-sm text-slate-200">{verification.completeLongRuns} / 2</strong></div>
      <div className="rounded border border-white/10 bg-white/[.025] p-2"><span className="block text-[9px] text-slate-500">viewport</span><strong className="text-sm text-slate-200">{verification.devices.join(" /") || "—"}</strong></div>
      <div className="rounded border border-white/10 bg-white/[.025] p-2"><span className="block text-[9px] text-slate-500">current</span><strong className="text-sm text-slate-200">{current} · {typeof window === "undefined" ? "unknown" : `${window.innerWidth}×${window.innerHeight}`}</strong></div>
      <div className="rounded border border-white/10 bg-white/[.025] p-2"><span className="block text-[9px] text-slate-500">elapsed</span><strong className="text-sm text-slate-200">{running ? formatDuration(elapsedMs) : "idle"}</strong></div>
    </div>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded border border-white/10 px-2 py-1.5 text-[9px] text-slate-500" data-mainline-a-r65-archive={archiveState}>
      <span>浏览器原始存档 · {archiveState} · {archiveCount} 条 · 当前构建隔离</span>
      <button type="button" onClick={exportReceipt} className="min-h-8 rounded border border-white/15 px-2 text-slate-300" data-mainline-a-r65-export-receipt="true">导出 receipt JSON</button>
    </div>
    <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
      <label className="text-[10px] text-slate-400">viewport<select value={device} onChange={(event) => setDevice(event.target.value as MainlineAR65LongRunDeviceV643)} disabled={running} className="mt-1 block w-full rounded border border-white/15 bg-[#081017] px-2 py-1.5 text-[10px] text-slate-200"><option value="desktop">desktop browser</option><option value="mobile">mobile viewport</option></select></label>
      <label className="text-[10px] text-slate-400">scenario<select value={scenario} onChange={(event) => setScenario(event.target.value as MainlineAR65LongRunScenarioV643)} disabled={running} className="mt-1 block w-full rounded border border-white/15 bg-[#081017] px-2 py-1.5 text-[10px] text-slate-200">{MAINLINE_A_R65_LONGRUN_SCENARIOS_V643.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <div className="flex flex-wrap items-end gap-1"><button type="button" onClick={() => running ? finish("aborted") : start()} disabled={!running && (archiveState === "loading" || archiveState === "saving")} className={`min-h-9 rounded border px-2 text-[10px] disabled:opacity-35 ${running ? "border-rose-100/35 text-rose-100" : "border-amber-100/35 text-amber-100"}`}>{running ? "中止并留账" : "开始 30 分钟"}</button><button type="button" onClick={captureActive} disabled={!running} className="min-h-9 rounded border border-cyan-100/25 px-2 text-[10px] text-cyan-100 disabled:opacity-35" data-mainline-a-r65-capture-active="true">记录活动资源</button><button type="button" onClick={clear} disabled={running || receipt.observations.length > 0} className="min-h-9 rounded border border-white/15 px-2 text-[10px] text-slate-400 disabled:opacity-35">清空</button></div>
    </div>
    <p className="mt-2 rounded border border-amber-100/10 bg-amber-100/[.025] px-2 py-1.5 text-[10px] leading-4 text-amber-100/70" data-mainline-a-r65-longrun-notice="true">{notice}</p>
    <div className="mt-2 rounded border border-cyan-100/15 bg-cyan-100/[.025] p-2 text-[10px] leading-4 text-slate-400" data-mainline-a-r65-guided-scene="true" data-mainline-a-r65-guided-selected={selectedCatalogId || "none"} data-mainline-a-r65-guided-registry={liveActivity?.status ?? "idle"} data-mainline-a-r65-guided-return={liveReturn?.status ?? "not-captured"}>
      <p>真实场景切换：以无聚焦场景开始 → 聚焦已接入的猎户座星云 → 等图像绘制并记录活动资源 → 退出聚焦并确认资源恢复。候选星云不会因这里的操作晋级。</p>
      <div className="mt-2 flex flex-wrap gap-1">
        <button type="button" onClick={focusGuidedNebula} disabled={!running || !onFocusCatalogObject || Boolean(liveSession?.active)} className="min-h-9 rounded border border-cyan-100/25 px-2 text-cyan-100 disabled:opacity-35" data-mainline-a-r65-focus-guided="true">聚焦猎户座星云</button>
        <button type="button" onClick={returnToBaseline} disabled={!running || !onClearFocus || !selectedCatalogId} className="min-h-9 rounded border border-white/15 px-2 text-slate-200 disabled:opacity-35" data-mainline-a-r65-return-baseline="true">退出聚焦</button>
      </div>
      <p className="mt-1 text-slate-500">活动资源 · {liveActivity ? describeMainlineAR65SceneActivityV645(liveActivity) : "尚未开始"} · 返回起点 · {liveReturn?.status ?? "尚未记录活动快照"}</p>
    </div>
    {running ? <div className="mt-2 grid gap-1 text-[9px] text-slate-500"><span>samples · {activeRef.current?.frames.length ?? 0} frames / {activeRef.current?.memory.length ?? 0} memory</span><span>active registry · {activeRef.current?.active ? `rev ${activeRef.current.active.revision} / ${activeRef.current.active.total} resources` : "waiting for real scene or object switch"}</span><span>visibility interruptions · {activeRef.current?.interruptions ?? 0} · physical mobile · not-run</span></div> : null}
    <div className="mt-3 space-y-2" data-mainline-a-r65-longrun-observations="true">{receipt.observations.length > 0 ? receipt.observations.map((observation, index) => <ObservationRow key={observation.sessionId} observation={observation} check={verification.observationChecks[index]} />) : <div className="rounded border border-dashed border-white/10 px-2 py-3 text-[10px] text-slate-600">尚无独立长跑记录。面板不会自动生成 fixture、synthetic 或 timeout 观察。</div>}</div>
    <footer className="mt-3 grid gap-1 border-t border-white/10 pt-2 text-[9px] leading-4 text-slate-600 sm:grid-cols-2" data-mainline-a-r65-longrun-boundary="true"><span>candidate-only · hold · not-admitted</span><span>scientificPayloadWriteback=false</span><span>mobile viewport ≠ physical mobile</span><span>static / browser / performance evidence remain separate</span></footer>
  </section>;
}
