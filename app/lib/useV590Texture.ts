"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { acquireAtlasResource, estimateAtlasTextureBytesV289 } from "./atlasResourceLifecycle";
import {
  CELESTIAL_RENDERING_MANIFEST_SHA256_V590,
  CELESTIAL_RENDERING_MANIFEST_URL_V590,
  CELESTIAL_RENDERING_NAMESPACE_V590,
  CELESTIAL_RENDERING_SCIENTIFIC_PAYLOAD_SHA256_V590,
  computeHeroAdmissionsV590,
  visualAssetMeetsFullQualityV590,
  type CelestialDeliveryTierV590,
  type CelestialDeviceTierV590,
  type VisualAssetFileV590,
  type VisualAssetManifestEntryV590,
  type VisualAssetManifestV590,
} from "./celestialRenderingV590";
import { sha256BytesHexV566, sha256Utf8HexV566 } from "./sha256BrowserV566";

export type V590TextureLoadState = Readonly<{
  texture: THREE.Texture | null;
  status: "idle" | "loading" | "ready" | "blocked";
  source: "none" | "ktx2" | "full-raster" | "fallback";
  assetId: string;
  sha256: string;
  reason: string;
  prewarmStatus: "idle" | "warming" | "ready" | "failed" | "disposed";
  fullQualityGate: "not-applicable" | "passed" | "blocked-full-fallback" | "blocked-full-dimensions";
}>;

export type V590Ktx2PrewarmReceipt = Readonly<{
  status: "ready" | "failed" | "disposed";
  sentinelAssetId: string;
  elapsedMs: number;
  reason: string;
}>;

type LoaderRuntimeV590 = {
  loader: KTX2Loader | null;
  loaderPromise: Promise<KTX2Loader> | null;
  prewarmPromise: Promise<V590Ktx2PrewarmReceipt> | null;
  prewarmStatus: V590TextureLoadState["prewarmStatus"];
  generation: number;
  assetFailures: Map<string, string>;
};

const IDLE_V590: V590TextureLoadState = Object.freeze({
  texture: null,
  status: "idle",
  source: "none",
  assetId: "none",
  sha256: "none",
  reason: "none",
  prewarmStatus: "idle",
  fullQualityGate: "not-applicable",
});

let manifestPromiseV590: Promise<VisualAssetManifestV590> | null = null;
let loaderModulePromiseV590: Promise<typeof import("three/examples/jsm/loaders/KTX2Loader.js")> | null = null;
const loaderRuntimeByRendererV590 = new WeakMap<THREE.WebGLRenderer, LoaderRuntimeV590>();
const trackedTextureResourcesV590 = new WeakMap<THREE.Texture, { references: number; releaseRegistry: () => void }>();

export function estimateV590TextureGpuBytes(texture: THREE.Texture): number {
  if (texture instanceof THREE.CompressedTexture) {
    const compressedBytes = (texture.mipmaps ?? []).reduce((total, mipmap) => {
      const data = mipmap?.data;
      return total + (ArrayBuffer.isView(data) ? data.byteLength : 0);
    }, 0);
    if (compressedBytes > 0) return compressedBytes;
  }
  return estimateAtlasTextureBytesV289(texture).estimatedBytes;
}

function acquireV590TextureResource(texture: THREE.Texture, label: string, owner: string): () => void {
  const shared = trackedTextureResourcesV590.get(texture);
  if (shared) {
    shared.references += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      shared.references -= 1;
      if (shared.references > 0) return;
      trackedTextureResourcesV590.delete(texture);
      shared.releaseRegistry();
    };
  }
  const releaseRegistry = acquireAtlasResource("texture", "atlas", label, {
    owner,
    estimatedBytes: estimateV590TextureGpuBytes(texture),
    contentSha256: texture.userData.atlasVisualAssetSha256,
    manifestSha256: texture.userData.atlasVisualAssetManifestSha256,
  });
  const entry = { references: 1, releaseRegistry };
  trackedTextureResourcesV590.set(texture, entry);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    entry.references -= 1;
    if (entry.references > 0) return;
    trackedTextureResourcesV590.delete(texture);
    releaseRegistry();
  };
}

