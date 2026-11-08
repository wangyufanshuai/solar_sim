/**
 * Roadmap A2 same-camera screenshots: opens the default Orbit Atlas route, uses
 * 恒星图集 → 查看 <star> → 在星空中定位 for each sample star, and captures the scene.
 * Run with the dev server on :3001:  PW_CHANNEL=chrome npx tsx scripts/a2-star-shots.mts <label>
 * Writes output/playwright/a2-stars/<label>-<star>.png (1440x900).
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const label = process.argv[2] ?? "shot";
const starsEnv = process.env.STARS ?? "Sirius A,Betelgeuse,Rigel"; // "ALL" = every 查看 button in 恒星图集
const outDir = "output/playwright/a2-stars";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || undefined,
  args: ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11", "--force_high_performance_gpu"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let stars = starsEnv.split(",");
if (starsEnv === "ALL") {
  await page.goto("http://127.0.0.1:3001/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "恒星图集" }).click({ timeout: 60_000 });
  await page.getByRole("button", { name: /^查看 / }).first().waitFor({ timeout: 30_000 });
  stars = (await page.getByRole("button", { name: /^查看 / }).allTextContents()).length
    ? await page.$$eval("button", (els) => els.map((e) => e.getAttribute("aria-label") ?? "").filter((n) => n.startsWith("查看 ")).map((n) => n.slice(3)))
    : [];
  console.log("stars:", stars.join(" | "));
}
for (const star of stars) {
  await page.goto("http://127.0.0.1:3001/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "恒星图集" }).click({ timeout: 60_000 });
  await page.getByRole("button", { name: `查看 ${star}` }).click({ timeout: 30_000 });
  await page.getByRole("button", { name: "在星空中定位" }).click({ timeout: 30_000 });
  await page.waitForTimeout(Number(process.env.SETTLE_MS ?? 8000));
  const file = `${outDir}/${label}-${star.replace(/\s+/g, "-").toLowerCase()}.png`;
  await page.screenshot({ path: file });
  console.log(file);
}
await browser.close();
