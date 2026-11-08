/**
 * Roadmap A4 same-camera captures: selects Orion (搜索 → canonical constellations → constellation:Ori),
 * captures the constellation view, then runs the five-stop Orion journey with 下一站 and captures
 * each stop once the journey reports "ready". Optionally (TIMING=1) records camera samples every
 * 100 ms during each transition to measure the easing and duration actually used.
 * Run with the dev server on :3001:  PW_CHANNEL=chrome npx tsx scripts/a4-journey-shots.mts <label>
 * Writes output/playwright/a4-journey/<label>-*.png and <label>-timing.json.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "playwright";

const label = process.argv[2] ?? "shot";
const outDir = "output/playwright/a4-journey";
mkdirSync(outDir, { recursive: true });
const JOURNEY = '[data-mainline-a-journey="orion-clouds-and-stars"]';

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || undefined,
  args: ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11", "--force_high_performance_gpu"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));

async function camera(p: Page) {
  return p.evaluate(() => {
    const node = document.querySelector("[data-atlas-camera-actual-forward]");
    const shell = document.querySelector("[data-atlas-app-shell]");
    return {
      t: performance.now(),
      forward: node?.getAttribute("data-atlas-camera-actual-forward"),
      position: node?.getAttribute("data-atlas-camera-actual-position"),
      progress: node?.getAttribute("data-atlas-camera-focus-progress") ?? shell?.getAttribute("data-atlas-camera-focus-progress"),
      state: shell?.getAttribute("data-atlas-camera-focus-state"),
      selected: shell?.getAttribute("data-celestial-catalog-selected-id"),
    };
  });
}

async function sampleUntilReady(index: number) {
  const samples = [];
  const start = Date.now();
  while (Date.now() - start < 15_000) {
    samples.push(await camera(page));
    const ready = await page.locator(`${JOURNEY}[data-mainline-a-journey-status="ready"][data-mainline-a-journey-index="${index}"]`).count();
    if (ready) break;
    await page.waitForTimeout(100);
  }
  return samples;
}

await page.goto("http://127.0.0.1:3001/", { waitUntil: "domcontentloaded" });
await page.locator("[data-atlas-app-shell]").waitFor({ timeout: 120_000 });
await page.locator('button[aria-label="搜索"]').click({ timeout: 120_000 });
const objects = page.locator("#universe-object-browser");
await objects.waitFor();
await objects.locator('[data-mainline-a-constellation-shortcut="canonical"]').click();
await objects.locator('[data-celestial-catalog-entry-id="constellation:Ori"]').press("Enter");
if (await objects.count()) await objects.getByRole("button", { name: "收起对象浏览器" }).press("Enter");
await page.waitForFunction(() => document.querySelector("[data-atlas-app-shell]")?.getAttribute("data-celestial-catalog-selected-id") === "constellation:Ori");
await page.waitForTimeout(Number(process.env.SETTLE_MS ?? 6000));
await page.screenshot({ path: `${outDir}/${label}-orion.png` });

const timing: unknown[] = [];
await page.locator('[data-mainline-a-journey-start="orion-clouds-and-stars"]').press("Enter");
timing.push({ index: 0, samples: await sampleUntilReady(0) });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/${label}-stop-0.png` });
for (let index = 1; index <= 4; index++) {
  await page.locator(JOURNEY).getByRole("button", { name: "下一站", exact: true }).press("Enter");
  timing.push({ index, samples: await sampleUntilReady(index) });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${outDir}/${label}-stop-${index}.png` });
}
writeFileSync(`${outDir}/${label}-timing.json`, JSON.stringify({ timing, errors }, null, 1));
console.log("errors:", errors.length);
await browser.close();