function runtimeForV590(gl: THREE.WebGLRenderer): LoaderRuntimeV590 {
  const current = loaderRuntimeByRendererV590.get(gl);
  if (current) return current;
  const created: LoaderRuntimeV590 = {
    loader: null,
    loaderPromise: null,
    prewarmPromise: null,
    prewarmStatus: "idle",
    generation: 0,
    assetFailures: new Map(),
  };
  loaderRuntimeByRendererV590.set(gl, created);
  return created;
}

function canonicalizeV590(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeV590);
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(source).sort().map((key) => [key, canonicalizeV590(source[key])]));
}

const SHA256_PATTERN_V590 = /^[a-f0-9]{64}$/;
const RASTER_FORMATS_V590 = new Set(["webp", "jpeg", "png"]);
const ALLOWED_LICENSES_V590 = new Set(["NASA-public-domain", "USGS-public-domain", "PDS-public-domain", "Poly-Haven-CC0", "Gaia-existing-admission"]);
const LOCAL_SOURCE_SCHEMES_V590 = new Map([
  ["local-admitted-v588:", "local-admitted-v588"],
  ["local-admitted-v9:", "local-admitted-v9"],
  ["local-existing-gaia:", "local-existing-gaia"],
]);

function isAllowedPublicHostV590(host: string): boolean {
  const normalized = host.toLowerCase();
  return ["nasa.gov", "gsfc.nasa.gov", "jpl.nasa.gov", "usgs.gov", "polyhaven.org"]
    .some((suffix) => normalized === suffix || normalized.endsWith(`.${suffix}`));
}

function validatePublicVariantUrlV590(asset: VisualAssetManifestEntryV590, file: VisualAssetFileV590): void {
  if (!file.url.startsWith("/") || file.url.startsWith("//") || file.url.includes("\\")) {
    throw new Error(`v590-manifest-variant-url:${asset.id}`);
  }
  let decoded: string;
  try {
    decoded = decodeURIComponent(file.url.split("?")[0]);
  } catch {
    throw new Error(`v590-manifest-variant-url-encoding:${asset.id}`);
  }
  if (decoded.split("/").includes("..")) throw new Error(`v590-manifest-variant-traversal:${asset.id}`);
  if (file.inheritedFrom) {
    const expectedNamespace = file.inheritedFrom === "v588"
      ? "candidate-v588"
      : file.inheritedFrom === "v589"
        ? "candidate-v589"
        : file.inheritedFrom === "v590"
          ? "candidate-v590"
          : "v9";
    if (file.inheritedFrom === "v589") {
      if (!file.url.includes(expectedNamespace) && !file.url.includes("celestial-art-v589")) {
        throw new Error(`v590-manifest-inherited-url:${asset.id}`);
      }
    } else if (!file.url.toLowerCase().includes(expectedNamespace)) {
      throw new Error(`v590-manifest-inherited-url:${asset.id}`);
    }
  }
}

export function validateVisualAssetProvenanceV590(asset: VisualAssetManifestEntryV590): void {
  if (!ALLOWED_LICENSES_V590.has(asset.license.id)) throw new Error(`v590-manifest-license-id:${asset.id}`);
  let source: URL;
  let license: URL;
  try {
    source = new URL(asset.sourceUrl);
    license = new URL(asset.license.url);
  } catch {
    throw new Error(`v590-manifest-source-url:${asset.id}`);
  }
  const localHost = LOCAL_SOURCE_SCHEMES_V590.get(source.protocol);
  if (localHost) {
    if (asset.sourceHost !== localHost || !Object.values(asset.variants).every((file) => !file || file.inheritedFrom)) {
      throw new Error(`v590-manifest-local-source:${asset.id}`);
    }
    if (source.protocol === "local-existing-gaia:" && asset.license.id !== "Gaia-existing-admission") {
      throw new Error(`v590-manifest-gaia-license:${asset.id}`);
    }
  } else if (source.protocol !== "https:" || source.hostname !== asset.sourceHost || !isAllowedPublicHostV590(source.hostname)) {
    throw new Error(`v590-manifest-source-host:${asset.id}`);
  }
  if (license.protocol !== "https:") throw new Error(`v590-manifest-license-scheme:${asset.id}`);
  if (asset.license.id === "Poly-Haven-CC0" && !(license.hostname === "polyhaven.com" || license.hostname.endsWith(".polyhaven.com"))) {
    throw new Error(`v590-manifest-license-host:${asset.id}`);
  }
  if (asset.license.id === "Gaia-existing-admission" && license.hostname !== "www.cosmos.esa.int") {
    throw new Error(`v590-manifest-license-host:${asset.id}`);
  }
  if (!["Poly-Haven-CC0", "Gaia-existing-admission"].includes(asset.license.id) && !isAllowedPublicHostV590(license.hostname)) {
    throw new Error(`v590-manifest-license-host:${asset.id}`);
  }
  if (asset.sourceBytes <= 0 || !SHA256_PATTERN_V590.test(asset.sourceSha256)) {
    throw new Error(`v590-manifest-source-identity:${asset.id}`);
  }
  for (const file of Object.values(asset.variants)) if (file) validatePublicVariantUrlV590(asset, file);
}

