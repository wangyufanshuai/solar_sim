"use client";

import type { MissionPlan } from "./missionDesignerTypes";
import type {
  MissionOptimizationResult,
  MissionOptimizerOptions,
  MissionPhysicsSnapshot,
  MissionWorkerProvenance,
} from "./missionDesignerTypes";

let requestId = 0;

export function runHighFidelityMissionAudit(
  plans: MissionPlan[],
  includeRelativity: boolean,
): Promise<MissionPlan[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("../workers/missionCowell.worker.ts", import.meta.url),
      { type: "module" },
    );
    const id = ++requestId;
    const timeout = window.setTimeout(() => {
      worker.terminate();
      reject(new Error("Cowell audit timed out"));
    }, 90000);
    worker.onmessage = (event: MessageEvent<{
      id: number;
      ok: boolean;
      plans?: MissionPlan[];
      error?: string;
    }>) => {
      if (event.data.id !== id) return;
      window.clearTimeout(timeout);
      worker.terminate();
      if (!event.data.ok || !event.data.plans) {
        reject(new Error(event.data.error ?? "Cowell audit failed"));
        return;
      }
      resolve(event.data.plans);
    };
    worker.onerror = (event) => {
      window.clearTimeout(timeout);
      worker.terminate();
      reject(new Error(event.message || "Cowell worker failed"));
    };
    worker.postMessage({ id, plans, includeRelativity });
  });
}

type MissionWorkerMessage =
  | {
      id: number;
      type: "progress";
      status: MissionWorkerProvenance["status"];
      message?: string;
    }
  | {
      id: number;
      type: "intermediate";
      result: MissionOptimizationResult;
    }
  | {
      id: number;
      type: "result";
      ok: boolean;
      result?: MissionOptimizationResult;
      error?: string;
    };

export function runMissionOptimizationWorker({
  options,
  physicsSnapshot,
  onProgress,
  onIntermediate,
}: {
  options: MissionOptimizerOptions;
  physicsSnapshot: MissionPhysicsSnapshot;
  onProgress?: (status: MissionWorkerProvenance["status"], message?: string) => void;
  onIntermediate?: (result: MissionOptimizationResult) => void;
}): Promise<MissionOptimizationResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("../workers/missionOptimizer.worker.ts", import.meta.url),
      { type: "module" },
    );
    const id = ++requestId;
    const timeout = window.setTimeout(() => {
      worker.terminate();
      reject(new Error("Mission worker timed out"));
    }, 120000);
    worker.onmessage = (event: MessageEvent<MissionWorkerMessage>) => {
      if (event.data.id !== id) return;
      if (event.data.type === "progress") {
        onProgress?.(event.data.status, event.data.message);
        return;
      }
      if (event.data.type === "intermediate") {
        onIntermediate?.(event.data.result);
        return;
      }
      window.clearTimeout(timeout);
      worker.terminate();
      if (!event.data.ok || !event.data.result) {
        reject(new Error(event.data.error ?? "Mission worker failed"));
        return;
      }
      resolve(event.data.result);
    };
    worker.onerror = (event) => {
      window.clearTimeout(timeout);
      worker.terminate();
      reject(new Error(event.message || "Mission worker failed"));
    };
    onProgress?.("queued", "Queued mission worker");
    worker.postMessage({ id, options, physicsSnapshot });
  });
}
