/**
 * Roadmap A4 acceptance: (1) select each of the 12 roster constellations through 搜索 → canonical
 * shortcut, wait for the label layout, record placed/required labels and pending ids, then close
 * the passport (return) and record page errors; (2) Orion with lines+boundaries, lines off,
 * boundaries off, via the 图层 menu. Run with the dev server on :3001:
 *   PW_CHANNEL=chrome npx tsx scripts/a4-constellation-check.mts <label>
 * Writes output/playwright/a4-constellations/<label>-*.png and <label>-check.json.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "playwright";

const label = process.argv[2] ?? "check";
const outDir = "output/playwright/a4-constellations";
mkdirSync(outDir, { recursive: true });
const CODES = ["Ori", "UMa", "Cas", "Sco", "Cyg", "Gem", "Leo", "Cru", "Lyr", "Aql", "Tau", "Sgr"];
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined,
  args: ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors: { code: string; message: string }[] = [];
let current = "load";
page.on("pageerror", (error) => errors.push({ code: current, message: error.message }));
page.on("console", (message) => { if (message.type() === "error") errors.push({ code: current, message: message.text().slice(0, 300) }); });

async function select(p: Page, code: string) {
  await p.locator('button[aria-label="搜索"]').click({ timeout: 120_000 });
  const objects = p.locator("#universe-object-browser");
  await objects.waitFor();
  await objects.locator('[data-mainline-a-constellation-shortcut="canonical"]').click();
  await objects.locator(`[data-celestial-catalog-entry-id="constellation:${code}"]`).press("Enter");
  if (await objects.count()) await objects.getByRole("button", { name: "收起对象浏览器" }).press("Enter");
  await p.waitForFunction((id) => document.querySelector("[data-atlas-app-shell]")?.getAttribute("data-celestial-catalog-selected-id") === id, `constellation:${code}`);
}

await page.goto("http://127.0.0.1:3001/", { waitUntil: "domcontentloaded" });
await page.locator("[data-atlas-app-shell]").waitFor({ timeout: 120_000 });
const rows = [];
for (const code of CODES) {
  current = code;
  await select(page, code);
  await page.waitForFunction(() => document.querySelector("[data-atlas-app-shell]")?.getAttribute("data-atlas-camera-focus-state") === "locked", null, { timeout: 30_000 });
  await page.waitForTimeout(2500);
  const layout = await page.evaluate(`(() => {
    const t = document.querySelector('[data-mainline-a-constellation-label-layout]');
    return t ? { layout: t.getAttribute('data-mainline-a-constellation-label-layout'),
      required: Number(t.getAttribute('data-mainline-a-constellation-label-required-count')),
      placed: Number(t.getAttribute('data-mainline-a-constellation-label-placed-count')),
      pending: t.getAttribute('data-mainline-a-constellation-label-pending-ids'),
      figure: t.getAttribute('data-mainline-a-constellation-figure-visibility') } : null;
  })()`);
  await page.screenshot({ path: `${outDir}/${label}-${code}.png` });
  await page.getByRole("button", { name: "关闭天体档案" }).first().click({ timeout: 10_000 });
  await page.waitForTimeout(1500);
  const after = await page.evaluate(`document.querySelector("[data-atlas-app-shell]")?.getAttribute("data-celestial-catalog-selected-id") ?? ""`);
  rows.push({ code, layout, returnedSelection: after, errors: errors.filter((e) => e.code === code).length });
  console.log(code, JSON.stringify(layout), "after-close:", after || "(none)");
}

current = "layers";
await select(page, "Ori");
await page.waitForTimeout(3000);
await page.screenshot({ path: `${outDir}/${label}-layers-both.png` });
await page.locator('button[title="图层"]').click();
await page.getByLabel("星座连线").uncheck();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/${label}-layers-no-lines.png` });
await page.getByLabel("星座连线").check();
await page.getByLabel("星座边界").uncheck();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/${label}-layers-no-boundary.png` });
await page.getByLabel("星座边界").check();
writeFileSync(`${outDir}/${label}-check.json`, JSON.stringify({ rows, errors }, null, 1));
console.log("errors:", errors.length);
await browser.close();
