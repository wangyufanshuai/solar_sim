/// <reference lib="webworker" />

import { runMissionMonteCarloLite } from "../lib/missionReview";
import type { MissionMonteCarloConfig, MissionPlan } from "../lib/missionDesignerTypes";

type Request = {
  id: number;
  runId: string;
  plan: MissionPlan;
  config: MissionMonteCarloConfig;
};

self.onmessage = (event: MessageEvent<Request>) => {
  const request = event.data;
  try {
    self.postMessage({ id: request.id, type: "progress", message: "Monte Carlo Lite sampling" });
    const result = runMissionMonteCarloLite(request.plan, request.runId, request.config);
    self.postMessage({ id: request.id, type: "result", ok: true, result });
  } catch (error) {
    self.postMessage({
      id: request.id,
      type: "result",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
