export const CATALOG_PERSISTENT_CACHE_VERSION = "catalog-persistent-cache-v2" as const;
export const CATALOG_PERSISTENT_CACHE_DATABASE = "orbit-atlas-catalog-cache-v1" as const;
export const CATALOG_PERSISTENT_CACHE_DATABASE_VERSION = 2;
export const CATALOG_PERSISTENT_CACHE_MAX_BYTES = 128 * 1024 * 1024;
export const CATALOG_PERSISTENT_CACHE_BATCH_ENTRIES = 16;
export const CATALOG_PERSISTENT_CACHE_BATCH_BYTES = 4 * 1024 * 1024;

export type CatalogPersistentCacheSnapshotV2 = {
  version: typeof CATALOG_PERSISTENT_CACHE_VERSION;
  status: "idle" | "ready" | "blocked" | "unavailable";
  bytes: number;
  entries: number;
  hits: number;
  misses: number;
  evictions: number;
  queueDepth: number;
  flushStatus: "idle" | "scheduled" | "flushing" | "blocked";
  flushMs: number;
  error: string;
};

export type CatalogPersistentCacheMetadataV2 = {
  key: string;
  manifestSha256: string;
  byteLength: number;
  lastAccessMs: number;
};

export type CatalogPersistentCachePayloadV2 = {
  key: string;
  payload: ArrayBuffer;
};

export type CatalogPersistentCacheEntryV2 = CatalogPersistentCacheMetadataV2 & {
  payload: ArrayBuffer;
};

export interface CatalogPersistentCacheBackendV2 {
  open(): Promise<void>;
  getMany(keys: readonly string[]): Promise<Map<string, CatalogPersistentCacheEntryV2>>;
  putMany(entries: readonly CatalogPersistentCacheEntryV2[]): Promise<void>;
  putMetadata(entries: readonly CatalogPersistentCacheMetadataV2[]): Promise<void>;
  deleteMany(keys: readonly string[]): Promise<void>;
  metadata(): Promise<CatalogPersistentCacheMetadataV2[]>;
  clear(): Promise<void>;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

export class IndexedDbCatalogPersistentBackendV2 implements CatalogPersistentCacheBackendV2 {
  #database: IDBDatabase | null = null;

  async open(): Promise<void> {
    if (this.#database) return;
    if (typeof indexedDB === "undefined") throw new Error("IndexedDB is unavailable");
    const request = indexedDB.open(CATALOG_PERSISTENT_CACHE_DATABASE, CATALOG_PERSISTENT_CACHE_DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (database.objectStoreNames.contains("entries")) database.deleteObjectStore("entries");
      if (database.objectStoreNames.contains("payloads")) database.deleteObjectStore("payloads");
      if (database.objectStoreNames.contains("metadata")) database.deleteObjectStore("metadata");
      database.createObjectStore("payloads", { keyPath: "key" });
      const metadata = database.createObjectStore("metadata", { keyPath: "key" });
      metadata.createIndex("manifestSha256", "manifestSha256", { unique: false });
      metadata.createIndex("lastAccessMs", "lastAccessMs", { unique: false });
    };
    this.#database = await requestResult(request);
    this.#database.onversionchange = () => {
      this.#database?.close();
      this.#database = null;
    };
  }

  #transaction(storeNames: readonly string[], mode: IDBTransactionMode): IDBTransaction {
    if (!this.#database) throw new Error("Catalog persistent cache is not open");
    return this.#database.transaction([...storeNames], mode);
  }

  async getMany(keys: readonly string[]): Promise<Map<string, CatalogPersistentCacheEntryV2>> {
    if (keys.length === 0) return new Map();
    const transaction = this.#transaction(["metadata", "payloads"], "readonly");
    const completed = transactionComplete(transaction);
    const metadataStore = transaction.objectStore("metadata");
    const payloadStore = transaction.objectStore("payloads");
    const rows = await Promise.all(keys.map(async (key) => {
      const [metadata, payload] = await Promise.all([
        requestResult(metadataStore.get(key)) as Promise<CatalogPersistentCacheMetadataV2 | undefined>,
        requestResult(payloadStore.get(key)) as Promise<CatalogPersistentCachePayloadV2 | undefined>,
      ]);
      return metadata && payload ? ({ ...metadata, payload: payload.payload } satisfies CatalogPersistentCacheEntryV2) : null;
    }));
    await completed;
    return new Map(rows.filter((entry): entry is CatalogPersistentCacheEntryV2 => entry !== null).map((entry) => [entry.key, entry]));
  }