export function parseVisualAssetManifestV590(value: unknown): VisualAssetManifestV590 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v590-manifest-object");
  const root = value as Record<string, unknown>;
  if (
    root.version !== "v590-celestial-rendering-candidate-v1"
    || root.authorityNamespace !== CELESTIAL_RENDERING_NAMESPACE_V590
    || root.manifestSha256 !== CELESTIAL_RENDERING_MANIFEST_SHA256_V590
    || !Array.isArray(root.assets)
  ) throw new Error("v590-manifest-identity");
  const unsigned = { ...root };
  delete unsigned.manifestSha256;
  const actualSha = sha256Utf8HexV566(JSON.stringify(canonicalizeV590(unsigned)));
  if (actualSha !== root.manifestSha256) throw new Error("v590-manifest-sha");
  const manifest = root as unknown as VisualAssetManifestV590;
  if (
    manifest.boundaries.formalProductPointer !== "v263"
    || manifest.boundaries.frozenCandidatesRewritten !== false
    || manifest.boundaries.historicalEvidenceRewritten !== false
    || manifest.boundaries.scientificPayloadWriteback !== false
    || manifest.boundaries.scientificPayloadSha256 !== CELESTIAL_RENDERING_SCIENTIFIC_PAYLOAD_SHA256_V590
    || manifest.boundaries.singleCanvasRequired !== true
    || manifest.boundaries.productionPromotionAllowed !== false
    || manifest.boundaries.scientificAuthorityChanged !== false
  ) throw new Error("v590-manifest-boundary");
  if (
    manifest.runtime.basisTranscoderPath !== "/basis-v590/"
    || !SHA256_PATTERN_V590.test(manifest.runtime.basisRuntimeReceiptSha256)
    || !SHA256_PATTERN_V590.test(manifest.runtime.basisTranscoderJsSha256)
    || !SHA256_PATTERN_V590.test(manifest.runtime.basisTranscoderWasmSha256)
    || manifest.runtime.unsafeEvalRequired !== false
    || manifest.runtime.assetFailureIsolation !== true
    || manifest.runtime.workerLimit !== 1
  ) throw new Error("v590-manifest-runtime");
  const ids = new Set<string>();
  for (const asset of manifest.assets) {
    if (ids.has(asset.id)) throw new Error(`v590-manifest-duplicate:${asset.id}`);
    ids.add(asset.id);
    if (!asset.presentationOnly || !SHA256_PATTERN_V590.test(asset.sourceSha256)) {
      throw new Error(`v590-manifest-asset:${asset.id}`);
    }
    validateVisualAssetProvenanceV590(asset);
    if (asset.fullQualityMinimum) {
      for (const minimum of [asset.fullQualityMinimum.desktop, asset.fullQualityMinimum.mobile]) {
        if (!Number.isInteger(minimum.width) || !Number.isInteger(minimum.height) || minimum.width <= 0 || minimum.height <= 0) {
          throw new Error(`v590-manifest-quality-minimum:${asset.id}`);
        }
      }
    }
    for (const file of Object.values(asset.variants)) {
      if (!file) continue;
      if (file.bytes <= 0 || file.width <= 0 || file.height <= 0 || !SHA256_PATTERN_V590.test(file.sha256)) {
        throw new Error(`v590-manifest-file:${asset.id}`);
      }
    }
  }
  if (!ids.has(manifest.runtime.ktx2SentinelAssetId)) throw new Error("v590-manifest-sentinel");
  const computedAdmissions = computeHeroAdmissionsV590(manifest.assets);
  for (const [body, admission] of Object.entries(computedAdmissions)) {
    if (manifest.heroBodies[body as keyof typeof manifest.heroBodies] !== admission) {
      throw new Error(`v590-manifest-hero-admission:${body}`);
    }
  }
  return manifest;
}

