import * as THREE from "three";
import type { MainlineANebulaVisualAssetV607 } from "../data/mainlineANebulaVisualAssetsV607.generated";
import { acquireAtlasResource, acquireAtlasTextureResourceV289 } from "./atlasResourceLifecycle";
import { isMainlineANebulaSceneAssetV607, MAINLINE_A_NEBULA_SCENE_OWNER_V607 } from "./mainlineANebulaSceneV607";
import { sha256BytesHexV566 } from "./sha256BrowserV566";
import { reportCanonicalRuntimeCleanupFailureV635 } from "./mainlineACanonicalRuntimeV635";
import {
  classifyNebulaLoadErrorV638,
  createNebulaLoadDeadlineV638,
  nebulaLoadTimeoutV638,
  NebulaLoadErrorV638,
  type NebulaLoadPhaseV638,
} from "./mainlineANebulaLoadV638";

export type MainlineANebulaSceneTextureLeaseV607 = Readonly<{ texture: THREE.Texture; release: () => void }>;
export type MainlineANebulaSceneTextureOptionsV638 = {
  timeoutMs?: number;
  retry?: boolean;
  onPhase?: (phase: NebulaLoadPhaseV638) => void;
};

function reportCleanup(error: unknown): void {
  const detail = error instanceof Error ? error.message : String(error);
  reportCanonicalRuntimeCleanupFailureV635(`nebula-v638:${detail.replace(/[\u0000-\u001f]/g, " ").slice(0, 900)}`);
}

function disposeDecodedTexture(texture: THREE.Texture): void {
  texture.dispose();
  texture.image = null;
}

function decodeJpegV607(bytes: ArrayBuffer, asset: MainlineANebulaVisualAssetV607, signal: AbortSignal): Promise<THREE.Texture> {
  const objectUrl = URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
  let releaseUrl: () => void;
  try {
    releaseUrl = acquireAtlasResource("object-url", "atlas", `v607-nebula-jpeg-${asset.objectId}`, {
      owner: MAINLINE_A_NEBULA_SCENE_OWNER_V607, estimatedBytes: bytes.byteLength, contentSha256: asset.sha256,
    });
  } catch (error) { URL.revokeObjectURL(objectUrl); throw error; }
  return new Promise((resolve, reject) => {
    let settled = false;
    let failed = false;
    let pendingTexture: THREE.Texture | null = null;
    const disposed = new WeakSet<THREE.Texture>();
    const discard = (texture: THREE.Texture | null) => {
      if (!texture || disposed.has(texture)) return;
      try { disposeDecodedTexture(texture); disposed.add(texture); }
      catch (error) { reportCleanup(error); }
    };
    const finalize = () => {
      if (settled) return false;
      settled = true;
      signal.removeEventListener("abort", abort);
      URL.revokeObjectURL(objectUrl);
      releaseUrl();
      return true;
    };
    const abort = () => {
      if (!finalize()) return;
      failed = true;
      discard(pendingTexture);
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) { abort(); return; }
    try {
      pendingTexture = new THREE.TextureLoader().load(objectUrl, (texture) => {
        if (!finalize()) {
          // TextureLoader can assign image after an earlier cancellation.
          discard(texture);
          texture.image = null;
          return;
        }
        resolve(texture);
      }, undefined, () => {
        if (!finalize()) return;
        failed = true;
        discard(pendingTexture);
        reject(new NebulaLoadErrorV638("decode", "decode", "v607-nebula-scene-decode-failed"));
      });
      if (failed) discard(pendingTexture);
    } catch (error) {
      if (finalize()) {
        failed = true;
        discard(pendingTexture);
        reject(classifyNebulaLoadErrorV638(error, "decode"));
      }
    }
  });
}

