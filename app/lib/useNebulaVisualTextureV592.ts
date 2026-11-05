"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  NEBULA_VISUAL_MANIFEST_SHA256_V592,
  loadNebulaVisualManifestV592,
  nebulaVisualManifestShaForIdV592,
  selectNebulaVisualSlicesV592,
  type NebulaVisualFileV592,
  type NebulaVisualIdV592,
} from "./nebulaVisualAssetsV592";
import {
  isNebulaOverlayVisualIdV592,
  loadNebulaOverlayVisualManifestV592,
  selectNebulaOverlayVisualSlicesV592,
} from "./nebulaOverlayVisualAssetsV592";
import { sha256BytesHexV566 } from "./sha256BrowserV566";
import type { CelestialDeliveryTierV590, CelestialDeviceTierV590 } from "./celestialRenderingV590";
import {
  estimateV590TextureGpuBytes,
  loadVerifiedVisualAssetBytesV590,
  loadVisualAssetManifestV590,
  parseKtx2V590,
  selectVisualAssetFilesV590,
} from "./useV590Texture";
import { disposeV591TextureLoader } from "./useV591Texture";

export type NebulaVisualTextureStateV592 = Readonly<{
  texture: THREE.Texture | null;
  status: "idle" | "loading" | "ready" | "blocked";
  source: "none" | "ktx2" | "fallback";
  assetId: NebulaVisualIdV592;
  depthIndex: number;
  sha256: string;
  reason: string;
  prewarmStatus: "idle" | "warming" | "ready" | "failed" | "disposed";
  fullQualityGate: "not-applicable" | "passed" | "blocked-full-fallback";
}>;

type LoaderRuntimeV592 = {
  loader: KTX2Loader | null;
  loaderPromise: Promise<KTX2Loader> | null;
  prewarmPromise: Promise<void> | null;
  prewarmStatus: NebulaVisualTextureStateV592["prewarmStatus"];
  generation: number;
  references: number;
  releaseWorker: (() => void) | null;
  assetFailures: Map<string, string>;
};

const BASIS_PATH_V592 = "/basis-v590/";
const COLD_START_TIMEOUT_MS_V592 = 15_000;
const WARM_ASSET_TIMEOUT_MS_V592 = 12_000;
const V591_LANE_SETTLEMENT_TIMEOUT_MS_V592 = 15_000;
const V591_LANE_QUIET_WINDOW_MS_V592 = 1_250;
const runtimesV592 = new WeakMap<THREE.WebGLRenderer, LoaderRuntimeV592>();
let loaderModulePromiseV592: Promise<typeof import("three/examples/jsm/loaders/KTX2Loader.js")> | null = null;

function idleStateV592(assetId: NebulaVisualIdV592, depthIndex: number): NebulaVisualTextureStateV592 {
  return {
    texture: null,
    status: "idle",
    source: "none",
    assetId,
    depthIndex,
    sha256: "none",
    reason: "none",
    prewarmStatus: "idle",
    fullQualityGate: "not-applicable",
  };
}

function explicitFallbackRequestedV592(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("atlasV592NebulaTexture") === "fallback";
}

function runtimeForV592(gl: THREE.WebGLRenderer): LoaderRuntimeV592 {
  const current = runtimesV592.get(gl);
  if (current) return current;
  const created: LoaderRuntimeV592 = {
    loader: null,
    loaderPromise: null,
    prewarmPromise: null,
    prewarmStatus: "idle",
    generation: 0,
    references: 0,
    releaseWorker: null,
    assetFailures: new Map(),
  };
  runtimesV592.set(gl, created);
  return created;
}

function setLoaderTelemetryV592(status: LoaderRuntimeV592["prewarmStatus"], reason: string): void {
  const root = document.querySelector<HTMLElement>('[data-atlas-v592-browser-acceptance-version="v592-living-universe-browser-acceptance"]');
  if (!root) return;
  root.dataset.atlasV592NebulaKtx2Prewarm = status;
  root.dataset.atlasV592NebulaKtx2PrewarmReason = reason;
}

