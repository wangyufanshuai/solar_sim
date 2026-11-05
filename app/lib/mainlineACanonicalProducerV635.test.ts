import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import coverage from "../data/mainlineACanonicalCoverageV622.generated.json";
import { createCanonicalRuntimeRegistryV635 } from "./mainlineACanonicalRuntimeV635";
import { getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import { createMainlineALifecycleSessionV633 } from "./mainlineALifecycleSessionV633";
import { evaluateMainlineAResourceObservationV633 } from "./mainlineAResourceObservationV633";
import {
  acquireCanonicalProducerResourcesV635, createCanonicalProducerLeaseV635,
  createCanonicalRenderedResourceObserverV635,
  observeCanonicalStellarLayerV636,
  estimateCanonicalGeometryBytesV635, resolveCanonicalProducerTargetV635,
  createCanonicalProducerHandleV635,
  type CanonicalProducerTargetV635,
} from "./mainlineACanonicalProducerV635";

const star = { kind: "star", id: "sirius-a", route: "mainline-a-stellar-parametric", assetHash: null } as const;
const makeRegistry = () => createCanonicalRuntimeRegistryV635(() => "2026-09-27T00:00:00.000Z");
const dependencies = (registry: ReturnType<typeof makeRegistry>) => ({ read: registry.read, publish: registry.publish });

describe("canonical runtime producer manifest binding", () => {
  it.each(coverage.records)("retains the exact $kind/$id route and hash", (row) => {
    expect(resolveCanonicalProducerTargetV635(row.kind as CanonicalProducerTargetV635["kind"], row.id, row.route.route, row.route.assetHash)).toEqual({
      kind: row.kind, id: row.id, route: row.route.route, assetHash: row.route.assetHash,
    });
  });
  it.each([
    { ...star, id: "acrux" }, { ...star, route: "mainline-a-stellar-parametric?fixture=1" },
    { ...star, assetHash: "f".repeat(64) }, { ...star, kind: "nebula" as const },
    { ...star, id: "Sirius-A" },
  ])("rejects unsupported or altered producer binding %j", (target) => {
    expect(resolveCanonicalProducerTargetV635(target.kind, target.id, target.route, target.assetHash)).toBeNull();
    expect(() => createCanonicalProducerLeaseV635(target, dependencies(makeRegistry()))).toThrow("canonical-producer-target-not-in-manifest");
  });
  it("preserves IAU case and null source hash rather than manufacturing an image hash", () => {
    const row = coverage.records.find((value) => value.kind === "constellation" && value.id === "UMa")!;
    const target = resolveCanonicalProducerTargetV635("constellation", row.id, row.route.route, row.route.assetHash)!;
    const registry = makeRegistry();
    createCanonicalProducerLeaseV635(target, dependencies(registry));
    expect(registry.read().selection).toMatchObject({ id: "UMa", assetHash: null, loading: "loading" });
    expect(resolveCanonicalProducerTargetV635("constellation", "uma", row.route.route, null)).toBeNull();
  });
});

describe("canonical runtime ownership and reported state", () => {
  it("starts loading, advances only when the producer reports a draw, and releases once", () => {
    const registry = makeRegistry();
    const lease = createCanonicalProducerLeaseV635(star, dependencies(registry));
    expect(registry.read().selection?.loading).toBe("loading");
    expect(lease.ready()).toBe(true);
    expect(registry.read().selection?.loading).toBe("ready");
    const renderedRevision = registry.read().revision;
    expect(lease.ready()).toBe(true);
    expect(registry.read().revision).toBe(renderedRevision);
    lease.release();
    const releasedRevision = registry.read().revision;
    expect(registry.read().selection).toBeNull();
    lease.release();
    expect(registry.read().revision).toBe(releasedRevision);
    expect(lease.ready()).toBe(false);
  });
  it("retains actual loading failure and can return to loading before a later draw", () => {
    const registry = makeRegistry();
    const lease = createCanonicalProducerLeaseV635(star, dependencies(registry));
    lease.failed("http:503\nupstream failure");
    expect(registry.read().selection).toMatchObject({ loading: "failed", error: "http:503 upstream failure" });
    lease.loading();
    expect(registry.read().selection).toMatchObject({ loading: "loading", error: null });
    lease.unobserved();
    expect(registry.read().selection?.loading).toBe("unobserved");
    lease.ready();
    expect(registry.read().selection).toMatchObject({ loading: "ready", error: null });
  });
  it("does not let an old producer overwrite or clear a newer different selection", () => {
    const registry = makeRegistry();
    const old = createCanonicalProducerLeaseV635(star, dependencies(registry));
    const current = createCanonicalProducerLeaseV635({ ...star, id: "vega" }, dependencies(registry));
    current.ready();
    expect(old.ready()).toBe(false);
    expect(old.failed("late decoder failure")).toBe(false);
    old.release();
    expect(registry.read().selection).toMatchObject({ id: "vega", loading: "ready" });
  });
  it("protects an equal-id remount from the prior instance's cleanup", () => {
    const registry = makeRegistry();
    const old = createCanonicalProducerLeaseV635(star, dependencies(registry));
    const remount = createCanonicalProducerLeaseV635(star, dependencies(registry));
    remount.ready();
    old.release();
    expect(registry.read().selection).toMatchObject({ id: star.id, loading: "ready" });
    expect(old.loading()).toBe(false);
  });
  it("cannot revive a producer after an externally recorded cleanup failure", () => {
    const registry = makeRegistry();
    const lease = createCanonicalProducerLeaseV635(star, dependencies(registry));
    registry.reportCleanupFailure("geometry-disposal-failed");
    expect(lease.ready()).toBe(false);
    lease.release();
    expect(registry.read().cleanupErrors).toEqual(["geometry-disposal-failed"]);
    expect(registry.read().selection?.loading).toBe("loading");
  });
  it("bounds failure text without dropping the failed state", () => {
    const registry = makeRegistry();
    const lease = createCanonicalProducerLeaseV635(star, dependencies(registry));
    lease.failed("x".repeat(1200));
    expect(registry.read().selection?.error?.length).toBe(1000);
    lease.failed("\n\t");
    expect(registry.read().selection?.error).toBe("runtime-producer-failed");
  });
});

describe("render callbacks remain bound to their original selection generation", () => {
  it("does not reuse an A callback after A to B to A", () => {
    const registry = makeRegistry();
    const create = (id: string) => createCanonicalProducerHandleV635({ ...star, id }, dependencies(registry));
    const firstSirius = create("sirius-a");
    expect(firstSirius.rendered()).toBe(false);
    const releaseFirst = firstSirius.activate();
    expect(firstSirius.rendered()).toBe(true);
    releaseFirst();
    const vega = create("vega");
    const releaseVega = vega.activate();
    expect(vega.rendered()).toBe(true);
    expect(firstSirius.failed("late render failure")).toBe(false);
    releaseVega();
    const lastSirius = create("sirius-a");
    const releaseLast = lastSirius.activate();
    expect(registry.read().selection?.loading).toBe("loading");
    expect(firstSirius.rendered()).toBe(false);
    expect(firstSirius.failed("stale same-id failure")).toBe(false);
    expect(vega.rendered()).toBe(false);
    expect(registry.read().selection?.loading).toBe("loading");
    expect(lastSirius.rendered()).toBe(true);
    releaseLast();
    expect(lastSirius.rendered()).toBe(false);
    expect(registry.read().selection).toBeNull();
  });
  it("prevents an old cleanup from clearing a reactivated equal-id handle", () => {
    const registry = makeRegistry();
    const handle = createCanonicalProducerHandleV635(star, dependencies(registry));
    const firstCleanup = handle.activate();
    const secondCleanup = handle.activate();
    expect(handle.rendered()).toBe(true);
    const revision = registry.read().revision;
    firstCleanup();
    expect(registry.read().revision).toBe(revision);
    expect(registry.read().selection).toMatchObject({ id: "sirius-a", loading: "ready" });
    secondCleanup();
    expect(handle.rendered()).toBe(false);
  });
});

describe("actual disposable resource accounting without a WebGL renderer", () => {
  it("keeps a failing resource registered while releasing independent resources and allows retry", () => {
    const events: string[] = [];
    const releases = [vi.fn(() => events.push("release:a")), vi.fn(() => events.push("release:b"))];
    let index = 0;
    const acquire = vi.fn(() => releases[index++]);
    const report = vi.fn();
    const broken = { dispose: vi.fn<() => void>(() => { events.push("dispose:a"); throw new Error("test-only failure"); }) };
    const healthy = { dispose: vi.fn(() => events.push("dispose:b")) };
    const cleanup = acquireCanonicalProducerResourcesV635("test-only-owner", [
      { resource: broken, label: "a" }, { resource: healthy, label: "b", estimatedBytes: 42 },
    ], { acquire, report });
    cleanup();
    expect(events).toEqual(["dispose:a", "dispose:b", "release:b"]);
    expect(releases[0]).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledWith("test-only-owner:a:test-only failure");
    broken.dispose.mockImplementation(() => { events.push("dispose:a:retry"); });
    cleanup();
    cleanup();
    expect(releases[0]).toHaveBeenCalledTimes(1);
    expect(healthy.dispose).toHaveBeenCalledTimes(1);
    expect(acquire).toHaveBeenNthCalledWith(2, "model", "atlas", "b", { owner: "test-only-owner", estimatedBytes: 42 });
  });
  it("records Three geometry and material dispose events before releasing their ledger entries", () => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial();
    const events: string[] = [];
    geometry.addEventListener("dispose", () => events.push("geometry:dispose"));
    material.addEventListener("dispose", () => events.push("material:dispose"));
    const cleanup = acquireCanonicalProducerResourcesV635("test-only-three", [
      { resource: geometry, label: "geometry", estimatedBytes: estimateCanonicalGeometryBytesV635(geometry) },
      { resource: material, label: "material" },
    ], { acquire: (_kind, _scene, label) => () => events.push(`${label}:released`), report: vi.fn() });
    cleanup();
    expect(events).toEqual(["geometry:dispose", "geometry:released", "material:dispose", "material:released"]);
  });
  it("counts geometry CPU attribute/index bytes once, including shared interleaved storage", () => {
    const geometry = new THREE.BufferGeometry();
    const interleaved = new THREE.InterleavedBuffer(new Float32Array(24), 6);
    geometry.setAttribute("position", new THREE.InterleavedBufferAttribute(interleaved, 3, 0));
    geometry.setAttribute("normal", new THREE.InterleavedBufferAttribute(interleaved, 3, 3));
    geometry.setIndex([0, 1, 2]);
    expect(estimateCanonicalGeometryBytesV635(geometry)).toBe(interleaved.array.byteLength + geometry.index!.array.byteLength);
    geometry.dispose();
  });
});

