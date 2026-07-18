import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const RECOMMENDED_TRANSFER_BYTES = 620 * 1024;
const HARD_MAX_TRANSFER_BYTES = 640 * 1024;

test("v192 cold Canvas-ready JavaScript transfer remains within the hard budget", async ({ page }) => {
  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  const root = page.locator(ROOT);
  await expect(root).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(root).toHaveAttribute("data-atlas-render-programs", /[1-9]\d*/, { timeout: 30_000 });
  const profile = await root.getAttribute("data-atlas-delivery-profile") ?? "standalone-full";
  const resources = await page.evaluate(() => performance.getEntriesByType("resource")
    .filter((entry): entry is PerformanceResourceTiming => entry instanceof PerformanceResourceTiming)
    .filter((entry) => entry.initiatorType === "script" || /\.js(?:\?|$)/.test(entry.name))
    .map((entry) => ({
      name: new URL(entry.name).pathname,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
    })));
  const transferBytes = resources.reduce(
    (sum, resource) => sum + (resource.transferSize || resource.encodedBodySize),
    0,
  );
  const report = {
    version: "v192-cold-client-bundle-budget",
    generatedAt: new Date().toISOString(),
    profile,
    milestone: "single-webgl-canvas-programs-ready",
    transferBytes,
    recommendedTransferBytes: RECOMMENDED_TRANSFER_BYTES,
    hardMaxTransferBytes: HARD_MAX_TRANSFER_BYTES,
    recommendedPassed: transferBytes > 0 && transferBytes <= RECOMMENDED_TRANSFER_BYTES,
    passed: transferBytes > 0 && transferBytes <= HARD_MAX_TRANSFER_BYTES,
    resourceCount: resources.length,
    resources,
  };
  const output = path.resolve(`dist/science/client-bundle-v192-${profile}.json`);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  expect(report.passed, JSON.stringify(report, null, 2)).toBe(true);
});
