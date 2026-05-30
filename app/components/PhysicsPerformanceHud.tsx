"use client";

import { useEffect, useState, type MutableRefObject } from "react";
import type { PhysicsPrecisionTier } from "../lib/physicsPrecision";
import { mainThreadLastAcceptedSubsteps } from "../lib/solarIntegrationMetrics";
import { isPhysicsRuntime } from "../lib/physicsRuntime";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import type { MissionPlan } from "../lib/missionDesignerTypes";
import type { SimulationViewSettings } from "../lib/simulationViewSettings";

const TIERS: { id: PhysicsPrecisionTier; label: string }[] = [
  { id: "full", label: "FULL" },
  { id: "economy", label: "ECO" },
  { id: "newton", label: "NEWTON" },
];

export default function PhysicsPerformanceHud({
  physicsRef,
  precisionTierRef,
  physicsUsesSharedBuffer,
  viewSettings,
  missionPlan,
}: {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  precisionTierRef: MutableRefObject<PhysicsPrecisionTier>;
  physicsUsesSharedBuffer: boolean;
  viewSettings: SimulationViewSettings;
  missionPlan: MissionPlan | null;
}) {
  const [stepsPerSec, setStepsPerSec] = useState(0);
  const [perf, setPerf] = useState({
    fps: 0,
    avgFps10s: 0,
    minFps10s: 0,
    frameMs: 0,
    longFrames10s: 0,
  });
  const [tierLabel, setTierLabel] = useState<PhysicsPrecisionTier>(
    precisionTierRef.current,
  );

  useEffect(() => {
    let id = 0;
    const stepsBuf: number[] = [];
    const timeBuf: number[] = [];
    const frameBuf: Array<{ t: number; dt: number; fps: number }> = [];
    let lastFrameT = performance.now();
    let fpsSmooth = 0;
    let lastSetT = 0;

    const tick = (t: number) => {
      const dt = Math.max(1, t - lastFrameT);
      lastFrameT = t;
      const currentFps = 1000 / dt;
      fpsSmooth = fpsSmooth === 0 ? currentFps : fpsSmooth * 0.9 + currentFps * 0.1;
      frameBuf.push({ t, dt, fps: currentFps });
      while (frameBuf.length > 0 && t - frameBuf[0]!.t > 10000) {
        frameBuf.shift();
      }
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
      if (t - lastSetT >= 500) {
        lastSetT = t;
        const sum = stepsBuf.reduce((a, b) => a + b, 0);
        const dtMs = t - (timeBuf[0] ?? t);
        const dtS = dtMs / 1000;
        const avgFrameMs =
          frameBuf.length > 0
            ? frameBuf.reduce((a, b) => a + b.dt, 0) / frameBuf.length
            : dt;
        const minFps10s =
          frameBuf.length > 0
            ? Math.min(...frameBuf.map((sample) => sample.fps))
            : currentFps;
        const longFrames10s = frameBuf.filter((sample) => sample.dt > 50).length;
        setStepsPerSec(dtS > 0.05 ? sum / dtS : 0);
        setPerf({
          fps: fpsSmooth,
          avgFps10s: 1000 / Math.max(avgFrameMs, 1),
          minFps10s,
          frameMs: 1000 / Math.max(fpsSmooth, 1),
          longFrames10s,
        });
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [physicsRef]);

  const activeLayers = [
    viewSettings.showGalaxyBackground,
    viewSettings.showGaiaStars,
    viewSettings.showConstellations,
    viewSettings.showNebulaImages,
    viewSettings.showDeepSkyMarkers,
    viewSettings.showMissionTrajectory && !!missionPlan,
    viewSettings.showLagrangePoints,
    viewSettings.showRelativisticOptics,
    viewSettings.highQualityRendering,
  ].filter(Boolean).length;

  const heavyLayers = [
    viewSettings.showGaiaStars,
    viewSettings.showNebulaImages,
    viewSettings.showDeepSkyMarkers,
    viewSettings.highQualityRendering,
    viewSettings.showMissionTrajectory && !!missionPlan,
  ].filter(Boolean).length;

  const dprLabel = viewSettings.highQualityRendering ? "1-1.5" : "1";
  const deepSkyLabel = !viewSettings.showNebulaImages
    ? "off"
    : viewSettings.highQualityRendering || viewSettings.renderBudget === "quality"
      ? "full"
      : "core";
  const missionSegments = missionPlan?.segments.length ?? 0;

  return (
    <div className="pointer-events-auto fixed right-3 top-3 z-[84] w-[174px] rounded-3xl bg-[rgba(8,9,12,0.78)] px-3 py-3 text-white/56 shadow-[0_14px_36px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
      <div className="text-[8px] tracking-[0.24em]">PHYSICS ENGINE</div>
      <div className="mt-2 text-[10px] text-slate-500">
        {physicsUsesSharedBuffer ? "Worker + SAB" : "Main thread"}
      </div>
      <div className="mt-1 text-[10px]">
        FPS <span className={perf.fps >= 50 ? "text-emerald-200" : perf.fps >= 30 ? "text-amber-200" : "text-rose-200"}>{perf.fps.toFixed(0)}</span>
        <span className="ml-1 text-white/34">{perf.frameMs.toFixed(1)}ms</span>
      </div>
      <div className="mt-1 text-[10px]">
        Steps/s <span className="text-white/82">{stepsPerSec.toFixed(0)}</span>
      </div>
      <div className="mt-2 border-t border-white/6 pt-2 text-[9px] leading-4 text-white/42">
        <div className="flex justify-between">
          <span>10s avg/min</span>
          <span className="text-white/68">{perf.avgFps10s.toFixed(0)} / {perf.minFps10s.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span>Long frames</span>
          <span className={perf.longFrames10s > 12 ? "text-amber-200" : "text-white/68"}>{perf.longFrames10s}</span>
        </div>
        <div className="flex justify-between">
          <span>Render</span>
          <span className="text-white/68">{viewSettings.renderBudget}</span>
        </div>
        <div className="flex justify-between">
          <span>DPR</span>
          <span className="text-white/68">{dprLabel}</span>
        </div>
        <div className="flex justify-between">
          <span>Layers</span>
          <span className={heavyLayers >= 4 ? "text-amber-200" : "text-white/68"}>
            {activeLayers} / heavy {heavyLayers}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Deep sky</span>
          <span className="text-white/68">{deepSkyLabel}</span>
        </div>
        <div className="flex justify-between">
          <span>Mission seg</span>
          <span className="text-white/68">{missionSegments}</span>
        </div>
      </div>
      <div className="mt-3 flex rounded-full bg-black/22 p-1">
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
                ? "bg-white/10 text-white/88"
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
