"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MainlineACanonicalBatchExportV638 from "./MainlineACanonicalBatchExportV638";
import { useAtlasResourceSnapshot } from "../lib/atlasResourceLifecycle";
import { readMainlineAPerformanceBuildIdentityV625 } from "../lib/mainlineAPerformanceEvidenceV625";
import canonicalCoverage from "../data/mainlineACanonicalCoverageV622.generated.json";
import {
  readCanonicalRuntimeSelectionV635,
  subscribeCanonicalRuntimeV635,
  CANONICAL_COVERAGE_SHA256_V635,
  type CanonicalRuntimeSelectionV635,
} from "../lib/mainlineACanonicalRuntimeV635";
import {
  attachMainlineALifecycleBrowserV633,
  createMainlineALifecycleSessionV633,
  readMainlineALifecycleViewportV633,
} from "../lib/mainlineALifecycleSessionV633";
import {
  evaluateMainlineAResourceObservationV633,
  type MainlineAResourceObservationV633,
} from "../lib/mainlineAResourceObservationV633";
import {
  appendBrowserEvidenceEventV639,
  appendBrowserEvidenceObservationV639,
  browserEvidenceSessionBatchV639,
  browserEvidenceSessionRecordsV639,
  browserEvidenceSessionStorageKeyV639,
  createBrowserEvidenceSessionV639,
  createBrowserEvidenceStorageV639,
  decodeBrowserEvidenceSessionV639,
  encodeBrowserEvidenceSessionV639,
  markBrowserEvidencePanelLifecycleV639,
  persistBrowserEvidenceSessionV639,
  reconcileBrowserEvidenceSessionsV639,
  restoreBrowserEvidenceFromStorageV639,
  sessionWithPersistFailureV639,
  summarizeBrowserEvidenceSessionV639,
  type BrowserEvidenceBuildV639,
  type BrowserEvidenceSessionV639,
} from "../lib/mainlineABrowserEvidenceSessionV639";
import { createBrowserEvidenceRecoveryReportV640, planBrowserEvidenceRecoveryV640, recoverBrowserEvidenceSessionV640, recoverySummaryV640 } from "../lib/mainlineABrowserEvidenceRecoveryV640";

type Controller = ReturnType<typeof createMainlineALifecycleSessionV633>;
type Progress = ReturnType<Controller["snapshot"]>;
const MAX_HISTORY = 48;
const MAX_EXPORT_BYTES = 2 * 1024 * 1024;

export function canonicalObservationTargetV635(key: string) {
  const row = canonicalCoverage.records.find((item) => `${item.kind}:${item.id}` === key);
  if (!row) return null;
  return {
    kind: row.kind as CanonicalRuntimeSelectionV635["kind"], id: row.id,
    route: row.route.route, assetHash: row.route.assetHash,
  };
}

export function observationHistorySummaryV635(history: MainlineAResourceObservationV633[]) {
  const latest = new Map<string, boolean>();
  let blocked = 0;
  let longRuns = 0;
  for (const observation of history) {
    const evaluation = evaluateMainlineAResourceObservationV633(observation);
    const passed = evaluation.status === "measured-local";
    if (!passed) blocked += 1;
    if (passed && observation.session && observation.session.requestedDurationMs >= 1_800_000) longRuns += 1;
    const cycle = observation.objectCycle;
    if (!cycle?.target) continue;
    const key = `${cycle.target.kind}:${cycle.target.id}`;
    const target = canonicalObservationTargetV635(key);
    if (target) latest.set(key, passed && cycle.manifestDigest === CANONICAL_COVERAGE_SHA256_V635
      && target.route === cycle.target.route && target.assetHash === cycle.target.assetHash);
  }
  return { observedObjects: [...latest.values()].filter(Boolean).length, blocked, longRuns };
}