export async function loadVisualAssetManifestV590(signal?: AbortSignal): Promise<VisualAssetManifestV590> {
  if (signal) {
    const response = await fetch(
      `${CELESTIAL_RENDERING_MANIFEST_URL_V590}?sha256=${CELESTIAL_RENDERING_MANIFEST_SHA256_V590}`,
      { cache: "force-cache", signal },
    );
    if (!response.ok) throw new Error(`v590-manifest-fetch:${response.status}`);
    return parseVisualAssetManifestV590(await response.json());
  }
  manifestPromiseV590 ??= fetch(
    `${CELESTIAL_RENDERING_MANIFEST_URL_V590}?sha256=${CELESTIAL_RENDERING_MANIFEST_SHA256_V590}`,
    { cache: "force-cache" },
  ).then(async (response) => {
    if (!response.ok) throw new Error(`v590-manifest-fetch:${response.status}`);
    return parseVisualAssetManifestV590(await response.json());
  }).catch((error) => {
    manifestPromiseV590 = null;
    throw error;
  });
  return manifestPromiseV590;
}

export async function loadVerifiedVisualAssetBytesV590(
  file: VisualAssetFileV590,
  signal?: AbortSignal,
): Promise<ArrayBuffer> {
  const response = await fetch(`${file.url}?sha256=${file.sha256}`, { cache: "force-cache", signal });
  if (!response.ok) throw new Error(`v590-asset-fetch:${response.status}:${file.url}`);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== file.bytes) throw new Error(`v590-asset-bytes:${file.url}`);
  if (sha256BytesHexV566(new Uint8Array(bytes)) !== file.sha256) throw new Error(`v590-asset-sha:${file.url}`);
  return bytes;
}

export function selectVisualAssetFilesV590(
  asset: VisualAssetManifestEntryV590,
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
): Readonly<{
  primary: VisualAssetFileV590 | null;
  fullRaster: VisualAssetFileV590 | null;
  fallback: VisualAssetFileV590 | null;
}> {
  const preferred = deviceTier === "mobile" ? asset.variants.fullMobile : asset.variants.fullDesktop;
  const litePreferred = deviceTier === "mobile" ? asset.variants.liteMobile : asset.variants.liteDesktop;
  const liteAlternative = deviceTier === "mobile" ? asset.variants.liteDesktop : asset.variants.liteMobile;
  if (deliveryTier === "vercel-lite") {
    return { primary: null, fullRaster: null, fallback: litePreferred ?? liteAlternative ?? null };
  }
  // Full mobile is deliberately device-strict: a verified mobile raster is safer
  // than allocating a desktop 8K texture merely because its KTX2 exists.
  const primary = preferred?.format === "ktx2" ? preferred : null;
  const fullRaster = preferred && RASTER_FORMATS_V590.has(preferred.format) ? preferred : null;
  const fallback = [litePreferred, liteAlternative]
    .find((file) => file && RASTER_FORMATS_V590.has(file.format)) ?? null;
  return { primary, fullRaster, fallback };
}

