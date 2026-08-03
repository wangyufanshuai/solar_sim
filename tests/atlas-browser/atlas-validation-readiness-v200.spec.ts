import { expect, test } from "./atlasBrowserTestV263";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';

test("deferred validation evidence becomes ready after panel intent", async ({ page }) => {
  const failedResponses: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator(ROOT)).toHaveCount(1);
  await page.locator('[data-atlas-accessibility-return-target="search"]').click();
  const navigator = page.locator('[role="dialog"][data-atlas-navigator-open="true"]');
  await navigator.locator("input[data-no-escape-clear]").fill("visual polish");
  await page.locator('[data-atlas-navigator-item-id="panel:validation-console"]').click();

  const console = page.locator('[data-atlas-validation-console-open="true"]').first();
  await expect(console).toBeVisible();
  await expect(console.locator('[data-atlas-validation-domain-id="visual-system"]')).toHaveCount(1, {
    timeout: 20_000,
  });
  await expect(console.locator('[data-atlas-validation-domain-id="relativity-verification"]')).toHaveCount(1);
  expect(failedResponses).toEqual([]);
});
