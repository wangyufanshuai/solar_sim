import { expect, test } from "./atlasBrowserTestV263";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const TEN_MILLION_PATH = "gaia-dr3-presentation-10000000-v9";

test("v275 Lite stays usable and never probes standalone-only Gaia or research data", async ({ page, request }) => {
  const tenMillionRequests: string[] = [];
  page.on("request", (entry) => {
    if (entry.url().includes(TEN_MILLION_PATH)) tenMillionRequests.push(entry.url());
  });

  const research = await request.post("/api/atlas/science-workbench", { data: { kind: "overview" } });
  expect(research.status()).toBe(404);
  expect(await research.json()).toMatchObject({ boundary: "standalone-shadow-only-no-loopback" });
  const cosmic = await request.get("/api/atlas/cosmicflows");
  expect(cosmic.status()).toBe(451);

  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-render-programs", /[1-9]\d*/, { timeout: 30_000 });
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator('[data-atlas-delivery-profile="vercel-lite"]')).toHaveCount(1);
  const sceneHost = page.locator("[data-atlas-scene-host]");
  const revision = await sceneHost.getAttribute("data-atlas-scene-host-revision");
  const scale = page.locator("[data-atlas-scale-band]");
  await scale.getByRole("button").nth(1).click();
  await expect(scale).toHaveAttribute("data-atlas-scale-band", "stellar", { timeout: 15_000 });
  await expect(scale).toHaveAttribute("data-atlas-scale-journey", "idle", { timeout: 15_000 });
  await page.waitForTimeout(1_000);
  expect(tenMillionRequests).toEqual([]);
  await expect(sceneHost).toHaveAttribute("data-atlas-scene-host-revision", revision ?? "0");
});
