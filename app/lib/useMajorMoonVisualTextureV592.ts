"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { acquireAtlasResource } from "./atlasResourceLifecycle";
import type { CelestialDeliveryTierV590, CelestialDeviceTierV590 } from "./celestialRenderingV590";
import {
  MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592,
  loadMajorMoonVisualManifestV592,
  selectMajorMoonVisualFilesV592,
  type MajorMoonRuntimeHeroIdV592,
  type MajorMoonVisualFileV592,
} from "./majorMoonVisualAssetsV592";
import { sha256BytesHexV566 } from "./sha256BrowserV566";
import {
  estimateV590TextureGpuBytes,
  loadVerifiedVisualAssetBytesV590,
  loadVisualAssetManifestV590,
  parseKtx2V590,
  selectVisualAssetFilesV590,
} from "./useV590Texture";
import { disposeV591TextureLoader } from "./useV591Texture";

export type MajorMoonVisualTextureStateV592 = Readonly<{
  texture: THREE.Texture | null;
  status: "idle" | "loading" | "ready" | "blocked";
  source: "none" | "ktx2" | "fallback";
  assetId: MajorMoonRuntimeHeroIdV592;
  sha256: string;
  reason: string;
  prewarmStatus: "idle" | "warming" | "ready" | "failed" | "disposed";
  fullQualityGate: "not-applicable" | "passed" | "blocked-full-fallback";
}>;

