import { expect, test } from "@playwright/test";

test("v262 Lite remains usable while enforcing the Cosmicflows public blocker", async ({ page, request }) => {
  const blocked = await request.get("/api/atlas/cosmicflows");
  expect(blocked.status()).toBe(451);
  expect(await blocked.json()).toMatchObject({ error: expect.stringContaining("blocked") });
  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator('[data-atlas-delivery-profile="vercel-lite"]')).toHaveCount(1);
  await page.getByRole("button", { name: "本地恒星" }).click();
  await page.waitForTimeout(1_000);
  await expect(page.locator("canvas")).toHaveCount(1);
});
