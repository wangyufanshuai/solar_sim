"use client";

import { useEffect, useState, type MutableRefObject } from "react";
import type { PhysicsPrecisionTier } from "../lib/physicsPrecision";
import { mainThreadLastAcceptedSubsteps } from "../lib/solarIntegrationMetrics";
import { isPhysicsRuntime } from "../lib/physicsRuntime";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import type { AtlasPerformanceBudgetSummary } from "../lib/simulationDiagnosticsTypes";

const TIERS: { id: PhysicsPrecisionTier; label: string }[] = [
  { id: "full", label: "FULL" },
  { id: "economy", label: "ECO" },
  { id: "newton", label: "NEWTON" },
];

export default function PhysicsPerformanceHud({
  physicsRef,
  precisionTierRef,
  physicsUsesSharedBuffer,
  performanceBudgetSummary,
}: {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  precisionTierRef: MutableRefObject<PhysicsPrecisionTier>;
  physicsUsesSharedBuffer: boolean;
  performanceBudgetSummary?: AtlasPerformanceBudgetSummary;
}) {
  const [stepsPerSec, setStepsPerSec] = useState(0);
  const [fps, setFps] = useState(0);
  const [frameMs, setFrameMs] = useState(0);
  const [tierLabel, setTierLabel] = useState<PhysicsPrecisionTier>(
    precisionTierRef.current,
  );

  useEffect(() => {
    let id = 0;
    const stepsBuf: number[] = [];
    const timeBuf: number[] = [];
    let lastFrameT = performance.now();
    let fpsSmooth = 0;
    let lastSetT = 0;

    const tick = (t: number) => {
      const dt = Math.max(1, t - lastFrameT);
      lastFrameT = t;
      const currentFps = 1000 / dt;
      fpsSmooth = fpsSmooth === 0 ? currentFps : fpsSmooth * 0.9 + currentFps * 0.1;
      const p = physicsRef.current;
      let s = mainThreadLastAcceptedSubsteps.value;
      if (p && isPhysicsRuntime(p)) {
        s = p.getStepsLastFrame();
      }
      stepsBuf.push(s);
      timeBuf.push(t);
      while (timeBuf.length > 0 && t - timeBuf[0]! > 1000) {
        timeBuf.shift();
        stepsBuf.shift();
      }
      if (t - lastSetT >= 300) {
        lastSetT = t;
        const sum = stepsBuf.reduce((a, b) => a + b, 0);
        const dtMs = t - (timeBuf[0] ?? t);
        const dtS = dtMs / 1000;
        setStepsPerSec(dtS > 0.05 ? sum / dtS : 0);
        setFps(fpsSmooth);
        setFrameMs(1000 / Math.max(fpsSmooth, 1));
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [physicsRef]);

  return (
    <div
      className="atlas-cinematic-panel pointer-events-auto fixed right-3 top-3 z-[84] w-[96px] rounded-lg px-2 py-1.5 text-white/58 sm:w-[164px] sm:px-3 sm:py-2.5"
      data-atlas-performance-version={performanceBudgetSummary?.version}
      data-atlas-performance-tier={performanceBudgetSummary?.tier}
      data-atlas-cinematic-hud="performance"
    >
      <div className="hidden text-[8px] tracking-[0.2em] text-[var(--atlas-cine-dim)] sm:block">PHYSICS ENGINE</div>
      <div className="mt-1.5 hidden text-[10px] text-[var(--atlas-cine-muted)] sm:block">
        {physicsUsesSharedBuffer ? "Worker + SAB" : "Main thread"}
      </div>
      <div className="text-center text-[10px] sm:mt-1 sm:text-left">
        FPS <span className={fps >= 50 ? "text-emerald-200" : fps >= 30 ? "text-amber-200" : "text-rose-200"}>{fps.toFixed(0)}</span>
        <span className="ml-1 hidden text-white/34 sm:inline">{frameMs.toFixed(1)}ms</span>
      </div>
      <div className="mt-1 hidden text-[10px] sm:block">
        Steps/s <span className="text-white/82">{stepsPerSec.toFixed(0)}</span>
      </div>
      {performanceBudgetSummary ? (
        <div className="mt-2 hidden rounded-md border border-[var(--atlas-cine-line)] bg-black/24 px-2 py-1.5 text-[9px] text-[var(--atlas-cine-muted)] sm:block">
          <div className="flex items-center justify-between gap-2">
            <span>Render</span>
            <span className="text-cyan-100/82">{performanceBudgetSummary.tier}</span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <span>Stability</span>
            <span className={performanceBudgetSummary.renderStability === "ready" ? "text-emerald-200" : "text-amber-200"}>
              {performanceBudgetSummary.renderStability}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <span>Labels</span>
            <span className="text-white/78">{performanceBudgetSummary.deepSkyLabelBudget}</span>
          </div>
        </div>
      ) : null}
      <div className="mt-2 hidden rounded-md bg-black/24 p-1 sm:flex">
        {TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              precisionTierRef.current = t.id;
              setTierLabel(t.id);
            }}
            className={`flex-1 rounded-full px-1.5 py-1 text-[8px] transition-colors ${
              tierLabel === t.id
                ? "bg-[rgba(211,179,110,0.12)] text-white/88"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