async function ensureKtx2LoaderV590(
  gl: THREE.WebGLRenderer,
  manifest: VisualAssetManifestV590,
): Promise<KTX2Loader> {
  const runtime = runtimeForV590(gl);
  if (runtime.loader) return runtime.loader;
  if (runtime.loaderPromise) return runtime.loaderPromise;
  const generation = runtime.generation;
  runtime.loaderPromise = (async () => {
    loaderModulePromiseV590 ??= import("three/examples/jsm/loaders/KTX2Loader.js");
    const { KTX2Loader } = await loaderModulePromiseV590;
    const loader = new KTX2Loader()
      .setTranscoderPath(manifest.runtime.basisTranscoderPath)
      .setWorkerLimit(manifest.runtime.workerLimit)
      .detectSupport(gl);
    if (runtime.generation !== generation) {
      loader.dispose();
      throw new Error("v590-ktx2-loader-disposed");
    }
    runtime.loader = loader;
    return loader;
  })().catch((error) => {
    runtime.loaderPromise = null;
    throw error;
  });
  return runtime.loaderPromise;
}

export function parseKtx2V590(
  loader: KTX2Loader,
  bytes: ArrayBuffer,
  timeoutMs: number,
  isCurrent: () => boolean,
  onTimeout: () => void,
): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = globalThis.setTimeout(() => {
      if (settled) return;
      if (!isCurrent()) {
        settled = true;
        reject(new Error("v590-ktx2-parse-disposed"));
        return;
      }
      settled = true;
      onTimeout();
      reject(new Error("v590-ktx2-parse-timeout"));
    }, timeoutMs);
    loader.parse(bytes, (texture) => {
      if (settled || !isCurrent()) {
        texture.dispose();
        if (!settled) {
          settled = true;
          globalThis.clearTimeout(timer);
          reject(new Error("v590-ktx2-parse-disposed"));
        }
        return;
      }
      settled = true;
      globalThis.clearTimeout(timer);
      resolve(texture);
    }, (error) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timer);
      reject(error);
    });
  });
}

/**
 * A timed-out Basis worker may still own an unresolved message port. Dispose the
 * whole generation so the next asset creates a fresh loader and worker pool.
 */
export function invalidateV590TextureLoaderGeneration(
  gl: THREE.WebGLRenderer,
  reason: string,
): number {
  const runtime = runtimeForV590(gl);
  runtime.generation += 1;
  runtime.loader?.dispose();
  runtime.loader = null;
  runtime.loaderPromise = null;
  runtime.prewarmPromise = null;
  runtime.prewarmStatus = "failed";
  runtime.assetFailures.set("__loader-generation__", reason);
  return runtime.generation;
}

function setPrewarmProbeV590(receipt: V590Ktx2PrewarmReceipt): void {
  const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v590-celestial-rendering-browser-acceptance"]');
  if (!root) return;
  root.dataset.atlasV590Ktx2Prewarm = receipt.status;
  root.dataset.atlasV590Ktx2Sentinel = receipt.sentinelAssetId;
  root.dataset.atlasV590Ktx2PrewarmMs = receipt.elapsedMs.toFixed(1);
  root.dataset.atlasV590Ktx2PrewarmReason = receipt.reason;
}

export function prewarmV590Ktx2(
  gl: THREE.WebGLRenderer,
  manifest: VisualAssetManifestV590,
  signal?: AbortSignal,
): Promise<V590Ktx2PrewarmReceipt> {
  const runtime = runtimeForV590(gl);
  if (runtime.prewarmPromise) return runtime.prewarmPromise;
  const generation = runtime.generation;
  runtime.prewarmStatus = "warming";
  runtime.prewarmPromise = (async () => {
    const started = performance.now();
    const sentinel = manifest.assets.find((asset) => asset.id === manifest.runtime.ktx2SentinelAssetId);
    const primary = sentinel ? selectVisualAssetFilesV590(sentinel, "standalone-full", "desktop").primary : null;
    if (!sentinel || !primary) throw new Error("v590-ktx2-sentinel-missing");
    const bytes = await loadVerifiedVisualAssetBytesV590(primary, signal);
    const texture = await parseKtx2V590(
      await ensureKtx2LoaderV590(gl, manifest),
      bytes,
      manifest.runtime.coldStartTimeoutMs,
      () => runtime.generation === generation && !signal?.aborted,
      () => invalidateV590TextureLoaderGeneration(gl, "v590-ktx2-cold-start-timeout"),
    );
    texture.dispose();
    runtime.prewarmStatus = "ready";
    const receipt: V590Ktx2PrewarmReceipt = {
      status: "ready",
      sentinelAssetId: sentinel.id,
      elapsedMs: performance.now() - started,
      reason: "none",
    };
    setPrewarmProbeV590(receipt);
    return receipt;
  })().catch((error: unknown) => {
    runtime.prewarmStatus = runtime.generation === generation ? "failed" : "disposed";
    const receipt: V590Ktx2PrewarmReceipt = {
      status: runtime.prewarmStatus === "disposed" ? "disposed" : "failed",
      sentinelAssetId: manifest.runtime.ktx2SentinelAssetId,
      elapsedMs: 0,
      reason: error instanceof Error ? error.message : "v590-ktx2-prewarm-unknown",
    };
    runtime.assetFailures.set(manifest.runtime.ktx2SentinelAssetId, receipt.reason);
    setPrewarmProbeV590(receipt);
    return receipt;
  });
  return runtime.prewarmPromise;
}

