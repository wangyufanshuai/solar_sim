import { expect, test } from "@playwright/test";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';

test("Canvas survives a same-page cold reload before close-up focus", async ({ page }) => {
  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator(ROOT)).toHaveCount(1);

  await page.goto("about:blank", { waitUntil: "commit" });
  await page.waitForTimeout(120);
  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });

  const root = page.locator(ROOT);
  await expect(root).toHaveCount(1);
  await page.getByRole("button", { exact: true, name: "搜索" }).click();
  await page.getByLabel("搜索图谱导航", { exact: true }).fill("Earth");
  await page.locator('[data-atlas-navigator-item-id="solar-body:earth"]').click();
  await expect(root).toHaveAttribute("data-atlas-selected-body-closeup-active", "true");
  await expect(root).toHaveAttribute("data-atlas-render-programs", /^[1-9]\d*$/);

  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible();
  const screenshot = await canvas.screenshot();
  const brightRatio = await page.evaluate(async (url) => {
    const blob = await (await fetch(url)).blob();
    const image = await createImageBitmap(blob);
    const sample = document.createElement("canvas");
    sample.width = image.width;
    sample.height = image.height;
    const context = sample.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("2D screenshot context unavailable");
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    let samples = 0;
    let bright = 0;
    for (let y = 0; y < image.height; y += Math.max(1, Math.floor(image.height / 80))) {
      for (let x = 0; x < image.width * 0.75; x += Math.max(1, Math.floor(image.width / 120))) {
        const index = (y * image.width + x) * 4;
        const luminance = pixels[index]! * 0.2126 + pixels[index + 1]! * 0.7152 + pixels[index + 2]! * 0.0722;
        samples += 1;
        if (luminance > 142) bright += 1;
      }
    }
    image.close();
    return samples > 0 ? bright / samples : 1;
  }, `data:image/png;base64,${screenshot.toString("base64")}`);

  expect(brightRatio, "reloaded Canvas must render a dark-space close-up").toBeLessThan(0.2);
});
