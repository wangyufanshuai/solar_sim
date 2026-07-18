/// <reference lib="webworker" />

import {
  runRelativityForceModelV2ShadowRequest,
  type RelativityForceModelV2WorkerRequest,
  type RelativityForceModelV2WorkerResponse,
} from "../lib/relativityForceModelV2WorkerProtocol";

self.onmessage = (event: MessageEvent<RelativityForceModelV2WorkerRequest>) => {
  if (event.data.type !== "compare-shadow") return;
  const response: RelativityForceModelV2WorkerResponse =
    runRelativityForceModelV2ShadowRequest(event.data);
  self.postMessage(response);
};

export {};
