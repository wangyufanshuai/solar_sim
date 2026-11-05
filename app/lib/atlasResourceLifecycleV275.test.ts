import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  acquireAtlasResource,
  acquireAtlasTextureResourceV289,
  diffAtlasResourceSnapshotsV300,
  estimateAtlasTextureBytesV289,
  getAtlasTextureReferenceCountV300,
  getAtlasResourceSnapshot,
  listAtlasRuntimeResources,
} from "./atlasResourceLifecycle";
import { DataTexture } from "three";
import { ATLAS_VISUAL_ASSET_MANIFEST_CANONICAL_SHA256_V289 } from "./atlasVisualAssetsV289";

const BASE_ASSET_SHA = "53ff92ed692d56058854e5216e9204f3f6437c8a9b7de6aeae40758db326fff5";

describe("v275 resource ownership and byte accounting", () => {
  it("accounts by owner and returns GPU, object URL and worker resources to baseline", () => {
    const before = getAtlasResourceSnapshot();
    const releaseWorker = acquireAtlasResource("worker", "atlas", "test-catalog-worker", {
      owner: "catalog",
    });
    const releaseBuffer = acquireAtlasResource("gpu-buffer", "atlas", "test-catalog-buffer", {
      owner: "catalog",
      estimatedBytes: 4096.9,
    });
    const releasePipeline = acquireAtlasResource("gpu-compute-pipeline", "kerr", "test-kerr-pipeline", {
      owner: "kerr-shadow",
    });
    const releaseQuery = acquireAtlasResource("gpu-query", "kerr", "test-kerr-timestamp-query", {
      owner: "kerr-shadow",
    });
    const releaseUrl = acquireAtlasResource("object-url", "atlas", "test-export", {
      owner: "export",
      estimatedBytes: 128,
    });
    const releaseTypedArray = acquireAtlasResource("typed-array-cache", "atlas", "test-cosmic-cache", {
      owner: "cosmic",
      estimatedBytes: 2048,
    });

    const during = getAtlasResourceSnapshot();
    expect(during.total - before.total).toBe(6);
    expect(during.gpuBuffers - before.gpuBuffers).toBe(1);
    expect(during.objectUrls - before.objectUrls).toBe(1);
    expect(during.typedArrayCaches - before.typedArrayCaches).toBe(1);
    expect(during.gpuComputePipelines - before.gpuComputePipelines).toBe(1);
    expect(during.gpuQueries - before.gpuQueries).toBe(1);
    expect(during.estimatedBytes - before.estimatedBytes).toBe(6272);
    expect(during.estimatedGpuBytes - before.estimatedGpuBytes).toBe(4096);
    expect(during.byOwner.catalog).toEqual({ count: 2, estimatedBytes: 4096 });
    expect(listAtlasRuntimeResources().some((entry) => entry.owner === "export" && entry.label === "test-export")).toBe(true);

    releaseUrl();
    releaseTypedArray();
    releaseQuery();
    releasePipeline();
    releaseBuffer();
    releaseWorker();
    expect(getAtlasResourceSnapshot()).toMatchObject({
      total: before.total,
      estimatedBytes: before.estimatedBytes,
      estimatedGpuBytes: before.estimatedGpuBytes,
    });
  });

  it("tracks and releases user texture object URLs, textures and cosmic decoded caches", () => {
    const userTextures = readFileSync("app/context/PlanetUserTextureContext.tsx", "utf8");
    const cosmic = readFileSync("app/components/CosmicScaleDataLayerV260.tsx", "utf8");
    const scienceRecordService = readFileSync("app/lib/gaiaScienceRecordQueryServiceV275.ts", "utf8");
    expect(userTextures).toContain('acquireAtlasResource("object-url"');
    expect(userTextures).toContain('acquireAtlasResource("texture"');
    expect(userTextures).toContain("entry.releaseObjectUrl()");
    expect(userTextures).toContain("entry.releaseTexture()");
    expect(userTextures).toContain("texture?.dispose()");
    expect(userTextures).toContain("if (isCancelled())");
    expect(userTextures).toContain("cancelled = true");
    expect(userTextures).toContain("if (!mountedRef.current)");
    expect(cosmic).toContain("clearDecodedCacheV273()");
    expect(cosmic).toContain("decodedCacheResourceReleases.forEach((release) => release())");
    expect(scienceRecordService).toContain("async dispose(): Promise<void>");
    expect(scienceRecordService).toContain("await this.#worker.terminate()");
    expect(scienceRecordService).toContain("disposeGaiaScienceRecordQueryServiceV275ForTests");
  });

  it("estimates and idempotently releases tracked texture memory", () => {
    const texture = new DataTexture(new Uint8Array(16 * 8 * 4), 16, 8);
    texture.generateMipmaps = true;
    texture.userData.atlasVisualAssetSha256 = BASE_ASSET_SHA;
    texture.userData.atlasVisualAssetManifestSha256 = ATLAS_VISUAL_ASSET_MANIFEST_CANONICAL_SHA256_V289;
    const estimate = estimateAtlasTextureBytesV289(texture);
    expect(estimate).toMatchObject({ width: 16, height: 8, bytesPerPixel: 4 });
    expect(estimate.estimatedBytes).toBe(683);
    const before = getAtlasResourceSnapshot();
    const release = acquireAtlasTextureResourceV289(texture, "atlas", "test-v289-texture", "test");
    expect(getAtlasResourceSnapshot().textures).toBe(before.textures + 1);
    expect(listAtlasRuntimeResources()).toContainEqual(expect.objectContaining({
      label: "test-v289-texture",
      contentSha256: BASE_ASSET_SHA,
      manifestSha256: ATLAS_VISUAL_ASSET_MANIFEST_CANONICAL_SHA256_V289,
    }));
    release();
    release();
    expect(getAtlasResourceSnapshot().textures).toBe(before.textures);
    texture.dispose();
  });

  it("detects owner or label substitution even when every numeric total matches", () => {
    const root = getAtlasResourceSnapshot();
    const releaseFirst = acquireAtlasResource("worker", "kerr", "authority-worker-a", { owner: "kerr-authority", estimatedBytes: 1024 });
    const first = getAtlasResourceSnapshot();
    releaseFirst();
    const releaseSecond = acquireAtlasResource("worker", "kerr", "authority-worker-b", { owner: "kerr-preview", estimatedBytes: 1024 });
    const second = getAtlasResourceSnapshot();
    expect(second.total).toBe(first.total);
    expect(second.estimatedBytes).toBe(first.estimatedBytes);
    expect(diffAtlasResourceSnapshotsV300(first, second)).toMatchObject({
      status: "drift",
      total: 0,
      estimatedBytes: 0,
      identityChanged: true,
      ownerChanged: true,
    });
    releaseSecond();
    expect(diffAtlasResourceSnapshotsV300(root, getAtlasResourceSnapshot())).toMatchObject({ status: "baseline", identityChanged: false, ownerChanged: false });
  });

  it("rejects malformed texture provenance before creating a registry entry", () => {
    const texture = new DataTexture(new Uint8Array(4 * 4 * 4), 4, 4);
    texture.userData.atlasVisualAssetSha256 = "not-a-sha";
    const before = getAtlasResourceSnapshot();
    expect(() => acquireAtlasTextureResourceV289(texture, "atlas", "invalid-provenance", "sky-backdrop"))
      .toThrow("invalid tracked texture provenance");
    expect(getAtlasResourceSnapshot().identityDigest).toBe(before.identityDigest);
    texture.dispose();
  });

  it("counts shared textures once and returns every lifecycle dimension to baseline", () => {
    const texture = new DataTexture(new Uint8Array(8 * 8 * 4), 8, 8);
    texture.generateMipmaps = true;
    const before = getAtlasResourceSnapshot();
    const releaseSky = acquireAtlasTextureResourceV289(texture, "atlas", "shared-sky", "sky");
    const releasePreview = acquireAtlasTextureResourceV289(texture, "inspect", "shared-preview", "preview");
    const during = getAtlasResourceSnapshot();
    expect(during.textures - before.textures).toBe(1);
    expect(during.estimatedGpuBytes - before.estimatedGpuBytes).toBe(342);
    expect(getAtlasTextureReferenceCountV300(texture)).toBe(2);
    expect(diffAtlasResourceSnapshotsV300(before, during)).toMatchObject({ status: "drift", textures: 1, estimatedGpuBytes: 342 });
    releaseSky();
    releaseSky();
    expect(getAtlasResourceSnapshot().textures - before.textures).toBe(1);
    expect(getAtlasTextureReferenceCountV300(texture)).toBe(1);
    releasePreview();
    expect(getAtlasTextureReferenceCountV300(texture)).toBe(0);
    expect(diffAtlasResourceSnapshotsV300(before, getAtlasResourceSnapshot())).toMatchObject({
      status: "baseline",
      total: 0,
      workers: 0,
      gpuRenderTargets: 0,
      gpuBuffers: 0,
      textures: 0,
      objectUrls: 0,
      typedArrayCaches: 0,
      cameraLocks: 0,
      estimatedBytes: 0,
      estimatedGpuBytes: 0,
      identityChanged: false,
      ownerChanged: false,
    });
    texture.dispose();
  });

  it("closes V299 one-shot Worker and WebGPU allocations deterministically", () => {
    const worker = readFileSync("app/workers/kerrInteractiveCompute.worker.ts", "utf8");
    const renderer = readFileSync("app/components/KerrStrongGravityRendererV299.tsx", "utf8");
    const scope = readFileSync("app/lib/atlasResourceScopeV308.ts", "utf8");
    expect(worker).toContain("parameters.destroy()");
    expect(worker).toContain("output.destroy()");
    expect(worker).toContain("readback.destroy()");
    expect(worker).toContain("device.destroy()");
    expect(renderer).toContain("stopWorker = () =>");
    expect(renderer).toContain("worker.terminate()");
    expect(renderer).toContain('scope.add("cinematic-worker-registry"');
    expect(renderer).toContain('scope.add("cinematic-response-cache"');
    expect(renderer).toContain('scope.add("cinematic-texture-registry"');
    expect(renderer).toContain('scope.add("cinematic-texture-dispose"');
    expect(renderer).toContain('releaseAtlasResourceScopeV309(scope, "kerr-cinematic-compute-texture", "cinematic-effect-cleanup")');
    expect(scope).toContain("for (let index = entries.length - 1");
    expect(scope).toContain("if (released) releaseEntry(entry)");
  });

  it("publishes every lifecycle counter for browser baseline comparison without React subscriptions", () => {
    const shell = readFileSync("app/components/AtlasAppShell.tsx", "utf8");
    expect(shell).toContain("subscribeAtlasResourceSnapshot");
    expect(shell).not.toContain("useAtlasResourceSnapshot");
    for (const attribute of [
      "atlasResourceGpuPipelines",
      "atlasResourceGpuQueries",
      "atlasResourceObjectUrls",
      "atlasResourceTypedArrayCaches",
      "atlasResourceCameraLocks",
      "atlasResourceEstimatedGpuBytes",
      "atlasResourceIdentityDigest",
      "atlasResourceOwnerCount",
      "atlasResourceRevision",
    ]) expect(shell).toContain(attribute);
  });
});