async function readBoundedBodyV638(response: Response, expectedBytes: number, deadline: ReturnType<typeof createNebulaLoadDeadlineV638>): Promise<ArrayBuffer> {
  if (!response.body?.getReader) return deadline.wait(response.arrayBuffer());
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  let finished = false;
  try {
    while (true) {
      const chunk = await deadline.wait(reader.read());
      if (chunk.done) { finished = true; break; }
      received += chunk.value.byteLength;
      if (received > expectedBytes) throw new NebulaLoadErrorV638("byte-size", "body", "v607-nebula-scene-bytes-rejected:oversized");
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return bytes.buffer;
  } finally {
    if (!finished) void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

/** One verified local JPEG, with no retained cache or shared renderer mutation. */
export async function loadMainlineANebulaSceneTextureV607(
  asset: MainlineANebulaVisualAssetV607,
  signal: AbortSignal,
  options: MainlineANebulaSceneTextureOptionsV638 = {},
): Promise<MainlineANebulaSceneTextureLeaseV607> {
  if (!isMainlineANebulaSceneAssetV607(asset)) throw new NebulaLoadErrorV638("asset", "request", "v607-nebula-scene-asset-rejected");
  const deadline = createNebulaLoadDeadlineV638(signal, nebulaLoadTimeoutV638(options.timeoutMs), reportCleanup);
  let texture: THREE.Texture | null = null;
  let releaseRegistry: (() => void) | undefined;
  const phase = (next: NebulaLoadPhaseV638) => {
    deadline.enter(next);
    try { options.onPhase?.(next); }
    catch { /* Presentation observers cannot change image verification. */ }
  };
  try {
    phase("request");
    const response = await deadline.wait(fetch(`${asset.src}?sha256=${asset.sha256}`, {
      cache: options.retry ? "reload" : "force-cache", signal: deadline.signal,
    }), (lateResponse) => { void lateResponse.body?.cancel().catch(() => undefined); });
    if (!response.ok) {
      void response.body?.cancel().catch(() => undefined);
      throw new NebulaLoadErrorV638("http", "request", `v607-nebula-scene-http:${response.status}`, response.status);
    }
    phase("body");
    const bytes = await readBoundedBodyV638(response, asset.byteSize, deadline);
    phase("verify");
    if (bytes.byteLength !== asset.byteSize) throw new NebulaLoadErrorV638("byte-size", "verify", "v607-nebula-scene-bytes-rejected:size");
    if (sha256BytesHexV566(new Uint8Array(bytes)) !== asset.sha256) throw new NebulaLoadErrorV638("digest", "verify", "v607-nebula-scene-bytes-rejected:sha256");
    phase("decode");
    texture = await deadline.wait(decodeJpegV607(bytes, asset, deadline.signal), disposeDecodedTexture);
    deadline.enter("decode");
    const image = texture.image as { width: number; height: number };
    if (!image || image.width !== asset.dimensions.width || image.height !== asset.dimensions.height) {
      throw new NebulaLoadErrorV638("dimensions", "decode", "v607-nebula-scene-dimensions-rejected");
    }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.userData = {
      ...texture.userData,
      atlasVisualAssetSha256: asset.sha256,
      atlasPresentationOnly: true,
      atlasObservationImageClaim: true,
      atlasNakedEyeRepresentationClaimed: false,
      atlasDepthReconstructionClaimed: false,
      atlasScientificPayloadWriteback: false,
    };
    texture.needsUpdate = true;
    releaseRegistry = acquireAtlasTextureResourceV289(texture, "atlas", `v607-nebula-${asset.objectId}`, MAINLINE_A_NEBULA_SCENE_OWNER_V607);
  } catch (error) {
    try {
      if (texture) disposeDecodedTexture(texture);
      releaseRegistry?.();
    } catch (cleanupError) { reportCleanup(cleanupError); }
    throw classifyNebulaLoadErrorV638(error, deadline.phase);
  } finally {
    deadline.dispose();
  }
  const ownedTexture = texture;
  let released = false;
  return { texture: ownedTexture, release: () => {
    if (released) return;
    disposeDecodedTexture(ownedTexture);
    releaseRegistry?.();
    released = true;
  } };
}
