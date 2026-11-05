import { describe, expect, it } from "vitest";
import {
  CatalogPersistentTileCacheV2,
  createCatalogPersistentCacheKeyV1,
  type CatalogPersistentCacheBackendV2,
  type CatalogPersistentCacheEntryV2,
  type CatalogPersistentCacheMetadataV2,
} from "./catalogPersistentCacheV1";

class MemoryBackend implements CatalogPersistentCacheBackendV2 {
  metadataValues = new Map<string, CatalogPersistentCacheMetadataV2>();
  payloadValues = new Map<string, ArrayBuffer>();
  getManyCalls = 0;
  putManyCalls = 0;
  failWrites = false;

  async open() {}

  async getMany(keys: readonly string[]) {
    this.getManyCalls += 1;
    const output = new Map<string, CatalogPersistentCacheEntryV2>();
    for (const key of keys) {
      const metadata = this.metadataValues.get(key);
      const payload = this.payloadValues.get(key);
      if (metadata && payload) output.set(key, { ...metadata, payload: payload.slice(0) });
    }
    return output;
  }

  async putMany(entries: readonly CatalogPersistentCacheEntryV2[]) {
    if (this.failWrites) throw new Error("quota blocked");
    this.putManyCalls += 1;
    for (const entry of entries) {
      this.metadataValues.set(entry.key, {
        key: entry.key,
        manifestSha256: entry.manifestSha256,
        byteLength: entry.byteLength,
        lastAccessMs: entry.lastAccessMs,
      });
      this.payloadValues.set(entry.key, entry.payload.slice(0));
    }
  }

  async putMetadata(entries: readonly CatalogPersistentCacheMetadataV2[]) {
    for (const entry of entries) this.metadataValues.set(entry.key, { ...entry });
  }

  async deleteMany(keys: readonly string[]) {
    for (const key of keys) {
      this.metadataValues.delete(key);
      this.payloadValues.delete(key);
    }
  }

  async metadata() { return [...this.metadataValues.values()].map((entry) => ({ ...entry })); }
  async clear() { this.metadataValues.clear(); this.payloadValues.clear(); }
}

describe("v264.1 persistent catalog cache", () => {
  it("batches reads and evicts least-recently-used ranges without scanning payloads", async () => {
    const backend = new MemoryBackend();
    const cache = new CatalogPersistentTileCacheV2(backend, 8);
    const manifest = "a".repeat(64);
    await cache.initialize(manifest);
    await cache.set("archive", 0, 3, new ArrayBuffer(4));
    await cache.set("archive", 4, 7, new ArrayBuffer(4));
    const hits = await cache.getMany([
      { resourceUrl: "archive", start: 0, end: 3 },
      { resourceUrl: "archive", start: 40, end: 43 },
    ]);
    expect(backend.getManyCalls).toBe(1);
    expect(hits.size).toBe(1);
    await cache.set("archive", 8, 11, new ArrayBuffer(4));
    expect(await cache.get("archive", 4, 7)).toBeNull();
    expect((await cache.get("archive", 0, 3))?.byteLength).toBe(4);
    expect(cache.snapshot).toMatchObject({ status: "ready", bytes: 8, entries: 2, evictions: 1 });
  });

  it("deduplicates queued writes and does not make durability part of enqueue", async () => {
    const backend = new MemoryBackend();
    const cache = new CatalogPersistentTileCacheV2(backend, 32);
    const manifest = "a".repeat(64);
    await cache.initialize(manifest);
    cache.enqueueSet("archive", 0, 3, new Uint8Array([1, 2, 3, 4]).buffer);
    cache.enqueueSet("archive", 0, 3, new Uint8Array([5, 6, 7, 8]).buffer);
    expect(cache.snapshot).toMatchObject({ queueDepth: 1, flushStatus: "scheduled", bytes: 0 });
    expect(backend.putManyCalls).toBe(0);
    await cache.flush();
    expect(backend.putManyCalls).toBe(1);
    expect(cache.snapshot).toMatchObject({ queueDepth: 0, flushStatus: "idle", bytes: 4, entries: 1 });
    const key = createCatalogPersistentCacheKeyV1(manifest, "archive", 0, 3);
    expect([...new Uint8Array(backend.payloadValues.get(key)!)]).toEqual([5, 6, 7, 8]);
  });

  it("invalidates all metadata and payloads when the manifest SHA changes", async () => {
    const backend = new MemoryBackend();
    const first = new CatalogPersistentTileCacheV2(backend, 16);
    await first.initialize("a".repeat(64));
    await first.set("archive", 0, 3, new ArrayBuffer(4));
    const second = new CatalogPersistentTileCacheV2(backend, 16);
    await second.initialize("b".repeat(64));
    expect(second.snapshot).toMatchObject({ status: "ready", bytes: 0, entries: 0 });
    expect(backend.metadataValues.size).toBe(0);
    expect(backend.payloadValues.size).toBe(0);
  });

  it("fails persistent writes closed while leaving the caller free to use memory cache", async () => {
    const backend = new MemoryBackend();
    const cache = new CatalogPersistentTileCacheV2(backend, 16);
    await cache.initialize("a".repeat(64));
    backend.failWrites = true;
    cache.enqueueSet("archive", 0, 3, new ArrayBuffer(4));
    await cache.flush();
    expect(cache.snapshot).toMatchObject({ status: "blocked", flushStatus: "blocked", queueDepth: 0 });
    expect(cache.snapshot.error).toContain("quota blocked");
  });
});
