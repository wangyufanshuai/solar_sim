import {
  compareRelativityForceModelsShadow,
  type RelativityForceModelV2Config,
  type RelativityShadowComparison,
} from "./relativityForceModelV2";

export type RelativityForceModelV2WorkerRequest = {
  type: "compare-shadow";
  requestId: number;
  posM: Float64Array;
  velMS: Float64Array;
  massKg: Float64Array;
  bodyCount: number;
  config?: RelativityForceModelV2Config;
};

export type RelativityForceModelV2WorkerResponse =
  | {
      type: "shadow-result";
      requestId: number;
      comparison: RelativityShadowComparison;
    }
  | {
      type: "shadow-error";
      requestId: number;
      message: string;
    };

export function runRelativityForceModelV2ShadowRequest(
  request: RelativityForceModelV2WorkerRequest,
): RelativityForceModelV2WorkerResponse {
  try {
    return {
      type: "shadow-result",
      requestId: request.requestId,
      comparison: compareRelativityForceModelsShadow(
        request.posM,
        request.velMS,
        request.massKg,
        request.bodyCount,
        request.config,
      ),
    };
  } catch (error) {
    return {
      type: "shadow-error",
      requestId: request.requestId,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
