import { useThree } from "@react-three/fiber";
import type { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import * as THREE from "three";
import { useEffect, useState } from "react";
import {
  atlasAssetCandidates,
  atlasContentPackAssetUrl,
} from "./atlasAssetResolver";
import { acquireAtlasResource } from "./atlasResourceLifecycle";
import { atlasRuntimeStore } from "./atlasRuntimeStore";

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
  texture: THREE.Texture | null;
  pending: boolean;
  refs: number;
  lastUsedAt: number;
  release: (() => void) | null;
  listeners: Set<(texture: THREE.Texture | null) => void>;
};
const textureCaches = new WeakMap<THREE.WebGLRenderer, Map<string, CachedTextureEntry>>();
const MAX_RETAINED_TEXTURES_PER_RENDERER = 48;
// Three r170's Basis transcoder is an Emscripten embind build that creates
// functions dynamically. Production CSP intentionally omits `unsafe-eval`, so
// production uses the byte-source JPG/PNG fallback instead of first raising a
// page error and only then falling back. Development retains the compressed
// texture path for asset-pipeline inspection.
const KTX2_TRANSCODER_CSP_COMPATIBLE = process.env.NODE_ENV !== "production";

function textureCacheFor(gl: THREE.WebGLRenderer) {
  const existing = textureCaches.get(gl);
  if (existing) return existing;
  const created = new Map<string, CachedTextureEntry>();
  textureCaches.set(gl, created);
  return created;
}

function trimTextureCache(cache: Map<string, CachedTextureEntry>) {
  if (cache.size < MAX_RETAINED_TEXTURES_PER_RENDERER) return;
  const idle = [...cache.entries()]
    .filter(([, entry]) => entry.refs === 0 && !entry.pending)
    .sort((left, right) => left[1].lastUsedAt - right[1].lastUsedAt);
  while (cache.size >= MAX_RETAINED_TEXTURES_PER_RENDERER && idle.length > 0) {
    const [key, entry] = idle.shift()!;
    entry.texture?.dispose();
    entry.release?.();
    cache.delete(key);
  }
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
  const cached = ktx2Loaders.get(gl);
  if (cached) return cached;
  await waitForPostCanvasReadyKtx2Window();
  const postReadyCached = ktx2Loaders.get(gl);
  if (postReadyCached) return postReadyCached;
  ktx2LoaderModulePromise ??= import("three/examples/jsm/loaders/KTX2Loader.js");
  const { KTX2Loader } = await ktx2LoaderModulePromise;
  const postImportCached = ktx2Loaders.get(gl);
  if (postImportCached) return postImportCached;
  const loader = new KTX2Loader()
    .setTranscoderPath(atlasContentPackAssetUrl("runtime-codecs", "basis/"))
    .setWorkerLimit(1)
    .detectSupport(gl);
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
    const cacheKey = `${colorSpace}|${anisotropyScale}|${url}`;
    const existing = cache.get(cacheKey);
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
        trimTextureCache(cache);
      };
    }

    trimTextureCache(cache);
    const entry: CachedTextureEntry = {
      texture: null,
      pending: true,
      refs: 1,
      lastUsedAt: performance.now(),
      release: null,
      listeners: new Set(),
    };
    const listener = (next: THREE.Texture | null) => {
      if (alive) setTexture(next);
    };
    entry.listeners.add(listener);
    cache.set(cacheKey, entry);
    const anisotropy = Math.max(
      1,
      Math.floor(gl.capabilities.getMaxAnisotropy() * anisotropyScale),
    );

    const accept = (candidate: THREE.Texture) => {
      if (entry.texture) {
        candidate.dispose();
        return;
      }
      entry.release = acquireAtlasResource(
        "texture",
        atlasRuntimeStore.getSnapshot().sceneMode,
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

    const fallbackCandidates = atlasAssetCandidates(url);
    const loadFallback = (candidateIndex = 0) => {
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
      const candidate = candidates[candidateIndex];
      if (!candidate) {
        loadFallback();
        return;
      }
      void getKtx2Loader(gl).then((loader) => {
        loader.load(
          candidate,
          accept,
          undefined,
          () => loadKtx2Candidate(candidates, candidateIndex + 1),
        );
      }).catch(() => loadKtx2Candidate(candidates, candidateIndex + 1));
    };

    void loadKtx2SourceMap().then((sourceMap) => {
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
      trimTextureCache(cache);
    };
  }, [anisotropyScale, colorSpace, gl, url]);

  return texture;
}

export function useOptionalTexture(url: string | undefined): THREE.Texture | null {
  return useTextureWithOfflineFallback(url, THREE.SRGBColorSpace, 1);
}

export function useOptionalDataTexture(
  url: string | undefined,
): THREE.Texture | null {
  return useTextureWithOfflineFallback(url, THREE.LinearSRGBColorSpace, 0.5);
}