function delayWithAbortV592(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function waitForV591DecoderSettlementV592(signal: AbortSignal): Promise<"ready" | "failed" | "disposed"> {
  const deadline = performance.now() + V591_LANE_SETTLEMENT_TIMEOUT_MS_V592;
  while (!signal.aborted) {
    const inheritedRoot = document.querySelector<HTMLElement>(
      '[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]',
    );
    const status = inheritedRoot?.dataset.atlasV591Ktx2Prewarm;
    if (status === "ready" || status === "failed" || status === "disposed") return status;
    if (performance.now() >= deadline) throw new Error("v592-nebula-v591-ktx2-lane-settlement-timeout");
    await delayWithAbortV592(25, signal);
  }
  throw new DOMException("Aborted", "AbortError");
}

function disposeLoaderV592(gl: THREE.WebGLRenderer, status: "failed" | "disposed", reason: string): void {
  const runtime = runtimeForV592(gl);
  runtime.generation += 1;
  runtime.loader?.dispose();
  runtime.loader = null;
  runtime.loaderPromise = null;
  runtime.prewarmPromise = null;
  runtime.prewarmStatus = status;
  runtime.releaseWorker?.();
  runtime.releaseWorker = null;
  if (status === "failed") runtime.assetFailures.set("__loader-generation__", reason);
  setLoaderTelemetryV592(status, reason);
}

export function disposeNebulaVisualTextureLoaderV592(
  gl: THREE.WebGLRenderer,
  reason = "v592-nebula-explicit-lane-retirement",
): void {
  const runtime = runtimeForV592(gl);
  disposeLoaderV592(gl, "disposed", reason);
  runtime.assetFailures.clear();
}

function retainLoaderRuntimeV592(gl: THREE.WebGLRenderer): () => void {
  const runtime = runtimeForV592(gl);
  runtime.references += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    runtime.references = Math.max(0, runtime.references - 1);
    if (runtime.references > 0) return;
    disposeLoaderV592(gl, "disposed", "v592-nebula-scope-released");
    runtime.assetFailures.clear();
  };
}

async function ensureKtx2LoaderV592(gl: THREE.WebGLRenderer): Promise<KTX2Loader> {
  const runtime = runtimeForV592(gl);
  if (runtime.loader) return runtime.loader;
  if (runtime.loaderPromise) return runtime.loaderPromise;
  const generation = runtime.generation;
  runtime.loaderPromise = (async () => {
    loaderModulePromiseV592 ??= import("three/examples/jsm/loaders/KTX2Loader.js");
    const { KTX2Loader } = await loaderModulePromiseV592;
    // The frozen v591 textures remain valid after decode. Retire its idle
    // decoder before opening the additive nebula lane so Three sees only one
    // active Basis worker for this renderer.
    disposeV591TextureLoader(gl);
    const loader = new KTX2Loader().setTranscoderPath(BASIS_PATH_V592).setWorkerLimit(1).detectSupport(gl);
    if (runtime.generation !== generation || runtime.references === 0) {
      loader.dispose();
      throw new Error("v592-nebula-ktx2-loader-disposed");
    }
    runtime.loader = loader;
    runtime.releaseWorker = acquireAtlasResource("worker", "atlas", "v592-nebula-basis-worker", {
      owner: "v592-nebula-visual-runtime",
      manifestSha256: NEBULA_VISUAL_MANIFEST_SHA256_V592,
    });
    return loader;
  })().catch((error) => {
    runtime.loaderPromise = null;
    throw error;
  });
  return runtime.loaderPromise;
}

async function prewarmKtx2V592(gl: THREE.WebGLRenderer, signal: AbortSignal): Promise<void> {
  const runtime = runtimeForV592(gl);
  if (runtime.prewarmPromise) return runtime.prewarmPromise;
  const generation = runtime.generation;
  runtime.prewarmStatus = "warming";
  setLoaderTelemetryV592("warming", "v590-sealed-sentinel");
  runtime.prewarmPromise = (async () => {
    // v591 mounts inside the same Canvas before the additive layer. Let its
    // sentinel and already-scheduled decodes settle, then hand the single
    // renderer-wide KTX2 lane to v592. This prevents a visually successful
    // load from emitting the global "multiple active loaders" warning.
    const inheritedLaneStatus = await waitForV591DecoderSettlementV592(signal);
    await delayWithAbortV592(V591_LANE_QUIET_WINDOW_MS_V592, signal);
    disposeV591TextureLoader(gl);
    setLoaderTelemetryV592("warming", `v591-${inheritedLaneStatus}-quiesced-v590-sealed-sentinel`);
    const baseline = await loadVisualAssetManifestV590(signal);
    const sentinel = baseline.assets.find((asset) => asset.id === baseline.runtime.ktx2SentinelAssetId);
    const file = sentinel ? selectVisualAssetFilesV590(sentinel, "standalone-full", "desktop").primary : null;
    if (!file) throw new Error("v592-nebula-ktx2-sentinel-missing");
    const bytes = await loadVerifiedVisualAssetBytesV590(file, signal);
    const texture = await parseKtx2V590(
      await ensureKtx2LoaderV592(gl),
      bytes,
      COLD_START_TIMEOUT_MS_V592,
      () => runtime.generation === generation && runtime.references > 0 && !signal.aborted,
      () => disposeLoaderV592(gl, "failed", "v592-nebula-ktx2-cold-start-timeout"),
    );
    texture.dispose();
    runtime.prewarmStatus = "ready";
    setLoaderTelemetryV592("ready", "v590-sealed-sentinel");
  })().catch((error: unknown) => {
    if (signal.aborted || runtime.references === 0) return;
    runtime.prewarmStatus = "failed";
    runtime.assetFailures.set("__sentinel__", error instanceof Error ? error.message : "v592-nebula-ktx2-prewarm-unknown");
    setLoaderTelemetryV592("failed", runtime.assetFailures.get("__sentinel__")!);
  });
  return runtime.prewarmPromise;
}

