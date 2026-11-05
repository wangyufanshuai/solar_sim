import { expect, test } from "./atlasBrowserTestV263";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const SHELL = '[data-atlas-app-shell]';

test("Kerr V3 target follows desktop and mobile-safe lifecycle", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const mobile = testInfo.project.name.includes("mobile");
  if (mobile) await page.setViewportSize({ width: 1440, height: 900 });
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator(ROOT)).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator(SHELL)).toHaveAttribute("data-atlas-resource-render-targets", "0");

  await page.getByRole("button", { exact: true, name: "视图" }).click();
  const kerrToggle = page.getByLabel("Kerr 相对论实验室", { exact: true });
  await kerrToggle.check();
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "kerr");
  await expect(page.locator('[data-kerr-ray-trace-version="v205-kerr-ray-trace-reference-v3"]')).toBeVisible();

  await expect(page.locator(SHELL)).toHaveAttribute("data-atlas-resource-render-targets", "1", {
    timeout: 15_000,
  });
  await expect(page.locator("canvas")).toHaveCount(1);

  if (mobile) {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "kerr");
    await expect(page.locator(SHELL)).toHaveAttribute("data-atlas-resource-render-targets", "0", {
      timeout: 15_000,
    });
    await expect(page.locator("canvas")).toHaveCount(1);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator(SHELL)).toHaveAttribute("data-atlas-resource-render-targets", "1", {
      timeout: 15_000,
    });
  }

  await kerrToggle.uncheck();
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "atlas");
  await expect(page.locator(SHELL)).toHaveAttribute("data-atlas-resource-render-targets", "0");
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
