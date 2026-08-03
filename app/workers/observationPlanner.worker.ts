/// <reference lib="webworker" />

import { createObservationPlanV1 } from "../lib/observationPlannerV1";
import type {
  ObservationPlannerWorkerRequestV2,
  ObservationPlannerWorkerResponseV2,
} from "../lib/observationPlannerV2";

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = (event: MessageEvent<ObservationPlannerWorkerRequestV2>) => {
  const message = event.data;
  if (message.type !== "plan") return;
  const startedAt = performance.now();
  try {
    const result = createObservationPlanV1(message.request);
    workerScope.postMessage({
      type: "result",
      requestId: message.requestId,
      result,
      durationMs: performance.now() - startedAt,
    } satisfies ObservationPlannerWorkerResponseV2);
  } catch (error) {
    workerScope.postMessage({
      type: "error",
      requestId: message.requestId,
      error: error instanceof Error ? error.message : String(error),
      durationMs: performance.now() - startedAt,
    } satisfies ObservationPlannerWorkerResponseV2);
  }
};

export type { ObservationPlannerWorkerRequestV2, ObservationPlannerWorkerResponseV2 };
