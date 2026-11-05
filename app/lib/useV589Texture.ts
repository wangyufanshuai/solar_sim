"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import * as THREE from "three";
import type { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { acquireAtlasTextureResourceV289 } from "./atlasResourceLifecycle";
import {
  CELESTIAL_ART_MANIFEST_SHA256_V589,
  CELESTIAL_ART_MANIFEST_URL_V589,
  CELESTIAL_ART_NAMESPACE_V589,
  type CelestialDeliveryTierV589,
  type CelestialDeviceTierV589,
  type VisualAssetFileV589,
  type VisualAssetManifestEntryV589,
  type VisualAssetManifestV589,
} from "./celestialArtV589";
import { sha256BytesHexV566, sha256Utf8HexV566 } from "./sha256BrowserV566";

export type V589TextureLoadState = Readonly<{
  texture: THREE.Texture | null;
  status: "idle" | "loading" | "ready" | "blocked";
  source: "none" | "ktx2" | "fallback";
  assetId: string;
  sha256: string;
  reason: string;
}>;

const IDLE: V589TextureLoadState = Object.freeze({
  texture: null,
  status: "idle",
  source: "none",
  assetId: "none",
  sha256: "none",
  reason: "none",
});

let manifestPromise: Promise<VisualAssetManifestV589> | null = null;
let loaderModulePromise: Promise<typeof import("three/examples/jsm/loaders/KTX2Loader.js")> | null = null;
const loaderCache = new WeakMap<THREE.WebGLRenderer, KTX2Loader>();
const loaderPending = new WeakMap<THREE.WebGLRenderer, Promise<KTX2Loader>>();
const loaderGeneration = new WeakMap<THREE.WebGLRenderer, number>();
const loaderFailure = new WeakMap<THREE.WebGLRenderer, string>();

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(source).sort().map((key) => [key, canonicalize(source[key])]));
}

function parseManifest(value: unknown): VisualAssetManifestV589 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v589-manifest-object");
  const root = value as Record<string, unknown>;
  if (
    root.version !== "v589-celestial-art-candidate-v1"
    || root.authorityNamespace !== CELESTIAL_ART_NAMESPACE_V589
    || root.manifestSha256 !== CELESTIAL_ART_MANIFEST_SHA256_V589
    || !Array.isArray(root.assets)
  ) throw new Error("v589-manifest-identity");
  const unsigned = { ...root };
  delete unsigned.manifestSha256;
  if (sha256Utf8HexV566(JSON.stringify(canonicalize(unsigned))) !== root.manifestSha256) {
    throw new Error("v589-manifest-sha");
  }
  const manifest = root as unknown as VisualAssetManifestV589;
  if (
    manifest.boundaries.formalProductPointer !== "v263"
    || manifest.boundaries.v588Rewritten !== false
    || manifest.boundaries.historicalEvidenceRewritten !== false
    || manifest.boundaries.scientificPayloadWriteback !== false
    || manifest.boundaries.singleCanvasRequired !== true
    || manifest.boundaries.productionPromotionAllowed !== false
  ) throw new Error("v589-manifest-boundary");
  return manifest;
}

export async function loadVisualAssetManifestV589(): Promise<VisualAssetManifestV589> {
  manifestPromise ??= fetch(
    `${CELESTIAL_ART_MANIFEST_URL_V589}?sha256=${CELESTIAL_ART_MANIFEST_SHA256_V589}`,
    { cache: "force-cache" },
  ).then(async (response) => {
    if (!response.ok) throw new Error(`v589-manifest-fetch:${response.status}`);
    return parseManifest(await response.json());
  }).catch((error) => {
    manifestPromise = null;
    throw error;
  });
  return manifestPromise;
}

