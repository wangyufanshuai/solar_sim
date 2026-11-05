import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';

test("Vercel Lite is interactive, self-contained and honest about disabled capabilities", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const notFound: string[] = [];
  const forbiddenRequests: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    const url = response.url();
    if (response.status() === 404) notFound.push(url);
  });
  page.on("request", (request) => {
    const url = request.url();
    if (/\/api\/atlas\/(content-packs|catalog-pack)/.test(url) || /127\.0\.0\.1:8765/.test(url)) {
      forbiddenRequests.push(url);
    }
  });

  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  const root = page.locator(ROOT);
  await expect(root).toHaveCount(1);
  await expect(root).toHaveAttribute("data-atlas-delivery-profile", "vercel-lite");
  await expect(root).toHaveAttribute("data-atlas-delivery-million-catalog", "disabled");
  await expect(root).toHaveAttribute("data-atlas-delivery-full-observations", "disabled");
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(root).toHaveAttribute("data-atlas-runtime-scene-mode", "atlas", { timeout: 30_000 });
  await page.waitForTimeout(3_000);

  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
  }));
  expect(overflow.document).toBeLessThanOrEqual(0);
  expect(overflow.body).toBeLessThanOrEqual(0);

  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(axe.violations).toEqual([]);
  expect(forbiddenRequests).toEqual([]);
  expect(notFound).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
