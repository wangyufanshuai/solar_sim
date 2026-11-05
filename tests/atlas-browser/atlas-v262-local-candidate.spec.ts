import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { enterAtlasResearchModeV263, expect, test } from "./atlasBrowserTestV263";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const SCREEN_ROOT = resolve(process.cwd(), "dist/visual/v262");

test("v262 streams real catalogs and exposes local Legacy/Candidate research A/B", async ({ page, request }, testInfo) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const missing: string[] = [];
  const viewport = page.viewportSize();
  const viewportTag = `${viewport?.width ?? 1440}x${viewport?.height ?? 900}`;
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("response", (response) => { if (response.status() === 404) missing.push(response.url()); });

  const range = await request.get("/api/atlas/content-packs/core/files/data/catalog-healpix-v8/catalog-v8.bin", { headers: { Range: "bytes=0-127" } });
  expect(range.status()).toBe(206);
  expect((await range.body()).byteLength).toBe(128);
  expect(range.headers()["content-range"]).toMatch(/^bytes 0-127\/39393216$/);

  const scienceRecord = await request.get("/api/atlas/science-record?sourceId=3235862721054592");
  expect(scienceRecord.status()).toBe(200);
  expect(await scienceRecord.json()).toMatchObject({ canonical: true, record: { sourceId: "3235862721054592", qualityTier: "gold" } });

  await mkdir(SCREEN_ROOT, { recursive: true });
  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator(ROOT)).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-render-programs", /[1-9]\d*/, { timeout: 30_000 });
  await page.screenshot({ path: resolve(SCREEN_ROOT, `legacy-v9-solar-${viewportTag}.png`), animations: "disabled" });

  await page.getByRole("button", { name: "Science Cinematic" }).click();
  await expect(page.locator(".atlas-science-cinematic")).toHaveCount(1);
  await expect(page.locator('[data-atlas-science-cinematic="visual-only-not-grmhd-or-physics"]')).toHaveCount(1);
  await page.screenshot({ path: resolve(SCREEN_ROOT, `science-cinematic-solar-${viewportTag}.png`), animations: "disabled" });

  const tileResponse = page.waitForResponse((response) => response.url().includes("catalog-v8.bin") && response.request().headers()["range"] !== undefined, { timeout: 30_000 });
  await page.getByRole("button", { name: "本地恒星" }).click();
  expect([200, 206]).toContain((await tileResponse).status());

  const openNgcResponse = page.waitForResponse((response) => response.url().includes("openngc-v260.json.gz"), { timeout: 30_000 });
  await page.getByRole("button", { name: "本星系群 / NGC" }).click();
  expect((await openNgcResponse).ok()).toBe(true);
  await page.screenshot({ path: resolve(SCREEN_ROOT, `science-cinematic-local-group-${viewportTag}.png`), animations: "disabled" });

  const cosmicflowsResponse = page.waitForResponse((response) => response.url().includes("/api/atlas/cosmicflows"), { timeout: 30_000 });
  await page.getByRole("button", { name: "近邻宇宙" }).click();
  const cosmicflows = await cosmicflowsResponse;
  expect(cosmicflows.status()).toBe(200);
  expect(cosmicflows.headers()["x-atlas-public-deployment-blocked"]).toBe("true");
  await page.screenshot({ path: resolve(SCREEN_ROOT, `science-cinematic-near-universe-${viewportTag}.png`), animations: "disabled" });

  await enterAtlasResearchModeV263(page, testInfo);
  await page.getByRole("button", { name: "今晚可见性" }).click();
  await expect(page.getByRole("region", { name: "地面观测规划器" })).toBeVisible();
  await page.getByRole("button", { name: "关闭观测规划器" }).click();
  await page.getByRole("button", { name: "Gaia 误差分析" }).click();
  const frozenResponse = page.waitForResponse((response) => response.url().includes("/api/atlas/science-record"), { timeout: 15_000 });
  await page.getByRole("button", { name: "分析冻结记录" }).click();
  expect((await frozenResponse).status()).toBe(200);
  await expect(page.getByText("4096", { exact: true })).toBeVisible({ timeout: 15_000 });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(missing).toEqual([]);
});