export async function loadVerifiedVisualAssetBytesV589(file: VisualAssetFileV589): Promise<ArrayBuffer> {
  const response = await fetch(`${file.url}?sha256=${file.sha256}`, { cache: "force-cache" });
  if (!response.ok) throw new Error(`v589-asset-fetch:${response.status}:${file.url}`);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== file.bytes) throw new Error(`v589-asset-bytes:${file.url}`);
  if (sha256BytesHexV566(new Uint8Array(bytes)) !== file.sha256) throw new Error(`v589-asset-sha:${file.url}`);
  return bytes;
}

async function ktxLoader(gl: THREE.WebGLRenderer): Promise<KTX2Loader> {
  const cached = loaderCache.get(gl);
  if (cached) return cached;
  const pending = loaderPending.get(gl);
  if (pending) return pending;
  const generation = loaderGeneration.get(gl) ?? 0;
  const created = (async () => {
    loaderModulePromise ??= import("three/examples/jsm/loaders/KTX2Loader.js");
    const { KTX2Loader } = await loaderModulePromise;
    const loader = new KTX2Loader().setTranscoderPath("/basis/").setWorkerLimit(1).detectSupport(gl);
    if ((loaderGeneration.get(gl) ?? 0) !== generation) {
      loader.dispose();
      throw new Error("v589-ktx2-loader-released");
    }
    loaderCache.set(gl, loader);
    return loader;
  })();
  loaderPending.set(gl, created);
  return created;
}

export function disposeV589TextureLoader(gl: THREE.WebGLRenderer): void {
  loaderGeneration.set(gl, (loaderGeneration.get(gl) ?? 0) + 1);
  loaderCache.get(gl)?.dispose();
  loaderCache.delete(gl);
  loaderPending.delete(gl);
}

// The first decode also boots the Basis worker and WebAssembly module. On a
// cold standalone run that routinely takes longer than 2.5 s even though the
// asset and transcoder are valid. Keep the operation bounded, but allow one
// cold-start window before using the manifest-bound verified WebP fallback.
function parseKtx2(loader: KTX2Loader, bytes: ArrayBuffer, timeoutMs = 8000): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      settled = true;
      reject(new Error("v589-ktx2-parse-timeout"));
    }, timeoutMs);
    loader.parse(bytes, (texture) => {
      if (settled) {
        texture.dispose();
        return;
      }
      settled = true;
      window.clearTimeout(timer);
      resolve(texture);
    }, (error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      reject(error);
    });
  });
}

function parseImage(bytes: ArrayBuffer, format: VisualAssetFileV589["format"]): Promise<THREE.Texture> {
  const mime = format === "webp" ? "image/webp" : "image/jpeg";
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(url, (texture) => {
      URL.revokeObjectURL(url);
      resolve(texture);
    }, undefined, (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    });
  });
}

function configure(
  texture: THREE.Texture,
  gl: THREE.WebGLRenderer,
  asset: VisualAssetManifestEntryV589,
  file: VisualAssetFileV589,
  source: "ktx2" | "fallback",
): void {
  texture.colorSpace = file.colorSpace === "srgb" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = !(texture instanceof THREE.CompressedTexture);
  texture.anisotropy = Math.min(12, Math.max(1, gl.capabilities.getMaxAnisotropy()));
  texture.userData = {
    ...texture.userData,
    atlasCandidate: "v589",
    atlasCandidateNamespace: CELESTIAL_ART_NAMESPACE_V589,
    atlasVisualAssetId: asset.id,
    atlasVisualAssetSource: source,
    atlasVisualAssetSha256: file.sha256,
    atlasVisualAssetManifestSha256: CELESTIAL_ART_MANIFEST_SHA256_V589,
    atlasPresentationOnly: true,
    atlasScientificPayloadMutation: false,
    atlasProceduralFallback: false,
  };
  texture.needsUpdate = true;
}

function disposeTextureAfterDetachV589(texture: THREE.Texture): void {
  texture.dispose();
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => texture.dispose());
  });
}

