/**
 * Roadmap A4: per-frame view-direction profile of one sky focus transition (default M42 -> M57).
 * Records data-atlas-camera-actual-forward on every animation frame inside the page.
 * Run with the dev server on :3001:  PW_CHANNEL=chrome npx tsx scripts/a4-turn-profile.mts <label>
 * Writes output/playwright/a4-journey/<label>-turn.json.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "playwright";

const label = process.argv[2] ?? "turn";
const [from, to] = (process.env.PAIR ?? "nebula:m42,nebula:m57").split(",");
mkdirSync("output/playwright/a4-journey", { recursive: true });
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined,
  args: ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function select(p: Page, id: string) {
  await p.locator('button[aria-label="搜索"]').click({ timeout: 120_000 });
  const objects = p.locator("#universe-object-browser");
  await objects.waitFor();
  const sections = objects.locator("button[aria-expanded]");
  for (let i = 0; i < await sections.count(); i++) {
    const section = sections.nth(i);
    if (await section.getAttribute("aria-expanded") === "false") await section.press("Enter");
  }
  await objects.locator(`[data-celestial-catalog-entry-id="${id}"]`).press("Enter");
  if (await objects.count()) await objects.getByRole("button", { name: "收起对象浏览器" }).press("Enter");
}

await page.goto("http://127.0.0.1:3001/", { waitUntil: "domcontentloaded" });
await page.locator("[data-atlas-app-shell]").waitFor({ timeout: 120_000 });
await select(page, from);
await page.waitForFunction(() => document.querySelector("[data-atlas-app-shell]")?.getAttribute("data-atlas-camera-focus-state") === "locked", null, { timeout: 30_000 });
await page.waitForTimeout(3000);
// A string, so the bundler cannot inject helpers into the page-side recorder.
await page.evaluate(`(() => {
  window.__turn = [];
  const tick = () => {
    const node = document.querySelector("[data-atlas-camera-actual-forward]");
    const shell = document.querySelector("[data-atlas-app-shell]");
    window.__turn.push({ t: performance.now(), f: node ? node.getAttribute("data-atlas-camera-actual-forward") : null,
      p: shell ? shell.getAttribute("data-atlas-camera-focus-progress") : null });
    if (window.__turn.length < 400) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})()`);
await select(page, to);
await page.waitForTimeout(4000);
const samples = await page.evaluate("window.__turn");
writeFileSync(`output/playwright/a4-journey/${label}-turn.json`, JSON.stringify({ from, to, samples }));
await browser.close();