export function formatObservationBytesV633(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "不可用";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`;
  return `${(value / 1024 / 1024).toFixed(2)} MiB`;
}

export function observationExportV633(value: MainlineAResourceObservationV633): string {
  const json = JSON.stringify(value, null, 2);
  if (new TextEncoder().encode(json).length > MAX_EXPORT_BYTES) {
    throw new Error("本次记录超过 2 MiB 导出上限，请缩小观察范围。");
  }
  return json;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="min-w-0 rounded border border-white/10 bg-white/[.025] p-2">
    <span className="block text-[10px] text-slate-400">{label}</span>
    <strong className="mt-1 block break-words text-xs text-slate-100">{value}</strong>
  </div>;
}

function CheckpointTable({ observation }: { observation: MainlineAResourceObservationV633 }) {
  return <div className="overflow-x-auto rounded border border-white/10">
    <table className="w-full text-left text-[10px]">
      <caption className="p-2 text-left text-slate-400">完整快照摘要；JSON 同时保留逐资源、逐类别和逐所有者记录。</caption>
      <thead className="border-b border-white/10 text-slate-400">
        <tr><th className="p-2">阶段 / 场景</th><th className="p-2">资源</th><th className="p-2">纹理</th><th className="p-2">估算字节</th></tr>
      </thead>
      <tbody>{observation.checkpoints.map((checkpoint, index) => <tr key={`${checkpoint.phase}-${index}`} className="border-b border-white/5 text-slate-200">
        <td className="p-2">{checkpoint.phase}<span className="block text-slate-500">{checkpoint.scene}</span>
          {checkpoint.canonical && <span className="block break-all text-slate-400">{checkpoint.canonical.selection
            ? `${checkpoint.canonical.selection.kind}:${checkpoint.canonical.selection.id} · ${checkpoint.canonical.selection.loading}` : "无选中对象"}</span>}
        </td>
        <td className="p-2">{checkpoint.snapshot.total}</td>
        <td className="p-2">{checkpoint.snapshot.textures}</td>
        <td className="p-2">{formatObservationBytesV633(checkpoint.snapshot.estimatedBytes)}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

export function resourceOwnerChangesV633(observation: MainlineAResourceObservationV633) {
  const snapshots = ["baseline", "active", "returned"].map((phase) =>
    observation.checkpoints.find((item) => item.phase === phase)?.snapshot);
  if (snapshots.some((snapshot) => !snapshot)) return [];
  const [before, active, after] = snapshots;
  const owners = new Set([
    ...Object.keys(before!.byOwner),
    ...Object.keys(active!.byOwner),
    ...Object.keys(after!.byOwner),
  ]);
  return [...owners].sort().map((owner) => {
    const initial = before!.byOwner[owner] ?? { count: 0, estimatedBytes: 0 };
    const loaded = active!.byOwner[owner] ?? { count: 0, estimatedBytes: 0 };
    const returned = after!.byOwner[owner] ?? { count: 0, estimatedBytes: 0 };
    return {
      owner,
      before: initial.count,
      active: loaded.count,
      after: returned.count,
      bytesDelta: returned.estimatedBytes - initial.estimatedBytes,
      changed: initial.count !== loaded.count || loaded.count !== returned.count
        || initial.estimatedBytes !== loaded.estimatedBytes || loaded.estimatedBytes !== returned.estimatedBytes,
      restored: initial.count === returned.count && initial.estimatedBytes === returned.estimatedBytes,
    };
  });
}

function OwnerChanges({ observation }: { observation: MainlineAResourceObservationV633 }) {
  const [filter, setFilter] = useState("");
  const [changedOnly, setChangedOnly] = useState(true);
  const changes = useMemo(() => resourceOwnerChangesV633(observation), [observation]);
  const visible = changes.filter((row) => (!changedOnly || row.changed)
    && row.owner.toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
  return <details className="rounded border border-white/10 p-2 text-xs text-slate-300">
    <summary className="cursor-pointer">资源所有者变化 · {changes.filter((row) => row.changed).length} 个</summary>
    <div className="mt-2 space-y-2">
      <label className="block text-[11px] text-slate-400">筛选资源所有者
        <input value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="筛选资源所有者" className="mt-1 block w-full rounded border border-white/15 bg-black/30 p-2 text-xs" />
      </label>
      <label className="flex min-h-8 items-center gap-2 text-[11px]"><input type="checkbox" checked={changedOnly} onChange={(event) => setChangedOnly(event.target.checked)} />只看有变化的所有者</label>
      <p className="text-[10px] leading-4 text-slate-500">聚合数相同仍需逐资源身份校验。此表用于定位差异，完整判定见校验详情。</p>
      {visible.length ? <div className="max-h-60 space-y-1 overflow-y-auto">
        {visible.map((row) => <div key={row.owner} className="rounded border border-white/10 p-2 text-[10px]">
          <span className="block break-all text-slate-200">{row.owner}</span>
          <span className="block text-slate-400">基线 {row.before} → 加载后 {row.active} → 返回后 {row.after}</span>
          <span className={row.restored ? "text-slate-400" : "text-amber-100"}>返回后估算字节差 {row.bytesDelta > 0 ? "+" : ""}{row.bytesDelta} B · {row.restored ? "聚合回到基线" : "聚合仍有差异"}</span>
        </div>)}
      </div> : <p className="py-2 text-[11px] text-slate-500">没有匹配的所有者变化；这不构成释放证明。</p>}
    </div>
  </details>;
}

export default function MainlineAResourceObservationPanelV633({ onRunningChange }: { onRunningChange?: (running: boolean) => void }) {
  const resources = useAtlasResourceSnapshot();
  const [durationMs, setDurationMs] = useState<30_000 | 1_800_000>(30_000);
  const [mode, setMode] = useState<"scene" | "canonical-object">("scene");
  const [targetKey, setTargetKey] = useState(`${canonicalCoverage.records[0].kind}:${canonicalCoverage.records[0].id}`);
  const [canonicalRuntime, setCanonicalRuntime] = useState(readCanonicalRuntimeSelectionV635);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [history, setHistory] = useState<MainlineAResourceObservationV633[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("先停留在基线场景，开始后通过应用场景入口完成一次真实切换。");
  const [showExport, setShowExport] = useState(false);
  const [showSessionExport, setShowSessionExport] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [session, setSession] = useState<BrowserEvidenceSessionV639 | null>(null);
  const [persistence, setPersistence] = useState<"available" | "unavailable" | "not-requested">("not-requested");
  const controllerRef = useRef<Controller | null>(null);
  const activeRunIdRef = useRef<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);
  const retainedId = useRef<string | null>(null);
  const sessionRef = useRef<BrowserEvidenceSessionV639 | null>(null);
  const storageRef = useRef<ReturnType<typeof createBrowserEvidenceStorageV639>>(null);
  const downloadRef = useRef<{ url: string; timer: number } | null>(null);
  const selected = history.find((item) => item.runId === selectedId) ?? history[history.length - 1] ?? null;
  const evaluation = useMemo(() => selected ? evaluateMainlineAResourceObservationV633(selected) : null, [selected]);
  const running = progress?.state === "running";
  const historySummary = useMemo(() => observationHistorySummaryV635(history), [history]);
  const sessionSummary = useMemo(() => session
    ? summarizeBrowserEvidenceSessionV639(session, persistence)
    : null, [session, persistence]);
  const sessionBatch = useMemo(() => session ? browserEvidenceSessionBatchV639(session).evaluation : null, [session]);
  const recovery = useMemo(() => {
    if (!session) return { summary: "尚无会话恢复计划", action: "none" as const, conflicts: 0 };
    try {
      const plan = planBrowserEvidenceRecoveryV640([{ source: "current-tab", raw: encodeBrowserEvidenceSessionV639(session) }], session.build, session.updatedAt);
      const recovered = recoverBrowserEvidenceSessionV640(plan);
      const report = createBrowserEvidenceRecoveryReportV640(plan, recovered, session.updatedAt);
      return { summary: recoverySummaryV640(report), action: report.action, conflicts: report.conflicts.length };
    } catch (error) {
      return { summary: `恢复计划不可用：${error instanceof Error ? error.message : String(error)}`, action: "blocked" as const, conflicts: 1 };
    }
  }, [session]);
  const sessionExport = useMemo(() => {
    if (!session) return { json: "", error: null };
    try { return { json: encodeBrowserEvidenceSessionV639(session), error: null }; }
    catch (error) { return { json: "", error: error instanceof Error ? error.message : String(error) }; }
  }, [session]);
  const report = useMemo(() => {
    if (!selected) return { json: "", error: null };
    try { return { json: observationExportV633(selected), error: null }; }
    catch (error) { return { json: "", error: error instanceof Error ? error.message : String(error) }; }
  }, [selected]);

  const persistSession = useCallback((next: BrowserEvidenceSessionV639): string | null => {
    sessionRef.current = next;
    setSession(next);
    const storage = storageRef.current;
    if (!storage) { setPersistence("unavailable"); return "同源浏览器存储不可用"; }
    const result = persistBrowserEvidenceSessionV639(storage, next);
    if (result.ok) { setPersistence("available"); return null; }
    let failed = next;
    try { failed = sessionWithPersistFailureV639(next, result.error); } catch { /* Preserve the raw observations already in memory. */ }
    sessionRef.current = failed;
    setSession(failed);
    setPersistence("unavailable");
    return result.error;
  }, []);

  const recordSessionEvent = (event: Parameters<typeof appendBrowserEvidenceEventV639>[1]): string | null => {
    const current = sessionRef.current;
    if (!current) return "会话 ledger 尚未建立";
    try { return persistSession(appendBrowserEvidenceEventV639(current, event)); }
    catch (error) { return error instanceof Error ? error.message : String(error); }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanupRef.current?.();
      cleanupRef.current = null;
      controllerRef.current = null;
      if (downloadRef.current) {
        window.clearTimeout(downloadRef.current.timer);
        URL.revokeObjectURL(downloadRef.current.url);
        downloadRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const shell = document.querySelector<HTMLElement>("[data-atlas-app-shell]");
    const identity = readMainlineAPerformanceBuildIdentityV625(shell);
    if ([identity.buildId, identity.branch, identity.head].some((value) => !value || value.startsWith("unknown"))) {
      setPersistence("unavailable");
      return undefined;
    }
    const build: BrowserEvidenceBuildV639 = { buildId: identity.buildId, branch: identity.branch, head: identity.head };
    const viewport = readMainlineALifecycleViewportV633();
    const storage = createBrowserEvidenceStorageV639();
    storageRef.current = storage;
    let next: BrowserEvidenceSessionV639;
    if (storage) {
      const restored = restoreBrowserEvidenceFromStorageV639(storage, build);
      if (restored.session) {
        next = markBrowserEvidencePanelLifecycleV639(restored.session, "opened");
        setPersistence("available");
        const restoredHistory = browserEvidenceSessionRecordsV639(next);
        setHistory(restoredHistory.slice(-MAX_HISTORY));
        setSelectedId(restoredHistory.at(-1)?.runId ?? null);
      } else {
        next = createBrowserEvidenceSessionV639({ build, viewport });
        setPersistence(restored.status === "missing" ? "available" : "unavailable");
      }
    } else {
      next = createBrowserEvidenceSessionV639({ build, viewport });
      setPersistence("unavailable");
    }
    const persistenceError = persistSession(next);
    if (persistenceError) setNotice(`会话只能暂存在当前页面：${persistenceError}。请导出会话 JSON。`);
    const key = browserEvidenceSessionStorageKeyV639(build);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key || event.storageArea !== window.localStorage) return;
      if (!event.newValue) {
        setPersistence("unavailable");
        setNotice("另一标签移除了会话存储；当前页面的原始记录仍可导出。");
        return;
      }
      try {
        const incoming = decodeBrowserEvidenceSessionV639(event.newValue, build);
        const current = sessionRef.current;
        if (!current) return;
        const relation = reconcileBrowserEvidenceSessionsV639(current, incoming);
        if (relation === "advanced" && controllerRef.current?.state() !== "running") {
          sessionRef.current = incoming;
          setSession(incoming);
          const imported = browserEvidenceSessionRecordsV639(incoming);
          setHistory(imported.slice(-MAX_HISTORY));
          setSelectedId(imported.at(-1)?.runId ?? null);
          setPersistence("available");
          setNotice("已同步另一标签新增的原始观察；仍须导出并离线重算。 ");
        } else if (relation === "conflict" || relation === "wrong-build" || relation === "advanced") {
          setPersistence("unavailable");
          setNotice("检测到另一标签的并发会话；当前页面记录未覆盖，请先导出会话 JSON。");
        }
      } catch (error) {
        setPersistence("unavailable");
        setNotice(`另一标签的会话无法校验：${error instanceof Error ? error.message : String(error)}。当前页面记录仍可导出。`);
      }
    };
    if (storage) window.addEventListener("storage", onStorage);
    return () => {
      if (storage) window.removeEventListener("storage", onStorage);
      const current = sessionRef.current;
      if (!current) return;
      const closed = markBrowserEvidencePanelLifecycleV639(current, "closed");
      sessionRef.current = closed;
      if (storageRef.current) persistBrowserEvidenceSessionV639(storageRef.current, closed);
    };
  }, [persistSession]);

  useEffect(() => { onRunningChange?.(running); }, [running, onRunningChange]);
  useEffect(() => subscribeCanonicalRuntimeV635(() => setCanonicalRuntime(readCanonicalRuntimeSelectionV635())), []);

  const retain = (observation: MainlineAResourceObservationV633 | null) => {
    if (!observation || !mountedRef.current || retainedId.current === observation.runId) return;
    retainedId.current = observation.runId;
    setHistory((previous) => [...previous, observation].slice(-MAX_HISTORY));
    setSelectedId(observation.runId);
    setProgress(controllerRef.current?.snapshot() ?? null);
    setShowExport(true);
    const currentSession = sessionRef.current;
    let retentionError: string | null = null;
    if (currentSession) {
      try {
        const rawJson = observationExportV633(observation);
        const next = appendBrowserEvidenceObservationV639(currentSession, observation, rawJson, observation.endedAt);
        retentionError = persistSession(next);
      } catch (error) {
        retentionError = error instanceof Error ? error.message : String(error);
      }
    }
    const result = evaluateMainlineAResourceObservationV633(observation);
    setNotice(retentionError
      ? `会话存储未能保留本次原始记录：${retentionError}。当前页面仍可导出观察 JSON 与会话 ledger。`
      : result.status === "measured-local"
      ? "本地对象与资源观察已记录。请保存 JSON；复用已有资源与实际释放会分别报告。"
      : "本次观察存在未通过项，原始记录已保留。展开结果查看具体原因。");
  };

  const start = () => {
    if (running) return;
    if (document.visibilityState !== "visible") {
      setNotice("页面不可见，无法开始有效观察。");
      return;
    }
    const identity = readMainlineAPerformanceBuildIdentityV625(document.querySelector<HTMLElement>("[data-atlas-app-shell]"));
    if ([identity.buildId, identity.branch, identity.head].some((value) => !value || value.startsWith("unknown"))) {
      setNotice("构建身份尚未就绪，请等待应用加载完成。");
      return;
    }
    cleanupRef.current?.();
    setShowExport(false);
    setExportError(null);
    let controller: Controller;
    const target = canonicalObservationTargetV635(targetKey);
    if (mode === "canonical-object" && !target) {
      setNotice("目标不在 canonical manifest 中，无法开始对象观察。");
      return;
    }
    const runId = `r65-registry-${crypto.randomUUID()}`;
    try { controller = createMainlineALifecycleSessionV633({
      runId,
      build: { buildId: identity.buildId, branch: identity.branch, head: identity.head },
      viewport: readMainlineALifecycleViewportV633(),
      durationMs,
      mode,
      ...(mode === "canonical-object" && target ? { canonicalTarget: target, canonicalManifestDigest: CANONICAL_COVERAGE_SHA256_V635 } : {}),
    }); } catch (error) {
      setNotice(`无法开始资源观察：${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    controllerRef.current = controller;
    activeRunIdRef.current = runId;
    setProgress(controller.snapshot());
    cleanupRef.current = attachMainlineALifecycleBrowserV633(controller, {
      onUpdate: (value) => { if (mountedRef.current) setProgress(value); },
      onFinished: retain,
    });
    const eventError = recordSessionEvent({ type: "observation-started", runId,
      targetKey: mode === "canonical-object" && target ? `${target.kind}:${target.id}` : null });
    setNotice(eventError
      ? `观察已开始，但会话事件未保存：${eventError}。结束后请导出原始 JSON。`
      : mode === "canonical-object"
      ? "基线对象已记录。通过应用入口选择目标，等待实际渲染与资源加载，再点击「记录加载后」。"
      : "基线已记录。切换到另一场景，等待资源加载后点击「记录加载后」。请保持页面可见。");
  };

  const markActive = () => {
    const controller = controllerRef.current;
    if (!controller || controller.state() !== "running") return;
    controller.markActive();
    const next = controller.snapshot();
    setProgress(next);
    const eventError = sessionRef.current && next.activeCaptured
      ? recordSessionEvent({ type: "active-checkpoint-recorded", runId: activeRunIdRef.current }) : null;
    setNotice(eventError
      ? `加载后快照已记录，但会话事件未保存：${eventError}。请导出会话 ledger。`
      : next.activeCaptured
      ? "加载后快照已记录。返回基线场景或基线对象，等待资源释放，再点击「完成并校验」。"
      : "未记录到加载后阶段。确认目标已切换、实际加载完成，并检查记录中的阻断原因。");
  };

  const finish = () => {
    const controller = controllerRef.current;
    if (!controller || controller.state() !== "running") return;
    retain(controller.finish());
    cleanupRef.current?.();
    cleanupRef.current = null;
    setProgress(controller.snapshot());
    activeRunIdRef.current = null;
  };

  const abort = () => {
    const controller = controllerRef.current;
    if (!controller || controller.state() !== "running") return;
    retain(controller.abort("user-stopped"));
    cleanupRef.current?.();
    cleanupRef.current = null;
    setProgress(controller.snapshot());
    const eventError = sessionRef.current
      ? recordSessionEvent({ type: "observation-aborted", runId: activeRunIdRef.current, detail: "user-stopped" }) : null;
    setNotice(eventError
      ? `观察已停止，但中止事件未保存：${eventError}。请导出原始 JSON 与会话 ledger。`
      : "观察已停止，保留为未通过记录。不会把不足时长的样本提升为长时证据。");
    activeRunIdRef.current = null;
  };

  const download = () => {
    if (!selected || !report.json || report.error) return;
    if (downloadRef.current) {
      window.clearTimeout(downloadRef.current.timer);
      URL.revokeObjectURL(downloadRef.current.url);
    }
    const url = URL.createObjectURL(new Blob([report.json], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selected.runId}.json`;
    try {
      link.click();
      const timer = window.setTimeout(() => {
        URL.revokeObjectURL(url);
        downloadRef.current = null;
      }, 1000);
      downloadRef.current = { url, timer };
    } catch {
      URL.revokeObjectURL(url);
      downloadRef.current = null;
      setExportError("下载未能启动，完整 JSON 仍可从文本框复制。");
    }
  };

  const copy = async () => {
    if (!report.json) return;
    try {
      await navigator.clipboard.writeText(report.json);
      setNotice("已复制完整观察 JSON，包含全部资源快照。");
      setExportError(null);
    } catch {
      setExportError("剪贴板不可用，可从下方只读文本框复制，或下载 JSON。");
      setShowExport(true);
    }
  };

  return <div className="mt-3 space-y-3" data-mainline-a-resource-observation="v633" data-observation-state={progress?.state ?? "idle"}>
    <div className="rounded border border-cyan-100/20 bg-cyan-100/[.035] p-3">
      <h3 className="text-sm text-cyan-100">场景与对象资源观察</h3>
      <p className="mt-1 text-xs leading-5 text-slate-400">记录真实场景切换前、加载后、返回后的资源。保持页面可见；关闭面板会中止当前观察。</p>
      <ol className="mt-2 space-y-1 text-[11px] leading-5 text-slate-300">
        <li>1. 在当前场景开始，保留基线快照。</li>
        <li>2. 使用应用入口切换场景或指定对象，实际加载完成后记录。</li>
        <li>3. 返回基线场景或对象并等待释放，完成观察。</li>
      </ol>
    </div>
      <label className="block text-xs text-slate-300">观察范围
      <select aria-label="资源观察范围" value={mode} disabled={running} onChange={(event) => setMode(event.target.value as typeof mode)} className="mt-1 block w-full rounded border border-white/20 bg-[#081017] p-2 text-xs">
        <option value="scene">跨场景资源往返</option>
        <option value="canonical-object">同场景 canonical 对象往返</option>
      </select>
    </label>
    {mode === "canonical-object" && <div className="space-y-2 rounded border border-white/15 p-2">
      <label className="block text-xs text-slate-300">本次目标对象
        <select aria-label="本次目标对象" value={targetKey} disabled={running} onChange={(event) => {
          const nextTargetKey = event.target.value;
          setTargetKey(nextTargetKey);
          if (sessionRef.current) {
            const eventError = recordSessionEvent({ type: "target-selected", targetKey: nextTargetKey });
            if (eventError) setNotice(`目标已切换，但会话事件未保存：${eventError}。请导出会话 ledger。`);
          }
        }} className="mt-1 block w-full rounded border border-white/20 bg-[#081017] p-2 text-xs">
          {canonicalCoverage.records.map((row) => <option key={`${row.kind}:${row.id}`} value={`${row.kind}:${row.id}`}>{row.kind} · {row.displayName}</option>)}
        </select>
      </label>
      <p className="break-all text-[11px] text-slate-400">运行时对象：{canonicalRuntime.selection
        ? `${canonicalRuntime.selection.kind}:${canonicalRuntime.selection.id} · ${canonicalRuntime.selection.loading}` : "尚无组件报告"}</p>
      {canonicalRuntime.selection?.error && <p role="alert" className="text-xs text-rose-200">{canonicalRuntime.selection.error}</p>}
      {canonicalRuntime.cleanupErrors.length > 0 && <p role="alert" className="text-xs text-rose-200">资源清理异常：{canonicalRuntime.cleanupErrors.join("；")}</p>}
      <p className="text-[10px] leading-5 text-slate-500">目标选择仅指定验收对象。请通过图集或场景入口实际切换；未报告加载成功的组件继续 pending。</p>
    </div>}
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Metric label="当前登记资源" value={resources.total} />
      <Metric label="当前登记纹理" value={resources.textures} />
      <Metric label="登记估算占用" value={formatObservationBytesV633(resources.estimatedBytes)} />
      <Metric label="资源所有者" value={Object.keys(resources.byOwner).length} />
    </div>
    <label className="block text-xs text-slate-300">观察时长
      <select aria-label="资源观察时长" disabled={running} value={durationMs} onChange={(event) => setDurationMs(Number(event.target.value) as 30_000 | 1_800_000)} className="mt-1 block w-full rounded border border-white/20 bg-[#081017] p-2 text-xs">
        <option value={30_000}>30 秒 · 场景释放检查</option>
        <option value={1_800_000}>30 分钟 · 持续观察</option>
      </select>
    </label>
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={start} disabled={running} className="min-h-10 rounded border border-cyan-100/30 px-3 text-xs text-cyan-100 disabled:opacity-35">开始资源观察</button>
      <button type="button" onClick={markActive} disabled={!running || progress?.activeCaptured} className="min-h-10 rounded border border-white/20 px-3 text-xs text-slate-200 disabled:opacity-35">记录加载后</button>
      <button type="button" onClick={finish} disabled={!running || !progress?.activeCaptured || (progress?.remainingMs ?? 1) > 0} className="min-h-10 rounded border border-white/20 px-3 text-xs text-slate-200 disabled:opacity-35">完成并校验</button>
      <button type="button" onClick={abort} disabled={!running} className="min-h-10 rounded border border-rose-100/20 px-3 text-xs text-rose-100 disabled:opacity-35">中止并保留</button>
    </div>
    {progress && <div className="rounded border border-white/10 p-2 text-[11px] text-slate-300" role="status" aria-live="off">
      <span>场景 {progress.currentScene} · 已观察 {Math.floor(progress.elapsedMs / 1000)}s</span>
      <span className="block text-slate-400">剩余至少 {Math.ceil(progress.remainingMs / 1000)}s · {progress.frameCount} 次 RAF 间隔采样 · {progress.state}</span>
    </div>}
    <p role="status" className="rounded border border-amber-100/15 bg-amber-100/[.025] p-2 text-[11px] leading-5 text-amber-100/80">{notice}</p>
    {sessionSummary && <div className="rounded border border-white/10 bg-white/[.02] p-2 text-[10px] leading-5 text-slate-400" data-mainline-a-evidence-session="v639">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-slate-200">B2 会话 ledger · {sessionSummary.status}</strong>
        <span>持久化：{sessionSummary.persistence === "available" ? "当前标签可用" : "不可用"}</span>
      </div>
      <p>已保留 {sessionSummary.observed}/36 个对象，最新通过 {sessionSummary.verified}/36，阻断记录 {sessionSummary.blockedRecords}，事件 {session?.events.length ?? 0}。</p>
      <p>当前批次可重算：{sessionBatch ? `${sessionBatch.verified}/36 · ${sessionBatch.issues.length} 个问题` : "尚无记录"}；失败重试仍保留在 ledger，导出批次只取每个对象最新记录。</p>
      <p data-mainline-a-recovery-v640="true">V640 离线恢复：{recovery.summary}；冲突 {recovery.conflicts}。该状态只说明 ledger 可否恢复，不提升浏览器、科学、版权或性能证据。</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" onClick={() => setShowSessionExport((value) => !value)} aria-expanded={showSessionExport} className="min-h-9 rounded border border-white/20 px-2 text-xs text-slate-200">{showSessionExport ? "收起会话 JSON" : "显示会话 JSON"}</button>
        {sessionExport.json && <button type="button" onClick={() => {
          const blob = new Blob([sessionExport.json], { type: "application/json;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a"); link.href = url; link.download = `${session?.sessionId ?? "mainline-a-session"}.json`; link.click();
          window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        }} className="min-h-9 rounded border border-white/20 px-2 text-xs text-slate-200">下载会话 ledger</button>}
      </div>
      {showSessionExport && <textarea aria-label="完整浏览器会话 ledger JSON" readOnly value={sessionExport.json} className="mt-2 h-40 w-full min-w-0 resize-y rounded border border-white/20 bg-black/30 p-2 font-mono text-[10px] text-slate-300" />}
      {sessionExport.error && <p role="alert" className="text-rose-200">会话导出失败：{sessionExport.error}</p>}
      <p>该 ledger 只用于恢复原始浏览器记录；它不提供浏览器签名、版权批准、科学有效性或生产性能证明。</p>
    </div>}
    {history.length > 0 && <div className="space-y-2 border-t border-white/10 pt-3">
      <h4 className="text-xs text-slate-200">本面板记录 · {history.length}/{MAX_HISTORY}</h4>
      <p className="text-[10px] text-slate-500">保留最近 48 次原始记录；关闭面板前逐次下载 JSON。超过上限会移出最早记录。</p>
      <p className="text-[11px] text-slate-400">最新对象观察通过 {historySummary.observedObjects}/36 · 未通过记录 {historySummary.blocked} · 30 分钟记录 {historySummary.longRuns}</p>
      <p className="text-[10px] leading-5 text-slate-500">这里只汇总当前面板记录。发布校验器会重新核对 36 个对象、原始文件哈希和构建；长时门禁另需至少两次独立、连续可见的 30 分钟记录。</p>
      <div className="flex flex-wrap gap-1">{history.map((item, index) => <button type="button" key={item.runId} onClick={() => { setSelectedId(item.runId); setExportError(null); }} aria-pressed={selected?.runId === item.runId} className="min-h-9 rounded border border-white/15 px-2 text-[11px] text-slate-300 aria-pressed:border-cyan-100/50">记录 {index + 1}</button>)}</div>
      <MainlineACanonicalBatchExportV638 history={history} />
    </div>}
    {selected && evaluation && <div className="space-y-2" data-resource-observation-result={evaluation.status}>
      <h4 className="break-all text-xs text-slate-200">{selected.runId}</h4>
      <p className="text-xs text-cyan-100">{evaluation.status}</p>
      <CheckpointTable observation={selected} />
      <OwnerChanges key={selected.runId} observation={selected} />
      <details className="rounded border border-white/10 p-2 text-[10px] text-slate-400">
        <summary className="cursor-pointer text-xs text-slate-200">资源变化与校验详情</summary>
        <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(evaluation, null, 2)}</pre>
      </details>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setShowExport((value) => !value)} aria-expanded={showExport} className="min-h-9 rounded border border-white/20 px-2 text-xs text-slate-200">{showExport ? "收起完整 JSON" : "显示完整 JSON"}</button>
        <button type="button" onClick={download} disabled={Boolean(report.error)} className="min-h-9 rounded border border-white/20 px-2 text-xs text-slate-200">下载观察 JSON</button>
        <button type="button" onClick={() => void copy()} disabled={Boolean(report.error)} className="min-h-9 rounded border border-white/20 px-2 text-xs text-slate-200">复制观察 JSON</button>
      </div>
      {(report.error || exportError) && <p role="alert" className="text-xs text-rose-200">{report.error ?? exportError}</p>}
      {showExport && !report.error && <label className="block text-xs text-slate-400">完整资源观察 JSON
        <textarea aria-label="完整资源观察 JSON" readOnly value={report.json} className="mt-1 h-48 w-full min-w-0 resize-y rounded border border-white/20 bg-black/30 p-2 font-mono text-[10px] text-slate-300" />
      </label>}
    </div>}
    <footer className="border-t border-white/10 pt-2 text-[10px] leading-5 text-slate-500">
      <p>登记字节为估算，不能证明显卡物理内存。对象往返中复用既有资源可记录为复用；相同摘要或静止场景不会被认定为资源释放。</p>
      <p>帧摘要采集浏览器 requestAnimationFrame 回调间隔，不等同于渲染器帧时间。</p>
      <p>模拟移动视口不是物理设备；本地观察不代表生产性能。</p>
      <p>candidate-only · hold · not-admitted · scientificPayloadWriteback=false</p>
    </footer>
  </div>;
}
