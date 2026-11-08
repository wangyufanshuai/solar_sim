/**
 * Roadmap A3 same-camera screenshots: opens the default Orbit Atlas route, selects each nebula
 * through 搜索 → object browser, waits for the observation image, captures the default view, then
 * performs the same scripted orbit drag and captures again (that pair shows parallax or its absence).
 * Run with the dev server on :3001:  PW_CHANNEL=chrome npx tsx scripts/a3-nebula-shots.mts <label>
 * Writes output/playwright/a3-nebulae/<label>-<id>-{0,1}.png (1440x900).
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const label = process.argv[2] ?? "shot";
const ids = (process.env.NEBULAE ?? "m42,m20,ngc2237").split(",");
const outDir = "output/playwright/a3-nebulae";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || undefined,
  args: ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11", "--force_high_performance_gpu"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const id of ids) {
  await page.goto("http://127.0.0.1:3001/", { waitUntil: "domcontentloaded" });
  await page.locator("[data-atlas-app-shell]").waitFor({ timeout: 120_000 });
  await page.locator('button[aria-label="搜索"]').click({ timeout: 120_000 });
  const objects = page.locator("#universe-object-browser");
  await objects.waitFor();
  const sections = objects.locator("button[aria-expanded]");
  for (let i = 0; i < await sections.count(); i++) {
    const section = sections.nth(i);
    if (await section.getAttribute("aria-expanded") === "false") await section.press("Enter");
  }
  await objects.locator(`[data-celestial-catalog-entry-id="nebula:${id}"]`).press("Enter");
  if (await objects.count()) await objects.getByRole("button", { name: "收起对象浏览器" }).press("Enter");
  await page.locator(`[data-mainline-a-scene-nebula="${id}"][data-mainline-a-scene-image-status="ready"]`).waitFor({ timeout: 60_000 });
  await page.waitForTimeout(Number(process.env.SETTLE_MS ?? 6000));
  await page.screenshot({ path: `${outDir}/${label}-${id}-0.png` });
  await page.mouse.move(900, 450);
  await page.mouse.down();
  await page.mouse.move(1060, 470, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${outDir}/${label}-${id}-1.png` });
  console.log(id);
}
await browser.close();
