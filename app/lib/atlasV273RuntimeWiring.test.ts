import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ATLAS_SCALE_CAMERA_DISTANCE_V268 } from "./atlasScaleJourneyV268";
import { ATLAS_SCALE_ORBIT_LIMITS_V273 } from "./atlasScalePresentationV273";

const read = (path: string) => readFileSync(path, "utf8");

describe("v273 runtime wiring", () => {
  it("keeps every journey target inside its band-specific OrbitControls range", () => {
    for (const band of ["solar", "stellar", "galactic", "local-group", "near-universe"] as const) {
      expect(ATLAS_SCALE_CAMERA_DISTANCE_V268[band], band).toBeLessThanOrEqual(ATLAS_SCALE_ORBIT_LIMITS_V273[band].maxDistance);
      expect(ATLAS_SCALE_CAMERA_DISTANCE_V268[band], band).toBeGreaterThanOrEqual(ATLAS_SCALE_ORBIT_LIMITS_V273[band].minDistance);
    }
    expect(ATLAS_SCALE_ORBIT_LIMITS_V273.galactic.maxDistance).toBeGreaterThan(2_400);
    expect(ATLAS_SCALE_ORBIT_LIMITS_V273["local-group"].maxDistance).toBeGreaterThan(2_400);
    expect(ATLAS_SCALE_ORBIT_LIMITS_V273["near-universe"].maxDistance).toBeGreaterThan(2_400);
  });

  it("keeps the mobile scale navigator below the top-left object browser control", () => {
    const source = read("app/components/AtlasScaleNavigatorV260.tsx");
    expect(source).toContain("max-sm:top-14");
  });

  it("wires focus and journey writers through the shared presentation lease", () => {
    const focus = read("app/components/AtlasSceneFocusCameraBridge.tsx");
    const journey = read("app/components/AtlasScaleTransitionBridgeV268.tsx");
    expect(focus).toContain('requestAtlasCameraPresentationLeaseV273("focus-lock"');
    expect(focus).toContain('acquireAtlasResource(\n          "camera-lock"');
    expect(journey).toContain('requestAtlasCameraPresentationLeaseV273("scale-journey"');
    expect(focus).not.toContain("sceneRevision");
    expect(journey).not.toContain("sceneRevision");
  });

  it("publishes throttled actual camera pose markers after focus updates", () => {
    const marker = read("app/components/AtlasCameraRuntimeMarker.ts");
    const focus = read("app/components/AtlasSceneFocusCameraBridge.tsx");
    expect(marker).toContain("data-atlas-camera-actual-position");
    expect(marker).toContain("data-atlas-camera-actual-target");
    expect(marker).toContain("data-atlas-camera-actual-direction");
    expect(marker).toContain("intervalMs: 120");
    expect(focus).toContain("camera.getWorldDirection(actualDirectionRef.current)");
    expect(focus).toContain("writeActualCameraState();");
  });

  it("uses one mounted cosmic coordinator and a persistent per-band decoded cache", () => {
    const source = read("app/components/CosmicScaleDataLayerV260.tsx");
    expect(source.match(/new Worker\(/g)).toHaveLength(1);
    expect(source).toContain("const decodedCache = new Map<CosmicBand, PointState>()");
    expect(source).toContain("const workerRef = useRef<Worker | null>(null)");
    expect(source).toContain("}, []);");
    expect(source).toContain('acquireAtlasResource(\n          "typed-array-cache"');
    expect(source).toContain("decodedCacheResourceReleases.forEach((release) => release())");
    expect(source).toContain("decodedCacheResourceReleases.clear()");
    expect(source).toContain("decodedCache.clear()");
    expect(source).toContain("worker.onmessage = null");
  });
});