async function loadVerifiedBytesV592(file: NebulaVisualFileV592, signal: AbortSignal): Promise<ArrayBuffer> {
  const response = await fetch(`${file.url}?sha256=${file.sha256}`, { cache: "force-cache", signal });
  if (!response.ok) throw new Error(`v592-nebula-file-fetch:${response.status}:${file.url}`);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== file.bytes) throw new Error(`v592-nebula-file-bytes:${file.url}`);
  if (sha256BytesHexV566(new Uint8Array(bytes)) !== file.sha256) throw new Error(`v592-nebula-file-sha:${file.url}`);
  return bytes;
}

function parseRasterV592(bytes: ArrayBuffer, file: NebulaVisualFileV592, assetId: NebulaVisualIdV592, signal: AbortSignal): Promise<THREE.Texture> {
  const blobUrl = URL.createObjectURL(new Blob([bytes], { type: "image/webp" }));
  const releaseObjectUrl = acquireAtlasResource("object-url", "atlas", `v592-nebula-object-url-${file.sha256.slice(0, 12)}`, {
    owner: "v592-nebula-visual-runtime",
    estimatedBytes: file.bytes,
    contentSha256: file.sha256,
    manifestSha256: nebulaVisualManifestShaForIdV592(assetId),
  });
  return new Promise((resolve, reject) => {
    const finalize = () => {
      URL.revokeObjectURL(blobUrl);
      releaseObjectUrl();
    };
    if (signal.aborted) {
      finalize();
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    new THREE.TextureLoader().load(blobUrl, (texture) => {
      finalize();
      if (signal.aborted) {
        texture.dispose();
        reject(new DOMException("Aborted", "AbortError"));
      } else resolve(texture);
    }, undefined, (error) => {
      finalize();
      reject(error);
    });
  });
}

function configureTextureV592(
  texture: THREE.Texture,
  gl: THREE.WebGLRenderer,
  file: NebulaVisualFileV592,
  assetId: NebulaVisualIdV592,
  source: "ktx2" | "fallback",
): THREE.Texture {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = !(texture instanceof THREE.CompressedTexture);
  texture.anisotropy = Math.min(8, Math.max(1, gl.capabilities.getMaxAnisotropy()));
  texture.userData = {
    ...texture.userData,
    atlasCandidate: "v592",
    atlasLayer: "expanded-nebula-depth-impostor",
    atlasVisualAssetId: assetId,
    atlasVisualAssetSource: source,
    atlasVisualAssetSha256: file.sha256,
    atlasVisualAssetManifestSha256: nebulaVisualManifestShaForIdV592(assetId),
    atlasDepthIndex: file.depthIndex,
    atlasPresentationOnly: true,
    atlasScientificAuthority: false,
    atlasScientificPayloadMutation: false,
  };
  texture.needsUpdate = true;
  return texture;
}

function disposeTextureV592(texture: THREE.Texture): void {
  texture.dispose();
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => texture.dispose()));
}

