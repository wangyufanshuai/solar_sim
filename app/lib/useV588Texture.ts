"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import * as THREE from "three";
import type { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { acquireAtlasTextureResourceV289 } from "./atlasResourceLifecycle";
import { sha256BytesHexV566, sha256Utf8HexV566 } from "./sha256BrowserV566";
import {
  VISUAL_RESTORATION_MANIFEST_SHA256_V588,
  VISUAL_RESTORATION_MANIFEST_URL_V588,
  type VisualRestorationVariantV588,
} from "./visualRestorationV588";

type CandidateFileV588 = Readonly<{
  url: string;
  bytes: number;
  sha256: string;
  dimensions: Readonly<{ width: number; height: number }>;
  format: string;
  compression: string;
}>;

type CandidateAssetV588 = Readonly<{
  id: string;
  body: string;
  role: string;
  colorSpace: "srgb" | "linear" | "srgb-assumed-untagged";
  presentationOnly: true;
  primary: CandidateFileV588;
  fallback: Partial<Record<VisualRestorationVariantV588, CandidateFileV588>>;
}>;

type CandidateManifestV588 = Readonly<{
  version: "v588-visual-restoration-candidate-v1";
  authorityNamespace: "candidate-v588";
  manifestSha256: string;
  assets: readonly CandidateAssetV588[];
  admission: Readonly<{ heroProceduralFallbackAllowed: false; ktx2Primary: true; verifiedFallbackRequired: true }>;
  boundary: Readonly<{ formalProductPointer: "v263"; singleCanvasRequired: true; v587ScientificPayloadWriteback: false }>;
}>;

export type V588TextureLoadPolicy = "ktx2-first" | "verified-fallback-only";
export type V588TextureLoadState = Readonly<{
  texture: THREE.Texture | null;
  status: "idle" | "loading" | "ready" | "blocked";
  source: "none" | "ktx2" | "fallback";
  reason: string;
}>;

const IDLE_STATE: V588TextureLoadState = Object.freeze({
  texture: null,
  status: "idle",
  source: "none",
  reason: "none",
});

const loaderCache = new WeakMap<THREE.WebGLRenderer, KTX2Loader>();
const loaderPromiseCache = new WeakMap<THREE.WebGLRenderer, Promise<KTX2Loader>>();
const loaderGeneration = new WeakMap<THREE.WebGLRenderer, number>();
let loaderModulePromise: Promise<typeof import("three/examples/jsm/loaders/KTX2Loader.js")> | null = null;
let manifestPromise: Promise<CandidateManifestV588> | null = null;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(source)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => [key, canonicalize(source[key])]),
  );
}

function parseManifest(value: unknown): CandidateManifestV588 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v588-manifest-object");
  const source = value as Record<string, unknown>;
  if (
    source.version !== "v588-visual-restoration-candidate-v1"
    || source.authorityNamespace !== "candidate-v588"
    || source.manifestSha256 !== VISUAL_RESTORATION_MANIFEST_SHA256_V588
    || !Array.isArray(source.assets)
  ) throw new Error("v588-manifest-identity");
  const unsigned = { ...source };
  delete unsigned.manifestSha256;
  const observed = sha256Utf8HexV566(JSON.stringify(canonicalize(unsigned)));
  if (observed !== source.manifestSha256) throw new Error("v588-manifest-sha");
  const manifest = source as unknown as CandidateManifestV588;
  if (
    manifest.assets.length !== 18
    || manifest.admission.heroProceduralFallbackAllowed !== false
    || manifest.admission.ktx2Primary !== true
    || manifest.admission.verifiedFallbackRequired !== true
    || manifest.boundary.formalProductPointer !== "v263"
    || manifest.boundary.singleCanvasRequired !== true
    || manifest.boundary.v587ScientificPayloadWriteback !== false
  ) throw new Error("v588-manifest-boundary");
  for (const asset of manifest.assets) {
    if (
      !asset.id
      || asset.presentationOnly !== true
      || !asset.primary.url.startsWith("/textures/candidate-v588/")
      || !/^[a-f0-9]{64}$/.test(asset.primary.sha256)
      || asset.primary.bytes <= 0
    ) throw new Error(`v588-manifest-asset:${asset.id || "unknown"}`);
  }
  return manifest;
}

async function loadManifest(): Promise<CandidateManifestV588> {
  manifestPromise ??= fetch(
    `${VISUAL_RESTORATION_MANIFEST_URL_V588}?sha256=${VISUAL_RESTORATION_MANIFEST_SHA256_V588}`,
    { cache: "force-cache" },
  ).then(async (response) => {
    if (!response.ok) throw new Error(`v588-manifest-fetch:${response.status}`);
    return parseManifest(await response.json());
  }).catch((error) => {
    manifestPromise = null;
    throw error;
  });
  return manifestPromise;
}

async function getKtx2Loader(gl: THREE.WebGLRenderer): Promise<KTX2Loader> {
  const cached = loaderCache.get(gl);
  if (cached) return cached;
  const pending = loaderPromiseCache.get(gl);
  if (pending) return pending;
  const generation = loaderGeneration.get(gl) ?? 0;
  const created = (async () => {
    loaderModulePromise ??= import("three/examples/jsm/loaders/KTX2Loader.js");
    const { KTX2Loader } = await loaderModulePromise;
    const loader = new KTX2Loader()
      .setTranscoderPath("/basis/")
      .setWorkerLimit(1)
      .detectSupport(gl);
    if ((loaderGeneration.get(gl) ?? 0) !== generation) {
      loader.dispose();
      throw new Error("v588-ktx2-loader-released");
    }
    loaderCache.set(gl, loader);
    return loader;
  })();
  loaderPromiseCache.set(gl, created);
  return created;
}

