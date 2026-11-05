/// <reference lib="webworker" />

import {
  analyzeGaiaScienceRecordV8,
  type GaiaScienceAnalysisResultV8,
  type GaiaScienceRecordV8,
} from "../lib/gaiaScienceV8";

export type GaiaAnalysisWorkerRequestV8 = {
  type: "analyze";
  requestId: number;
  record: GaiaScienceRecordV8;
  seed?: number;
};

export type GaiaAnalysisWorkerResponseV8 =
  | { type: "result"; requestId: number; result: GaiaScienceAnalysisResultV8 }
  | { type: "error"; requestId: number; message: string };

self.addEventListener("message", (event: MessageEvent<GaiaAnalysisWorkerRequestV8>) => {
  const request = event.data;
  if (request.type !== "analyze") return;
  try {
    self.postMessage({
      type: "result",
      requestId: request.requestId,
      result: analyzeGaiaScienceRecordV8(request.record, request.seed),
    } satisfies GaiaAnalysisWorkerResponseV8);
  } catch (error) {
    self.postMessage({
      type: "error",
      requestId: request.requestId,
      message: error instanceof Error ? error.message : String(error),
    } satisfies GaiaAnalysisWorkerResponseV8);
  }
});

export {};