export function useNebulaVisualTextureV592(
  assetId: NebulaVisualIdV592,
  depthIndex: number,
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  enabled = true,
): NebulaVisualTextureStateV592 {
  const gl = useThree((state) => state.gl);
  const [state, setState] = useState<NebulaVisualTextureStateV592>(() => idleStateV592(assetId, depthIndex));
  const effectGeneration = useRef(0);

  useEffect(() => {
    const generation = ++effectGeneration.current;
    const abort = new AbortController();
    let texture: THREE.Texture | null = null;
    let releaseTexture: (() => void) | null = null;
    const current = () => effectGeneration.current === generation && !abort.signal.aborted;
    if (!enabled) {
      setState(idleStateV592(assetId, depthIndex));
      return () => abort.abort();
    }
    const releaseRuntime = retainLoaderRuntimeV592(gl);
    setState({ ...idleStateV592(assetId, depthIndex), status: "loading", prewarmStatus: runtimeForV592(gl).prewarmStatus });

    const accept = (
      candidate: THREE.Texture,
      file: NebulaVisualFileV592,
      source: "ktx2" | "fallback",
      reason: string,
    ) => {
      if (!current()) {
        disposeTextureV592(candidate);
        return;
      }
      texture = configureTextureV592(candidate, gl, file, assetId, source);
      releaseTexture = acquireAtlasResource("texture", "atlas", `v592-nebula-${assetId}-depth-${depthIndex}`, {
        owner: "v592-nebula-visual-runtime",
        estimatedBytes: estimateV590TextureGpuBytes(texture),
        contentSha256: file.sha256,
        manifestSha256: nebulaVisualManifestShaForIdV592(assetId),
      });
      setState({
        texture,
        status: "ready",
        source,
        assetId,
        depthIndex,
        sha256: file.sha256,
        reason,
        prewarmStatus: runtimeForV592(gl).prewarmStatus,
        fullQualityGate: deliveryTier === "standalone-full" && source === "ktx2"
          ? "passed"
          : deliveryTier === "standalone-full" ? "blocked-full-fallback" : "not-applicable",
      });
    };

    void (async () => {
      const slice = isNebulaOverlayVisualIdV592(assetId)
        ? selectNebulaOverlayVisualSlicesV592(
          (await loadNebulaOverlayVisualManifestV592(assetId, abort.signal)).assets.find((candidate) => candidate.target === assetId)!,
          deliveryTier,
          deviceTier,
        ).find((candidate) => candidate.depthIndex === depthIndex)
        : selectNebulaVisualSlicesV592(
          (await loadNebulaVisualManifestV592(abort.signal)).assets.find((candidate) => candidate.target === assetId)!,
          deliveryTier,
          deviceTier,
        ).find((candidate) => candidate.depthIndex === depthIndex);
      if (!slice) throw new Error(`v592-nebula-slice-blocked:${assetId}:${depthIndex}`);
      const runtime = runtimeForV592(gl);
      const failureKey = `${assetId}:${depthIndex}`;
      let primaryFailure = runtime.assetFailures.get(failureKey) ?? "none";
      const explicitFallback = explicitFallbackRequestedV592();
      if (slice.primary && primaryFailure === "none" && !explicitFallback) {
        await prewarmKtx2V592(gl, abort.signal);
        try {
          const loaderGeneration = runtime.generation;
          const bytes = await loadVerifiedBytesV592(slice.primary, abort.signal);
          const candidate = await parseKtx2V590(
            await ensureKtx2LoaderV592(gl),
            bytes,
            WARM_ASSET_TIMEOUT_MS_V592,
            () => current() && runtime.generation === loaderGeneration,
            () => disposeLoaderV592(gl, "failed", `v592-nebula-ktx2-timeout:${failureKey}`),
          );
          accept(candidate, slice.primary, "ktx2", "verified-v592-nebula-ktx2");
          return;
        } catch (error: unknown) {
          if (!current()) return;
          primaryFailure = error instanceof Error ? error.message : "v592-nebula-ktx2-unknown";
          runtime.assetFailures.set(failureKey, primaryFailure);
        }
      }
      const bytes = await loadVerifiedBytesV592(slice.fallback, abort.signal);
      accept(
        await parseRasterV592(bytes, slice.fallback, assetId, abort.signal),
        slice.fallback,
        "fallback",
        explicitFallback
          ? "explicit-v592-local-shadow-fallback-diagnostic"
          : primaryFailure === "none" ? "verified-v592-nebula-webp" : `ktx2-fallback:${primaryFailure}`,
      );
    })().catch((error: unknown) => {
      if (!current()) return;
      setState({
        ...idleStateV592(assetId, depthIndex),
        status: "blocked",
        reason: error instanceof Error ? error.message : "v592-nebula-runtime-unknown",
        prewarmStatus: runtimeForV592(gl).prewarmStatus,
        fullQualityGate: deliveryTier === "standalone-full" ? "blocked-full-fallback" : "not-applicable",
      });
    });

    return () => {
      abort.abort();
      releaseTexture?.();
      if (texture) disposeTextureV592(texture);
      texture = null;
      releaseRuntime();
    };
  }, [assetId, deliveryTier, depthIndex, deviceTier, enabled, gl]);

  return state;
}