function filesFor(
  asset: VisualAssetManifestEntryV589,
  deliveryTier: CelestialDeliveryTierV589,
  deviceTier: CelestialDeviceTierV589,
): { primary: VisualAssetFileV589 | null; fallback: VisualAssetFileV589 | null } {
  const primary = deliveryTier === "vercel-lite"
    ? null
    : asset.variants.fullDesktop?.format === "ktx2"
      ? asset.variants.fullDesktop
      : null;
  const fallback = deviceTier === "mobile"
    ? asset.variants.liteMobile ?? asset.variants.liteDesktop ?? asset.variants.fullMobile ?? null
    : asset.variants.liteDesktop ?? asset.variants.fullMobile ?? asset.variants.liteMobile ?? null;
  if (deliveryTier === "vercel-lite") return { primary, fallback };
  return { primary, fallback: fallback ?? asset.variants.fullMobile ?? null };
}

export function useV589Texture(
  assetId: string,
  deliveryTier: CelestialDeliveryTierV589,
  deviceTier: CelestialDeviceTierV589,
  enabled = true,
): V589TextureLoadState {
  const gl = useThree((state) => state.gl);
  const [state, setState] = useState<V589TextureLoadState>(IDLE);

  useEffect(() => {
    let alive = true;
    let texture: THREE.Texture | null = null;
    let release: (() => void) | null = null;
    if (!enabled) {
      setState(IDLE);
      return () => undefined;
    }
    setState({ ...IDLE, status: "loading", assetId });
    const accept = (
      candidate: THREE.Texture,
      asset: VisualAssetManifestEntryV589,
      file: VisualAssetFileV589,
      source: "ktx2" | "fallback",
      reason = "none",
    ) => {
      configure(candidate, gl, asset, file, source);
      if (!alive) {
        candidate.dispose();
        return;
      }
      texture = candidate;
      release = acquireAtlasTextureResourceV289(candidate, "atlas", `v589-${assetId}-${deviceTier}`, "v589-celestial-art");
      setState({ texture: candidate, status: "ready", source, assetId, sha256: file.sha256, reason });
    };
    const run = async () => {
      const manifest = await loadVisualAssetManifestV589();
      const asset = manifest.assets.find((entry) => entry.id === assetId);
      if (!asset) throw new Error(`v589-asset-id:${assetId}`);
      const files = filesFor(asset, deliveryTier, deviceTier);
      let primaryFailure = files.primary ? loaderFailure.get(gl) ?? "none" : "none";
      if (files.primary && primaryFailure === "none") {
        try {
          const bytes = await loadVerifiedVisualAssetBytesV589(files.primary);
          accept(await parseKtx2(await ktxLoader(gl), bytes), asset, files.primary, "ktx2");
          return;
        } catch (error: unknown) {
          primaryFailure = error instanceof Error ? error.message : "v589-ktx2-unknown";
          loaderFailure.set(gl, primaryFailure);
          // The only permitted recovery is the same manifest's verified WebP.
        }
      }
      if (!files.fallback || !["webp", "jpeg"].includes(files.fallback.format)) {
        throw new Error(`v589-verified-fallback-missing:${assetId}`);
      }
      const bytes = await loadVerifiedVisualAssetBytesV589(files.fallback);
      accept(
        await parseImage(bytes, files.fallback.format),
        asset,
        files.fallback,
        "fallback",
        primaryFailure === "none" ? "none" : `ktx2-fallback:${primaryFailure}`,
      );
    };
    void run().catch((error: unknown) => {
      if (!alive) return;
      setState({
        texture: null,
        status: "blocked",
        source: "none",
        assetId,
        sha256: "none",
        reason: error instanceof Error ? error.message : "v589-asset-unknown",
      });
    });
    return () => {
      alive = false;
      release?.();
      if (texture) disposeTextureAfterDetachV589(texture);
      texture = null;
    };
  }, [assetId, deliveryTier, deviceTier, enabled, gl]);

  return state;
}
