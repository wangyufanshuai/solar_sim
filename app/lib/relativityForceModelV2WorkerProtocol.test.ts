import { describe, expect, it } from "vitest";
import { AU_METERS } from "./physicalConstants";
import { DEFAULT_RELATIVITY_FORCE_MODEL_V2_CONFIG } from "./relativityForceModelV2";
import { runRelativityForceModelV2ShadowRequest } from "./relativityForceModelV2WorkerProtocol";

describe("v128 isolated shadow Worker protocol", () => {
  it("returns a request-correlated read-only comparison", () => {
    const posM = new Float64Array([0, 0, 0, 0.387 * AU_METERS, 0, 0]);
    const velMS = new Float64Array([0, 0, 0, 0, 47_360, 0]);
    const massKg = new Float64Array([
      DEFAULT_RELATIVITY_FORCE_MODEL_V2_CONFIG.solarGmM3S2 / 6.6743e-11,
      3.3011e23,
    ]);
    const posBefore = posM.slice();
    const response = runRelativityForceModelV2ShadowRequest({
      type: "compare-shadow",
      requestId: 17,
      posM,
      velMS,
      massKg,
      bodyCount: 2,
    });
    expect(response.type).toBe("shadow-result");
    expect(response.requestId).toBe(17);
    if (response.type === "shadow-result") {
      expect(response.comparison.promotion).toBe("blocked-pending-ephemeris-gates");
      expect(response.comparison.liveStateMutated).toBe(false);
    }
    expect(posM).toEqual(posBefore);
  });
});
