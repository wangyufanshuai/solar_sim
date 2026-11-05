import { describe, expect, it } from "vitest";
import { publishAtlasScienceImageProbeTelemetryV346, resetAtlasScienceImageProbeTelemetryV346ForTests } from "./atlasScienceImageProbeTelemetryV346";

describe("v346 probe telemetry", () => {
  it("publishes bounded selection data directly to the DOM dataset", () => {
    resetAtlasScienceImageProbeTelemetryV346ForTests(); const node = { dataset: {} as DOMStringMap };
    const hit = { key: "visible:12", platePixel: [267, 187], cardBounds: { x: 142, y: 108, width: 251, height: 159 }, arrayIndex: [0, 0], fitsPixel: [1, 1], cell: {} as never, celestialWcs: "unavailable" } as const;
    const snapshot = publishAtlasScienceImageProbeTelemetryV346(hit, { node, resources: { total: 2, workers: 0, gpuRenderTargets: 0, gpuBuffers: 0, gpuComputePipelines: 0, gpuQueries: 0, textures: 0, models: 0, subscriptions: 0, objectUrls: 1, typedArrayCaches: 1, cameraLocks: 0 } as never, client: { version: "v346-kerr-science-image-probe-client-v1", cacheEntries: 1, inFlightCount: 0, referenceCount: 1, fetchCount: 1, boundary: "intent-only-single-flight-exact-response-sha-bounded-json-release-baseline" } });
    expect(snapshot).toMatchObject({ selectedKey: "visible:12", fitsPixel: "1,1", arrayIndex: "0,0", sceneRevisionDelta: 0, canvasCount: 1 });
    expect(node.dataset).toMatchObject({ atlasScienceProbeSelectionV346: "visible:12", atlasScienceProbeCelestialWcsV346: "unavailable" });
  });
});
