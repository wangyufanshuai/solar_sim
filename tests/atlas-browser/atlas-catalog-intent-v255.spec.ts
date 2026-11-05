import { expect, test } from "./atlasBrowserTestV263";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const V255_CATALOG_ASSET = "gaia-dr3-nearby-46000-v255.json";
const LEGACY_CATALOG_ASSET = "gaia-dr3-bright-5000.json";

test("v255 defers the 46k catalog until Orbit Atlas or deep-space intent", async ({ page }) => {
  const requestedAssets: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes(V255_CATALOG_ASSET) || url.includes(LEGACY_CATALOG_ASSET)) {
      requestedAssets.push(url);
    }
  });

  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator(ROOT)).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.waitForTimeout(3_000);
  expect(requestedAssets.filter((url) => url.includes(V255_CATALOG_ASSET))).toHaveLength(0);

  const catalogResponse = page.waitForResponse(
    (response) => response.url().includes(V255_CATALOG_ASSET),
    { timeout: 30_000 },
  );
  await page.goto("/?presentation=orbitAtlas&budget=dense", { waitUntil: "domcontentloaded" });
  const response = await catalogResponse;
  expect(response.ok()).toBe(true);
  await expect(page.locator(ROOT)).toHaveAttribute("data-gaia-catalog-source", "gaia-dr3");
  expect(requestedAssets.filter((url) => url.includes(V255_CATALOG_ASSET))).toHaveLength(1);
  expect(requestedAssets.filter((url) => url.includes(LEGACY_CATALOG_ASSET))).toHaveLength(0);
});
