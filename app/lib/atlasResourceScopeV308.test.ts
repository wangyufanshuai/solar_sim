import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createAtlasResourceScopeV308 } from "./atlasResourceScopeV308";

describe("v308 transactional resource scope", () => {
  it("releases acquired resources exactly once in reverse order", () => {
    const events: string[] = [];
    const scope = createAtlasResourceScopeV308("science-texture-fixture");
    scope.add("payload", () => events.push("payload"));
    scope.add("texture-dispose", () => events.push("texture-dispose"));
    scope.add("texture-registry", () => events.push("texture-registry"));
    expect(scope.snapshot()).toMatchObject({ registeredCount: 3, releasedCount: 0, pendingCount: 3, released: false });
    expect(scope.releaseAll("test-cleanup")).toMatchObject({ releasedCount: 3, pendingCount: 0, failures: [] });
    expect(events).toEqual(["texture-registry", "texture-dispose", "payload"]);
    expect(scope.releaseAll("test-cleanup-replay")).toMatchObject({ releasedCount: 0, pendingCount: 0, failures: [] });
    expect(events).toHaveLength(3);
  });

  it("supports an early one-shot release without double finalization", () => {
    let workerReleaseCount = 0;
    const scope = createAtlasResourceScopeV308("worker-fixture");
    const release = scope.add("worker", () => { workerReleaseCount += 1; });
    release();
    release();
    expect(workerReleaseCount).toBe(1);
    expect(scope.snapshot()).toMatchObject({ releasedCount: 1, pendingCount: 0 });
    scope.releaseAll("component-cleanup");
    expect(workerReleaseCount).toBe(1);
  });

  it("continues rollback after a finalizer failure and records a bounded report", () => {
    const events: string[] = [];
    const scope = createAtlasResourceScopeV308("failure-fixture");
    scope.add("payload", () => events.push("payload"));
    scope.add("broken-texture", () => { throw new Error("dispose-failed"); });
    scope.add("registry", () => events.push("registry"));
    const report = scope.releaseAll("materialization-failed");
    expect(events).toEqual(["registry", "payload"]);
    expect(report.releasedCount).toBe(3);
    expect(report.failures).toEqual([{ label: "broken-texture", message: "dispose-failed" }]);
    expect(scope.snapshot()).toMatchObject({ pendingCount: 0, failureCount: 1 });
  });

  it("immediately releases resources that arrive after cancellation", () => {
    const events: string[] = [];
    const scope = createAtlasResourceScopeV308("late-payload-fixture");
    scope.releaseAll("abort-before-fetch-resolves");
    const release = scope.add("late-payload", () => events.push("late-payload"));
    expect(events).toEqual(["late-payload"]);
    release();
    expect(events).toHaveLength(1);
    expect(scope.snapshot()).toMatchObject({ registeredCount: 1, releasedCount: 1, pendingCount: 0, released: true });
  });

  it("wires both Science and Cinematic failure paths through the scope", () => {
    const renderer = readFileSync(resolve(process.cwd(), "app/components/KerrStrongGravityRendererV299.tsx"), "utf8");
    expect(renderer).toContain('createAtlasResourceScopeV308("kerr-science-sparse-texture")');
    expect(renderer).toContain('releaseAtlasResourceScopeV309(scope, "kerr-science-sparse-texture", "science-load-failed")');
    expect(renderer).toContain('createAtlasResourceScopeV308("kerr-cinematic-compute-texture")');
    expect(renderer).toContain('releaseAtlasResourceScopeV309(scope, "kerr-cinematic-compute-texture", "cinematic-response-materialization-failed")');
    expect(renderer).toContain('releaseAtlasResourceScopeV309(scope, "kerr-cinematic-compute-texture", "cinematic-effect-cleanup")');
  });
});