describe("production producer wiring contract; not renderer or browser evidence", () => {
  it("puts stellar readiness on the surface mesh rather than its roster button", () => {
    const source = readFileSync("app/components/SelectedSkyTargetProxy.tsx", "utf8");
    expect(source).toMatch(/ref=\{surfaceMeshRef\}[\s\S]{0,100}onAfterRender=\{function \(this: THREE.Mesh,/);
    expect(source).toContain("surfaceMeshRef.current !== this");
    expect(source).toContain("renderVisible(this, camera, drawnMaterial, group)");
    expect(source).toContain('observeCanonicalStellarLayerV636(this, hero.id, "surface")');
    expect(source).toContain("canonicalProducer.rendered()");
    expect(source).toContain('"mainline-a-stellar-parametric", null');
    const roster = readFileSync("app/components/PostV593StellarRosterPanel.tsx", "utf8");
    expect(roster).not.toContain("publishCanonicalRuntimeSelection");
  });
  it("requires a verified decoded texture and a subsequent mesh draw for nebula readiness", () => {
    const source = readFileSync("app/components/MainlineANebulaScenePortraitV607.tsx", "utf8");
    const observer = readFileSync("app/lib/mainlineANebulaRenderV638.ts", "utf8");
    expect(source).toContain("loadMainlineANebulaSceneTextureV607(asset, abort.signal,");
    expect(source).toContain("renderObserver.inspect(camera)");
    expect(source).toContain("renderObserver.afterDraw(this, camera, drawnGeometry, drawnMaterial, group)");
    expect(observer).toContain('state.attempt.status === "decoded" || state.attempt.status === "ready"');
    expect(observer).toContain("material.map === state.texture");
    expect(observer).toContain("state.texture.userData.atlasVisualAssetSha256 === assetSha256");
    expect(source).toContain("canonicalProducer.failed");
    expect(source).toContain("releaseCanonicalTextureLeaseV635(lease?.release, asset.objectId)");
  });
  it("passes the selected IAU code into the actual root constellation line renderer", () => {
    const source = readFileSync("app/components/ConstellationLines.tsx", "utf8");
    const parent = readFileSync("app/components/AtlasDeepSpacePresentationSubtreeV275.tsx", "utf8");
    expect(parent).toMatch(/<ConstellationLines\s+selectedCatalogId=\{simulation\.selectedCelestialCatalogId\}/);
    expect(source).toContain("selectedFigureLineRef.current !== this");
    expect(source).toContain("this.geometry !== selectedFigureGeometry");
    expect(source).toContain("this.material !== selectedFigureMaterial");
    expect(source).toContain("projectMainlineAConstellationSegmentsV638(");
    expect(source).toContain("canonicalProducer.unobserved()");
    expect((source.match(/useCanonicalDisposableV635\(/g) ?? []).length).toBe(12);
    expect(source).toContain("selectedPresentation.nodeGeometry");
    expect(source).toContain("selectedPresentation.nodeMaterial");
    expect(source).toContain('observeSelectedDraw("nodes"');
  });
});

describe("canonical three-layer resource ownership", () => {
  const layers = ["surface", "halo", "corona"] as const;
  const createLayers = () => layers.map((layer) => ({
    layer, mesh: new THREE.Mesh(new THREE.SphereGeometry(1, 8, 4), new THREE.ShaderMaterial()),
  }));
  const disposeLayers = (items: ReturnType<typeof createLayers>) => items.forEach(({ mesh }) => {
    mesh.geometry.dispose(); mesh.material.dispose();
  });

  it("records all six allocations once across repeated draws with distinct layer identities", () => {
    const before = getAtlasResourceSnapshot();
    const items = createLayers();
    const observe = createCanonicalRenderedResourceObserverV635();
    try {
      for (const { mesh, layer } of items) {
        expect(observeCanonicalStellarLayerV636(mesh, "vega", layer, observe)).toBe(2);
        expect(observeCanonicalStellarLayerV636(mesh, "vega", layer, observe)).toBe(0);
      }
      const active = getAtlasResourceSnapshot();
      expect(active.total).toBe(before.total + 6);
      const labels = Object.values(active.byIdentity).map((row) => row.label);
      for (const layer of layers) {
        expect(labels).toContain(`stellar-hero:vega:${layer}-geometry`);
        expect(labels).toContain(`stellar-hero:vega:${layer}-material-0`);
      }
    } finally { disposeLayers(items); }
    expect(getAtlasResourceSnapshot().byIdentity).toEqual(before.byIdentity);
  });

  it.each(layers)("retains a replaced %s material until its own dispose event", (changedLayer) => {
    const before = getAtlasResourceSnapshot();
    const items = createLayers();
    const observe = createCanonicalRenderedResourceObserverV635();
    for (const { mesh, layer } of items) observeCanonicalStellarLayerV636(mesh, "vega", layer, observe);
    const changed = items.find(({ layer }) => layer === changedLayer)!;
    const oldMaterial = changed.mesh.material;
    changed.mesh.material = new THREE.ShaderMaterial();
    try {
      expect(observeCanonicalStellarLayerV636(changed.mesh, "vega", changedLayer, observe)).toBe(1);
      expect(getAtlasResourceSnapshot().total).toBe(before.total + 7);
      disposeLayers(items);
      const leaked = getAtlasResourceSnapshot();
      expect(leaked.total).toBe(before.total + 1);
      expect(leaked.byIdentity).not.toEqual(before.byIdentity);
      expect(Object.values(leaked.byIdentity).some((row) => row.label === `stellar-hero:vega:${changedLayer}-material-0`)).toBe(true);
      oldMaterial.dispose();
      expect(getAtlasResourceSnapshot().byIdentity).toEqual(before.byIdentity);
    } finally { disposeLayers(items); oldMaterial.dispose(); }
  });

  it.each(layers)("blocks the full lifecycle result when %s cleanup never disposes its shader", (missingLayer) => {
    let now = 0, scene = "atlas";
    const build = { buildId: "test-only-three-layer-release", branch: "codex/test", head: "b".repeat(40) };
    const viewport = { width: 1280, height: 720, devicePixelRatio: 1, device: "desktop" as const };
    const session = createMainlineALifecycleSessionV633({
      runId: `test-only-missing-${missingLayer}-dispose`, build, viewport, durationMs: 30_000,
      dependencies: {
        clock: () => now, isoNow: () => new Date(Date.UTC(2026, 8, 27) + now).toISOString(),
        scene: () => scene, resources: getAtlasResourceSnapshot, visible: () => true,
        heap: () => null, build: () => build, viewport: () => viewport,
      },
    });
    const items = createLayers();
    const observe = createCanonicalRenderedResourceObserverV635();
    try {
      session.pushFrame(0);
      for (const { mesh, layer } of items) observeCanonicalStellarLayerV636(mesh, "vega", layer, observe);
      now = 1000;
      scene = "inspect";
      expect(session.markActive()).toBe(true);
      session.pushFrame(now);
      for (const { mesh, layer } of items) {
        mesh.removeFromParent();
        mesh.geometry.dispose();
        if (layer !== missingLayer) mesh.material.dispose();
      }
      now = 30_000;
      scene = "atlas";
      session.pushFrame(now);
      const result = evaluateMainlineAResourceObservationV633(session.finish());
      expect(result).toMatchObject({ status: "blocked", acquiredCount: 6, releasedCount: 5, retainedCount: 1, baselineRestored: false });
      expect(result.issues).toContain("lifecycle:acquired-resources-retained");
      expect(result.issues).toContain("lifecycle:baseline-not-restored");
    } finally { disposeLayers(items); }
  });

  it("does not release detached decorative layers or promote canonical readiness", () => {
    const before = getAtlasResourceSnapshot();
    const items = createLayers();
    const observe = createCanonicalRenderedResourceObserverV635();
    const registry = makeRegistry();
    const lease = createCanonicalProducerLeaseV635(star, dependencies(registry));
    const group = new THREE.Group();
    try {
      for (const { mesh, layer } of items.filter(({ layer }) => layer !== "surface")) {
        group.add(mesh);
        observeCanonicalStellarLayerV636(mesh, "sirius-a", layer, observe);
      }
      group.clear();
      expect(registry.read().selection?.loading).toBe("loading");
      expect(getAtlasResourceSnapshot().total).toBe(before.total + 4);
      expect(getAtlasResourceSnapshot().byIdentity).not.toEqual(before.byIdentity);
    } finally { disposeLayers(items); lease.release(); }
  });

  it("restores the three-layer semantic baseline after real A to B to A disposals", () => {
    const before = getAtlasResourceSnapshot();
    const observe = createCanonicalRenderedResourceObserverV635();
    const first = createLayers(), second = createLayers(), returned = createLayers();
    try {
      for (const { mesh, layer } of first) observeCanonicalStellarLayerV636(mesh, "sirius-a", layer, observe);
      const baseline = getAtlasResourceSnapshot();
      disposeLayers(first);
      for (const { mesh, layer } of second) observeCanonicalStellarLayerV636(mesh, "vega", layer, observe);
      expect(getAtlasResourceSnapshot().byIdentity).not.toEqual(baseline.byIdentity);
      disposeLayers(second);
      for (const { mesh, layer } of returned) observeCanonicalStellarLayerV636(mesh, "sirius-a", layer, observe);
      expect(getAtlasResourceSnapshot().byIdentity).toEqual(baseline.byIdentity);
    } finally { disposeLayers(first); disposeLayers(second); disposeLayers(returned); }
    expect(getAtlasResourceSnapshot().byIdentity).toEqual(before.byIdentity);
  });

  it("deduplicates shared Three instances even across layer callbacks", () => {
    const geometry = new THREE.PlaneGeometry(1, 1), material = new THREE.ShaderMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    const acquire = vi.fn(() => vi.fn());
    const observe = createCanonicalRenderedResourceObserverV635({ acquire, report: vi.fn() });
    try {
      expect(observeCanonicalStellarLayerV636(mesh, "vega", "surface", observe)).toBe(2);
      expect(observeCanonicalStellarLayerV636(mesh, "vega", "halo", observe)).toBe(0);
      expect(observeCanonicalStellarLayerV636(mesh, "vega", "corona", observe)).toBe(0);
      expect(acquire).toHaveBeenCalledTimes(2);
    } finally { geometry.dispose(); material.dispose(); }
  });

  it("does not invent a canonical identity for a beta-only or unknown hero", () => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial());
    const observe = vi.fn(() => 2);
    try {
      expect(observeCanonicalStellarLayerV636(mesh, "invented", "halo", observe)).toBe(0);
      expect(observeCanonicalStellarLayerV636(mesh, "acrux", "corona", observe)).toBe(0);
      expect(observe).not.toHaveBeenCalled();
    } finally { mesh.geometry.dispose(); mesh.material.dispose(); }
  });
});

describe("rendered stellar resource observation; dispose events are not GPU measurements", () => {
  function observation() {
    const active = new Map<symbol, string>();
    const released: string[] = [];
    const acquire = vi.fn((_kind: string, _scene: string, label: string) => {
      const instance = Symbol(label);
      active.set(instance, label);
      return () => { active.delete(instance); released.push(label); };
    });
    const report = vi.fn();
    return { active, released, acquire, report, observe: createCanonicalRenderedResourceObserverV635({ acquire, report }) };
  }
  it("registers actual geometry and shader once across repeated draws and releases only on dispose", () => {
    const geometry = new THREE.SphereGeometry(1, 8, 4);
    const material = new THREE.ShaderMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    const state = observation();
    expect(state.observe(mesh, "test-only-star", "test-star")).toBe(2);
    for (let frame = 0; frame < 50; frame += 1) expect(state.observe(mesh, "test-only-star", "test-star")).toBe(0);
    expect(state.acquire).toHaveBeenCalledTimes(2);
    expect(state.active.size).toBe(2);
    geometry.dispose();
    expect(state.active.size).toBe(1);
    material.dispose();
    material.dispose();
    expect(state.active.size).toBe(0);
    expect(state.released).toHaveLength(2);
  });
  it("deduplicates a shared geometry and duplicate material entries across different meshes", () => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial();
    const otherMaterial = new THREE.MeshBasicMaterial();
    const first = new THREE.Mesh(geometry, [material, material]);
    const second = new THREE.Mesh(geometry, [material, otherMaterial]);
    const state = observation();
    expect(state.observe(first, "test-only-shared", "first")).toBe(2);
    expect(state.observe(second, "test-only-shared", "second")).toBe(1);
    expect(state.active.size).toBe(3);
    first.removeFromParent();
    second.removeFromParent();
    expect(state.active.size).toBe(3);
    geometry.dispose(); material.dispose(); otherMaterial.dispose();
    expect(state.released).toHaveLength(3);
  });
  it("retains the old material when replacement occurs without disposal", () => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const oldMaterial = new THREE.MeshBasicMaterial();
    const replacement = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geometry, oldMaterial);
    const state = observation();
    state.observe(mesh, "test-only-replacement", "star");
    mesh.material = replacement;
    expect(state.observe(mesh, "test-only-replacement", "star")).toBe(1);
    expect(state.active.size).toBe(3);
    replacement.dispose();
    expect(state.active.size).toBe(2);
    oldMaterial.dispose();
    geometry.dispose();
    expect(state.active.size).toBe(0);
  });
  it("starts a fresh registration if a disposed object is actually submitted again", () => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    const state = observation();
    state.observe(mesh, "test-only-reuse", "star");
    geometry.dispose(); material.dispose();
    expect(state.observe(mesh, "test-only-reuse", "star")).toBe(2);
    expect(state.active.size).toBe(2);
    geometry.dispose(); material.dispose();
    expect(state.released).toHaveLength(4);
  });
  it("does not take ownership of disposal or release a mesh merely because it detaches", () => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial();
    const geometryDispose = vi.spyOn(geometry, "dispose");
    const materialDispose = vi.spyOn(material, "dispose");
    const mesh = new THREE.Mesh(geometry, material);
    const state = observation();
    state.observe(mesh, "test-only-detach", "star");
    mesh.removeFromParent();
    expect(geometryDispose).not.toHaveBeenCalled();
    expect(materialDispose).not.toHaveBeenCalled();
    expect(state.active.size).toBe(2);
    geometry.dispose(); material.dispose();
  });
  it("tracks a replacement geometry while retaining the undisposed previous allocation", () => {
    const original = new THREE.SphereGeometry(1, 8, 4);
    const replacement = new THREE.SphereGeometry(2, 16, 8);
    const material = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(original, material);
    const state = observation();
    state.observe(mesh, "test-only-geometry-replacement", "star");
    mesh.geometry = replacement;
    expect(state.observe(mesh, "test-only-geometry-replacement", "star")).toBe(1);
    expect(state.active.size).toBe(3);
    expect(state.acquire.mock.calls[0][2]).toBe("star-geometry");
    expect(state.acquire.mock.calls[2][2]).toBe("star-geometry");
    original.dispose();
    expect(state.active.size).toBe(2);
    replacement.dispose(); material.dispose();
    expect(state.active.size).toBe(0);
  });
  it("retains failed registry releases until a later actual disposal event retries them", () => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial();
    const releases = [vi.fn<() => void>(), vi.fn<() => void>()];
    releases[0].mockImplementationOnce(() => { throw new Error("test-only registry failure"); });
    let index = 0;
    const acquire = vi.fn(() => releases[index++]);
    const report = vi.fn();
    const observe = createCanonicalRenderedResourceObserverV635({ acquire, report });
    const mesh = new THREE.Mesh(geometry, material);
    expect(observe(mesh, "test-only-retry", "star")).toBe(2);
    geometry.dispose();
    expect(report).toHaveBeenCalledWith("test-only-retry:star:dispose-event:test-only registry failure");
    expect(observe(mesh, "test-only-retry", "star")).toBe(0);
    material.dispose();
    expect(releases[1]).toHaveBeenCalledTimes(1);
    geometry.dispose();
    expect(releases[0]).toHaveBeenCalledTimes(2);
    geometry.dispose();
    expect(releases[0]).toHaveBeenCalledTimes(2);
    expect(acquire).toHaveBeenCalledTimes(2);
  });
  it("restores semantic registry identity after disposal and recreation but retains undisposed allocations", () => {
    const observe = createCanonicalRenderedResourceObserverV635();
    const initial = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 4), new THREE.MeshBasicMaterial());
    const replacement = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 4), new THREE.MeshBasicMaterial());
    const owner = "test-only-semantic-baseline";
    observe(initial, owner, "stellar-hero:sirius-a");
    const baseline = getAtlasResourceSnapshot();
    initial.geometry.dispose(); initial.material.dispose();
    observe(replacement, owner, "stellar-hero:sirius-a");
    const restored = getAtlasResourceSnapshot();
    expect(restored.byIdentity).toEqual(baseline.byIdentity);
    expect(restored.identityDigest).toBe(baseline.identityDigest);
    const missingDisposal = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 4), new THREE.MeshBasicMaterial());
    observe(missingDisposal, owner, "stellar-hero:sirius-a");
    const retained = getAtlasResourceSnapshot();
    expect(retained.byIdentity).not.toEqual(baseline.byIdentity);
    expect(retained.total).toBe(baseline.total + 2);
    replacement.geometry.dispose(); replacement.material.dispose();
    expect(getAtlasResourceSnapshot().byIdentity).toEqual(baseline.byIdentity);
    missingDisposal.geometry.dispose(); missingDisposal.material.dispose();
  });
});