  async putMany(entries: readonly CatalogPersistentCacheEntryV2[]): Promise<void> {
    if (entries.length === 0) return;
    const transaction = this.#transaction(["metadata", "payloads"], "readwrite");
    const completed = transactionComplete(transaction);
    const metadataStore = transaction.objectStore("metadata");
    const payloadStore = transaction.objectStore("payloads");
    for (const entry of entries) {
      metadataStore.put({
        key: entry.key,
        manifestSha256: entry.manifestSha256,
        byteLength: entry.byteLength,
        lastAccessMs: entry.lastAccessMs,
      } satisfies CatalogPersistentCacheMetadataV2);
      payloadStore.put({ key: entry.key, payload: entry.payload } satisfies CatalogPersistentCachePayloadV2);
    }
    await completed;
  }

  async putMetadata(entries: readonly CatalogPersistentCacheMetadataV2[]): Promise<void> {
    if (entries.length === 0) return;
    const transaction = this.#transaction(["metadata"], "readwrite");
    const completed = transactionComplete(transaction);
    const store = transaction.objectStore("metadata");
    for (const entry of entries) store.put(entry);
    await completed;
  }

  async deleteMany(keys: readonly string[]): Promise<void> {
    if (keys.length === 0) return;
    const transaction = this.#transaction(["metadata", "payloads"], "readwrite");
    const completed = transactionComplete(transaction);
    const metadataStore = transaction.objectStore("metadata");
    const payloadStore = transaction.objectStore("payloads");
    for (const key of keys) {
      metadataStore.delete(key);
      payloadStore.delete(key);
    }
    await completed;
  }

  async metadata(): Promise<CatalogPersistentCacheMetadataV2[]> {
    const transaction = this.#transaction(["metadata"], "readonly");
    const completed = transactionComplete(transaction);
    const rows = await requestResult(transaction.objectStore("metadata").getAll()) as CatalogPersistentCacheMetadataV2[];
    await completed;
    return rows;
  }

  async clear(): Promise<void> {
    const transaction = this.#transaction(["metadata", "payloads"], "readwrite");
    const completed = transactionComplete(transaction);
    transaction.objectStore("metadata").clear();
    transaction.objectStore("payloads").clear();
    await completed;
  }
}

export function createCatalogPersistentCacheKeyV1(
  manifestSha256: string,
  resourceUrl: string,
  start: number,
  end: number,
): string {
  return `${manifestSha256}:${resourceUrl}:${start}-${end}`;
}

type CatalogPersistentRangeV2 = {
  resourceUrl: string;
  start: number;
  end: number;
};

export class CatalogPersistentTileCacheV2 {
  readonly maxBytes: number;
  readonly backend: CatalogPersistentCacheBackendV2;
  #manifestSha256 = "";
  #accessClock = Date.now();
  #metadata = new Map<string, CatalogPersistentCacheMetadataV2>();
  #pendingWrites = new Map<string, CatalogPersistentCacheEntryV2>();
  #pendingTouches = new Map<string, CatalogPersistentCacheMetadataV2>();
  #flushTimer: ReturnType<typeof setTimeout> | null = null;
  #flushPromise: Promise<void> | null = null;
  #inFlightEntries = 0;
  #onChange?: () => void;
  #snapshot: CatalogPersistentCacheSnapshotV2 = {
    version: CATALOG_PERSISTENT_CACHE_VERSION,
    status: "idle",
    bytes: 0,
    entries: 0,
    hits: 0,
    misses: 0,
    evictions: 0,
    queueDepth: 0,
    flushStatus: "idle",
    flushMs: 0,
    error: "",
  };

  constructor(
    backend: CatalogPersistentCacheBackendV2,
    maxBytes = CATALOG_PERSISTENT_CACHE_MAX_BYTES,
    onChange?: () => void,
  ) {
    this.backend = backend;
    this.maxBytes = maxBytes;
    this.#onChange = onChange;
  }

