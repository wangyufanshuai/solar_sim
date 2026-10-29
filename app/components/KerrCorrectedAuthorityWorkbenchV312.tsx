"use client";

import { useEffect, useState } from "react";
import { parseKerrCorrectedAuthorityViewV312, type KerrCorrectedAuthorityViewV312 } from "../lib/kerrAuthorityV312";

const ARTIFACT_URL = "/api/atlas/relativity-evidence/artifacts/v312-corrected-authority";
const MAX_RESPONSE_BYTES = 32 * 1024;

export default function KerrCorrectedAuthorityWorkbenchV312() {
  const [view, setView] = useState<KerrCorrectedAuthorityViewV312 | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  useEffect(() => {
    const controller = new AbortController();
    void fetch(ARTIFACT_URL, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("v312-authority-unavailable");
        const text = await response.text();
        if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new Error("v312-authority-view-size-boundary");
        return parseKerrCorrectedAuthorityViewV312(JSON.parse(text));
      })
      .then((next) => { setView(next); setStatus("ready"); })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") setStatus("unavailable");
      });
    return () => controller.abort();
  }, []);
  if (!view) return <div className="mt-2 rounded border border-cyan-100/10 bg-cyan-100/[0.025] px-3 py-2 text-[10px] text-white/45" data-atlas-kerr-v312={status}>{status === "loading" ? "正在读取 v312 corrected authority…" : "v312 corrected authority unavailable"}</div>;
  return (
    <section className="mt-2 rounded border border-cyan-100/12 bg-cyan-100/[0.035] px-3 py-2 text-[10px] text-white/52" data-atlas-kerr-v312="corrected-authority-qualified" data-atlas-kerr-v312-sha={view.authoritySha256}>
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-cyan-50/78">v312 双容差科研权威</span><span className="font-mono text-emerald-100/65">{view.solverLadder.pairCount}/{view.solverLadder.expectedPairCount} pairs</span></div>
      <div className="mt-1 grid grid-cols-2 gap-1 sm:grid-cols-4">
        <div>执行<div className="font-mono text-white/72">{view.executionCount}</div></div>
        <div>非退化槽<div className="font-mono text-white/72">{view.solverLadder.distinctObservableCount}/{view.solverLadder.observableCount}</div></div>
        <div>release / internal<div className="font-mono text-white/72">{view.solverLadder.releaseRtol.toExponential()} / {view.solverLadder.internalRtol.toExponential()}</div></div>
        <div>peak RSS<div className="font-mono text-white/72">{view.resource.peakRssGiB.toFixed(3)} GiB</div></div>
      </div>
      <div className="mt-1 font-mono text-[9px] text-white/38">Carter {view.residuals.maxCarterNormalized.toExponential(2)} · null {view.residuals.maxMassShellRaw.toExponential(2)} · redshift Δ {view.residuals.maxRedshiftDifference.toExponential(2)}</div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[9px] text-amber-50/55"><span>旧 v311 shard 仍隔离；偏振与新 dense namespace 尚未晋级。</span><a href={ARTIFACT_URL} target="_blank" rel="noreferrer" className="atlas-accessible-focus underline decoration-cyan-100/20 underline-offset-2">查看有界证据</a></div>
    </section>
  );
}
