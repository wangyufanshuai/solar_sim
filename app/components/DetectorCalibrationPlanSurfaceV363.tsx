"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V362, resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
import { createAtlasVisualTokenSignatureV300, useAtlasVisualRuntimeConsumerV300 } from "../lib/atlasVisualRuntimeConsumptionV300";
import { parseKerrDetectorCalibrationPlanV363, type KerrDetectorCalibrationPlanArtifactV363 } from "../lib/kerrDetectorCalibrationPlanV363";

export default function DetectorCalibrationPlanSurfaceV363() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V362) return null;
  return <CalibrationPlanPanelV363 />;
}

function CalibrationPlanPanelV363() {
  const resolved = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V362);
  const tokens = resolved.runtimeTokens.hud.instrumentLabV9;
  if (!tokens) throw new Error("v363-instrument-token-boundary");
  useAtlasVisualRuntimeConsumerV300({ profile: resolved.id, group: "hud", consumer: "DetectorCalibrationPlanSurfaceV363", tokenSignature: createAtlasVisualTokenSignatureV300(resolved.runtimeTokens.hud) });
  const [artifact, setArtifact] = useState<KerrDetectorCalibrationPlanArtifactV363 | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable" | "error">("loading");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v363/calibration-plan", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const value = await response.json() as { available?: boolean; artifact?: unknown };
        if (response.ok && value.available === false) return null;
        if (!response.ok || value.available !== true || !value.artifact) throw new Error("v363-calibration-plan-unavailable");
        return parseKerrDetectorCalibrationPlanV363(value.artifact);
      })
      .then((value) => { if (controller.signal.aborted) return; if (!value) { setState("unavailable"); return; } setArtifact(value); setState("ready"); })
      .catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, []);
  const style = {
    "--atlas-v363-grid-opacity": tokens.uncertaintyGridOpacity,
    "--atlas-v363-alert-opacity": tokens.calibrationAlertOpacity,
    "--atlas-v363-accent": tokens.eigenmodeAccent,
  } as CSSProperties;
  const rankedBands = artifact?.bandPressure.slice().sort((left, right) => left.priorityRank - right.priorityRank) ?? [];
  return <section
    style={style}
    className="relative mt-2 overflow-hidden rounded-[10px] border border-cyan-100/15 bg-[linear-gradient(145deg,rgba(3,20,29,.94),rgba(6,8,14,.98))] p-3 font-mono text-[8px] text-white/55"
    data-atlas-detector-calibration-plan-v363
    data-atlas-detector-calibration-plan-status={state}
    data-atlas-v363-measured-performance-claimed="false"
    data-atlas-v363-task-execution="not-run-plan-only"
    data-atlas-v363-science-buffer-mutation="false"
    data-atlas-v363-cinematic-color-input="false"
  >
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v363-grid-opacity)] [background-image:linear-gradient(rgba(103,232,249,.12)_1px,transparent_1px)] [background-size:100%_22px]" />
    <div className="relative flex flex-wrap items-end justify-between gap-2"><div><div className="text-[7px] uppercase tracking-[.2em] text-cyan-100/50">Calibration design v363</div><div className="text-[13px] text-cyan-50/90">采集优先级与结构可辨识矩阵</div></div><div className="text-right text-[7px] text-cyan-100/60">{state}<br />plan only · no measurements</div></div>
    {artifact ? <>
      <div className="relative mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Metric label="requirements" value="11 / 11 covered" />
        <Metric label="tasks" value="9 planned" />
        <Metric label="structural rank" value={`${artifact.identifiability.rank} / ${artifact.counts.parameterCount}`} />
        <Metric label="execution" value="NOT RUN" alert />
      </div>
      <div className="relative mt-2 grid gap-1.5 sm:grid-cols-3">
        {rankedBands.map((band) => <div key={band.bandId} className="rounded border border-white/[.08] bg-black/20 px-2 py-2">
          <div className="flex justify-between text-[7px] uppercase text-white/34"><span>#{band.priorityRank} {band.bandId}</span><span>synthetic</span></div>
          <div className="mt-1 text-[10px] text-cyan-50/80">log₁₀ pressure {band.log10GeometricMeanSystematicToPoissonRatio.toFixed(3)}</div>
          <div className="mt-0.5 h-1 overflow-hidden rounded bg-white/[.06]"><i className="block h-full rounded bg-cyan-200/55" style={{ width: `${Math.max(6, band.relativeLogPressure * 100)}%` }} /></div>
        </div>)}
      </div>
      <details className="relative mt-2 rounded border border-white/[.08] bg-black/20 px-2 py-1.5">
        <summary className="atlas-accessible-focus cursor-pointer text-cyan-50/75">查看 9 个采集任务与验收证据</summary>
        <div className="mt-1.5 grid gap-1 sm:grid-cols-2">
          {artifact.acquisitionTasks.map((task) => <div key={task.id} className="rounded border border-white/[.06] px-2 py-1.5 text-[7px] text-white/42">
            <div className="text-cyan-100/72">{task.phase} · {task.label}</div>
            <div className="mt-0.5">{task.plannedCount} {task.plannedCountUnit} · {task.design}</div>
            <div className="mt-0.5 text-white/30">evidence: {task.acceptanceEvidence}</div>
          </div>)}
        </div>
      </details>
      <div className="relative mt-2 rounded border border-amber-100/10 bg-amber-100/[.025] px-2 py-1.5 text-[7px] text-white/38">
        排序仅来自 v360 合成 log-ratio，用于规划而非探测器性能结论。采样数是无实测方差条件下的 planning floor，不是统计功效保证；v361 实测校准仍未取得。
      </div>
    </> : <div className="relative mt-2 rounded border border-white/[.08] px-2 py-1.5 text-white/40">{state === "loading" ? "正在读取有界采集设计…" : state === "unavailable" ? "仅 local-shadow Instrument Lab 可用。" : "采集设计证据不可用；已 fail closed。"}</div>}
  </section>;
}

function Metric({ label, value, alert = false }: Readonly<{ label: string; value: string; alert?: boolean }>) {
  return <div className="rounded border border-white/[.08] bg-black/20 px-2 py-2"><div className="text-[7px] uppercase text-white/30">{label}</div><div className={`mt-1 text-[11px] ${alert ? "text-amber-100/80" : "text-cyan-50/84"}`}>{value}</div></div>;
}
