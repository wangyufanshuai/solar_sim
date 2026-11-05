import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { enterAtlasResearchModeV263, expect, test } from "./atlasBrowserTestV263";

const SCREEN_ROOT = resolve(process.cwd(), "dist/visual/v266-observation-planner");

test("v266 runs the planner worker, exclusive research sheet, profiles, weather and exports", async ({ page }, testInfo) => {
  await page.route("**/api/atlas/locations?*", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      canonical: false,
      source: "Open-Meteo Geocoding",
      fetchedAt: "2026-07-20T00:00:00Z",
      results: [{ id: "1816670", name: "北京", admin1: "北京市", country: "中国", latitudeDeg: 39.9042, longitudeDeg: 116.4074, elevationM: 44, timeZone: "Asia/Shanghai" }],
    }),
  }));
  const weatherHour = new Date().toISOString().slice(0, 13) + ":00";
  await page.route("**/api/atlas/weather", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      canonical: false,
      source: "Open-Meteo",
      fetchedAt: "2026-07-20T00:00:00Z",
      expiresAt: "2026-07-20T00:30:00Z",
      weather: { hourly: {
        time: [weatherHour, new Date(Date.parse(`${weatherHour}Z`) + 3_600_000).toISOString().slice(0, 16)],
        cloud_cover_low: [20, 30], cloud_cover_mid: [35, 40], cloud_cover_high: [5, 10],
        relative_humidity_2m: [55, 58], visibility: [20_000, 18_000],
        precipitation_probability: [5, 8], wind_speed_10m: [12, 14],
      } },
    }),
  }));

  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator("canvas")).toHaveCount(1);
  await enterAtlasResearchModeV263(page, testInfo);
  await expect(page.locator('[data-atlas-observation-charts="v266-lazy-recharts"]')).toHaveCount(0);

  const trigger = page.getByRole("button", { name: "今晚可见性", exact: true });
  await trigger.click();
  const planner = page.getByRole("region", { name: "地面观测规划器" });
  await expect(planner).toBeVisible();
  await expect(page.getByRole("button", { name: "Gaia 误差分析" })).toHaveCount(0);
  await expect(page.locator('[data-atlas-scale-band]')).toHaveAttribute("aria-hidden", "true");

  await page.getByRole("button", { name: "手动 RA / Dec" }).click();
  await page.getByRole("button", { name: "更新观测计划" }).click();
  await expect(page.getByText(/Observation Worker .* ms/)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-atlas-observation-charts="v266-lazy-recharts"]')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("canvas")).toHaveCount(1);

  await page.getByPlaceholder("城市 / 地名").fill("北京");
  await planner.getByRole("button", { name: "搜索", exact: true }).click();
  await page.getByRole("button", { name: /北京.*北京市/ }).click();
  await expect(page.getByLabel("IANA 时区")).toHaveValue("Asia/Shanghai");

  await page.getByRole("button", { name: "保存当前", exact: true }).first().click();
  await expect(page.getByText("已保存观测点 1/10", { exact: true })).toBeVisible();
  await page.locator('input[type="file"][accept*="csv"]').setInputFiles({
    name: "invalid-horizon.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("0,5,unexpected\n"),
  });
  await expect(page.getByRole("status").filter({ hasText: /Invalid horizon mask row/ })).toBeVisible();

  await page.getByRole("button", { name: "获取天气", exact: true }).click();
  await expect(page.getByText(/2 hourly samples/)).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "JSON", exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^orbit-atlas-observation-.*\.json$/);

  await mkdir(SCREEN_ROOT, { recursive: true });
  await page.screenshot({
    path: resolve(SCREEN_ROOT, `${testInfo.project.name}.png`),
    animations: "disabled",
  });

  await page.keyboard.press("Escape");
  await expect(planner).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("button", { name: "Gaia 误差分析" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);
});
