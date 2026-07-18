import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const DEFAULT_OUTPUT = "dist/science/performance-v5-report.json";
const DEFAULT_VERSION = "v153-hardware-performance-v5";

type SceneSample = {
  id: "overview" | "earth-inspect" | "gaia-stellar" | "launch" | "kerr";
  sceneMode: string;
  medianFps: number;
  frameP50Ms: number;
  frameP95Ms: number;
  longestTaskMs: number;
  frameSamples: number;
  drawCalls: number;
  triangles: number;
  programs: number;
  textures: number;
  renderTargets: number;
};

async function openNavigatorResult(page: Page, query: string, itemId: string): Promise<void> {
  await page.getByRole("button", { exact: true, name: "搜索" }).click();
  const navigator = page.getByRole("dialog", { exact: true, name: "图谱导航" });
  await expect(navigator).toBeVisible();
  await page.getByLabel("搜索图谱导航", { exact: true }).fill(query);
  await page.locator(`[data-atlas-navigator-item-id="${itemId}"]`).click();
  await expect(navigator).toBeHidden();
}

async function freshOverview(page: Page): Promise<void> {
  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator(ROOT)).toHaveCount(1);
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "atlas", { timeout: 30_000 });
}

async function sampleScene(page: Page, id: SceneSample["id"], minimumFps: number): Promise<SceneSample> {
  const root = page.locator(ROOT);
  await page.waitForTimeout(10_600);
  const sample = await root.evaluate((element, sampleId) => {
    const numeric = (attribute: string) => Number(element.getAttribute(attribute) ?? "NaN");
    return {
      id: sampleId,
      sceneMode: element.getAttribute("data-atlas-runtime-scene-mode") ?? "unknown",
      medianFps: numeric("data-atlas-runtime-median-fps"),
      frameP50Ms: numeric("data-atlas-runtime-frame-p50-ms"),
      frameP95Ms: numeric("data-atlas-runtime-frame-p95-ms"),
      longestTaskMs: numeric("data-atlas-runtime-long-task-max-ms"),
      frameSamples: numeric("data-atlas-runtime-frame-samples"),
      drawCalls: numeric("data-atlas-render-draw-calls"),
      triangles: numeric("data-atlas-render-triangles"),
      programs: numeric("data-atlas-render-programs"),
      textures: numeric("data-atlas-render-textures"),
      renderTargets: numeric("data-atlas-render-targets"),
    };
  }, id) as SceneSample;
  void minimumFps;
  return sample;
}

async function resourceSnapshot(page: Page) {
  return page.locator('[data-atlas-app-shell]').evaluate((element) => ({
    total: Number(element.getAttribute("data-atlas-resource-total") ?? "NaN"),
    workers: Number(element.getAttribute("data-atlas-resource-workers") ?? "NaN"),
    renderTargets: Number(element.getAttribute("data-atlas-resource-render-targets") ?? "NaN"),
    cameraLocks: Number(element.getAttribute("data-atlas-resource-camera-locks") ?? "NaN"),
  }));
}

test("records the named hardware performance gate without software fallback", async ({ page }, testInfo) => {
  const metadata = testInfo.config.metadata as Record<string, unknown>;
  const output = path.resolve(
    typeof metadata.performanceEvidenceOutput === "string"
      ? metadata.performanceEvidenceOutput
      : DEFAULT_OUTPUT,
  );
  const version = typeof metadata.performanceEvidenceVersion === "string"
    ? metadata.performanceEvidenceVersion
    : DEFAULT_VERSION;
  const runtimeBaseline = typeof metadata.performanceRuntimeBaseline === "string"
    ? metadata.performanceRuntimeBaseline
    : "development-server";
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await freshOverview(page);
  await page.waitForTimeout(1_500);
  const baseline = await resourceSnapshot(page);
  const adapter = await page.locator("canvas").first().evaluate((canvas) => {
    const target = canvas as HTMLCanvasElement;
    const gl = target.getContext("webgl2") ?? target.getContext("webgl");
    if (!gl) return { renderer: "unavailable", vendor: "unavailable" };
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      renderer: String(debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)),
      vendor: String(debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR)),
    };
  });
  const samples: SceneSample[] = [];
  samples.push(await sampleScene(page, "overview", 55));

  await freshOverview(page);
  await openNavigatorResult(page, "Earth", "solar-body:earth");
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "inspect");
  samples.push(await sampleScene(page, "earth-inspect", 45));

  await freshOverview(page);
  const gaiaSourceId = "4049506483413484672";
  await openNavigatorResult(page, gaiaSourceId, `gaia-star:${gaiaSourceId}`);
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "inspect");
  samples.push(await sampleScene(page, "gaia-stellar", 45));

  await freshOverview(page);
  await page.getByRole("button", { exact: true, name: "发射" }).click();
  await expect(page.locator('[data-launch-control-panel="true"]')).toBeVisible();
  await page.getByRole("button", { exact: true, name: "点火发射" }).click();
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "launch", { timeout: 15_000 });
  samples.push(await sampleScene(page, "launch", 45));

  await freshOverview(page);
  await openNavigatorResult(page, "Kerr", "panel:kerr-relativity-lab");
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "kerr");
  samples.push(await sampleScene(page, "kerr", 45));

  await freshOverview(page);
  await page.waitForTimeout(2_000);
  const released = await resourceSnapshot(page);
  const softwareRenderer = /swiftshader|llvmpipe|software/i.test(`${adapter.renderer} ${adapter.vendor}`);
  const resourcesReleased = JSON.stringify(released) === JSON.stringify(baseline);
  const sceneMetricsPassed = samples.every((sample) => {
    const minimumFps = sample.id === "overview" ? 55 : 45;
    return sample.frameSamples > 240 && sample.medianFps >= minimumFps && sample.frameP95Ms <= 50;
  });
  const passed = sceneMetricsPassed && !softwareRenderer && resourcesReleased && consoleErrors.length === 0 && pageErrors.length === 0;
  const report = {
    version,
    generatedAt: new Date().toISOString(),
    runtimeBaseline,
    viewport: { width: 1440, height: 900, dpr: await page.evaluate(() => window.devicePixelRatio) },
    browser: await page.evaluate(() => navigator.userAgent),
    adapter,
    softwareRenderer,
    windowMs: 10_000,
    samples,
    baseline,
    released,
    resourcesReleased,
    consoleErrors,
    pageErrors,
    thresholds: { overviewMedianFpsMin: 55, sceneMedianFpsMin: 45, frameP95MsMax: 50 },
    passed,
    boundary: "named-local-hardware-browser-observation-no-scientific-state-mutation",
  };
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  for (const sample of samples) {
    const minimumFps = sample.id === "overview" ? 55 : 45;
    expect(sample.frameSamples, `${sample.id} rolling frame samples`).toBeGreaterThan(240);
    expect(sample.medianFps, `${sample.id} median FPS`).toBeGreaterThanOrEqual(minimumFps);
    expect(sample.frameP95Ms, `${sample.id} P95 frame time`).toBeLessThanOrEqual(50);
  }
  expect(softwareRenderer, `hardware adapter: ${adapter.renderer}`).toBe(false);
  expect(resourcesReleased, "scene resources return to the overview baseline").toBe(true);
  expect(consoleErrors, "console errors").toEqual([]);
  expect(pageErrors, "page errors").toEqual([]);
});
