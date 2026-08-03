"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { acquireAtlasResource } from "./atlasResourceLifecycle";
import type { ObservationPlanRequest, ObservationPlanResult } from "./observationPlannerV1";
import type {
  ObservationPlannerWorkerRequestV2,
  ObservationPlannerWorkerResponseV2,
} from "./observationPlannerV2";

export type ObservationPlannerWorkerStateV2 = {
  status: "idle" | "calculating" | "ready" | "blocked";
  requestId: number;
  result: ObservationPlanResult | null;
  durationMs: number | null;
  error: string;
};

const INITIAL_STATE: ObservationPlannerWorkerStateV2 = {
  status: "idle",
  requestId: 0,
  result: null,
  durationMs: null,
  error: "",
};

/** Lazy panel-scoped worker. It is presentation-only and never mutates simulation physics. */
export function useObservationPlannerWorkerV266() {
  const workerRef = useRef<Worker | null>(null);
  const latestRequestIdRef = useRef(0);
  const [state, setState] = useState<ObservationPlannerWorkerStateV2>(INITIAL_STATE);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/observationPlanner.worker.ts", import.meta.url),
      { name: "orbit-atlas-observation-planner-v266" },
    );
    const release = acquireAtlasResource("worker", "atlas", "observation-planner-v266", { owner: "research" });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<ObservationPlannerWorkerResponseV2>) => {
      const message = event.data;
      if (message.requestId !== latestRequestIdRef.current) return;
      if (message.type === "result") {
        setState({
          status: "ready",
          requestId: message.requestId,
          result: message.result,
          durationMs: message.durationMs,
          error: "",
        });
        return;
      }
      setState({
        status: "blocked",
        requestId: message.requestId,
        result: null,
        durationMs: message.durationMs,
        error: message.error,
      });
    };
    worker.onerror = (event) => {
      event.preventDefault();
      setState({
        status: "blocked",
        requestId: latestRequestIdRef.current,
        result: null,
        durationMs: null,
        error: event.message || "Observation Worker failed",
      });
    };
    return () => {
      latestRequestIdRef.current += 1;
      worker.terminate();
      workerRef.current = null;
      release();
    };
  }, []);

  const plan = useCallback((request: ObservationPlanRequest) => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    setState({
      status: "calculating",
      requestId,
      result: null,
      durationMs: null,
      error: "",
    });
    workerRef.current?.postMessage({
      type: "plan",
      requestId,
      request,
    } satisfies ObservationPlannerWorkerRequestV2);
    return requestId;
  }, []);

  const clear = useCallback(() => {
    latestRequestIdRef.current += 1;
    setState(INITIAL_STATE);
  }, []);

  return { state, plan, clear } as const;
}
