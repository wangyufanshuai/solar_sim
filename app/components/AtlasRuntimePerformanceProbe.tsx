"use client";

import { useEffect } from "react";
import type { AtlasRuntimeQualityTier } from "../lib/simulationDiagnosticsTypes";
import { percentile } from "../lib/atlasVisualIntegrationRelease";
import type { AtlasSceneMode } from "../lib/atlasRuntimeSceneFocusPerformance";

const WINDOW_MS = 10_000;

export default function AtlasRuntimePerformanceProbe({ qualityTier, sceneMode = "atlas", resetToken = 0 }: { qualityTier: AtlasRuntimeQualityTier; sceneMode?: AtlasSceneMode; resetToken?: number }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-atlas-browser-acceptance-version]");
    if (!root) return;
    const frameTimes: Array<{ at: number; value: number }> = [];
    const taskTimes: Array<{ at: number; value: number }> = [];
    let last = performance.now();
    let frameId = 0;
    let lastPublish = last;
    const publish = (now: number) => {
      while (frameTimes[0] && now - frameTimes[0].at > WINDOW_MS) frameTimes.shift();
      while (taskTimes[0] && now - taskTimes[0].at > WINDOW_MS) taskTimes.shift();
      const recentFrames = frameTimes.map((sample) => sample.value);
      const recentTasks = taskTimes.map((sample) => sample.value);
      const medianFrame = percentile(recentFrames, 0.5);
      const medianFps = medianFrame > 0 ? Math.min(240, 1000 / medianFrame) : 0;
      const under50 = recentTasks.length === 0 ? 1 : recentTasks.filter((value) => value < 50).length / recentTasks.length;
      root.setAttribute("data-atlas-runtime-median-fps", medianFps.toFixed(1));
      root.setAttribute("data-atlas-runtime-frame-p50-ms", medianFrame.toFixed(1));
      root.setAttribute("data-atlas-runtime-frame-p95-ms", percentile(recentFrames, 0.95).toFixed(1));
      root.setAttribute("data-atlas-runtime-long-task-max-ms", Math.max(0, ...recentTasks).toFixed(1));
      root.setAttribute("data-atlas-runtime-tasks-under-50-ratio", under50.toFixed(3));
      root.setAttribute("data-atlas-runtime-frame-samples", String(recentFrames.length));
      root.setAttribute("data-atlas-runtime-quality-tier", qualityTier);
      root.setAttribute("data-atlas-runtime-window-ms", String(WINDOW_MS));
      root.setAttribute("data-atlas-runtime-scene-mode", sceneMode);
      lastPublish = now;
    };
    const tick = (now: number) => {
      frameTimes.push({ at: now, value: Math.min(1000, now - last) });
      last = now;
      if (now - lastPublish >= 1000) publish(now);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    const observer = typeof PerformanceObserver !== "undefined"
      ? new PerformanceObserver((list) => { const at = performance.now(); for (const entry of list.getEntries()) taskTimes.push({ at, value: entry.duration }); })
      : null;
    try { observer?.observe({ type: "longtask", buffered: true }); } catch { /* Long Tasks is optional. */ }
    return () => { cancelAnimationFrame(frameId); observer?.disconnect(); };
  }, [qualityTier, sceneMode, resetToken]);
  return null;
}
