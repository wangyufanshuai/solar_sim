"use client";

import type { MissionMonteCarloConfig, MissionMonteCarloResult, MissionPlan } from "./missionDesignerTypes";

let requestId = 0;

type MissionRiskWorkerMessage =
  | { id: number; type: "progress"; message?: string }
  | { id: number; type: "result"; ok: boolean; result?: MissionMonteCarloResult; error?: string };

function compactPlanForRisk(plan: MissionPlan): MissionPlan {
  return {
    ...plan,
    segments: plan.segments.map((segment) => ({
      ...segment,
      trajectoryAu: [segment.departurePositionAu, segment.arrivalPositionAu],
    })),
    cowellAudit: plan.cowellAudit
      ? {
          ...plan.cowellAudit,
          stateHistory: [],
          maneuverEvents: [],
        }
      : null,
    lowThrustSolutions: plan.lowThrustSolutions.map((solution) => ({
      ...solution,
      controls: [],
    })),
  };
}

export function runMissionRiskWorker({
  runId,
  plan,
  config,
  onProgress,
}: {
  runId: string;
  plan: MissionPlan;
  config: MissionMonteCarloConfig;
  onProgress?: (message: string) => void;
}): Promise<MissionMonteCarloResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../workers/missionRisk.worker.ts", import.meta.url), { type: "module" });
    const id = ++requestId;
    const timeout = window.setTimeout(() => {
      worker.terminate();
      reject(new Error("Monte Carlo worker timed out"));
    }, 60000);
    worker.onmessage = (event: MessageEvent<MissionRiskWorkerMessage>) => {
      if (event.data.id !== id) return;
      if (event.data.type === "progress") {
        onProgress?.(event.data.message ?? "Monte Carlo running");
        return;
      }
      window.clearTimeout(timeout);
      worker.terminate();
      if (!event.data.ok || !event.data.result) {
        reject(new Error(event.data.error ?? "Monte Carlo worker failed"));
        return;
      }
      resolve(event.data.result);
    };
    worker.onerror = (event) => {
      window.clearTimeout(timeout);
      worker.terminate();
      reject(new Error(event.message || "Monte Carlo worker failed"));
    };
    onProgress?.("Monte Carlo queued");
    worker.postMessage({ id, runId, plan: compactPlanForRisk(plan), config });
  });
}
