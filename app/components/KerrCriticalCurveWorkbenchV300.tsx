"use client";

import { useEffect, useMemo, useState } from "react";
import {
  parseKerrCriticalCurveViewV300,
  type KerrCriticalCurveViewV300,
} from "../lib/kerrCriticalCurveV300";
import {
  createKerrCriticalCurvePlotV300,
  nearestKerrCriticalBracketV300,
} from "../lib/kerrCriticalCurvePlotV300";

const ARTIFACT_URL = "/api/atlas/relativity-evidence/artifacts/v296-critical-brackets";
const MAX_RESPONSE_BYTES = 32 * 1024;

type LoadState = "loading" | "ready" | "unavailable";

export default function KerrCriticalCurveWorkbenchV300({ spinA }: { readonly spinA: number }) {
  const [view, setView] = useState<KerrCriticalCurveViewV300 | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(ARTIFACT_URL, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("critical-curve-artifact-unavailable");
        const text = await response.text();
        if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) {
          throw new Error("critical-curve-response-size-boundary");
        }
        return parseKerrCriticalCurveViewV300(JSON.parse(text));
      })
      .then((validated) => {
        setView(validated);
        setLoadState("ready");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setView(null);
        setLoadState("unavailable");
      });
    return () => controller.abort();
  }, []);

  const plot = useMemo(() => view ? createKerrCriticalCurvePlotV300(view) : null, [view]);
  const selected = useMemo(() => view ? nearestKerrCriticalBracketV300(view, spinA) : null, [spinA, view]);

  if (!view || !plot || !selected) {
    return (
      <div className="mt-2 rounded border border-cyan-100/10 bg-black/15 px-3 py-2 text-[10px] text-white/45" data-atlas-critical-curve-v300={loadState}>
        {loadState === "loading" ? "正在读取 SHA 锁定的临界曲线…" : "临界曲线不可用；不会使用经验着色器替代科研结果。"}
      </div>
    );
  }

  const selectedImpactM = (selected.leftImpactM + selected.rightImpactM) / 2;
  return (
    <figure
      className="mt-2 overflow-hidden rounded border border-cyan-100/12 bg-[radial-gradient(circle_at_50%_25%,rgba(34,211,238,0.07),transparent_58%),rgba(0,0,0,0.2)] p-2.5"
      data-atlas-critical-curve-v300="ready"
      data-atlas-critical-curve-bracket-count={view.bracketCount}
      data-atlas-critical-curve-authority-sha={view.geometryEvidenceSha256}
      data-atlas-critical-curve-max-width-px={view.maxBracketWidthPx}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <figcaption>
          <div className="text-[10px] font-medium tracking-[0.08em] text-cyan-50/80">有限距离 ZAMO 临界曲线</div>
          <div className="mt-0.5 text-[9px] text-white/42">40 个 capture/escape 异类端点区间 · 只读 v296 authority</div>
        </figcaption>
        <div className="text-right font-mono text-[9px] text-cyan-50/65">
          <div>a/M {selected.spin.toFixed(4)} · b {selectedImpactM.toFixed(6)} M</div>
          <div>bracket {selected.bracketWidthPx.toExponential(3)} px</div>
        </div>
      </div>
      <svg viewBox={plot.viewBox} role="img" aria-label="Kerr finite-observer critical curve brackets by signed spin" className="mt-2 block aspect-[8/3] w-full">
        <defs>
          <linearGradient id="atlas-kerr-critical-positive-v300" x1="0" x2="1">
            <stop offset="0" stopColor="#67e8f9" stopOpacity="0.45" />
            <stop offset="1" stopColor="#f0abfc" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="atlas-kerr-critical-negative-v300" x1="0" x2="1">
            <stop offset="0" stopColor="#f0abfc" stopOpacity="0.9" />
            <stop offset="1" stopColor="#67e8f9" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <line x1="34" x2="606" y1={plot.xAxisY} y2={plot.xAxisY} stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
        <line x1={plot.yAxisX} x2={plot.yAxisX} y1="22" y2="218" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
        <path d={plot.positivePath} fill="none" stroke="url(#atlas-kerr-critical-positive-v300)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <path d={plot.negativePath} fill="none" stroke="url(#atlas-kerr-critical-negative-v300)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {plot.points.map((point) => (
          <circle
            key={point.index}
            cx={point.x}
            cy={point.y}
            r={point.index === selected.index ? 3.2 : 1.65}
            fill={point.index === selected.index ? "#fef3c7" : point.endpointClasses[0] === "capture" ? "#67e8f9" : "#f0abfc"}
            stroke={point.index === selected.index ? "rgba(255,255,255,0.8)" : "none"}
            strokeWidth="0.8"
          />
        ))}
        <text x="606" y={plot.xAxisY - 6} textAnchor="end" fill="rgba(255,255,255,0.42)" fontSize="9">spin a/M</text>
        <text x="40" y="32" fill="rgba(255,255,255,0.42)" fontSize="9">impact b/M</text>
      </svg>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[9px] text-white/40">
        <span>最大 bracket 宽度 {view.maxBracketWidthPx.toExponential(3)} px，门槛 &lt; 0.5 px</span>
        <a href={ARTIFACT_URL} target="_blank" rel="noreferrer" className="atlas-accessible-focus text-cyan-100/65 underline decoration-cyan-100/20 underline-offset-2">查看 40-bracket JSON</a>
      </div>
    </figure>
  );
}
