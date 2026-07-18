/// <reference lib="webworker" />

import {
  createRadialVelocitySamples,
  createTransitModelSamples,
  type ObservationWorkerRequest,
  type ObservationWorkerResponse,
} from "../lib/observationalAstrophysics";

self.onmessage = (event: MessageEvent<ObservationWorkerRequest>) => {
  const message = event.data;
  try {
    const response: ObservationWorkerResponse = message.type === "transit-model"
      ? { type: "model-result", requestId: message.requestId, model: "transit", samples: createTransitModelSamples(message.document) }
      : { type: "model-result", requestId: message.requestId, model: "radial-velocity", samples: createRadialVelocitySamples(message.document) };
    self.postMessage(response);
  } catch (error) {
    const response: ObservationWorkerResponse = { type: "model-error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) };
    self.postMessage(response);
  }
};

export {};
