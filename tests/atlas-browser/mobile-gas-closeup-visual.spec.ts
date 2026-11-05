import { expect, test } from "./atlasBrowserTestV263";

test("mobile gas giant close-up keeps a low-noise background", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile-"), "mobile composition regression");
  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(
    page.locator('[data-atlas-app-shell="v131-runtime-simplification-resource-lifecycle"]'),
  ).toHaveCount(1);

  await page.getByRole("button", { exact: true, name: "搜索" }).click();
  await page.getByLabel("搜索图谱导航", { exact: true }).fill("Jupiter");
  await page.locator('[data-atlas-navigator-item-id="solar-body:jupiter"]').click();

  const root = page.locator('[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]');
  await expect(root).toHaveAttribute("data-atlas-selected-body-lighting-profile", "gas-giant-closeup");
  await expect(root).toHaveAttribute("data-atlas-selected-body-closeup-active", "true");
  await page.waitForTimeout(700);

  const screenshot = await page.screenshot({ fullPage: false });
  const ratio = await page.evaluate(async (url) => {
    const blob = await (await fetch(url)).blob();
    const image = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("2D screenshot context unavailable");
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    const stepX = Math.max(1, Math.floor(image.width / 160));
    const stepY = Math.max(1, Math.floor(image.height / 96));
    let backgroundSamples = 0;
    let backgroundHighNoise = 0;
    for (let y = Math.floor(image.height * 0.1); y < Math.floor(image.height * 0.82); y += stepY) {
      for (let x = Math.floor(image.width * 0.08); x < Math.floor(image.width * 0.84); x += stepX) {
        if (x >= image.width * 0.22 && y >= image.height * 0.18) continue;
        const index = (y * image.width + x) * 4;
        const luminance = pixels[index]! * 0.2126 + pixels[index + 1]! * 0.7152 + pixels[index + 2]! * 0.0722;
        backgroundSamples += 1;
        if (luminance > 88) backgroundHighNoise += 1;
      }
    }
    image.close();
    return backgroundSamples > 0 ? backgroundHighNoise / backgroundSamples : 1;
  }, `data:image/png;base64,${screenshot.toString("base64")}`);

  expect(ratio, "mobile gas close-up background high-noise ratio").toBeLessThan(0.28);
});
