import { expect, test } from "./atlasBrowserTestV263";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const DATABASE = "orbit-atlas-catalog-cache-v1";

type Snapshot = Record<string, unknown> & { at: number };

test("v264.1 publishes points before durable flush and keeps the corrected streaming gate", async ({ page, request }) => {
  test.setTimeout(180_000);
  await page.addInitScript(({ database }) => {
    const scope = window as unknown as {
      __atlasCatalogSnapshotsV264r1: Snapshot[];
      __atlasCatalogSourcesV264r1: Array<Record<string, unknown>>;
      __atlasCatalogLegacyDbReadyV264r1: Promise<void>;
    };
    scope.__atlasCatalogSnapshotsV264r1 = [];
    scope.__atlasCatalogSourcesV264r1 = [];
    scope.__atlasCatalogLegacyDbReadyV264r1 = new Promise<void>((resolve, reject) => {
      const deletion = indexedDB.deleteDatabase(database);
      deletion.onerror = () => reject(deletion.error);
      deletion.onblocked = () => reject(new Error("Legacy catalog cache deletion was blocked"));
      deletion.onsuccess = () => {
        const request = indexedDB.open(database, 1);
        request.onupgradeneeded = () => {
          const store = request.result.createObjectStore("entries", { keyPath: "key" });
          store.put({
            key: "legacy-entry",
            manifestSha256: "0".repeat(64),
            payload: new Uint8Array([1, 2, 3, 4]).buffer,
            byteLength: 4,
            lastAccessMs: 1,
          });
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          request.result.close();
          resolve();
        };
      };
    });
    window.addEventListener("atlas:catalog-stream-snapshot-v264", (event) => {
      scope.__atlasCatalogSnapshotsV264r1.push({ ...(event as CustomEvent).detail, at: performance.now() });
    });
    window.addEventListener("atlas:catalog-source-resolution-v264", (event) => {
      scope.__atlasCatalogSourcesV264r1.push({ ...(event as CustomEvent).detail, at: performance.now() });
    });
  }, { database: DATABASE });

  const manifestResponse = await request.get("/api/atlas/content-packs/core/files/data/catalog-healpix-v9/manifest.json");
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json() as { version: string; manifestSha256: string };
  expect(manifest).toMatchObject({
    version: "v264-healpix-stream-catalog-v9",
    manifestSha256: "68ea2f7972213bd420ffe9b85f6b02a3be977c58e3f3094d57d3796fbd45f421",
  });

  const transferred: number[] = [];
  let archiveRangeResponses = 0;
  page.on("response", (response) => {
    const url = response.url();
    if (!url.includes("catalog-healpix-v9") && !url.includes("catalog-v8.bin")) return;
    const length = Number(response.headers()["content-length"] ?? 0);
    if (Number.isFinite(length) && length > 0) transferred.push(length);
    if (url.includes("catalog-v8.bin") && response.request().headers()["range"]) archiveRangeResponses += 1;
  });

  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator(ROOT)).toHaveCount(1);
  await page.evaluate(async () => {
    await (window as unknown as { __atlasCatalogLegacyDbReadyV264r1: Promise<void> }).__atlasCatalogLegacyDbReadyV264r1;
  });
  await page.getByRole("button", { name: "本地恒星", exact: true }).click();
  await page.waitForFunction(() => {
    const snapshots = (window as unknown as { __atlasCatalogSnapshotsV264r1?: Snapshot[] }).__atlasCatalogSnapshotsV264r1 ?? [];
    return snapshots.some((snapshot) => snapshot.status === "ready" && Number(snapshot.activeRecordCount) > 0);
  }, undefined, { timeout: 30_000 });

  const cold = await page.evaluate(() => {
    const snapshots = (window as unknown as { __atlasCatalogSnapshotsV264r1: Snapshot[] }).__atlasCatalogSnapshotsV264r1;
    const streaming = snapshots.find((snapshot) => snapshot.status === "streaming");
    const ready = snapshots.find((snapshot) => snapshot.status === "ready" && Number(snapshot.activeRecordCount) > 0);
    return { snapshots, streaming, ready };
  });
  expect(cold.ready).toMatchObject({
    contract: "v9",
    fallback: "none",
    persistentCacheStatus: "ready",
    selectedSourceRetention: "not-requested",
  });
  expect(Number(cold.ready?.activeRangeRequests ?? -1)).toBe(0);
  expect(Math.max(...cold.snapshots.map((snapshot) => Number(snapshot.activeRangeRequests ?? 0)))).toBeLessThanOrEqual(4);
  expect(Number(cold.ready?.memoryCacheBytes ?? 0)).toBeLessThanOrEqual(64 * 1024 * 1024);
  expect(Number(cold.ready?.readyMs ?? Number.POSITIVE_INFINITY)).toBeLessThanOrEqual(400);
  expect(Number(cold.ready?.at ?? 0) - Number(cold.streaming?.at ?? 0)).toBeLessThanOrEqual(400);
  expect(Number(cold.ready?.persistentReadMs ?? -1)).toBeGreaterThanOrEqual(0);
  expect(Number(cold.ready?.networkWallMs ?? -1)).toBeGreaterThanOrEqual(0);
  expect(Number(cold.ready?.checksumMs ?? -1)).toBeGreaterThanOrEqual(0);
  expect(transferred.reduce((sum, value) => sum + value, 0)).toBeLessThanOrEqual(2.5 * 1024 * 1024);
  const coldArchiveResponses = archiveRangeResponses;

  await page.waitForFunction(() => {
    const snapshots = (window as unknown as { __atlasCatalogSnapshotsV264r1?: Snapshot[] }).__atlasCatalogSnapshotsV264r1 ?? [];
    return snapshots.some((snapshot) =>
      snapshot.status === "ready" &&
      Number(snapshot.activeRecordCount) > 0 &&
      Number(snapshot.persistentQueueDepth) === 0 &&
      Number(snapshot.persistentCacheEntries) > 0 &&
      snapshot.persistentFlushStatus === "idle",
    );
  }, undefined, { timeout: 15_000 });

  const databaseState = await page.evaluate(async ({ database }) => {
    const request = indexedDB.open(database);
    const connection = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const stores = [...connection.objectStoreNames];
    const transaction = connection.transaction(["metadata", "payloads"], "readonly");
    const count = (store: string) => new Promise<number>((resolve, reject) => {
      const countRequest = transaction.objectStore(store).count();
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });
    const [metadata, payloads] = await Promise.all([count("metadata"), count("payloads")]);
    const version = connection.version;
    connection.close();
    return { stores, metadata, payloads, version };
  }, { database: DATABASE });
  expect(databaseState).toMatchObject({ version: 2 });
  expect(databaseState.stores.sort()).toEqual(["metadata", "payloads"]);
  expect(databaseState.metadata).toBeGreaterThan(0);
  expect(databaseState.payloads).toBe(databaseState.metadata);

  const warmDurations: number[] = [];
  for (let cycle = 0; cycle < 10; cycle += 1) {
    await page.getByRole("button", { name: "太阳系", exact: true }).click();
    await page.waitForTimeout(50);
    await page.evaluate(() => {
      (window as unknown as { __atlasCatalogSnapshotsV264r1: Snapshot[] }).__atlasCatalogSnapshotsV264r1 = [];
    });
    await page.getByRole("button", { name: "本地恒星", exact: true }).click();
    await page.waitForFunction(() => {
      const snapshots = (window as unknown as { __atlasCatalogSnapshotsV264r1?: Snapshot[] }).__atlasCatalogSnapshotsV264r1 ?? [];
      return snapshots.some((snapshot) => snapshot.status === "ready" && Number(snapshot.activeRecordCount) > 0);
    }, undefined, { timeout: 15_000 });
    warmDurations.push(await page.evaluate(() => {
      const snapshots = (window as unknown as { __atlasCatalogSnapshotsV264r1: Snapshot[] }).__atlasCatalogSnapshotsV264r1;
      const streaming = snapshots.find((snapshot) => snapshot.status === "streaming");
      const ready = snapshots.find((snapshot) => snapshot.status === "ready" && Number(snapshot.activeRecordCount) > 0);
      return Number(ready?.at ?? 0) - Number(streaming?.at ?? 0);
    }));
  }
  const orderedWarm = [...warmDurations].sort((left, right) => left - right);
  const warmP95 = orderedWarm[Math.ceil(orderedWarm.length * 0.95) - 1]!;
  expect(warmP95).toBeLessThanOrEqual(100);
  expect(archiveRangeResponses).toBe(coldArchiveResponses);

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("atlas:catalog-resolve-source-v264", { detail: { sourceId: "3235862721054592" } }));
  });
  await page.waitForFunction(() => {
    const sources = (window as unknown as { __atlasCatalogSourcesV264r1?: Array<Record<string, unknown>> }).__atlasCatalogSourcesV264r1 ?? [];
    return sources.some((entry) => entry.sourceId === "3235862721054592");
  }, undefined, { timeout: 15_000 });
  const source = await page.evaluate(() => {
    const sources = (window as unknown as { __atlasCatalogSourcesV264r1: Array<Record<string, unknown>> }).__atlasCatalogSourcesV264r1;
    return sources.find((entry) => entry.sourceId === "3235862721054592");
  });
  expect(source?.location).toMatchObject({ sourceId: "3235862721054592" });
});
