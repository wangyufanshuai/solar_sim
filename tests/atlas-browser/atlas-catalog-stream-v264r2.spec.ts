import { expect, test } from "./atlasBrowserTestV263";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const DATABASE = "orbit-atlas-catalog-cache-v1";

type Snapshot = Record<string, unknown> & { at: number };

test("v264.2 coalesces compact v10 ranges within the corrected cold gate", async ({ page, request }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    const scope = window as unknown as {
      __atlasCatalogSnapshotsV264r2: Snapshot[];
      __atlasCatalogSourcesV264r2: Array<Record<string, unknown>>;
    };
    scope.__atlasCatalogSnapshotsV264r2 = [];
    scope.__atlasCatalogSourcesV264r2 = [];
    window.addEventListener("atlas:catalog-stream-snapshot-v264", (event) => {
      scope.__atlasCatalogSnapshotsV264r2.push({ ...(event as CustomEvent).detail, at: performance.now() });
    });
    window.addEventListener("atlas:catalog-source-resolution-v264", (event) => {
      scope.__atlasCatalogSourcesV264r2.push({ ...(event as CustomEvent).detail, at: performance.now() });
    });
  });

  const manifestResponse = await request.get("/api/atlas/content-packs/core/files/data/catalog-healpix-v10/manifest.json");
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json() as {
    version: string;
    manifestSha256: string;
    transfer: { coldTransferLimitBytes: number; coldUpperBoundBytes: number };
  };
  expect(manifest).toMatchObject({
    version: "v264r2-healpix-stream-catalog-v10",
    manifestSha256: "68fd59ae6d91a9e7882fd20bc26f2052566c1eeed7667d3b751bbd8a3810cfc9",
  });
  expect(manifest.transfer.coldUpperBoundBytes).toBeLessThanOrEqual(manifest.transfer.coldTransferLimitBytes);

  const transferred: number[] = [];
  let archiveRangeResponses = 0;
  page.on("response", (response) => {
    const url = response.url();
    if (!url.includes("catalog-healpix-v10") && !url.includes("catalog-v9.source-directory.bin") && !url.includes("catalog-v8.bin")) return;
    const length = Number(response.headers()["content-length"] ?? 0);
    if (Number.isFinite(length) && length > 0) transferred.push(length);
    if (url.includes("catalog-v8.bin") && response.request().headers()["range"]) archiveRangeResponses += 1;
  });

  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator(ROOT)).toHaveCount(1);
  await page.getByRole("button", { name: "本地恒星", exact: true }).click();
  await page.waitForFunction(() => {
    const snapshots = (window as unknown as { __atlasCatalogSnapshotsV264r2?: Snapshot[] }).__atlasCatalogSnapshotsV264r2 ?? [];
    return snapshots.some((snapshot) => snapshot.status === "ready" && Number(snapshot.activeRecordCount) > 0);
  }, undefined, { timeout: 30_000 });

  const cold = await page.evaluate(() => {
    const snapshots = (window as unknown as { __atlasCatalogSnapshotsV264r2: Snapshot[] }).__atlasCatalogSnapshotsV264r2;
    const streaming = snapshots.find((snapshot) => snapshot.status === "streaming");
    const ready = snapshots.find((snapshot) => snapshot.status === "ready" && Number(snapshot.activeRecordCount) > 0);
    return { snapshots, streaming, ready };
  });
  expect(cold.ready).toMatchObject({ contract: "v10", fallback: "none", persistentCacheStatus: "ready" });
  expect(Number(cold.ready?.activeRangeRequests ?? -1)).toBe(0);
  expect(Number(cold.ready?.mergedRangeRequestCount ?? Number.POSITIVE_INFINITY)).toBeLessThanOrEqual(12);
  expect(Math.max(...cold.snapshots.map((snapshot) => Number(snapshot.activeRangeRequests ?? 0)))).toBeLessThanOrEqual(4);
  expect(Number(cold.ready?.memoryCacheBytes ?? 0)).toBeLessThanOrEqual(64 * 1024 * 1024);
  expect(Number(cold.ready?.readyMs ?? Number.POSITIVE_INFINITY)).toBeLessThanOrEqual(400);
  expect(Number(cold.ready?.at ?? 0) - Number(cold.streaming?.at ?? 0)).toBeLessThanOrEqual(400);
  expect(Number(cold.ready?.selectedRangeBytes ?? 0) + Number(cold.ready?.gapRangeBytes ?? 0)).toBe(Number(cold.ready?.transferredBytes ?? -1));
  expect(Number(cold.ready?.coldBootstrapBytes ?? -1)).toBe(transferred.reduce((sum, value) => sum + value, 0));
  expect(Number(cold.ready?.coldBootstrapBytes ?? Number.POSITIVE_INFINITY)).toBeLessThanOrEqual(2.5 * 1024 * 1024);
  expect(archiveRangeResponses).toBeLessThanOrEqual(12);
  const coldArchiveResponses = archiveRangeResponses;

  await page.waitForFunction(() => {
    const snapshots = (window as unknown as { __atlasCatalogSnapshotsV264r2?: Snapshot[] }).__atlasCatalogSnapshotsV264r2 ?? [];
    return snapshots.some((snapshot) =>
      snapshot.status === "ready" && Number(snapshot.activeRecordCount) > 0 &&
      Number(snapshot.persistentQueueDepth) === 0 && Number(snapshot.persistentCacheEntries) > 0 &&
      snapshot.persistentFlushStatus === "idle",
    );
  }, undefined, { timeout: 15_000 });

  const databaseState = await page.evaluate(async ({ database }) => {
    const request = indexedDB.open(database);
    const connection = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = connection.transaction(["metadata", "payloads"], "readonly");
    const count = (store: string) => new Promise<number>((resolve, reject) => {
      const countRequest = transaction.objectStore(store).count();
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });
    const [metadata, payloads] = await Promise.all([count("metadata"), count("payloads")]);
    const result = { stores: [...connection.objectStoreNames], metadata, payloads, version: connection.version };
    connection.close();
    return result;
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
      (window as unknown as { __atlasCatalogSnapshotsV264r2: Snapshot[] }).__atlasCatalogSnapshotsV264r2 = [];
    });
    await page.getByRole("button", { name: "本地恒星", exact: true }).click();
    await page.waitForFunction(() => {
      const snapshots = (window as unknown as { __atlasCatalogSnapshotsV264r2?: Snapshot[] }).__atlasCatalogSnapshotsV264r2 ?? [];
      return snapshots.some((snapshot) => snapshot.status === "ready" && Number(snapshot.activeRecordCount) > 0);
    }, undefined, { timeout: 15_000 });
    warmDurations.push(await page.evaluate(() => {
      const snapshots = (window as unknown as { __atlasCatalogSnapshotsV264r2: Snapshot[] }).__atlasCatalogSnapshotsV264r2;
      const streaming = snapshots.find((snapshot) => snapshot.status === "streaming");
      const ready = snapshots.find((snapshot) => snapshot.status === "ready" && Number(snapshot.activeRecordCount) > 0);
      return Number(ready?.at ?? 0) - Number(streaming?.at ?? 0);
    }));
  }
  const orderedWarm = [...warmDurations].sort((left, right) => left - right);
  expect(orderedWarm[Math.ceil(orderedWarm.length * 0.95) - 1]).toBeLessThanOrEqual(100);
  expect(archiveRangeResponses).toBe(coldArchiveResponses);

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("atlas:catalog-resolve-source-v264", { detail: { sourceId: "3235862721054592" } }));
  });
  await page.waitForFunction(() => {
    const sources = (window as unknown as { __atlasCatalogSourcesV264r2?: Array<Record<string, unknown>> }).__atlasCatalogSourcesV264r2 ?? [];
    return sources.some((entry) => entry.sourceId === "3235862721054592");
  }, undefined, { timeout: 15_000 });
  const source = await page.evaluate(() => {
    const sources = (window as unknown as { __atlasCatalogSourcesV264r2: Array<Record<string, unknown>> }).__atlasCatalogSourcesV264r2;
    return sources.find((entry) => entry.sourceId === "3235862721054592");
  });
  expect(source?.location).toMatchObject({ sourceId: "3235862721054592" });
});
