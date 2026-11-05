import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { MAINLINE_A3_NEBULA_VISUAL_ASSETS } from "../data/mainlineANebulaVisualAssetsV607.generated";
import { getAtlasResourceSnapshot, getAtlasTextureReferenceCountV300 } from "./atlasResourceLifecycle";
import { loadMainlineANebulaSceneTextureV607, type MainlineANebulaSceneTextureLeaseV607 } from "./mainlineANebulaSceneTextureV607";

const asset = MAINLINE_A3_NEBULA_VISUAL_ASSETS[0];
const bytes = new Uint8Array(readFileSync(new URL(`../../${asset.localPath}`, import.meta.url))).buffer;

type Decode = { texture: THREE.Texture; accept: (texture: THREE.Texture) => void; reject: (error: unknown) => void };
let decodes: Decode[];
let leases: MainlineANebulaSceneTextureLeaseV607[];
let controllers: AbortController[];

function beginLoad(options?: Parameters<typeof loadMainlineANebulaSceneTextureV607>[2]) {
  const abort = new AbortController();
  controllers.push(abort);
  return { abort, result: loadMainlineANebulaSceneTextureV607(asset, abort.signal, options) };
}

beforeEach(() => {
  decodes = []; leases = []; controllers = [];
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, arrayBuffer: async () => bytes })));
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:nebula-v607-test");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  vi.spyOn(THREE.TextureLoader.prototype, "load").mockImplementation((_url, accept, _progress, reject) => {
    const texture = new THREE.Texture({ ...asset.dimensions } as unknown as TexImageSource);
    decodes.push({ texture, accept: accept!, reject: reject! });
    return texture;
  });
});