  get snapshot(): CatalogPersistentCacheSnapshotV2 {
    return { ...this.#snapshot };
  }

  async initialize(manifestSha256: string): Promise<void> {
    this.#manifestSha256 = manifestSha256;
    try {
      await this.backend.open();
      let metadata = await this.backend.metadata();
      if (metadata.some((entry) => entry.manifestSha256 !== manifestSha256)) {
        await this.backend.clear();
        metadata = [];
      }
      this.#metadata = new Map(metadata.map((entry) => [entry.key, entry]));
      this.#snapshot = {
        ...this.#snapshot,
        status: "ready",
        bytes: metadata.reduce((sum, entry) => sum + entry.byteLength, 0),
        entries: metadata.length,
        queueDepth: 0,
        flushStatus: "idle",
        error: "",
      };
    } catch (error) {
      this.#snapshot = {
        ...this.#snapshot,
        status: typeof indexedDB === "undefined" ? "unavailable" : "blocked",
        flushStatus: "blocked",
        error: error instanceof Error ? error.message : String(error),
      };
    }
    this.#emitChange();
  }

  async getMany(ranges: readonly CatalogPersistentRangeV2[]): Promise<Map<string, ArrayBuffer>> {
    const output = new Map<string, ArrayBuffer>();
    if (this.#snapshot.status !== "ready" || ranges.length === 0) return output;
    const keys = ranges.map((range) => createCatalogPersistentCacheKeyV1(
      this.#manifestSha256,
      range.resourceUrl,
      range.start,
      range.end,
    ));
    try {
      const rows = await this.backend.getMany(keys);
      for (const key of keys) {
        const row = rows.get(key);
        if (!row || row.payload.byteLength !== row.byteLength) {
          this.#snapshot = { ...this.#snapshot, misses: this.#snapshot.misses + 1 };
          continue;
        }
        const metadata: CatalogPersistentCacheMetadataV2 = {
          key: row.key,
          manifestSha256: row.manifestSha256,
          byteLength: row.byteLength,
          lastAccessMs: this.#nextAccess(),
        };
        this.#metadata.set(key, metadata);
        this.#pendingTouches.set(key, metadata);
        output.set(key, row.payload);
        this.#snapshot = { ...this.#snapshot, hits: this.#snapshot.hits + 1 };
      }
      if (this.#pendingTouches.size > 0) this.#refreshSnapshot("scheduled");
      return output;
    } catch (error) {
      this.#block(error);
      return output;
    }
  }

  async get(resourceUrl: string, start: number, end: number): Promise<ArrayBuffer | null> {
    const key = createCatalogPersistentCacheKeyV1(this.#manifestSha256, resourceUrl, start, end);
    return (await this.getMany([{ resourceUrl, start, end }])).get(key) ?? null;
  }

  enqueueSet(resourceUrl: string, start: number, end: number, payload: ArrayBuffer): void {
    if (this.#snapshot.status !== "ready" || payload.byteLength > this.maxBytes) return;
    const key = createCatalogPersistentCacheKeyV1(this.#manifestSha256, resourceUrl, start, end);
    this.#pendingTouches.delete(key);
    this.#pendingWrites.set(key, {
      key,
      manifestSha256: this.#manifestSha256,
      payload: payload.slice(0),
      byteLength: payload.byteLength,
      lastAccessMs: this.#nextAccess(),
    });
    this.#refreshSnapshot("scheduled");
  }

  async set(resourceUrl: string, start: number, end: number, payload: ArrayBuffer): Promise<void> {
    this.enqueueSet(resourceUrl, start, end, payload);
    await this.flush();
  }

  async flush(): Promise<void> {
    if (this.#flushTimer !== null) {
      clearTimeout(this.#flushTimer);
      this.#flushTimer = null;
    }
    await this.#ensureDrain();
  }

  async delete(resourceUrl: string, start: number, end: number): Promise<void> {
    if (this.#snapshot.status !== "ready") return;
    const key = createCatalogPersistentCacheKeyV1(this.#manifestSha256, resourceUrl, start, end);
    this.#pendingWrites.delete(key);
    this.#pendingTouches.delete(key);
    try {
      await this.backend.deleteMany([key]);
      this.#metadata.delete(key);
      this.#refreshSnapshot();
    } catch (error) {
      this.#block(error);
    }
  }

  async clear(): Promise<void> {
    if (this.#snapshot.status !== "ready") return;
    this.#pendingWrites.clear();
    this.#pendingTouches.clear();
    try {
      await this.backend.clear();
      this.#metadata.clear();
      this.#refreshSnapshot();
    } catch (error) {
      this.#block(error);
    }
  }

  #scheduleFlush(): void {
    if (this.#flushTimer !== null || this.#flushPromise || this.#snapshot.status !== "ready") {
      this.#refreshSnapshot(this.#flushPromise ? "flushing" : undefined);
      return;
    }
    this.#flushTimer = setTimeout(() => {
      this.#flushTimer = null;
      void this.#ensureDrain();
    }, 0);
    this.#refreshSnapshot("scheduled");
  }

  async #ensureDrain(): Promise<void> {
    if (this.#flushPromise) return this.#flushPromise;
    if (this.#snapshot.status !== "ready" || (this.#pendingWrites.size === 0 && this.#pendingTouches.size === 0)) {
      this.#refreshSnapshot();
      return;
    }
    this.#flushPromise = this.#drain().finally(() => {
      this.#flushPromise = null;
      if (this.#snapshot.status === "ready" && (this.#pendingWrites.size > 0 || this.#pendingTouches.size > 0)) {
        this.#scheduleFlush();
      } else {
        this.#refreshSnapshot();
      }
    });
    return this.#flushPromise;
  }

  async #drain(): Promise<void> {
    const started = performance.now();
    try {
      while (this.#pendingWrites.size > 0 || this.#pendingTouches.size > 0) {
        const batch: CatalogPersistentCacheEntryV2[] = [];
        let batchBytes = 0;
        for (const [key, entry] of this.#pendingWrites) {
          if (batch.length >= CATALOG_PERSISTENT_CACHE_BATCH_ENTRIES) break;
          if (batch.length > 0 && batchBytes + entry.byteLength > CATALOG_PERSISTENT_CACHE_BATCH_BYTES) break;
          this.#pendingWrites.delete(key);
          batch.push(entry);
          batchBytes += entry.byteLength;
        }
        this.#inFlightEntries = batch.length;
        this.#refreshSnapshot("flushing");
        if (batch.length > 0) {
          await this.backend.putMany(batch);
          for (const entry of batch) {
            this.#metadata.set(entry.key, {
              key: entry.key,
              manifestSha256: entry.manifestSha256,
              byteLength: entry.byteLength,
              lastAccessMs: entry.lastAccessMs,
            });
          }
        }

        if (this.#pendingTouches.size > 0) {
          const touches = [...this.#pendingTouches.values()].slice(0, CATALOG_PERSISTENT_CACHE_BATCH_ENTRIES);
          for (const entry of touches) this.#pendingTouches.delete(entry.key);
          await this.backend.putMetadata(touches);
        }

        let bytes = [...this.#metadata.values()].reduce((sum, entry) => sum + entry.byteLength, 0);
        if (bytes > this.maxBytes) {
          const ordered = [...this.#metadata.values()].sort(
            (left, right) => left.lastAccessMs - right.lastAccessMs || left.key.localeCompare(right.key),
          );
          const evicted: string[] = [];
          for (const entry of ordered) {
            if (bytes <= this.maxBytes) break;
            evicted.push(entry.key);
            bytes -= entry.byteLength;
            this.#metadata.delete(entry.key);
          }
          await this.backend.deleteMany(evicted);
          this.#snapshot = { ...this.#snapshot, evictions: this.#snapshot.evictions + evicted.length };
        }
        this.#inFlightEntries = 0;
      }
      this.#snapshot = { ...this.#snapshot, flushMs: performance.now() - started, error: "" };
      this.#refreshSnapshot();
    } catch (error) {
      this.#inFlightEntries = 0;
      this.#pendingWrites.clear();
      this.#pendingTouches.clear();
      this.#block(error);
    }
  }

  #refreshSnapshot(flushStatus?: CatalogPersistentCacheSnapshotV2["flushStatus"]): void {
    const metadata = [...this.#metadata.values()];
    this.#snapshot = {
      ...this.#snapshot,
      bytes: metadata.reduce((sum, entry) => sum + entry.byteLength, 0),
      entries: metadata.length,
      queueDepth: this.#pendingWrites.size + this.#pendingTouches.size + this.#inFlightEntries,
      flushStatus: this.#snapshot.status === "blocked"
        ? "blocked"
        : flushStatus ?? (this.#flushTimer !== null ? "scheduled" : this.#flushPromise ? "flushing" : "idle"),
    };
    this.#emitChange();
  }

  #block(error: unknown): void {
    this.#snapshot = {
      ...this.#snapshot,
      status: "blocked",
      queueDepth: 0,
      flushStatus: "blocked",
      error: error instanceof Error ? error.message : String(error),
    };
    this.#emitChange();
  }

  #emitChange(): void {
    this.#onChange?.();
  }

  #nextAccess(): number {
    this.#accessClock = Math.max(Date.now(), this.#accessClock + 1);
    return this.#accessClock;
  }
}

// Compatibility aliases retain the existing import surface while the cache schema advances.
export type CatalogPersistentCacheSnapshotV1 = CatalogPersistentCacheSnapshotV2;
export type CatalogPersistentCacheMetadataV1 = CatalogPersistentCacheMetadataV2;
export type CatalogPersistentCacheEntryV1 = CatalogPersistentCacheEntryV2;
export type CatalogPersistentCacheBackendV1 = CatalogPersistentCacheBackendV2;
export const IndexedDbCatalogPersistentBackendV1 = IndexedDbCatalogPersistentBackendV2;
export const CatalogPersistentTileCacheV1 = CatalogPersistentTileCacheV2;
