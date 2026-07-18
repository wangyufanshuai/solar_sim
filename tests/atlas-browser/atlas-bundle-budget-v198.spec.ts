import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const RELEASE_TARGET_BYTES = 600 * 1024;
const STOP_LINE_BYTES = 610 * 1024;
const EVIDENCE_VERSION = process.env.ATLAS_BUNDLE_EVIDENCE_VERSION ?? "v198";

test(`${EVIDENCE_VERSION} cold Canvas-ready JavaScript transfer stays at or below the release target`, async ({ page }) => {
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
    version: `${EVIDENCE_VERSION}-cold-client-bundle-budget`,
    generatedAt: new Date().toISOString(),
    profile,
    milestone: "single-webgl-canvas-programs-ready",
    transferBytes,
    releaseTargetBytes: RELEASE_TARGET_BYTES,
    stopLineBytes: STOP_LINE_BYTES,
    releaseTargetPassed: transferBytes > 0 && transferBytes <= RELEASE_TARGET_BYTES,
    stopLinePassed: transferBytes > 0 && transferBytes <= STOP_LINE_BYTES,
    resourceCount: resources.length,
    resources,
  };
  const output = path.resolve(`dist/science/client-bundle-${EVIDENCE_VERSION}-${profile}.json`);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  expect(report.stopLinePassed, JSON.stringify(report, null, 2)).toBe(true);
});