afterEach(() => {
  controllers.forEach((controller) => controller.abort());
  leases.forEach((lease) => lease.release());
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("mainline A image resource ownership", () => {
  it("tracks one pending blob and one decoded texture, then releases exactly once", async () => {
    const before = getAtlasResourceSnapshot();
    const load = beginLoad();
    await vi.waitFor(() => expect(decodes).toHaveLength(1));
    expect(getAtlasResourceSnapshot().objectUrls).toBe(before.objectUrls + 1);
    const dispose = vi.spyOn(decodes[0].texture, "dispose");
    decodes[0].accept(decodes[0].texture);
    const lease = await load.result;
    leases.push(lease);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(getAtlasResourceSnapshot().objectUrls).toBe(before.objectUrls);
    expect(getAtlasResourceSnapshot().textures).toBe(before.textures + 1);
    expect(getAtlasResourceSnapshot().estimatedGpuBytes).toBe(before.estimatedGpuBytes + asset.dimensions.width * asset.dimensions.height * 4);
    expect(getAtlasTextureReferenceCountV300(lease.texture)).toBe(1);
    expect(lease.texture.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(lease.texture.generateMipmaps).toBe(false);
    lease.release(); lease.release();
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(lease.texture.image).toBeNull();
    expect(getAtlasTextureReferenceCountV300(lease.texture)).toBe(0);
    expect(getAtlasResourceSnapshot()).toMatchObject({ total: before.total, estimatedBytes: before.estimatedBytes });
  });

  it("releases a canceled decode immediately and disposes its late completion", async () => {
    const before = getAtlasResourceSnapshot();
    const load = beginLoad();
    const rejected = expect(load.result).rejects.toMatchObject({ name: "AbortError" });
    await vi.waitFor(() => expect(decodes).toHaveLength(1));
    const dispose = vi.spyOn(decodes[0].texture, "dispose");
    load.abort.abort();
    await rejected;
    expect(getAtlasResourceSnapshot().total).toBe(before.total);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(dispose).toHaveBeenCalledTimes(1);
    decodes[0].texture.image = { ...asset.dimensions } as unknown as TexImageSource;
    decodes[0].accept(decodes[0].texture);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(decodes[0].texture.image).toBeNull();
    expect(getAtlasResourceSnapshot().total).toBe(before.total);
  });

  it("returns to baseline when browser image decoding fails", async () => {
    const before = getAtlasResourceSnapshot();
    const load = beginLoad();
    const rejected = expect(load.result).rejects.toMatchObject({ code: "decode", phase: "decode" });
    await vi.waitFor(() => expect(decodes).toHaveLength(1));
    const dispose = vi.spyOn(decodes[0].texture, "dispose");
    decodes[0].reject(new Error("decode failed"));
    await rejected;
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(getAtlasResourceSnapshot().total).toBe(before.total);
  });

  it("rejects decoded dimensions that disagree with the admitted source", async () => {
    const before = getAtlasResourceSnapshot();
    const load = beginLoad();
    const rejected = expect(load.result).rejects.toThrow("dimensions-rejected");
    await vi.waitFor(() => expect(decodes).toHaveLength(1));
    const dispose = vi.spyOn(decodes[0].texture, "dispose");
    // The loader only reads decoded dimensions in this fixture; keep the
    // minimal test image shape without widening the production texture type.
    decodes[0].texture.image = { width: 2048, height: 2048 } as unknown as TexImageSource;
    decodes[0].accept(decodes[0].texture);
    await rejected;
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(getAtlasResourceSnapshot().total).toBe(before.total);
  });

  it("does not decode wrong bytes, wrong hashes, missing files or canceled requests", async () => {
    const before = getAtlasResourceSnapshot();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 404 } as Response);
    await expect(beginLoad().result).rejects.toThrow("http:404");
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) } as Response);
    await expect(beginLoad().result).rejects.toThrow("bytes-rejected");
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(bytes.byteLength) } as Response);
    await expect(beginLoad().result).rejects.toThrow("bytes-rejected");
    const aborted = new AbortController();
    aborted.abort();
    await expect(loadMainlineANebulaSceneTextureV607(asset, aborted.signal)).rejects.toMatchObject({ name: "AbortError" });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(decodes).toHaveLength(0);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(getAtlasResourceSnapshot().total).toBe(before.total);
  });

  it("enforces a request deadline even when a fetch implementation ignores AbortSignal", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>(() => undefined));
    const before = getAtlasResourceSnapshot();
    const load = beginLoad({ timeoutMs: 20 });
    const rejected = expect(load.result).rejects.toMatchObject({ code: "timeout", phase: "request", name: "TimeoutError" });
    await vi.advanceTimersByTimeAsync(20);
    await rejected;
    expect(decodes).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
    expect(getAtlasResourceSnapshot().total).toBe(before.total);
  });

  it("keeps the original deadline across response body reading", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, arrayBuffer: () => new Promise<ArrayBuffer>(() => undefined) } as Response);
    const load = beginLoad({ timeoutMs: 20 });
    const rejected = expect(load.result).rejects.toMatchObject({ code: "timeout", phase: "body" });
    await vi.advanceTimersByTimeAsync(20);
    await rejected;
    expect(decodes).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("expires a stalled decode and cleans both its pending texture and blob", async () => {
    vi.useFakeTimers();
    const before = getAtlasResourceSnapshot();
    const load = beginLoad({ timeoutMs: 20 });
    const rejected = expect(load.result).rejects.toMatchObject({ code: "timeout", phase: "decode" });
    await vi.advanceTimersByTimeAsync(0);
    expect(decodes).toHaveLength(1);
    const dispose = vi.spyOn(decodes[0].texture, "dispose");
    await vi.advanceTimersByTimeAsync(20);
    await rejected;
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(decodes[0].texture.image).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(getAtlasResourceSnapshot().total).toBe(before.total);
  });

  it("cancels an oversized response stream before decoding or allocating a blob", async () => {
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(asset.byteSize + 1)); }, cancel,
    });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(body));
    await expect(beginLoad().result).rejects.toMatchObject({ code: "byte-size", phase: "body" });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(body.locked).toBe(false);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("cancels a stalled response stream on deadline and releases its reader", async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({ cancel });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(body));
    const load = beginLoad({ timeoutMs: 20 });
    const rejected = expect(load.result).rejects.toMatchObject({ code: "timeout", phase: "body" });
    await vi.advanceTimersByTimeAsync(20);
    await rejected;
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(body.locked).toBe(false);
  });

  it("reloads the same hash-bound asset on explicit retry and preserves progress order", async () => {
    const onPhase = vi.fn();
    const load = beginLoad({ retry: true, onPhase });
    await vi.waitFor(() => expect(decodes).toHaveLength(1));
    decodes[0].accept(decodes[0].texture);
    const lease = await load.result;
    leases.push(lease);
    expect(fetch).toHaveBeenCalledWith(`${asset.src}?sha256=${asset.sha256}`, expect.objectContaining({ cache: "reload" }));
    expect(onPhase.mock.calls.map(([phase]) => phase)).toEqual(["request", "body", "verify", "decode"]);
    expect(lease.texture.userData.atlasVisualAssetSha256).toBe(asset.sha256);
    expect(lease.texture.userData.atlasScientificPayloadWriteback).toBe(false);
  });

  it("reassembles bounded stream chunks before hash verification without claiming a renderer draw", async () => {
    const parts = new Uint8Array(bytes);
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(parts.slice(0, 5));
        controller.enqueue(parts.slice(5, 17));
        controller.enqueue(parts.slice(17));
        controller.close();
      },
    });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(body));
    const load = beginLoad({ onPhase: () => { throw new Error("observer failed"); } });
    await vi.waitFor(() => expect(decodes).toHaveLength(1));
    decodes[0].accept(decodes[0].texture);
    const lease = await load.result;
    leases.push(lease);
    expect(lease.texture.userData.atlasVisualAssetSha256).toBe(asset.sha256);
    expect(body.locked).toBe(false);
    expect(lease.texture.userData.atlasRendererReady).toBeUndefined();
  });

  it("cancels the response body if an ignored-abort fetch resolves after cancellation", async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>((accept) => { resolve = accept; }));
    const load = beginLoad();
    const rejected = expect(load.result).rejects.toMatchObject({ code: "cancelled" });
    load.abort.abort();
    await rejected;
    const cancel = vi.fn();
    resolve(new Response(new ReadableStream<Uint8Array>({ cancel })));
    await Promise.resolve();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(decodes).toHaveLength(0);
  });

  it("retains resource tracking if disposal throws and permits a later cleanup attempt", async () => {
    const before = getAtlasResourceSnapshot();
    const load = beginLoad();
    await vi.waitFor(() => expect(decodes).toHaveLength(1));
    decodes[0].accept(decodes[0].texture);
    const lease = await load.result;
    leases.push(lease);
    const dispose = vi.spyOn(lease.texture, "dispose").mockImplementationOnce(() => { throw new Error("dispose failed"); });
    expect(() => lease.release()).toThrow("dispose failed");
    expect(getAtlasResourceSnapshot().textures).toBe(before.textures + 1);
    lease.release();
    expect(dispose).toHaveBeenCalledTimes(2);
    expect(getAtlasResourceSnapshot().total).toBe(before.total);
  });
});
