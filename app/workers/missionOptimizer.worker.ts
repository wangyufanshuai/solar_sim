/// <reference lib="webworker" />

import { auditPlanHighFidelity } from "../lib/missionHighFidelity";
import { optimizeMission } from "../lib/missionOptimizer";
import type {
  MissionOptimizationResult,
  MissionOptimizerOptions,
  MissionPhysicsSnapshot,
  MissionPlan,
  MissionWorkerProvenance,
} from "../lib/missionDesignerTypes";
import { getLoadedSpiceManifest, loadSpiceEphemerisTable } from "../lib/spiceEphemerisTable";

type Request = {
  id: number;
  options: MissionOptimizerOptions;
  physicsSnapshot: MissionPhysicsSnapshot;
};

type Progress = MissionWorkerProvenance["status"];
const MIN_RESULT_POST_DELAY_MS = 2600;

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function progress(id: number, status: Progress, message?: string) {
  self.postMessage({ id, type: "progress", status, message });
}

async function waitForMinimumResultDelay(startedAt: number) {
  const remaining = MIN_RESULT_POST_DELAY_MS - (Date.now() - startedAt);
  if (remaining > 0) await sleep(remaining);
}

function withWorkerProvenance(
  plan: MissionPlan,
  status: Progress,
  message?: string,
): MissionPlan {
  const manifest = getLoadedSpiceManifest();
  return {
    ...plan,
    missionWorkerProvenance: {
      worker: "missionOptimizer.worker",
      status,
      spiceBinarySha256: manifest?.binarySha256,
      lowThrustMatchStatus: plan.missionWorkerProvenance?.lowThrustMatchStatus ?? "none",
      message,
    },
  };
}

function compactPlanForTransfer(plan: MissionPlan, keepTrajectory: boolean): MissionPlan {
  return {
    ...plan,
    segments: plan.segments.map((segment) => ({
      ...segment,
      trajectoryAu: keepTrajectory
        ? segment.trajectoryAu
        : [segment.departurePositionAu, segment.arrivalPositionAu],
    })),
    lowThrustSolutions: plan.lowThrustSolutions.map((solution) => ({
      ...solution,
      controls: solution.status === "converged" ? solution.controls : [],
    })),
  };
}

function compactResultForTransfer(result: MissionOptimizationResult): MissionOptimizationResult {
  const bestId = result.bestPlan?.id ?? result.plans[0]?.id ?? null;
  const plans = result.plans.map((plan) => compactPlanForTransfer(plan, plan.id === bestId));
  const bestPlan = plans.find((plan) => plan.id === bestId) ?? null;
  return {
    ...result,
    plans,
    bestPlan,
    rejectedPlans: result.rejectedPlans.map((plan) => compactPlanForTransfer(plan, false)),
  };
}

self.onmessage = async (event: MessageEvent<Request>) => {
  const request = event.data;
  const startedAt = Date.now();
  try {
    progress(request.id, "loading-spice", "Loading SPICE table");
    if ((request.options.ephemerisMode ?? "spice-table") === "spice-table") {
      await loadSpiceEphemerisTable();
    }

    progress(request.id, "solving", "Generating Lambert candidates");
    const initial = optimizeMission(request.options, request.physicsSnapshot);
    const manifest = getLoadedSpiceManifest();
    const markedInitial: MissionOptimizationResult = {
      ...initial,
      plans: initial.plans.map((plan) => withWorkerProvenance(plan, "solving", "Cowell audit pending")),
      rejectedPlans: initial.rejectedPlans.map((plan) =>
        withWorkerProvenance(plan, "solving", "Rejected before high-fidelity propagation"),
      ),
      bestPlan: initial.bestPlan
        ? withWorkerProvenance(initial.bestPlan, "solving", "Cowell audit pending")
        : null,
    };

    if (initial.plans.length === 0) {
      progress(request.id, "done", "No feasible Lambert candidates");
      await waitForMinimumResultDelay(startedAt);
      self.postMessage({ id: request.id, type: "result", ok: true, result: compactResultForTransfer(markedInitial) });
      return;
    }

    progress(request.id, "auditing", "Running Cowell and covariance audit");
    const auditedPlans = initial.plans.map((plan) =>
      auditPlanHighFidelity(
        withWorkerProvenance(plan, "auditing", "Cowell audit running"),
        request.options.includeRelativity,
      ),
    );
    const bestPlan =
      auditedPlans.find((plan) => plan.id === initial.bestPlan?.id) ??
      auditedPlans[0] ??
      null;
    const result: MissionOptimizationResult = {
      ...initial,
      plans: auditedPlans,
      bestPlan,
      rejectedPlans: initial.rejectedPlans.map((plan) =>
        withWorkerProvenance(plan, "done", "Rejected before high-fidelity propagation"),
      ),
    };
    progress(request.id, "done", `SPICE ${manifest?.binarySha256.slice(0, 12) ?? "unverified"} / Cowell audited`);
    await waitForMinimumResultDelay(startedAt);
    self.postMessage({ id: request.id, type: "result", ok: true, result: compactResultForTransfer(result) });
  } catch (error) {
    progress(request.id, "error", error instanceof Error ? error.message : String(error));
    self.postMessage({
      id: request.id,
      type: "result",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
