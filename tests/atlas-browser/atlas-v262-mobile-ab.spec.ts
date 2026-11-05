import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const SCREEN_ROOT = resolve(process.cwd(), "dist/visual/v262");

test("v262 captures the mobile Legacy/Candidate local visual extension", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const missing: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("response", (response) => { if (response.status() === 404) missing.push(response.url()); });

  await mkdir(SCREEN_ROOT, { recursive: true });
  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator(ROOT)).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-render-programs", /[1-9]\d*/, { timeout: 30_000 });
  await page.screenshot({ path: resolve(SCREEN_ROOT, "legacy-v9-solar-390x844.png"), animations: "disabled" });

  await page.getByRole("button", { name: "Science Cinematic" }).click();
  await expect(page.locator(".atlas-science-cinematic")).toHaveCount(1);
  await page.screenshot({ path: resolve(SCREEN_ROOT, "science-cinematic-solar-390x844.png"), animations: "disabled" });

  const openNgcResponse = page.waitForResponse((response) => response.url().includes("openngc-v260.json.gz"), { timeout: 30_000 });
  await page.getByRole("button", { name: "本星系群 / NGC" }).click();
  expect((await openNgcResponse).ok()).toBe(true);
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.screenshot({ path: resolve(SCREEN_ROOT, "science-cinematic-local-group-390x844.png"), animations: "disabled" });

  const cosmicflowsResponse = page.waitForResponse((response) => response.url().includes("/api/atlas/cosmicflows"), { timeout: 30_000 });
  await page.getByRole("button", { name: "近邻宇宙" }).click();
  const cosmicflows = await cosmicflowsResponse;
  expect(cosmicflows.status()).toBe(200);
  expect(cosmicflows.headers()["x-atlas-public-deployment-blocked"]).toBe("true");
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.screenshot({ path: resolve(SCREEN_ROOT, "science-cinematic-near-universe-390x844.png"), animations: "disabled" });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(missing).toEqual([]);
});