type LoaderRuntimeV592 = {
  loader: KTX2Loader | null;
  loaderPromise: Promise<KTX2Loader> | null;
  prewarmPromise: Promise<void> | null;
  prewarmStatus: MajorMoonVisualTextureStateV592["prewarmStatus"];
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

function idleStateV592(assetId: MajorMoonRuntimeHeroIdV592): MajorMoonVisualTextureStateV592 {
  return {
    texture: null,
    status: "idle",
    source: "none",
    assetId,
    sha256: "none",
    reason: "none",
    prewarmStatus: "idle",
    fullQualityGate: "not-applicable",
  };
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

function candidateRootV592(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-atlas-v592-browser-acceptance-version="v592-living-universe-browser-acceptance"]');
}

function setLoaderTelemetryV592(status: LoaderRuntimeV592["prewarmStatus"], reason: string): void {
  const root = candidateRootV592();
  if (!root) return;
  root.dataset.atlasV592MajorMoonKtx2Prewarm = status;
  root.dataset.atlasV592MajorMoonKtx2PrewarmReason = reason;
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
    if (performance.now() >= deadline) throw new Error("v592-major-moon-v591-ktx2-lane-settlement-timeout");
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

export function disposeMajorMoonVisualTextureLoaderV592(
  gl: THREE.WebGLRenderer,
  reason = "v592-major-moon-explicit-lane-retirement",
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
    disposeLoaderV592(gl, "disposed", "v592-major-moon-scope-released");
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
    // decoder before opening the v592 moon lane so Three sees one active
    // Basis worker per renderer instead of warning about parallel loaders.
    disposeV591TextureLoader(gl);
    const loader = new KTX2Loader().setTranscoderPath(BASIS_PATH_V592).setWorkerLimit(1).detectSupport(gl);
    if (runtime.generation !== generation || runtime.references === 0) {
      loader.dispose();
      throw new Error("v592-major-moon-ktx2-loader-disposed");
    }
    runtime.loader = loader;
    runtime.releaseWorker = acquireAtlasResource("worker", "atlas", "v592-major-moon-basis-worker", {
      owner: "v592-major-moon-runtime",
      manifestSha256: MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592,
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
    // The inherited stage mounts before the moon layer. Let its sentinel
    // decode settle, then retire that decoder before v592 opens its own lane.
    // This prevents one extra active Basis worker on every Release/Restore
    // cycle while preserving all already-decoded frozen textures.
    const inheritedLaneStatus = await waitForV591DecoderSettlementV592(signal);
    // The sentinel can settle just before inherited sky/hero hooks reach the
    // same loader. Give those already-scheduled decodes one bounded quiet
    // window, then retire the inherited runtime exactly once for the handoff.
    await delayWithAbortV592(V591_LANE_QUIET_WINDOW_MS_V592, signal);
    disposeV591TextureLoader(gl);
    setLoaderTelemetryV592("warming", `v591-${inheritedLaneStatus}-quiesced-v590-sealed-sentinel`);
    const baseline = await loadVisualAssetManifestV590(signal);
    const sentinel = baseline.assets.find((asset) => asset.id === baseline.runtime.ktx2SentinelAssetId);
    const file = sentinel ? selectVisualAssetFilesV590(sentinel, "standalone-full", "desktop").primary : null;
    if (!file) throw new Error("v592-major-moon-ktx2-sentinel-missing");
    const bytes = await loadVerifiedVisualAssetBytesV590(file, signal);
    const texture = await parseKtx2V590(
      await ensureKtx2LoaderV592(gl),
      bytes,
      COLD_START_TIMEOUT_MS_V592,
      () => runtime.generation === generation && runtime.references > 0 && !signal.aborted,
      () => disposeLoaderV592(gl, "failed", "v592-major-moon-ktx2-cold-start-timeout"),
    );
    texture.dispose();
    runtime.prewarmStatus = "ready";
    setLoaderTelemetryV592("ready", "v590-sealed-sentinel");
  })().catch((error: unknown) => {
    if (signal.aborted || runtime.references === 0) return;
    runtime.prewarmStatus = "failed";
    runtime.assetFailures.set("__sentinel__", error instanceof Error ? error.message : "v592-major-moon-ktx2-prewarm-unknown");
    setLoaderTelemetryV592("failed", runtime.assetFailures.get("__sentinel__")!);
  });
  return runtime.prewarmPromise;
}

async function loadVerifiedBytesV592(file: MajorMoonVisualFileV592, signal: AbortSignal): Promise<ArrayBuffer> {
  const response = await fetch(`${file.url}?sha256=${file.sha256}`, { cache: "force-cache", signal });
  if (!response.ok) throw new Error(`v592-major-moon-file-fetch:${response.status}:${file.url}`);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== file.bytes) throw new Error(`v592-major-moon-file-bytes:${file.url}`);
  if (sha256BytesHexV566(new Uint8Array(bytes)) !== file.sha256) throw new Error(`v592-major-moon-file-sha:${file.url}`);
  return bytes;
}

function parseRasterV592(bytes: ArrayBuffer, file: MajorMoonVisualFileV592, signal: AbortSignal): Promise<THREE.Texture> {
  const blobUrl = URL.createObjectURL(new Blob([bytes], { type: "image/webp" }));
  const releaseObjectUrl = acquireAtlasResource("object-url", "atlas", `v592-major-moon-object-url-${file.sha256.slice(0, 12)}`, {
    owner: "v592-major-moon-runtime",
    estimatedBytes: file.bytes,
    contentSha256: file.sha256,
    manifestSha256: MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592,
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
  file: MajorMoonVisualFileV592,
  assetId: MajorMoonRuntimeHeroIdV592,
  source: "ktx2" | "fallback",
): THREE.Texture {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = !(texture instanceof THREE.CompressedTexture);
  texture.anisotropy = Math.min(12, Math.max(1, gl.capabilities.getMaxAnisotropy()));
  texture.userData = {
    ...texture.userData,
    atlasCandidate: "v592",
    atlasLayer: "major-moon-observation-albedo",
    atlasVisualAssetId: assetId,
    atlasVisualAssetSource: source,
    atlasVisualAssetSha256: file.sha256,
    atlasVisualAssetManifestSha256: MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592,
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

export function useMajorMoonVisualTextureV592(
  assetId: MajorMoonRuntimeHeroIdV592,
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  enabled = true,
): MajorMoonVisualTextureStateV592 {
  const gl = useThree((state) => state.gl);
  const [state, setState] = useState<MajorMoonVisualTextureStateV592>(() => idleStateV592(assetId));
  const effectGeneration = useRef(0);

  useEffect(() => {
    const generation = ++effectGeneration.current;
    const abort = new AbortController();
    let texture: THREE.Texture | null = null;
    let releaseTexture: (() => void) | null = null;
    const current = () => effectGeneration.current === generation && !abort.signal.aborted;
    if (!enabled) {
      setState(idleStateV592(assetId));
      return () => abort.abort();
    }
    const releaseRuntime = retainLoaderRuntimeV592(gl);
    setState({ ...idleStateV592(assetId), status: "loading", prewarmStatus: runtimeForV592(gl).prewarmStatus });

    const accept = (
      candidate: THREE.Texture,
      file: MajorMoonVisualFileV592,
      source: "ktx2" | "fallback",
      reason: string,
    ) => {
      if (!current()) {
        disposeTextureV592(candidate);
        return;
      }
      texture = configureTextureV592(candidate, gl, file, assetId, source);
      releaseTexture = acquireAtlasResource("texture", "atlas", `v592-major-moon-${assetId}`, {
        owner: "v592-major-moon-runtime",
        estimatedBytes: estimateV590TextureGpuBytes(texture),
        contentSha256: file.sha256,
        manifestSha256: MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592,
      });
      setState({
        texture,
        status: "ready",
        source,
        assetId,
        sha256: file.sha256,
        reason,
        prewarmStatus: runtimeForV592(gl).prewarmStatus,
        fullQualityGate: deliveryTier === "standalone-full" && source === "ktx2"
          ? "passed"
          : deliveryTier === "standalone-full" ? "blocked-full-fallback" : "not-applicable",
      });
    };

    void (async () => {
      const manifest = await loadMajorMoonVisualManifestV592(abort.signal);
      const asset = manifest.assets.find((candidate) => candidate.target === assetId);
      if (!asset) throw new Error(`v592-major-moon-asset-blocked:${assetId}`);
      const selection = selectMajorMoonVisualFilesV592(asset, deliveryTier, deviceTier);
      const runtime = runtimeForV592(gl);
      let primaryFailure = runtime.assetFailures.get(assetId) ?? "none";
      if (selection.primary && primaryFailure === "none") {
        await prewarmKtx2V592(gl, abort.signal);
        try {
          const loaderGeneration = runtime.generation;
          const bytes = await loadVerifiedBytesV592(selection.primary, abort.signal);
          const candidate = await parseKtx2V590(
            await ensureKtx2LoaderV592(gl),
            bytes,
            WARM_ASSET_TIMEOUT_MS_V592,
            () => current() && runtime.generation === loaderGeneration,
            () => disposeLoaderV592(gl, "failed", `v592-major-moon-ktx2-timeout:${assetId}`),
          );
          accept(candidate, selection.primary, "ktx2", "verified-v592-major-moon-ktx2");
          return;
        } catch (error: unknown) {
          if (!current()) return;
          primaryFailure = error instanceof Error ? error.message : "v592-major-moon-ktx2-unknown";
          runtime.assetFailures.set(assetId, primaryFailure);
        }
      }
      const bytes = await loadVerifiedBytesV592(selection.fallback, abort.signal);
      accept(
        await parseRasterV592(bytes, selection.fallback, abort.signal),
        selection.fallback,
        "fallback",
        primaryFailure === "none" ? "verified-v592-major-moon-webp" : `ktx2-fallback:${primaryFailure}`,
      );
    })().catch((error: unknown) => {
      if (!current()) return;
      setState({
        ...idleStateV592(assetId),
        status: "blocked",
        reason: error instanceof Error ? error.message : "v592-major-moon-runtime-unknown",
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
  }, [assetId, deliveryTier, deviceTier, enabled, gl]);

  return state;
}
