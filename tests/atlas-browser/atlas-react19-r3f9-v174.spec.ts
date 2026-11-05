import { expect, test } from "./atlasBrowserTestV263";

test("Next 15 App Router mounts the React 19 / R3F 9 Canvas", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  const root = page.locator('[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]');
  await expect(root).toHaveCount(1, { timeout: 30_000 });
  await expect(page.getByText("Renderer Fault", { exact: true })).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(root).toHaveAttribute("data-atlas-runtime-scene-mode", "atlas");
  expect(errors).toEqual([]);
});