export function getV590AssetFailure(gl: THREE.WebGLRenderer, assetId: string): string | null {
  return runtimeForV590(gl).assetFailures.get(assetId) ?? null;
}

export function clearV590AssetFailure(gl: THREE.WebGLRenderer, assetId: string): void {
  runtimeForV590(gl).assetFailures.delete(assetId);
}

export function disposeV590TextureLoader(gl: THREE.WebGLRenderer): void {
  const runtime = runtimeForV590(gl);
  runtime.generation += 1;
  runtime.prewarmStatus = "disposed";
  runtime.loader?.dispose();
  runtime.loader = null;
  runtime.loaderPromise = null;
  runtime.prewarmPromise = null;
  runtime.assetFailures.clear();
  loaderRuntimeByRendererV590.delete(gl);
}

function parseImageV590(bytes: ArrayBuffer, format: VisualAssetFileV590["format"]): Promise<THREE.Texture> {
  const mime = format === "webp" ? "image/webp" : format === "png" ? "image/png" : "image/jpeg";
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

function configureTextureV590(
  texture: THREE.Texture,
  gl: THREE.WebGLRenderer,
  asset: VisualAssetManifestEntryV590,
  file: VisualAssetFileV590,
  source: "ktx2" | "full-raster" | "fallback",
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
    atlasCandidate: "v590",
    atlasCandidateNamespace: CELESTIAL_RENDERING_NAMESPACE_V590,
    atlasVisualAssetId: asset.id,
    atlasVisualAssetSource: source,
    atlasVisualAssetSha256: file.sha256,
    atlasVisualAssetManifestSha256: CELESTIAL_RENDERING_MANIFEST_SHA256_V590,
    atlasPresentationOnly: true,
    atlasScientificPayloadMutation: false,
    atlasProceduralFallback: false,
  };
  texture.needsUpdate = true;
}

function disposeTextureAfterDetachV590(texture: THREE.Texture): void {
  texture.dispose();
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => texture.dispose()));
}

export function V590Ktx2Prewarm(): null {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const abort = new AbortController();
    void loadVisualAssetManifestV590(abort.signal).then((manifest) => prewarmV590Ktx2(gl, manifest, abort.signal));
    return () => abort.abort();
  }, [gl]);
  return null;
}

