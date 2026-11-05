import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { enterAtlasResearchModeV263, expect, test, type Page } from "./atlasBrowserTestV263";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const SHELL = '[data-atlas-app-shell="v131-runtime-simplification-resource-lifecycle"]';
const SCALE = "[data-atlas-scale-band]";
const OUTPUT = "dist/science/performance-v275-diagnostic.json";

type PerformanceSampleV275 = {
  id: "overview" | "catalog-stellar" | "scale-galactic" | "research-workbench" | "visual-v274";
  medianFps: number;
  frameP95Ms: number;
  frameSamples: number;
  longestTaskMs: number;
  estimatedGpuBytes: number;
  rendererTextures: number;
  programs: number;
};

async function sample(page: Page, id: PerformanceSampleV275["id"]): Promise<PerformanceSampleV275> {
  await page.waitForTimeout(10_600);
  return page.locator(ROOT).evaluate((element, sampleId) => {
    const numeric = (attribute: string) => Number(element.getAttribute(attribute) ?? "NaN");
    return {
      id: sampleId,
      medianFps: numeric("data-atlas-runtime-median-fps"),
      frameP95Ms: numeric("data-atlas-runtime-frame-p95-ms"),
      frameSamples: numeric("data-atlas-runtime-frame-samples"),
      longestTaskMs: numeric("data-atlas-runtime-long-task-max-ms"),
      estimatedGpuBytes: numeric("data-atlas-render-resource-estimated-gpu-bytes"),
      rendererTextures: numeric("data-atlas-render-textures"),
      programs: numeric("data-atlas-render-programs"),
    };
  }, id) as Promise<PerformanceSampleV275>;
}

async function resources(page: Page) {
  return page.locator(SHELL).evaluate((element) => {
    const numeric = (attribute: string) => Number(element.getAttribute(attribute) ?? "NaN");
    return {
      total: numeric("data-atlas-resource-total"),
      workers: numeric("data-atlas-resource-workers"),
      renderTargets: numeric("data-atlas-resource-render-targets"),
      gpuBuffers: numeric("data-atlas-resource-gpu-buffers"),
      subscriptions: numeric("data-atlas-resource-subscriptions"),
      objectUrls: numeric("data-atlas-resource-object-urls"),
      typedArrayCaches: numeric("data-atlas-resource-typed-array-caches"),
      cameraLocks: numeric("data-atlas-resource-camera-locks"),
      estimatedBytes: numeric("data-atlas-resource-estimated-bytes"),
      estimatedGpuBytes: numeric("data-atlas-resource-estimated-gpu-bytes"),
    };
  });
}

test("records current-memory v275 catalog, scale, research and visual performance without promotion", async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator(ROOT)).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-render-programs", /[1-9]\d*/, { timeout: 30_000 });
  const baseline = await resources(page);
  const adapter = await page.locator("canvas").evaluate((canvas) => {
    const gl = (canvas as HTMLCanvasElement).getContext("webgl2") ?? (canvas as HTMLCanvasElement).getContext("webgl");
    if (!gl) return { renderer: "unavailable", vendor: "unavailable" };
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      renderer: String(debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)),
      vendor: String(debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR)),
    };
  });
  const samples: PerformanceSampleV275[] = [await sample(page, "overview")];

  const scale = page.locator(SCALE);
  const scaleButtons = scale.getByRole("button");
  await scaleButtons.nth(1).click();
  await expect(scale).toHaveAttribute("data-atlas-scale-band", "stellar", { timeout: 15_000 });
  await expect(scale).toHaveAttribute("data-atlas-scale-journey", "idle", { timeout: 15_000 });
  samples.push(await sample(page, "catalog-stellar"));

  await scaleButtons.nth(2).click();
  await expect(scale).toHaveAttribute("data-atlas-scale-band", "galactic", { timeout: 15_000 });
  await expect(scale).toHaveAttribute("data-atlas-scale-journey", "idle", { timeout: 15_000 });
  samples.push(await sample(page, "scale-galactic"));

  await scaleButtons.nth(0).click();
  await expect(scale).toHaveAttribute("data-atlas-scale-band", "solar", { timeout: 15_000 });
  await expect(scale).toHaveAttribute("data-atlas-scale-journey", "idle", { timeout: 15_000 });
  await enterAtlasResearchModeV263(page, testInfo);
  await page.locator('[data-atlas-gaia-analysis] > button:visible').click();
  const workbench = page.locator('[data-atlas-gaia-research-workbench="v271-shadow"]');
  await expect(workbench).toBeVisible();
  samples.push(await sample(page, "research-workbench"));
  await workbench.locator("header button").click();
  await expect(workbench).toHaveCount(0);

  await page.getByRole("button", { name: "Cinematic V3", exact: true }).click();
  await expect(page.locator('[data-atlas-science-cinematic-profile="science-cinematic-v3-v274"]')).toHaveCount(1);
  samples.push(await sample(page, "visual-v274"));
  await page.getByRole("button", { name: "Legacy V9", exact: true }).click();
  await page.waitForTimeout(2_000);
  const released = await resources(page);
  const softwareRenderer = /swiftshader|llvmpipe|software/i.test(`${adapter.renderer} ${adapter.vendor}`);
  const sceneMetricsPassed = samples.every((entry) => entry.frameSamples > 240
    && entry.medianFps >= (entry.id === "overview" ? 55 : 45)
    && entry.frameP95Ms <= 50
    && entry.estimatedGpuBytes <= 32 * 1024 * 1024);
  const resourcesReleased = JSON.stringify(released) === JSON.stringify(baseline);
  const report = {
    version: "v275-current-memory-performance-diagnostic-v1",
    generatedAt: new Date().toISOString(),
    formalQualificationApplied: false,
    adapter,
    softwareRenderer,
    samples,
    baseline,
    released,
    resourcesReleased,
    thresholds: {
      overviewMedianFpsMin: 55,
      sceneMedianFpsMin: 45,
      frameP95MsMax: 50,
      activeGpuBytesMax: 32 * 1024 * 1024,
    },
    passed: sceneMetricsPassed && !softwareRenderer && resourcesReleased,
    boundary: "current-memory-local-shadow-diagnostic-no-formal-or-science-promotion",
  };
  await mkdir(path.dirname(path.resolve(OUTPUT)), { recursive: true });
  await writeFile(path.resolve(OUTPUT), `${JSON.stringify(report, null, 2)}\n`);
  expect(report.passed, JSON.stringify(report, null, 2)).toBe(true);
});
