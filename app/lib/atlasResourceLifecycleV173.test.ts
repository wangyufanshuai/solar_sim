import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  acquireAtlasResource,
  getAtlasResourceSnapshot,
} from "./atlasResourceLifecycle";

describe("v173 runtime resource observability", () => {
  it("accounts for and releases every supported resource kind", () => {
    const before = getAtlasResourceSnapshot();
    const releases = [
      acquireAtlasResource("worker", "atlas", "test-worker"),
      acquireAtlasResource("gpu-render-target", "kerr", "test-target"),
      acquireAtlasResource("texture", "inspect", "test-texture"),
      acquireAtlasResource("model", "launch", "test-model"),
      acquireAtlasResource("subscription", "atlas", "test-subscription"),
      acquireAtlasResource("camera-lock", "inspect", "test-camera-lock"),
    ];
    const during = getAtlasResourceSnapshot();
    expect(during.total - before.total).toBe(6);
    expect(during.workers - before.workers).toBe(1);
    expect(during.gpuRenderTargets - before.gpuRenderTargets).toBe(1);
    expect(during.textures - before.textures).toBe(1);
    expect(during.models - before.models).toBe(1);
    expect(during.subscriptions - before.subscriptions).toBe(1);
    expect(during.cameraLocks - before.cameraLocks).toBe(1);

    releases.forEach((release) => release());
    releases.forEach((release) => release());
    expect(getAtlasResourceSnapshot().total).toBe(before.total);
  });

  it("samples material traversal outside the continuous frame callback", () => {
    const source = readFileSync("app/components/AtlasUniverseSceneRuntime.tsx", "utf8");
    const start = source.indexOf("export function AtlasRenderMetricsProbe");
    const end = source.indexOf("function AtlasRuntimeScene", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const probe = source.slice(start, end);
    const frameCallback = probe.slice(probe.indexOf("useFrame"));
    expect(probe).toContain("sceneRevision");
    expect(probe).toContain("data-atlas-render-texture-audit-revision");
    expect(frameCallback).not.toContain("scene.traverse");
  });
});