export function useV590Texture(
  assetId: string,
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  enabled = true,
): V590TextureLoadState {
  const gl = useThree((state) => state.gl);
  const [state, setState] = useState<V590TextureLoadState>(IDLE_V590);
  const effectGenerationRef = useRef(0);

  useEffect(() => {
    const effectGeneration = ++effectGenerationRef.current;
    let alive = true;
    let texture: THREE.Texture | null = null;
    let release: (() => void) | null = null;
    const abort = new AbortController();
    const isEffectCurrent = () => alive && effectGenerationRef.current === effectGeneration && !abort.signal.aborted;
    if (!enabled) {
      setState(IDLE_V590);
      return () => abort.abort();
    }
    setState({ ...IDLE_V590, status: "loading", assetId, prewarmStatus: runtimeForV590(gl).prewarmStatus });
    const accept = (
      candidate: THREE.Texture,
      asset: VisualAssetManifestEntryV590,
      file: VisualAssetFileV590,
      source: "ktx2" | "full-raster" | "fallback",
      reason = "none",
    ) => {
      configureTextureV590(candidate, gl, asset, file, source);
      if (!isEffectCurrent()) {
        disposeTextureAfterDetachV590(candidate);
        return;
      }
      texture = candidate;
      release = acquireV590TextureResource(candidate, `v590-${assetId}-${deviceTier}`, "v590-celestial-rendering");
      const fullQualityGate: V590TextureLoadState["fullQualityGate"] = deliveryTier !== "standalone-full" || !asset.fullQualityMinimum
        ? "not-applicable"
        : !visualAssetMeetsFullQualityV590(asset, file, deviceTier)
          ? "blocked-full-dimensions"
          : source === "ktx2" || source === "full-raster"
            ? "passed"
            : "blocked-full-fallback";
      setState({
        texture: candidate,
        status: "ready",
        source,
        assetId,
        sha256: file.sha256,
        reason,
        prewarmStatus: runtimeForV590(gl).prewarmStatus,
        fullQualityGate,
      });
    };
    const run = async () => {
      const manifest = await loadVisualAssetManifestV590(abort.signal);
      const asset = manifest.assets.find((entry) => entry.id === assetId);
      if (!asset) throw new Error(`v590-asset-id:${assetId}`);
      const files = selectVisualAssetFilesV590(asset, deliveryTier, deviceTier);
      const runtime = runtimeForV590(gl);
      let primaryFailure = runtime.assetFailures.get(assetId) ?? "none";
      if (files.primary && primaryFailure === "none") {
        await prewarmV590Ktx2(gl, manifest, abort.signal);
        try {
          const generation = runtime.generation;
          const bytes = await loadVerifiedVisualAssetBytesV590(files.primary, abort.signal);
          const candidate = await parseKtx2V590(
            await ensureKtx2LoaderV590(gl, manifest),
            bytes,
            manifest.runtime.warmAssetTimeoutMs,
            () => isEffectCurrent() && runtime.generation === generation,
            () => invalidateV590TextureLoaderGeneration(gl, `v590-ktx2-asset-timeout:${assetId}`),
          );
          accept(candidate, asset, files.primary, "ktx2");
          return;
        } catch (error: unknown) {
          primaryFailure = error instanceof Error ? error.message : "v590-ktx2-unknown";
          runtime.assetFailures.set(assetId, primaryFailure);
        }
      }
      if (files.fullRaster) {
        const bytes = await loadVerifiedVisualAssetBytesV590(files.fullRaster, abort.signal);
        const candidate = await parseImageV590(bytes, files.fullRaster.format);
        accept(candidate, asset, files.fullRaster, "full-raster", "verified-full-raster");
        return;
      }
      if (!files.fallback || !RASTER_FORMATS_V590.has(files.fallback.format)) {
        throw new Error(`v590-verified-fallback-missing:${assetId}`);
      }
      const bytes = await loadVerifiedVisualAssetBytesV590(files.fallback, abort.signal);
      accept(
        await parseImageV590(bytes, files.fallback.format),
        asset,
        files.fallback,
        "fallback",
        primaryFailure === "none" ? "verified-lite-fallback" : `ktx2-fallback:${primaryFailure}`,
      );
    };
    void run().catch((error: unknown) => {
      if (!isEffectCurrent()) return;
      setState({
        texture: null,
        status: "blocked",
        source: "none",
        assetId,
        sha256: "none",
        reason: error instanceof Error ? error.message : "v590-asset-unknown",
        prewarmStatus: runtimeForV590(gl).prewarmStatus,
        fullQualityGate: deliveryTier === "standalone-full" ? "blocked-full-fallback" : "not-applicable",
      });
    });
    return () => {
      alive = false;
      if (effectGenerationRef.current === effectGeneration) effectGenerationRef.current += 1;
      abort.abort();
      release?.();
      if (texture) disposeTextureAfterDetachV590(texture);
      texture = null;
    };
  }, [assetId, deliveryTier, deviceTier, enabled, gl]);

  return state;
}
