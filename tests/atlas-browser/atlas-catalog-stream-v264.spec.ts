import { expect, test } from "./atlasBrowserTestV263";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';

test("v264 streams checksummed tiles, persists ranges and resolves selected sources", async ({ page, request }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    const scope = window as unknown as {
      __atlasCatalogSnapshotsV264: Array<Record<string, unknown>>;
      __atlasCatalogSourcesV264: Array<Record<string, unknown>>;
    };
    scope.__atlasCatalogSnapshotsV264 = [];
    scope.__atlasCatalogSourcesV264 = [];
    window.addEventListener("atlas:catalog-stream-snapshot-v264", (event) => {
      scope.__atlasCatalogSnapshotsV264.push({ ...(event as CustomEvent).detail, at: performance.now() });
    });
    window.addEventListener("atlas:catalog-source-resolution-v264", (event) => {
      scope.__atlasCatalogSourcesV264.push({ ...(event as CustomEvent).detail, at: performance.now() });
    });
  });

  const manifestResponse = await request.get("/api/atlas/content-packs/core/files/data/catalog-healpix-v9/manifest.json");
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json() as {
    version: string;
    manifestSha256: string;
    index: { byteLength: number };
    sourceIndex: { directory: { byteLength: number } };
  };
  expect(manifest).toMatchObject({ version: "v264-healpix-stream-catalog-v9" });
  expect(manifest.manifestSha256).toMatch(/^[a-f0-9]{64}$/);

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
  await page.getByRole("button", { name: "本地恒星", exact: true }).click();
  await page.waitForFunction(() => {
    const snapshots = (window as unknown as { __atlasCatalogSnapshotsV264?: Array<Record<string, unknown>> }).__atlasCatalogSnapshotsV264 ?? [];
    return snapshots.some((snapshot) => snapshot.status === "ready" && Number(snapshot.activeRecordCount) > 0);
  }, undefined, { timeout: 30_000 });

  const first = await page.evaluate(() => {
    const snapshots = (window as unknown as { __atlasCatalogSnapshotsV264: Array<Record<string, unknown>> }).__atlasCatalogSnapshotsV264;
    const streaming = snapshots.find((snapshot) => snapshot.status === "streaming");
    const ready = [...snapshots].reverse().find((snapshot) => snapshot.status === "ready" && Number(snapshot.activeRecordCount) > 0);
    return { snapshots, streaming, ready };
  });
  expect(first.ready).toMatchObject({ contract: "v9", fallback: "none", persistentCacheStatus: "ready", selectedSourceRetention: "not-requested" });
  expect(Number(first.ready?.activeRangeRequests ?? -1)).toBe(0);
  expect(Math.max(...first.snapshots.map((snapshot) => Number(snapshot.activeRangeRequests ?? 0)))).toBeLessThanOrEqual(4);
  expect(Number(first.ready?.persistentCacheBytes ?? 0)).toBeGreaterThan(0);
  expect(Number(first.ready?.persistentCacheBytes ?? 0)).toBeLessThanOrEqual(128 * 1024 * 1024);
  expect(Number(first.ready?.memoryCacheBytes ?? 0)).toBeLessThanOrEqual(64 * 1024 * 1024);
  expect(Number(first.ready?.at ?? 0) - Number(first.streaming?.at ?? 0)).toBeLessThanOrEqual(400);
  expect(transferred.reduce((sum, value) => sum + value, 0)).toBeLessThanOrEqual(2.5 * 1024 * 1024);
  const coldArchiveResponses = archiveRangeResponses;

  await page.evaluate(() => {
    (window as unknown as { __atlasCatalogSnapshotsV264: Array<Record<string, unknown>> }).__atlasCatalogSnapshotsV264 = [];
  });
  await page.getByRole("button", { name: "太阳系", exact: true }).click();
  await page.waitForTimeout(100);
  await page.getByRole("button", { name: "本地恒星", exact: true }).click();
  await page.waitForFunction(() => {
    const snapshots = (window as unknown as { __atlasCatalogSnapshotsV264?: Array<Record<string, unknown>> }).__atlasCatalogSnapshotsV264 ?? [];
    return snapshots.some((snapshot) => snapshot.status === "ready" && Number(snapshot.activeRecordCount) > 0);
  }, undefined, { timeout: 30_000 });
  const warmMs = await page.evaluate(() => {
    const snapshots = (window as unknown as { __atlasCatalogSnapshotsV264: Array<Record<string, unknown>> }).__atlasCatalogSnapshotsV264;
    const streaming = snapshots.find((snapshot) => snapshot.status === "streaming");
    const ready = [...snapshots].reverse().find((snapshot) => snapshot.status === "ready" && Number(snapshot.activeRecordCount) > 0);
    return Number(ready?.at ?? 0) - Number(streaming?.at ?? 0);
  });
  expect(warmMs).toBeLessThanOrEqual(100);
  expect(archiveRangeResponses).toBe(coldArchiveResponses);

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("atlas:catalog-resolve-source-v264", { detail: { sourceId: "3235862721054592" } }));
  });
  await page.waitForFunction(() => {
    const sources = (window as unknown as { __atlasCatalogSourcesV264?: Array<Record<string, unknown>> }).__atlasCatalogSourcesV264 ?? [];
    return sources.some((entry) => entry.sourceId === "3235862721054592");
  }, undefined, { timeout: 15_000 });
  const source = await page.evaluate(() => {
    const sources = (window as unknown as { __atlasCatalogSourcesV264: Array<Record<string, unknown>> }).__atlasCatalogSourcesV264;
    return sources.find((entry) => entry.sourceId === "3235862721054592");
  });
  expect(source?.location).toMatchObject({ sourceId: "3235862721054592" });

  const persistent = await page.evaluate(async () => {
    const request = indexedDB.open("orbit-atlas-catalog-cache-v1", 1);
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const countRequest = database.transaction("entries", "readonly").objectStore("entries").count();
    const count = await new Promise<number>((resolve, reject) => {
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });
    database.close();
    return count;
  });
  expect(persistent).toBeGreaterThan(0);
});
