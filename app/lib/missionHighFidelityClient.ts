"use client";

import type { MissionPlan } from "./missionDesignerTypes";

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
