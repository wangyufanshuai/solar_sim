import { enterAtlasResearchModeV263, expect, test } from "./atlasBrowserTestV263";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const SHELL = '[data-atlas-app-shell="v131-runtime-simplification-resource-lifecycle"]';
const SCALE = '[data-atlas-scale-band]';
const SCENE_HOST = '[data-atlas-scene-host]';
const TEN_MILLION_PATH = "gaia-dr3-presentation-10000000-v9";

test("v275 standalone closes Gaia, scale, visual and lifecycle Shadow boundaries", async ({ page, request }, testInfo) => {
  const tenMillionRequests: string[] = [];
  page.on("request", (entry) => {
    if (entry.url().includes(TEN_MILLION_PATH)) tenMillionRequests.push(entry.url());
  });

  const overviewApi = await request.post("/api/atlas/science-workbench", { data: { kind: "overview" } });
  expect(overviewApi.status()).toBe(200);
  expect(await overviewApi.json()).toMatchObject({
    canonical: true,
    payload: { kind: "overview", frozenRows: 200_000 },
    boundary: "frozen-derived-analysis-not-gaia-survey-completeness-or-physics",
  });

  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator(ROOT)).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-render-programs", /[1-9]\d*/, { timeout: 30_000 });
  await expect(page.locator(SHELL)).toHaveAttribute("data-atlas-delivery-profile", "standalone-full");
  await page.waitForTimeout(500);
  expect(tenMillionRequests).toEqual([]);

  const initialRevision = await page.locator(SCENE_HOST).getAttribute("data-atlas-scene-host-revision");
  const initialWorkers = await page.locator(SHELL).getAttribute("data-atlas-resource-workers");
  const scale = page.locator(SCALE);
  const scaleButtons = scale.getByRole("button");
  const manifestResponse = page.waitForResponse(
    (response) => response.url().includes(`${TEN_MILLION_PATH}/manifest.json`),
    { timeout: 45_000 },
  );
  await scaleButtons.nth(1).click();
  await expect(scale).toHaveAttribute("data-atlas-scale-band", "stellar", { timeout: 15_000 });
  await expect(scale).toHaveAttribute("data-atlas-scale-journey", "idle", { timeout: 15_000 });
  expect((await manifestResponse).status()).toBe(200);
  expect(tenMillionRequests.length).toBeGreaterThan(0);

  await scaleButtons.nth(0).click();
  await expect(scale).toHaveAttribute("data-atlas-scale-band", "solar", { timeout: 15_000 });
  await expect(scale).toHaveAttribute("data-atlas-scale-journey", "idle", { timeout: 15_000 });
  await expect(page.locator(SCENE_HOST)).toHaveAttribute("data-atlas-scene-host-revision", initialRevision ?? "0");
  await expect(page.locator(SHELL)).toHaveAttribute("data-atlas-resource-workers", initialWorkers ?? "0", { timeout: 15_000 });

  await page.getByRole("button", { name: "Cinematic V3", exact: true }).click();
  await expect(page.locator(".atlas-science-cinematic-v3")).toHaveCount(1);
  await expect(page.locator('[data-atlas-science-cinematic-profile="science-cinematic-v3-v274"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Legacy V9", exact: true }).click();
  await expect(page.locator(".atlas-science-cinematic-v3")).toHaveCount(0);

  await enterAtlasResearchModeV263(page, testInfo);
  const workersBeforeWorkbench = await page.locator(SHELL).getAttribute("data-atlas-resource-workers");
  await page.locator('[data-atlas-gaia-analysis] > button:visible').click();
  const workbench = page.locator('[data-atlas-gaia-research-workbench="v271-shadow"]');
  await expect(workbench).toBeVisible();
  const overviewResponse = page.waitForResponse(
    (response) => response.url().includes("/api/atlas/science-workbench") && response.request().method() === "POST",
    { timeout: 30_000 },
  );
  await workbench.getByRole("navigation").getByRole("button").nth(1).click();
  expect((await overviewResponse).status()).toBe(200);
  await expect(workbench.getByText("200,000", { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  await expect(workbench).toHaveAttribute("data-atlas-physics-mutation", "not-applied");
  await workbench.locator("header button").click();
  await expect(workbench).toHaveCount(0);
  await expect(page.locator(SHELL)).toHaveAttribute("data-atlas-resource-workers", workersBeforeWorkbench ?? "0", { timeout: 15_000 });
  await expect(page.locator('[data-atlas-research-sheet="gaia-analysis"]')).toHaveCount(0);
});
