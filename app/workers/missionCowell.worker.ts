/// <reference lib="webworker" />

import { auditPlanHighFidelity } from "../lib/missionHighFidelity";
import type { MissionPlan } from "../lib/missionDesignerTypes";
import { loadSpiceEphemerisTable } from "../lib/spiceEphemerisTable";

type Request = {
  id: number;
  plans: MissionPlan[];
  includeRelativity: boolean;
};

self.onmessage = async (event: MessageEvent<Request>) => {
  const request = event.data;
  try {
    await loadSpiceEphemerisTable();
    const plans = request.plans.map((plan) =>
      auditPlanHighFidelity(plan, request.includeRelativity),
    );
    self.postMessage({ id: request.id, ok: true, plans });
  } catch (error) {
    self.postMessage({
      id: request.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
