import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import { acquireKerrScienceImageProductV344, getKerrScienceImageProductClientSnapshotV344, resetKerrScienceImageProductClientV344ForTests } from "./kerrScienceImageProductClientV344";
import { parseKerrScienceImageProductManifestV343 } from "./kerrScienceImageProductsV343";
const manifest = parseKerrScienceImageProductManifestV343(JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-observation-images-v343/manifest.json"), "utf8")));
const png = manifest.products.find((product) => product.id === "png")!;
const expectation = { id: "png" as const, endpoint: "/api/atlas/relativity-evidence/v343/products/png", sha256: png.sha256, manifestSha256: manifest.manifestSha256, bytes: png.bytes, mimeType: "image/png" as const };
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); resetKerrScienceImageProductClientV344ForTests(); });
describe("v344 product client lifecycle", () => {
  it("has zero network activity before explicit acquire and single-flights concurrent consumers", async () => {
    const baseline = getAtlasResourceSnapshot(); const productBytes = readFileSync(resolve(process.cwd(), png.path));
    const fetchMock = vi.fn(async () => new Response(productBytes, { status: 200, headers: { "content-type": "image/png", "content-length": String(productBytes.byteLength), etag: `"${png.sha256}"`, "x-atlas-science-product": "v343-png" } }));
    vi.stubGlobal("fetch", fetchMock); const create = vi.spyOn(URL, "createObjectURL").mockReturnValueOnce("blob:v344-a").mockReturnValueOnce("blob:v344-b"); const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    expect(fetchMock).not.toHaveBeenCalled(); expect(getKerrScienceImageProductClientSnapshotV344()).toMatchObject({ cacheEntries: 0, fetchCount: 0 });
    const [first, second] = await Promise.all([acquireKerrScienceImageProductV344(expectation), acquireKerrScienceImageProductV344(expectation)]);
    expect(fetchMock).toHaveBeenCalledTimes(1); expect(create).toHaveBeenCalledTimes(2); expect(getKerrScienceImageProductClientSnapshotV344()).toMatchObject({ cacheEntries: 1, referenceCount: 2, fetchCount: 1 });
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot())).toMatchObject({ typedArrayCaches: 1, objectUrls: 2 });
    second.release(); second.release(); expect(revoke).toHaveBeenCalledTimes(1); first.release(); expect(revoke).toHaveBeenCalledTimes(2);
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe("baseline"); expect(getKerrScienceImageProductClientSnapshotV344()).toMatchObject({ cacheEntries: 0, referenceCount: 0 });
  });
  it("fails closed on byte SHA drift and returns the registry to baseline", async () => {
    const baseline = getAtlasResourceSnapshot(); const corrupted = new Uint8Array(png.bytes);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(corrupted, { status: 200, headers: { "content-type": "image/png", "content-length": String(corrupted.byteLength), etag: `"${png.sha256}"`, "x-atlas-science-product": "v343-png" } })));
    await expect(acquireKerrScienceImageProductV344(expectation)).rejects.toThrow(/v344-product-byte-integrity/);
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe("baseline"); expect(getKerrScienceImageProductClientSnapshotV344().cacheEntries).toBe(0);
  });
});
