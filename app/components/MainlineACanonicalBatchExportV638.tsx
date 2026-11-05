"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createCanonicalBrowserBatchV638, evaluateCanonicalBrowserBatchV638 } from "../lib/mainlineACanonicalBatchV638";
import type { MainlineAResourceObservationV633 } from "../lib/mainlineAResourceObservationV633";
import { readMainlineAPerformanceBuildIdentityV625 } from "../lib/mainlineAPerformanceEvidenceV625";

export default function MainlineACanonicalBatchExportV638({ history }: { history: MainlineAResourceObservationV633[] }) {
  const [expanded, setExpanded] = useState(false);
  const [notice, setNotice] = useState("");
  const downloadRef = useRef<{ url: string; timer: number } | null>(null);
  const report = useMemo(() => {
    if (!history.length || typeof document === "undefined") return null;
    const identity = readMainlineAPerformanceBuildIdentityV625(document.querySelector<HTMLElement>("[data-atlas-app-shell]"));
    const build = { buildId: identity.buildId, branch: identity.branch, head: identity.head };
    try {
      const batch = createCanonicalBrowserBatchV638(history, build);
      return { json: JSON.stringify(batch, null, 2), evaluation: evaluateCanonicalBrowserBatchV638(batch, build), error: null };
    } catch (error) {
      return { json: "", evaluation: null, error: error instanceof Error ? error.message : "批次导出失败" };
    }
  }, [history]);
  useEffect(() => () => {
    if (downloadRef.current) {
      URL.revokeObjectURL(downloadRef.current.url);
      window.clearTimeout(downloadRef.current.timer);
      downloadRef.current = null;
    }
  }, []);
  function download() {
    if (!report?.json) return;
    if (downloadRef.current) {
      URL.revokeObjectURL(downloadRef.current.url);
      window.clearTimeout(downloadRef.current.timer);
    }
    const url = URL.createObjectURL(new Blob([report.json], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `mainline-a-canonical-batch-${Date.now()}.json`;
    try {
      link.click();
      downloadRef.current = { url, timer: window.setTimeout(() => { URL.revokeObjectURL(url); downloadRef.current = null; }, 1000) };
      setNotice("已请求下载全部记录，包括未通过的尝试。请保留原始批次文件。");
    } catch {
      URL.revokeObjectURL(url);
      downloadRef.current = null;
      setExpanded(true);
      setNotice("下载未启动，可从下方只读文本框保存完整批次。");
    }
  }
  if (!report) return null;
  const evaluation = report.evaluation;
  return <section aria-label="完整对象观察批次" className="space-y-2 rounded border border-cyan-100/20 p-3">
    <h4 className="text-xs text-cyan-100">批次保存与对象覆盖</h4>
    {evaluation && <>
      <p className="text-[11px] text-slate-300">最新尝试通过 {evaluation.verified}/36 · 原始记录 {history.length} · 未通过记录 {evaluation.rejectedRuns}</p>
      <p className="text-[10px] leading-5 text-slate-400">同一对象以最后一次尝试为准；后续失败会保留并重新打开该对象门禁。不同构建、重复 runId 和 fixture 无法组成有效批次。</p>
      {evaluation.missing.length > 0 && <details className="text-[10px] text-slate-400">
        <summary>仍需完成的对象 · {evaluation.missing.length}</summary>
        <ul className="mt-2 grid grid-cols-2 gap-1">{evaluation.missing.map((key) => <li className="break-all" key={key}>{key}</li>)}</ul>
      </details>}
      {evaluation.issues.length > 0 && <p role="alert" className="break-words text-[10px] text-rose-200">{evaluation.issues.join(" · ")}</p>}
    </>}
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={download} disabled={!report.json} className="min-h-10 rounded border border-white/20 px-3 text-xs">下载完整批次</button>
      <button type="button" onClick={() => setExpanded((previous) => !previous)} disabled={!report.json} aria-expanded={expanded}
        className="min-h-10 rounded border border-white/20 px-3 text-xs">{expanded ? "收起批次 JSON" : "显示批次 JSON"}</button>
    </div>
    {(report.error || notice) && <p role="status" className="text-[10px] text-amber-100">{report.error ?? notice}</p>}
    {expanded && <label className="block text-xs text-slate-400">完整对象观察批次 JSON
      <textarea readOnly aria-label="完整对象观察批次 JSON" value={report.json} className="mt-1 h-44 w-full rounded border border-white/20 bg-black/30 p-2 font-mono text-[10px]" />
    </label>}
    <p className="text-[10px] leading-5 text-slate-500">此包保留浏览器导出的原始记录字符串。离线工具重算每份字节哈希并复用既有回放；字节一致不能独立认证浏览器来源，也不代表版权、科学或发布批准。</p>
  </section>;
}
