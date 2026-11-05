import * as THREE from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hookHarness = vi.hoisted(() => ({
  gl: null as unknown,
  cleanups: [] as Array<() => void>,
}));

vi.mock("@react-three/fiber", () => ({
  useThree: (selector: (state: { gl: unknown }) => unknown) => selector({ gl: hookHarness.gl }),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useEffect: (effect: () => void | (() => void)) => {
      const cleanup = effect();
      if (typeof cleanup === "function") hookHarness.cleanups.push(cleanup);
    },
    useState: <T,>(initial: T) => [initial, () => undefined] as const,
  };
});

import { getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import { atlasRuntimeStore } from "./atlasRuntimeStore";
import { getProceduralPlanetTexture } from "./celestialTextures";
import {
  disposeOptionalTextureRendererResourcesV594,
  getOptionalTextureRendererCacheSnapshotV594,
  installOptionalTextureRendererTeardownV594,
  productionOptionalTextureFallbackCandidatesV594,
  reconcileOptionalTextureRendererSceneModeV595,
  registerRendererSharedGeometryBindingV594,
  useOptionalTexture,
} from "./useOptionalTexture";

type LoadCallback = (texture: THREE.Texture) => void;

function createRenderer() {
  const forceContextLoss = vi.fn();
  const dispose = vi.fn();
  return {
    renderer: {
      capabilities: { getMaxAnisotropy: () => 8 },
      forceContextLoss,
      dispose,
    } as unknown as THREE.WebGLRenderer,
    forceContextLoss,
    dispose,
  };
}

function releaseHookReferences() {
  for (const cleanup of hookHarness.cleanups.splice(0)) cleanup();
}

describe("renderer-owned optional texture cache v594", () => {
  let delayedLoads: Array<{ texture: THREE.Texture; accept: LoadCallback }>;
  let delayTextureLoads: boolean;

  beforeEach(() => {
    atlasRuntimeStore.setSceneMode("atlas");
    hookHarness.cleanups = [];
    delayedLoads = [];
    delayTextureLoads = false;
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ assets: [] }),
    })));
    vi.spyOn(THREE.TextureLoader.prototype, "load").mockImplementation((
      _url,
      onLoad,
    ) => {
      const texture = new THREE.Texture();
      texture.image = { width: 4, height: 4 };
      if (onLoad) {
        if (delayTextureLoads) delayedLoads.push({ texture, accept: onLoad });
        else onLoad(texture);
      }
      return texture;
    });
  });

  afterEach(() => {
    atlasRuntimeStore.setSceneMode("atlas");
    releaseHookReferences();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("routes missing production v49 byte sources to admitted Full assets and explicit Lite omissions", () => {
    expect(productionOptionalTextureFallbackCandidatesV594(
      "/textures/planets/hd/earth.jpg",
      "standalone-full",
    )).toEqual(["/textures/candidate-v588/fallback/desktop/earth-albedo.webp"]);
    expect(productionOptionalTextureFallbackCandidatesV594(
      "/textures/planets/hd/earth-clouds.jpg",
      "standalone-full",
    )).toEqual(["/textures/candidate-v588/fallback/desktop/earth-clouds.webp"]);
    expect(productionOptionalTextureFallbackCandidatesV594(
      "/textures/planets/hd/earth.jpg",
      "vercel-lite",
    )).toEqual(["/atlas-lite/textures/planets/earth.jpg"]);
    expect(productionOptionalTextureFallbackCandidatesV594(
      "/textures/planets/hd/earth-clouds.jpg",
      "vercel-lite",
    )).toEqual([]);
    expect(productionOptionalTextureFallbackCandidatesV594(
      "/textures/planets/hd/unknown-earth.jpg",
      "standalone-full",
    )).toBeNull();
    expect(productionOptionalTextureFallbackCandidatesV594(
      "/textures/planets/hd/mercury.jpg",
      "standalone-full",
    )).toEqual(["/textures/planets/mercury.jpg"]);
    expect(productionOptionalTextureFallbackCandidatesV594(
      "/textures/planets/hd/mercury.jpg",
      "vercel-lite",
    )).toEqual(["/atlas-lite/textures/planets/mercury.jpg"]);
    expect(productionOptionalTextureFallbackCandidatesV594(
      "/textures/planets/hd/venus.jpg",
      "standalone-full",
    )).toEqual(["/textures/planets/venus.jpg"]);
    expect(productionOptionalTextureFallbackCandidatesV594(
      "/textures/planets/v49/mars-albedo.jpg",
      "vercel-lite",
    )).toEqual(["/atlas-lite/textures/planets/mars.jpg"]);
    expect(productionOptionalTextureFallbackCandidatesV594(
      "/textures/planets/v49/mars-roughness.jpg",
      "vercel-lite",
    )).toEqual([]);
    expect(productionOptionalTextureFallbackCandidatesV594(
      "/textures/planets/v49/earth-clouds.jpg",
      "standalone-full",
    )).toEqual(["/textures/candidate-v588/fallback/desktop/earth-clouds.webp"]);
    expect(productionOptionalTextureFallbackCandidatesV594(
      "/textures/planets/v49/earth-albedo.jpg",
      "vercel-lite",
    )).toEqual(["/atlas-lite/textures/planets/earth.jpg"]);
    expect(productionOptionalTextureFallbackCandidatesV594(
      "/textures/planets/v49/jupiter-roughness.jpg",
      "vercel-lite",
    )).toEqual([]);
    expect(productionOptionalTextureFallbackCandidatesV594(
      "/textures/planets/v49/saturn-albedo.jpg",
      "standalone-full",
    )).toEqual(["/textures/candidate-v588/fallback/desktop/saturn-albedo.webp"]);
    expect(productionOptionalTextureFallbackCandidatesV594(
      "/textures/planets/v49/saturn-albedo.jpg",
      "vercel-lite",
    )).toEqual(["/atlas-lite/textures/planets/saturn.jpg"]);
    for (const assetId of [
      "saturn-roughness",
      "saturn-band-mask",
      "saturn-ring-color",
      "saturn-ring-alpha",
    ]) {
      expect(productionOptionalTextureFallbackCandidatesV594(
        `/textures/planets/v49/${assetId}.jpg`,
        "vercel-lite",
      )).toEqual([]);
    }
    expect(productionOptionalTextureFallbackCandidatesV594(
      "/textures/planets/v49/unknown-saturn-channel.jpg",
      "vercel-lite",
    )).toBeNull();
  });

  it("releases all eight retained entries below the live-renderer LRU threshold", async () => {
    const { renderer } = createRenderer();
    hookHarness.gl = renderer;
    useOptionalTexture("/test/planet-0.jpg");
    useOptionalTexture("/test/planet-1.jpg");
    useOptionalTexture("/test/planet-2.jpg");
    useOptionalTexture("/test/planet-3.jpg");
    useOptionalTexture("/test/planet-4.jpg");
    useOptionalTexture("/test/planet-5.jpg");
    useOptionalTexture("/test/planet-6.jpg");
    useOptionalTexture("/test/planet-7.jpg");
    await vi.waitFor(() => expect(getAtlasResourceSnapshot().textures).toBe(8));
    releaseHookReferences();

    expect(getOptionalTextureRendererCacheSnapshotV594(renderer)).toMatchObject({
      status: "active",
      entries: 8,
      referenced: 0,
      retainedTextures: 8,
      registeredTextures: 8,
    });

    const receipt = disposeOptionalTextureRendererResourcesV594(renderer);
    expect(receipt).toEqual({
      status: "disposed",
      entriesDisposed: 8,
      texturesDisposed: 8,
      registryReleases: 8,
      pendingAborted: 0,
      loaderDisposed: false,
    });
    expect(getAtlasResourceSnapshot().textures).toBe(0);
    expect(getOptionalTextureRendererCacheSnapshotV594(renderer)).toEqual({
      status: "disposed",
      entries: 0,
      pending: 0,
      referenced: 0,
      retainedTextures: 0,
      registeredTextures: 0,
    });
    expect(disposeOptionalTextureRendererResourcesV594(renderer)).toMatchObject({
      status: "already-disposed",
      entriesDisposed: 0,
      registryReleases: 0,
    });
  });

  it("disposes a late async texture without resurrecting its registry lease", async () => {
    const { renderer } = createRenderer();
    hookHarness.gl = renderer;
    delayTextureLoads = true;
    useOptionalTexture("/test/late.jpg");
    await vi.waitFor(() => expect(delayedLoads).toHaveLength(1));
    const lateTexture = delayedLoads[0].texture;
    const disposeSpy = vi.spyOn(lateTexture, "dispose");

    expect(disposeOptionalTextureRendererResourcesV594(renderer)).toMatchObject({
      pendingAborted: 1,
      registryReleases: 0,
    });
    delayedLoads[0].accept(lateTexture);

    expect(disposeSpy).toHaveBeenCalledOnce();
    expect(getAtlasResourceSnapshot().textures).toBe(0);
    expect(getOptionalTextureRendererCacheSnapshotV594(renderer).status).toBe("disposed");
  });

  it("captures the underlying Canvas owner before a delayed load crosses into Scene Lab", async () => {
    const { renderer } = createRenderer();
    hookHarness.gl = renderer;
    delayTextureLoads = true;
    atlasRuntimeStore.setSceneMode("atlas");
    useOptionalTexture("/test/delayed-atlas-owner.jpg");
    await vi.waitFor(() => expect(delayedLoads).toHaveLength(1));

    atlasRuntimeStore.setSceneMode("scene-lab");
    delayedLoads[0].accept(delayedLoads[0].texture);
    await vi.waitFor(() => expect(getAtlasResourceSnapshot().textures).toBe(1));

    const identities = Object.values(getAtlasResourceSnapshot().byIdentity);
    expect(identities).toHaveLength(1);
    expect(identities[0]).toMatchObject({
      kind: "texture",
      sceneMode: "atlas",
      owner: "atlas",
      label: "/test/delayed-atlas-owner.jpg",
    });

    disposeOptionalTextureRendererResourcesV594(renderer);
    expect(getAtlasResourceSnapshot().textures).toBe(0);
  });

  it("keeps StrictMode setup-cleanup-setup on one same-mode cache entry", async () => {
    const { renderer } = createRenderer();
    hookHarness.gl = renderer;
    const loadSpy = THREE.TextureLoader.prototype.load as unknown as { mock: { calls: unknown[][] } };

    useOptionalTexture("/test/strict-mode.jpg");
    await vi.waitFor(() => expect(getAtlasResourceSnapshot().textures).toBe(1));
    const firstCleanup = hookHarness.cleanups.shift();
    expect(firstCleanup).toBeTypeOf("function");
    firstCleanup?.();

    useOptionalTexture("/test/strict-mode.jpg");
    expect(loadSpy.mock.calls).toHaveLength(1);
    expect(getOptionalTextureRendererCacheSnapshotV594(renderer)).toMatchObject({
      entries: 1,
      referenced: 1,
      retainedTextures: 1,
      registeredTextures: 1,
    });

    releaseHookReferences();
    expect(getOptionalTextureRendererCacheSnapshotV594(renderer)).toMatchObject({
      entries: 1,
      referenced: 0,
      retainedTextures: 1,
      registeredTextures: 1,
    });
    disposeOptionalTextureRendererResourcesV594(renderer);
  });

  it("retains a same-mode texture until the last consumer cleanup", async () => {
    const { renderer } = createRenderer();
    hookHarness.gl = renderer;
    useOptionalTexture("/test/shared-consumers.jpg");
    useOptionalTexture("/test/shared-consumers.jpg");
    await vi.waitFor(() => expect(getAtlasResourceSnapshot().textures).toBe(1));

    expect(getOptionalTextureRendererCacheSnapshotV594(renderer)).toMatchObject({
      entries: 1,
      referenced: 2,
      registeredTextures: 1,
    });
    const firstCleanup = hookHarness.cleanups.shift();
    firstCleanup?.();
    expect(getOptionalTextureRendererCacheSnapshotV594(renderer)).toMatchObject({
      entries: 1,
      referenced: 1,
      retainedTextures: 1,
      registeredTextures: 1,
    });
    releaseHookReferences();
    expect(getOptionalTextureRendererCacheSnapshotV594(renderer)).toMatchObject({
      entries: 1,
      referenced: 0,
      retainedTextures: 1,
      registeredTextures: 1,
    });
    disposeOptionalTextureRendererResourcesV594(renderer);
  });

  it("evicts zero-reference entries for cleanup-before-reconcile and reconcile-before-cleanup", async () => {
    const cleanupFirst = createRenderer();
    hookHarness.gl = cleanupFirst.renderer;
    delayTextureLoads = true;
    atlasRuntimeStore.setSceneMode("atlas");
    useOptionalTexture("/test/cleanup-first.jpg");
    await vi.waitFor(() => expect(delayedLoads).toHaveLength(1));
    const lateCleanup = hookHarness.cleanups.shift();
    lateCleanup?.();
    expect(getOptionalTextureRendererCacheSnapshotV594(cleanupFirst.renderer)).toMatchObject({
      entries: 1,
      pending: 1,
      referenced: 0,
    });
    atlasRuntimeStore.setSceneMode("launch");
    expect(getOptionalTextureRendererCacheSnapshotV594(cleanupFirst.renderer)).toMatchObject({
      entries: 0,
      pending: 0,
      referenced: 0,
    });
    const lateTexture = delayedLoads[0].texture;
    const lateDispose = vi.spyOn(lateTexture, "dispose");
    delayedLoads[0].accept(lateTexture);
    expect(lateDispose).toHaveBeenCalledOnce();
    disposeOptionalTextureRendererResourcesV594(cleanupFirst.renderer);

    const reconcileFirst = createRenderer();
    hookHarness.gl = reconcileFirst.renderer;
    delayTextureLoads = false;
    atlasRuntimeStore.setSceneMode("atlas");
    useOptionalTexture("/test/reconcile-first.jpg");
    await vi.waitFor(() => expect(getAtlasResourceSnapshot().textures).toBe(1));
    atlasRuntimeStore.setSceneMode("launch");
    expect(getOptionalTextureRendererCacheSnapshotV594(reconcileFirst.renderer)).toMatchObject({
      entries: 1,
      referenced: 1,
    });
    releaseHookReferences();
    expect(getOptionalTextureRendererCacheSnapshotV594(reconcileFirst.renderer)).toMatchObject({
      entries: 0,
      pending: 0,
      referenced: 0,
      retainedTextures: 0,
      registeredTextures: 0,
    });
    disposeOptionalTextureRendererResourcesV594(reconcileFirst.renderer);
  });

  it("uses independent entries and registry owners for one URL across Canvas modes", async () => {
    const { renderer } = createRenderer();
    hookHarness.gl = renderer;
    atlasRuntimeStore.setSceneMode("atlas");
    useOptionalTexture("/test/cross-mode.jpg");
    await vi.waitFor(() => expect(getAtlasResourceSnapshot().textures).toBe(1));

    atlasRuntimeStore.setSceneMode("launch");
    useOptionalTexture("/test/cross-mode.jpg");
    await vi.waitFor(() => expect(getAtlasResourceSnapshot().textures).toBe(2));
    const identities = Object.values(getAtlasResourceSnapshot().byIdentity)
      .filter((identity) => identity.label === "/test/cross-mode.jpg");
    expect(identities).toHaveLength(2);
    expect(identities.map((identity) => identity.owner).sort()).toEqual(["atlas", "launch"]);
    expect(getOptionalTextureRendererCacheSnapshotV594(renderer)).toMatchObject({
      entries: 2,
      referenced: 2,
      registeredTextures: 2,
    });

    const firstCleanup = hookHarness.cleanups.shift();
    firstCleanup?.();
    expect(getOptionalTextureRendererCacheSnapshotV594(renderer)).toMatchObject({
      entries: 1,
      referenced: 1,
      registeredTextures: 1,
    });
    releaseHookReferences();
    disposeOptionalTextureRendererResourcesV594(renderer);
    expect(getAtlasResourceSnapshot().textures).toBe(0);
  });

  it("honors an explicit atlas owner for a persistent base texture loaded during inspect", async () => {
    const { renderer } = createRenderer();
    hookHarness.gl = renderer;
    atlasRuntimeStore.setSceneMode("inspect");

    useOptionalTexture("/test/persistent-earth-base.jpg", "atlas");
    await vi.waitFor(() => expect(getAtlasResourceSnapshot().textures).toBe(1));

    expect(Object.values(getAtlasResourceSnapshot().byIdentity)).toContainEqual(
      expect.objectContaining({
        kind: "texture",
        sceneMode: "atlas",
        owner: "atlas",
        label: "/test/persistent-earth-base.jpg",
      }),
    );

    releaseHookReferences();
    disposeOptionalTextureRendererResourcesV594(renderer);
    expect(getAtlasResourceSnapshot().textures).toBe(0);
  });

  it("normalizes shell aliases and unsubscribes the renderer on disposal", async () => {
    const { renderer } = createRenderer();
    hookHarness.gl = renderer;
    const listenerCount = atlasRuntimeStore.getListenerCount();
    atlasRuntimeStore.setSceneMode("scene-lab");
    useOptionalTexture("/test/shell-alias.jpg");
    await vi.waitFor(() => expect(getAtlasResourceSnapshot().textures).toBe(1));
    expect(atlasRuntimeStore.getListenerCount()).toBe(listenerCount + 1);

    // Scene Lab shares the atlas Canvas mode, so reconciliation must retain
    // and reuse this entry rather than creating an alias-owned resource.
    reconcileOptionalTextureRendererSceneModeV595(renderer, "atlas");
    expect(getOptionalTextureRendererCacheSnapshotV594(renderer)).toMatchObject({
      entries: 1,
      referenced: 1,
    });
    releaseHookReferences();
    disposeOptionalTextureRendererResourcesV594(renderer);
    expect(atlasRuntimeStore.getListenerCount()).toBe(listenerCount);
  });

  it("isolates disposal to the targeted renderer", async () => {
    const left = createRenderer().renderer;
    const right = createRenderer().renderer;
    hookHarness.gl = left;
    useOptionalTexture("/test/left.jpg");
    hookHarness.gl = right;
    useOptionalTexture("/test/right.jpg");
    await vi.waitFor(() => expect(getAtlasResourceSnapshot().textures).toBe(2));

    disposeOptionalTextureRendererResourcesV594(left);
    expect(getAtlasResourceSnapshot().textures).toBe(1);
    expect(getOptionalTextureRendererCacheSnapshotV594(left).status).toBe("disposed");
    expect(getOptionalTextureRendererCacheSnapshotV594(right)).toMatchObject({
      status: "active",
      entries: 1,
      registeredTextures: 1,
    });

    disposeOptionalTextureRendererResourcesV594(right);
    expect(getAtlasResourceSnapshot().textures).toBe(0);
  });

  it("binds full renderer cleanup to R3F's real forceContextLoss teardown path", async () => {
    const renderer = createRenderer();
    const sharedTexture = getProceduralPlanetTexture(
      "v594-renderer-teardown-test",
      new THREE.Color("#5b7fa3"),
    );
    const sharedTextureDispose = vi.spyOn(sharedTexture, "dispose");
    const sharedGeometry = new THREE.BufferGeometry();
    const sharedGeometryDispose = vi.spyOn(sharedGeometry, "dispose");
    hookHarness.gl = renderer.renderer;
    installOptionalTextureRendererTeardownV594(renderer.renderer);
    registerRendererSharedGeometryBindingV594(renderer.renderer, sharedGeometry);
    registerRendererSharedGeometryBindingV594(renderer.renderer, sharedGeometry);
    useOptionalTexture("/test/r3f-force-context-loss.jpg");
    await vi.waitFor(() => expect(getAtlasResourceSnapshot().textures).toBe(1));

    renderer.renderer.forceContextLoss();

    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(renderer.forceContextLoss).toHaveBeenCalledOnce();
    expect(sharedTextureDispose).toHaveBeenCalledOnce();
    expect(sharedGeometryDispose).toHaveBeenCalledOnce();
    expect(sharedTextureDispose.mock.invocationCallOrder[0]).toBeLessThan(
      renderer.dispose.mock.invocationCallOrder[0],
    );
    expect(sharedGeometryDispose.mock.invocationCallOrder[0]).toBeLessThan(
      renderer.dispose.mock.invocationCallOrder[0],
    );
    expect(getProceduralPlanetTexture(
      "v594-renderer-teardown-test",
      new THREE.Color("#5b7fa3"),
    )).toBe(sharedTexture);
    expect(getAtlasResourceSnapshot().textures).toBe(0);
    expect(getOptionalTextureRendererCacheSnapshotV594(renderer.renderer).status).toBe("disposed");

    renderer.renderer.dispose();
    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(sharedTextureDispose).toHaveBeenCalledOnce();
    expect(sharedGeometryDispose).toHaveBeenCalledOnce();
  });
});
