import { useThree } from "@react-three/fiber";
import type { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import * as THREE from "three";
import { useEffect, useState } from "react";
import {
  atlasAssetCandidates,
  atlasContentPackAssetUrl,
} from "./atlasAssetResolver";
import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import { getAtlasDeliveryProfile } from "./atlasDeliveryProfile";
import { acquireAtlasResource } from "./atlasResourceLifecycle";
import { atlasRuntimeStore } from "./atlasRuntimeStore";
import type { AtlasSceneModeV2 } from "./atlasRuntimeStore";
import { releaseSharedCelestialTextureRendererBindingsV594 } from "./celestialTextures";
import { resolveAtlasUnderlyingCanvasModeV595 } from "./atlasProductSceneFamilyContractV595";

type PlanetTextureRuntimeManifest = {
  assets?: Array<{
    source?: string;
    ktx2?: string;
  }>;
};

let ktx2SourceMapPromise: Promise<Map<string, string>> | null = null;
let ktx2LoaderModulePromise: Promise<typeof import("three/examples/jsm/loaders/KTX2Loader.js")> | null = null;
let ktx2PostCanvasReadyPromise: Promise<void> | null = null;
const ktx2Loaders = new WeakMap<THREE.WebGLRenderer, KTX2Loader>();
type CachedTextureEntry = {
  resourceSceneMode: ReturnType<typeof resolveAtlasUnderlyingCanvasModeV595>;
  texture: THREE.Texture | null;
  pending: boolean;
  disposed: boolean;
  refs: number;
  lastUsedAt: number;
  release: (() => void) | null;
  listeners: Set<(texture: THREE.Texture | null) => void>;
};
type RendererTextureCacheV594 = {
  disposed: boolean;
  activeUnderlyingCanvasMode: ReturnType<typeof resolveAtlasUnderlyingCanvasModeV595>;
  unsubscribeSceneMode: (() => void) | null;
  entries: Map<string, CachedTextureEntry>;
};

export type OptionalTextureRendererCacheSnapshotV594 = Readonly<{
  status: "uninitialized" | "active" | "disposed";
  entries: number;
  pending: number;
  referenced: number;
  retainedTextures: number;
  registeredTextures: number;
}>;

export type OptionalTextureRendererDisposalReceiptV594 = Readonly<{
  status: "disposed" | "already-disposed";
  entriesDisposed: number;
  texturesDisposed: number;
  registryReleases: number;
  pendingAborted: number;
  loaderDisposed: boolean;
}>;

const textureCaches = new WeakMap<THREE.WebGLRenderer, RendererTextureCacheV594>();
const disposedTextureRenderers = new WeakSet<THREE.WebGLRenderer>();
const installedTextureRendererTeardown = new WeakSet<THREE.WebGLRenderer>();
const rendererSharedGeometryBindings = new WeakMap<
  THREE.WebGLRenderer,
  Set<THREE.BufferGeometry>
>();
const MAX_RETAINED_TEXTURES_PER_RENDERER = 48;
// Three r170's Basis transcoder is an Emscripten embind build that creates
// functions dynamically. Production CSP intentionally omits `unsafe-eval`, so
// production uses the byte-source JPG/PNG fallback instead of first raising a
// page error and only then falling back. Development retains the compressed
// texture path for asset-pipeline inspection.
const KTX2_TRANSCODER_CSP_COMPATIBLE = process.env.NODE_ENV !== "production";

const V594_PRESENTATION_FALLBACK_IDS = Object.freeze(new Map<string, string>([
  ["/textures/planets/hd/earth.jpg", "earth-albedo"],
  ["/textures/planets/hd/earth-clouds.jpg", "earth-clouds"],
  ["/textures/planets/v49/earth-albedo.jpg", "earth-albedo"],
  ["/textures/planets/v49/earth-roughness.jpg", "earth-roughness"],
  ["/textures/planets/v49/earth-clouds.jpg", "earth-clouds"],
  ["/textures/planets/v49/earth-cloud-alpha.jpg", "earth-cloud-alpha"],
  ["/textures/planets/v49/earth-night.jpg", "earth-night"],
  ["/textures/planets/v49/earth-night-mask.jpg", "earth-night-mask"],
  ["/textures/planets/v49/jupiter-albedo.jpg", "jupiter-albedo"],
  ["/textures/planets/v49/jupiter-roughness.jpg", "jupiter-roughness"],
  ["/textures/planets/v49/jupiter-band-mask.jpg", "jupiter-band-mask"],
  ["/textures/planets/v49/mars-roughness.jpg", "mars-roughness"],
  ["/textures/planets/v49/saturn-albedo.jpg", "saturn-albedo"],
  ["/textures/planets/v49/saturn-roughness.jpg", "saturn-roughness"],
  ["/textures/planets/v49/saturn-band-mask.jpg", "saturn-band-mask"],
  ["/textures/planets/v49/saturn-ring-color.jpg", "saturn-ring-color"],
  ["/textures/planets/v49/saturn-ring-alpha.jpg", "saturn-ring-alpha"],
]));

const V595_DIRECT_PRESENTATION_FALLBACKS = Object.freeze(new Map<string, Readonly<{
  full: string;
  lite: string;
}>>([
  // Mercury/Venus HD logical entries are retained for provenance, while the
  // materialized byte source is the core albedo shared by both delivery tiers.
  ["/textures/planets/hd/mercury.jpg", {
    full: "/textures/planets/mercury.jpg",
    lite: "/atlas-lite/textures/planets/mercury.jpg",
  }],
  ["/textures/planets/hd/venus.jpg", {
    full: "/textures/planets/venus.jpg",
    lite: "/atlas-lite/textures/planets/venus.jpg",
  }],
  ["/textures/planets/v49/mars-albedo.jpg", {
    full: "/textures/planets/mars.jpg",
    lite: "/atlas-lite/textures/planets/mars.jpg",
  }],
]));

/**
 * The admitted source manifests map these logical JPG names to KTX2. Production
 * cannot execute Three's Basis transcoder under Atlas' strict CSP, and the
 * corresponding JPG byte sources were never shipped. Full therefore consumes
 * the already-admitted v588 deterministic WebP fallback. Lite retains only the
 * existing base albedo and intentionally omits unsupported material channels.
 */
export function productionOptionalTextureFallbackCandidatesV594(
  url: string,
  deliveryProfile: AtlasDeliveryProfile = getAtlasDeliveryProfile(),
): readonly string[] | null {
  const directFallback = V595_DIRECT_PRESENTATION_FALLBACKS.get(url);
  if (directFallback) {
    return [deliveryProfile === "vercel-lite" ? directFallback.lite : directFallback.full];
  }
  const assetId = V594_PRESENTATION_FALLBACK_IDS.get(url);
  if (!assetId) return null;
  if (deliveryProfile === "vercel-lite") {
    if (assetId === "earth-albedo") return ["/atlas-lite/textures/planets/earth.jpg"];
    if (assetId === "jupiter-albedo") return ["/atlas-lite/textures/planets/jupiter.jpg"];
    if (assetId === "saturn-albedo") return ["/atlas-lite/textures/planets/saturn.jpg"];
    return [];
  }
  return [`/textures/candidate-v588/fallback/desktop/${assetId}.webp`];
}

function textureCacheFor(gl: THREE.WebGLRenderer) {
  const existing = textureCaches.get(gl);
  if (existing) {
    if (existing.disposed || disposedTextureRenderers.has(gl)) {
      throw new Error("optional-texture-renderer-already-disposed-v594");
    }
    return existing;
  }
  if (disposedTextureRenderers.has(gl)) {
    throw new Error("optional-texture-renderer-already-disposed-v594");
  }
  const created: RendererTextureCacheV594 = {
    disposed: false,
    activeUnderlyingCanvasMode: resolveAtlasUnderlyingCanvasModeV595(
      atlasRuntimeStore.getSnapshot().sceneMode,
    ),
    unsubscribeSceneMode: null,
    entries: new Map<string, CachedTextureEntry>(),
  };
  textureCaches.set(gl, created);
  created.unsubscribeSceneMode = atlasRuntimeStore.subscribeSelector(
    (snapshot) => snapshot.sceneMode,
    () => {
      const snapshot = atlasRuntimeStore.getSnapshot();
      reconcileOptionalTextureRendererSceneModeV595(gl, snapshot.sceneMode);
    },
  );
  return created;
}

function disposeTextureEntryV594(entry: CachedTextureEntry): Readonly<{
  textureDisposed: boolean;
  registryReleased: boolean;
  pendingAborted: boolean;
}> {
  if (entry.disposed) {
    return Object.freeze({
      textureDisposed: false,
      registryReleased: false,
      pendingAborted: false,
    });
  }
  const texture = entry.texture;
  const release = entry.release;
  const pendingAborted = entry.pending;
  entry.disposed = true;
  entry.pending = false;
  entry.texture = null;
  entry.release = null;
  entry.refs = 0;
  entry.listeners.clear();
  texture?.dispose();
  release?.();
  return Object.freeze({
    textureDisposed: texture !== null,
    registryReleased: release !== null,
    pendingAborted,
  });
}

/**
 * Remove scene-owned entries which no longer belong to the active underlying
 * Canvas mode.  A zero-reference entry is safe to evict even while a loader
 * is pending: disposeTextureEntryV594 marks it closed so a late callback can
 * only dispose its candidate and cannot acquire a replacement registry lease.
 */
function evictInactiveOptionalTextureEntriesV595(
  cache: RendererTextureCacheV594,
  activeUnderlyingCanvasMode: CachedTextureEntry["resourceSceneMode"],
): void {
  if (cache.disposed) return;
  cache.activeUnderlyingCanvasMode = activeUnderlyingCanvasMode;
  for (const [key, entry] of cache.entries) {
    if (
      entry.refs !== 0
      || entry.disposed
      || entry.resourceSceneMode === activeUnderlyingCanvasMode
    ) continue;
    disposeTextureEntryV594(entry);
    // Do not delete a replacement entry if a future caller has already
    // reused this key.  (The mode-aware key normally prevents this, but the
    // identity check makes the late-completion contract explicit.)
    if (cache.entries.get(key) === entry) cache.entries.delete(key);
  }
}

/**
 * Reconcile renderer-owned optional textures with the current product scene.
 * Shell modes (Scene Lab/Relativity Lab) are normalized to their shared
 * Canvas mode by resolveAtlasUnderlyingCanvasModeV595.
 */
export function reconcileOptionalTextureRendererSceneModeV595(
  gl: THREE.WebGLRenderer,
  sceneModeV2: AtlasSceneModeV2,
): void {
  const cache = textureCaches.get(gl);
  if (!cache || cache.disposed || disposedTextureRenderers.has(gl)) return;
  evictInactiveOptionalTextureEntriesV595(
    cache,
    resolveAtlasUnderlyingCanvasModeV595(sceneModeV2),
  );
}

function trimTextureCache(cache: RendererTextureCacheV594) {
  if (cache.disposed || cache.entries.size < MAX_RETAINED_TEXTURES_PER_RENDERER) return;
  const idle = [...cache.entries.entries()]
    .filter(([, entry]) => entry.refs === 0 && !entry.pending && !entry.disposed)
    .sort((left, right) => left[1].lastUsedAt - right[1].lastUsedAt);
  while (cache.entries.size >= MAX_RETAINED_TEXTURES_PER_RENDERER && idle.length > 0) {
    const [key, entry] = idle.shift()!;
    disposeTextureEntryV594(entry);
    cache.entries.delete(key);
  }
}

export function getOptionalTextureRendererCacheSnapshotV594(
  gl: THREE.WebGLRenderer,
): OptionalTextureRendererCacheSnapshotV594 {
  const cache = textureCaches.get(gl);
  if (!cache) {
    return Object.freeze({
      status: disposedTextureRenderers.has(gl) ? "disposed" : "uninitialized",
      entries: 0,
      pending: 0,
      referenced: 0,
      retainedTextures: 0,
      registeredTextures: 0,
    });
  }
  const entries = [...cache.entries.values()];
  return Object.freeze({
    status: cache.disposed ? "disposed" : "active",
    entries: entries.length,
    pending: entries.filter((entry) => entry.pending && !entry.disposed).length,
    referenced: entries.reduce((total, entry) => total + entry.refs, 0),
    retainedTextures: entries.filter((entry) => entry.texture !== null && !entry.disposed).length,
    registeredTextures: entries.filter((entry) => entry.release !== null && !entry.disposed).length,
  });
}

export function disposeOptionalTextureRendererResourcesV594(
  gl: THREE.WebGLRenderer,
): OptionalTextureRendererDisposalReceiptV594 {
  const alreadyDisposed = disposedTextureRenderers.has(gl);
  disposedTextureRenderers.add(gl);
  const cache = textureCaches.get(gl);
  let entriesDisposed = 0;
  let texturesDisposed = 0;
  let registryReleases = 0;
  let pendingAborted = 0;
  if (cache && !cache.disposed) {
    cache.disposed = true;
    cache.unsubscribeSceneMode?.();
    cache.unsubscribeSceneMode = null;
    for (const entry of cache.entries.values()) {
      const result = disposeTextureEntryV594(entry);
      entriesDisposed += 1;
      if (result.textureDisposed) texturesDisposed += 1;
      if (result.registryReleased) registryReleases += 1;
      if (result.pendingAborted) pendingAborted += 1;
    }
    cache.entries.clear();
  }
  const loader = ktx2Loaders.get(gl);
  if (loader) {
    loader.dispose();
    ktx2Loaders.delete(gl);
  }
  return Object.freeze({
    status: alreadyDisposed ? "already-disposed" : "disposed",
    entriesDisposed,
    texturesDisposed,
    registryReleases,
    pendingAborted,
    loaderDisposed: loader !== undefined,
  });
}

export function registerRendererSharedGeometryBindingV594(
  gl: THREE.WebGLRenderer,
  geometry: THREE.BufferGeometry,
): void {
  if (disposedTextureRenderers.has(gl)) {
    throw new Error("optional-texture-renderer-already-disposed-v594");
  }
  const registered = rendererSharedGeometryBindings.get(gl) ?? new Set<THREE.BufferGeometry>();
  registered.add(geometry);
  rendererSharedGeometryBindings.set(gl, registered);
}

function releaseRendererSharedGeometryBindingsV594(gl: THREE.WebGLRenderer): void {
  const registered = rendererSharedGeometryBindings.get(gl);
  rendererSharedGeometryBindings.delete(gl);
  if (!registered) return;
  for (const geometry of registered) geometry.dispose();
}

/**
 * R3F 9.6 tears a root down through renderLists.dispose() and
 * forceContextLoss(), not WebGLRenderer.dispose(). Three r170 removes the
 * renderer-owned context listeners only from dispose(), so leaving that call
 * out retains the detached canvas and three listeners after every R3F root.
 * Bind both public teardown paths once and make the force-context path perform
 * the complete renderer disposal before losing the context.
 */
export function installOptionalTextureRendererTeardownV594(
  gl: THREE.WebGLRenderer,
): void {
  if (installedTextureRendererTeardown.has(gl)) return;
  installedTextureRendererTeardown.add(gl);
  const originalForceContextLoss = gl.forceContextLoss;
  const originalDispose = gl.dispose;
  let rendererInternalsDisposed = false;

  const disposeRendererInternals = () => {
    if (rendererInternalsDisposed) return;
    rendererInternalsDisposed = true;
    releaseSharedCelestialTextureRendererBindingsV594();
    releaseRendererSharedGeometryBindingsV594(gl);
    originalDispose.call(gl);
  };

  gl.forceContextLoss = function forceContextLossWithOptionalTextureReleaseV594() {
    disposeOptionalTextureRendererResourcesV594(gl);
    disposeRendererInternals();
    return originalForceContextLoss.call(gl);
  };
  gl.dispose = function disposeWithOptionalTextureReleaseV594() {
    disposeOptionalTextureRendererResourcesV594(gl);
    return disposeRendererInternals();
  };
}

function loadKtx2SourceMap(): Promise<Map<string, string>> {
  if (!KTX2_TRANSCODER_CSP_COMPATIBLE) return Promise.resolve(new Map());
  if (ktx2SourceMapPromise) return ktx2SourceMapPromise;
  ktx2SourceMapPromise = (async () => {
    for (const candidate of atlasAssetCandidates("/data/planet-textures-v2.json")) {
      try {
        const response = await fetch(candidate);
        if (!response.ok) continue;
        const manifest = (await response.json()) as PlanetTextureRuntimeManifest;
        return new Map(
          (manifest.assets ?? []).flatMap((asset) =>
            asset.source && asset.ktx2
              ? [[asset.source, asset.ktx2] as const]
              : [],
          ),
        );
      } catch {
        // Continue through local pack, configured remote pack and public fallback.
      }
    }
    return new Map<string, string>();
  })();
  return ktx2SourceMapPromise;
}

function waitForPostCanvasReadyKtx2Window(): Promise<void> {
  if (ktx2PostCanvasReadyPromise) return ktx2PostCanvasReadyPromise;
  ktx2PostCanvasReadyPromise = new Promise((resolve) => {
    let settled = false;
    let observer: MutationObserver | null = null;
    const finish = () => {
      if (settled) return;
      settled = true;
      observer?.disconnect();
      window.setTimeout(resolve, 750);
    };
    const programsReady = () => {
      const root = document.querySelector<HTMLElement>("[data-atlas-browser-acceptance-version]");
      if (Number(root?.getAttribute("data-atlas-render-programs") ?? "0") > 0) finish();
    };
    programsReady();
    if (settled) return;
    observer = new MutationObserver(programsReady);
    observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
    window.setTimeout(finish, 5_000);
  });
  return ktx2PostCanvasReadyPromise;
}

async function getKtx2Loader(gl: THREE.WebGLRenderer): Promise<KTX2Loader> {
  if (disposedTextureRenderers.has(gl)) {
    throw new Error("optional-texture-renderer-already-disposed-v594");
  }
  const cached = ktx2Loaders.get(gl);
  if (cached) return cached;
  await waitForPostCanvasReadyKtx2Window();
  if (disposedTextureRenderers.has(gl)) {
    throw new Error("optional-texture-renderer-already-disposed-v594");
  }
  const postReadyCached = ktx2Loaders.get(gl);
  if (postReadyCached) return postReadyCached;
  ktx2LoaderModulePromise ??= import("three/examples/jsm/loaders/KTX2Loader.js");
  const { KTX2Loader } = await ktx2LoaderModulePromise;
  if (disposedTextureRenderers.has(gl)) {
    throw new Error("optional-texture-renderer-already-disposed-v594");
  }
  const postImportCached = ktx2Loaders.get(gl);
  if (postImportCached) return postImportCached;
  const loader = new KTX2Loader()
    .setTranscoderPath(atlasContentPackAssetUrl("runtime-codecs", "basis/"))
    .setWorkerLimit(1)
    .detectSupport(gl);
  if (disposedTextureRenderers.has(gl)) {
    loader.dispose();
    throw new Error("optional-texture-renderer-already-disposed-v594");
  }
  ktx2Loaders.set(gl, loader);
  return loader;
}

function configureLoadedTexture(
  texture: THREE.Texture,
  colorSpace: THREE.ColorSpace,
  anisotropyMax: number,
) {
  texture.colorSpace = colorSpace;
  texture.generateMipmaps = !(texture instanceof THREE.CompressedTexture);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(16, Math.max(1, anisotropyMax));
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
}

function useTextureWithOfflineFallback(
  url: string | undefined,
  colorSpace: THREE.ColorSpace,
  anisotropyScale: number,
  resourceSceneModeOverride?: AtlasSceneModeV2,
): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }

    let alive = true;
    let fallbackStarted = false;
    const cache = textureCacheFor(gl);
    const resourceSceneMode = resourceSceneModeOverride
      ? resolveAtlasUnderlyingCanvasModeV595(resourceSceneModeOverride)
      : resolveAtlasUnderlyingCanvasModeV595(atlasRuntimeStore.getSnapshot().sceneMode);
    // Reconcile synchronously as well as through the renderer's store
    // subscription.  This closes the small window where a consumer effect is
    // committed immediately after a scene transition but before a queued
    // subscription callback has had a chance to run.
    reconcileOptionalTextureRendererSceneModeV595(
      gl,
      atlasRuntimeStore.getSnapshot().sceneMode,
    );
    const cacheKey = `${resourceSceneMode}|${colorSpace}|${anisotropyScale}|${url}`;
    const existing = cache.entries.get(cacheKey);
    if (existing) {
      existing.refs += 1;
      existing.lastUsedAt = performance.now();
      const listener = (next: THREE.Texture | null) => {
        if (alive) setTexture(next);
      };
      if (existing.texture) listener(existing.texture);
      else existing.listeners.add(listener);
      return () => {
        alive = false;
        existing.listeners.delete(listener);
        existing.refs = Math.max(0, existing.refs - 1);
        existing.lastUsedAt = performance.now();
        reconcileOptionalTextureRendererSceneModeV595(
          gl,
          atlasRuntimeStore.getSnapshot().sceneMode,
        );
        trimTextureCache(cache);
      };
    }

    trimTextureCache(cache);
    const entry: CachedTextureEntry = {
      resourceSceneMode,
      texture: null,
      pending: true,
      disposed: false,
      refs: 1,
      lastUsedAt: performance.now(),
      release: null,
      listeners: new Set(),
    };
    const listener = (next: THREE.Texture | null) => {
      if (alive) setTexture(next);
    };
    entry.listeners.add(listener);
    cache.entries.set(cacheKey, entry);
    const anisotropy = Math.max(
      1,
      Math.floor(gl.capabilities.getMaxAnisotropy() * anisotropyScale),
    );

    const accept = (candidate: THREE.Texture) => {
      const inactiveZeroRefEntry =
        entry.refs === 0
        && entry.resourceSceneMode !== cache.activeUnderlyingCanvasMode;
      if (cache.disposed || entry.disposed || entry.texture || inactiveZeroRefEntry) {
        if (inactiveZeroRefEntry && !entry.disposed) {
          disposeTextureEntryV594(entry);
          if (cache.entries.get(cacheKey) === entry) cache.entries.delete(cacheKey);
        }
        candidate.dispose();
        return;
      }
      entry.release = acquireAtlasResource(
        "texture",
        resourceSceneMode,
        url,
      );
      configureLoadedTexture(candidate, colorSpace, anisotropy);
      entry.texture = candidate;
      entry.pending = false;
      entry.lastUsedAt = performance.now();
      for (const notify of entry.listeners) notify(candidate);
      entry.listeners.clear();
      trimTextureCache(cache);
    };

    // Lite is a separately sealed static delivery tier.  It deliberately
    // carries only the admitted base raster assets, so it must use the same
    // explicit v49 fallback/omission table even when a development build has
    // CSP-compatible KTX2 support.  Otherwise the KTX2 miss falls through to
    // the logical v49 JPG URL and emits a real 404 for unsupported channels
    // (notably Saturn's roughness/ring maps).
    const deliveryProfile = getAtlasDeliveryProfile();
    const fallbackCandidates = !KTX2_TRANSCODER_CSP_COMPATIBLE
      || deliveryProfile === "vercel-lite"
      ? productionOptionalTextureFallbackCandidatesV594(url, deliveryProfile) ?? atlasAssetCandidates(url)
      : atlasAssetCandidates(url);
    const loadFallback = (candidateIndex = 0) => {
      if (cache.disposed || entry.disposed) {
        fallbackStarted = true;
        return;
      }
      if (fallbackStarted) return;
      const candidate = fallbackCandidates[candidateIndex];
      if (!candidate) {
        fallbackStarted = true;
        entry.pending = false;
        for (const notify of entry.listeners) notify(null);
        entry.listeners.clear();
        trimTextureCache(cache);
        return;
      }
      new THREE.TextureLoader().load(candidate, accept, undefined, () => {
        loadFallback(candidateIndex + 1);
      });
    };

    const loadKtx2Candidate = (candidates: readonly string[], candidateIndex = 0) => {
      if (cache.disposed || entry.disposed) return;
      const candidate = candidates[candidateIndex];
      if (!candidate) {
        loadFallback();
        return;
      }
      void getKtx2Loader(gl).then((loader) => {
        // Renderer teardown or scene-exit may happen while the loader module
        // is resolving.  Never start a late request for an entry that has
        // already been closed; its eventual candidate must not resurrect the
        // resource registry lease.
        if (cache.disposed || entry.disposed) return;
        loader.load(
          candidate,
          accept,
          undefined,
          () => loadKtx2Candidate(candidates, candidateIndex + 1),
        );
      }).catch(() => loadKtx2Candidate(candidates, candidateIndex + 1));
    };

    void loadKtx2SourceMap().then((sourceMap) => {
      if (cache.disposed || entry.disposed) return;
      const ktx2Url = sourceMap.get(url);
      if (!ktx2Url) {
        loadFallback();
        return;
      }
      loadKtx2Candidate(atlasAssetCandidates(ktx2Url));
    });

    return () => {
      alive = false;
      entry.listeners.delete(listener);
      entry.refs = Math.max(0, entry.refs - 1);
      entry.lastUsedAt = performance.now();
      reconcileOptionalTextureRendererSceneModeV595(
        gl,
        atlasRuntimeStore.getSnapshot().sceneMode,
      );
      trimTextureCache(cache);
    };
  }, [anisotropyScale, colorSpace, gl, resourceSceneModeOverride, url]);

  return texture;
}

export function useOptionalTexture(
  url: string | undefined,
  resourceSceneMode?: AtlasSceneModeV2,
): THREE.Texture | null {
  return useTextureWithOfflineFallback(url, THREE.SRGBColorSpace, 1, resourceSceneMode);
}

export function useOptionalDataTexture(
  url: string | undefined,
  resourceSceneMode?: AtlasSceneModeV2,
): THREE.Texture | null {
  return useTextureWithOfflineFallback(
    url,
    THREE.LinearSRGBColorSpace,
    0.5,
    resourceSceneMode,
  );
}