/** Release the candidate-only Basis worker pool when the v588 scene exits. */
export function disposeV588TextureLoader(gl: THREE.WebGLRenderer): void {
  loaderGeneration.set(gl, (loaderGeneration.get(gl) ?? 0) + 1);
  loaderCache.get(gl)?.dispose();
  loaderCache.delete(gl);
  loaderPromiseCache.delete(gl);
}

function parseKtx2(loader: KTX2Loader, bytes: ArrayBuffer): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => loader.parse(bytes, resolve, reject));
}

function loadFallbackTexture(bytes: ArrayBuffer, format: string): Promise<THREE.Texture> {
  const mime = format === "webp" ? "image/webp" : "image/jpeg";
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (texture) => {
        URL.revokeObjectURL(url);
        resolve(texture);
      },
      undefined,
      (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      },
    );
  });
}

async function fetchVerified(file: CandidateFileV588): Promise<ArrayBuffer> {
  const response = await fetch(`${file.url}?sha256=${file.sha256}`, { cache: "force-cache" });
  if (!response.ok) throw new Error(`v588-asset-fetch:${response.status}:${file.url}`);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== file.bytes) throw new Error(`v588-asset-bytes:${file.url}`);
  if (sha256BytesHexV566(new Uint8Array(bytes)) !== file.sha256) throw new Error(`v588-asset-sha:${file.url}`);
  return bytes;
}

function configureTexture(
  texture: THREE.Texture,
  gl: THREE.WebGLRenderer,
  asset: CandidateAssetV588,
  file: CandidateFileV588,
  source: "ktx2" | "fallback",
) {
  texture.colorSpace = asset.colorSpace === "linear" ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = !(texture instanceof THREE.CompressedTexture);
  texture.anisotropy = Math.min(12, Math.max(1, gl.capabilities.getMaxAnisotropy()));
  texture.userData = {
    ...texture.userData,
    atlasCandidate: "v588",
    atlasVisualAssetId: asset.id,
    atlasVisualAssetSource: source,
    atlasVisualAssetSha256: file.sha256,
    atlasVisualAssetManifestSha256: VISUAL_RESTORATION_MANIFEST_SHA256_V588,
    atlasPresentationOnly: true,
    atlasScientificPayloadMutation: false,
    atlasProceduralFallback: false,
  };
  texture.needsUpdate = true;
}

export function useV588Texture(
  assetId: string,
  variant: VisualRestorationVariantV588,
  policy: V588TextureLoadPolicy,
  enabled = true,
): V588TextureLoadState {
  const gl = useThree((state) => state.gl);
  const [state, setState] = useState<V588TextureLoadState>(IDLE_STATE);

  useEffect(() => {
    let alive = true;
    let loaded: THREE.Texture | null = null;
    let release: (() => void) | null = null;
    if (!enabled) {
      setState(IDLE_STATE);
      return () => undefined;
    }
    setState({ texture: null, status: "loading", source: "none", reason: "none" });
    const finish = (
      candidate: THREE.Texture,
      asset: CandidateAssetV588,
      file: CandidateFileV588,
      source: "ktx2" | "fallback",
    ) => {
      configureTexture(candidate, gl, asset, file, source);
      if (!alive) {
        candidate.dispose();
        return;
      }
      loaded = candidate;
      release = acquireAtlasTextureResourceV289(
        candidate,
        "atlas",
        `v588-${assetId}-${variant}`,
        "v588-visual-restoration",
      );
      setState({ texture: candidate, status: "ready", source, reason: "none" });
    };
    const run = async () => {
      const manifest = await loadManifest();
      const asset = manifest.assets.find((entry) => entry.id === assetId);
      if (!asset) throw new Error(`v588-asset-id:${assetId}`);
      const fallback = asset.fallback[variant]
        ?? asset.fallback.desktop
        ?? asset.fallback.mobile;
      if (!fallback) throw new Error(`v588-fallback-missing:${assetId}:${variant}`);
      if (policy === "ktx2-first") {
        try {
          const bytes = await fetchVerified(asset.primary);
          const texture = await parseKtx2(await getKtx2Loader(gl), bytes);
          finish(texture, asset, asset.primary, "ktx2");
          return;
        } catch {
          // Production CSP/browser support may reject Basis transcoding. The
          // verified fallback is an admitted asset, never a procedural map.
        }
      }
      const bytes = await fetchVerified(fallback);
      const texture = await loadFallbackTexture(bytes, fallback.format);
      finish(texture, asset, fallback, "fallback");
    };
    void run().catch((error: unknown) => {
      if (!alive) return;
      setState({
        texture: null,
        status: "blocked",
        source: "none",
        reason: error instanceof Error ? error.message : "v588-asset-unknown",
      });
    });
    return () => {
      alive = false;
      release?.();
      loaded?.dispose();
      loaded = null;
    };
  }, [assetId, enabled, gl, policy, variant]);

  return state;
}
