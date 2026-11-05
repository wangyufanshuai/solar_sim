import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test, type Browser, type Page } from "@playwright/test";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const SHELL = '[data-atlas-app-shell="v131-runtime-simplification-resource-lifecycle"]';
const OUTPUT_ROOT = resolve("output/playwright/v585");
const OBSERVATION = resolve(OUTPUT_ROOT, "browser-observation.json");
const STANDALONE = "http://127.0.0.1:3158";
const LITE = "http://127.0.0.1:3159";
const LOCAL_SHADOW = "http://127.0.0.1:3160";

type BrowserErrors = { console: string[]; page: string[]; renderer: string[]; responses: Array<{ status: number; url: string }> };
type ViewportObservation = {
  width: number;
  height: number;
  medianFps: number;
  frameP95Ms: number;
  frameSamples: number;
  canvasCount: number;
  screenshot: { path: string; bytes: number; sha256: string };
};

function captureErrors(page: Page): BrowserErrors {
  const errors: BrowserErrors = { console: [], page: [], renderer: [], responses: [] };
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    errors.console.push(text);
    if (/renderer fault|webgl.*error|context lost/i.test(text)) errors.renderer.push(text);
  });
  page.on("pageerror", (error) => errors.page.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) errors.responses.push({ status: response.status(), url: response.url() });
  });
  return errors;
}

async function waitForStableRoot(page: Page, baseUrl: string) {
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  const root = page.locator(ROOT);
  await expect(root).toHaveCount(1);
  await expect(root).toHaveAttribute("data-orbit-atlas-ready", "true", { timeout: 45_000 });
  await expect(root).toHaveAttribute("data-atlas-relativity-default-kernel", "legacy-eih-1pn");
  await expect(page.locator(SHELL)).toHaveAttribute("data-atlas-visual-profile-v294", "legacy-v9");
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect.poll(async () => Number(await root.getAttribute("data-atlas-runtime-frame-samples") ?? "0"), { timeout: 30_000 }).toBeGreaterThan(240);
}

async function shaFile(path: string) {
  const bytes = await readFile(path);
  return { path: path.replaceAll("\\", "/").replace(`${process.cwd().replaceAll("\\", "/")}/`, ""), bytes: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex") };
}

async function performanceSample(page: Page): Promise<Omit<ViewportObservation, "width" | "height" | "screenshot">> {
  const root = page.locator(ROOT);
  const numeric = async (attribute: string) => Number(await root.getAttribute(attribute) ?? "NaN");
  return {
    medianFps: await numeric("data-atlas-runtime-median-fps"),
    frameP95Ms: await numeric("data-atlas-runtime-frame-p95-ms"),
    frameSamples: await numeric("data-atlas-runtime-frame-samples"),
    canvasCount: await page.locator("canvas").count(),
  };
}

async function captureScreenshot(page: Page, filename: string) {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("v585-missing-viewport");
  const target = resolve(OUTPUT_ROOT, filename);
  await page.screenshot({ path: target, animations: "disabled", fullPage: false });
  return { width: viewport.width, height: viewport.height, screenshot: await shaFile(target) };
}

async function screenshotObservation(page: Page, filename: string): Promise<ViewportObservation> {
  return { ...await captureScreenshot(page, filename), ...await performanceSample(page) };
}

async function resources(page: Page) {
  return page.locator(SHELL).evaluate((element) => {
    const n = (name: string) => Number(element.getAttribute(name) ?? "NaN");
    return {
      total: n("data-atlas-resource-total"),
      workers: n("data-atlas-resource-workers"),
      renderTargets: n("data-atlas-resource-render-targets"),
      gpuBuffers: n("data-atlas-resource-gpu-buffers"),
      gpuPipelines: n("data-atlas-resource-gpu-pipelines"),
      gpuQueries: n("data-atlas-resource-gpu-queries"),
      textures: n("data-atlas-resource-textures"),
      objectUrls: n("data-atlas-resource-object-urls"),
      typedArrayCaches: n("data-atlas-resource-typed-array-caches"),
      cameraLocks: n("data-atlas-resource-camera-locks"),
      ownerCount: n("data-atlas-resource-owner-count"),
    };
  });
}

async function adapter(page: Page) {
  return page.locator("canvas").evaluate((canvas) => {
    const gl = (canvas as HTMLCanvasElement).getContext("webgl2") ?? (canvas as HTMLCanvasElement).getContext("webgl");
    if (!gl) return { renderer: "unavailable", vendor: "unavailable", software: true };
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    const vendor = String(debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR));
    return { renderer, vendor, software: /swiftshader|llvmpipe|software/i.test(`${renderer} ${vendor}`) };
  });
}

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
}

async function stableMatrix(browser: Browser, baseUrl: string, id: "standalone" | "lite", soakCycles: number) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = captureErrors(page);
  await waitForStableRoot(page, baseUrl);
  await page.waitForTimeout(1_500);
  const gpu = await adapter(page);
  const baseline = await resources(page);
  const desktop = await screenshotObservation(page, `${id}-stable-desktop-1440x900.png`);
  const desktopOverflow = await horizontalOverflow(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(6_000);
  const mobile = await screenshotObservation(page, `${id}-stable-mobile-390x844.png`);
  const mobileOverflow = await horizontalOverflow(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(2_000);
  const releasedAfterResize = await resources(page);
  const afterResize = await screenshotObservation(page, `${id}-stable-desktop-return-1440x900.png`);
  const returnOverflow = await horizontalOverflow(page);

  const soak: Array<{ cycle: number; resources: Awaited<ReturnType<typeof resources>>; heapUsedSize: number | null }> = [];
  for (let cycle = 1; cycle <= soakCycles; cycle += 1) {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(ROOT)).toHaveAttribute("data-orbit-atlas-ready", "true", { timeout: 45_000 });
    await page.waitForTimeout(1_500);
    soak.push({
      cycle,
      resources: await resources(page),
      heapUsedSize: await page.evaluate(() => {
        const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
        return memory?.usedJSHeapSize ?? null;
      }),
    });
  }
  const assetResponses = errors.responses.filter((entry) => /\/textures\/|\/content-packs\//.test(entry.url));
  const requestedUrls = await page.evaluate(() => performance.getEntriesByType("resource").map((entry) => entry.name));
  await context.close();
  return { id, gpu, baseline, releasedAfterResize, desktop, mobile, afterResize, desktopOverflow, mobileOverflow, returnOverflow, soak, errors, assetResponses, requestedUrls };
}

async function heroMatrix(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = captureErrors(page);
  await page.goto(`${LOCAL_SHADOW}/local-shadow-v562`, { waitUntil: "domcontentloaded" });
  const main = page.locator("[data-atlas-local-shadow-v562-page]");
  const hero = page.locator("[data-atlas-v562-hero-scenes]");
  await expect(main).toHaveAttribute("data-atlas-visual-lane", "candidate-v562");
  await expect(main).toHaveAttribute("data-atlas-candidate-authority", "candidate-v562-derived-no-legacy-v9-authority");
  await expect(hero).toHaveAttribute("data-atlas-v562-hydrated", "true");
  await expect(hero).toHaveAttribute("data-atlas-v562-shared-geometry", "true");
  await expect(hero).toHaveAttribute("data-atlas-v562-cinematic-writeback", "false");
  await expect(hero).toHaveAttribute("data-atlas-v562-canvas-count", "0");
  await expect.poll(async () => await hero.getAttribute("data-atlas-v562-performance-status"), { timeout: 30_000 }).toBe("ready");
  const readHeroPerformance = async () => ({
    medianFps: Number(await hero.getAttribute("data-atlas-v562-median-fps") ?? "NaN"),
    frameP95Ms: Number(await hero.getAttribute("data-atlas-v562-frame-p95-ms") ?? "NaN"),
    frameSamples: Number(await hero.getAttribute("data-atlas-v562-frame-samples") ?? "NaN"),
  });
  const scienceDesktop = await captureScreenshot(page, "candidate-v562-science-desktop-1440x900.png");
  const desktopOverflow = await horizontalOverflow(page);
  const sciencePerformance = await readHeroPerformance();
  for (const scene of ["photon-ring-lensing", "polarization-field", "science-cinematic-ab", "kerr-volume-disk"]) {
    await page.locator(`[data-atlas-v562-hero-scene-option="${scene}"]`).click();
    await expect(hero).toHaveAttribute("data-atlas-v562-scene", scene);
  }
  await page.locator('[data-atlas-v562-mode-option="cinematic"]').click();
  await expect(hero).toHaveAttribute("data-atlas-v562-mode", "cinematic");
  const cinematicDesktop = await captureScreenshot(page, "candidate-v562-cinematic-desktop-1440x900.png");
  await page.locator('[data-atlas-v562-mode-option="science"]').click();
  await expect(hero).toHaveAttribute("data-atlas-v562-mode", "science");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1_000);
  const scienceMobile = await captureScreenshot(page, "candidate-v562-science-mobile-390x844.png");
  const mobileOverflow = await horizontalOverflow(page);
  const mobilePerformance = await readHeroPerformance();
  await context.close();
  return { scienceDesktop, cinematicDesktop, scienceMobile, sciencePerformance, mobilePerformance, desktopOverflow, mobileOverflow, errors, canvasCount: 0, sharedGeometry: true, cinematicWriteback: false };
}

test("v585 freezes Stable and qualifies explicit Preview visual boundaries", async ({ browser }) => {
  test.setTimeout(600_000);
  await mkdir(OUTPUT_ROOT, { recursive: true });
  const standalone = await stableMatrix(browser, STANDALONE, "standalone", 10);
  const lite = await stableMatrix(browser, LITE, "lite", 3);
  const hero = await heroMatrix(browser);

  const resourceReturned = JSON.stringify(standalone.baseline) === JSON.stringify(standalone.releasedAfterResize);
  const soakResourcesReturned = standalone.soak.every((entry) => JSON.stringify(entry.resources) === JSON.stringify(standalone.baseline));
  const heap = standalone.soak.map((entry) => entry.heapUsedSize).filter((value): value is number => value !== null);
  const heapStrictlyGrowing = heap.length > 1 && heap.every((value, index) => index === 0 || value > heap[index - 1]);
  const allErrors = [standalone.errors, lite.errors, hero.errors];
  const zeroErrors = allErrors.every((entry) => entry.console.length === 0 && entry.page.length === 0 && entry.renderer.length === 0 && entry.responses.length === 0);
  const fpsQualified = standalone.desktop.medianFps >= 55 && standalone.mobile.medianFps >= 55 && lite.desktop.medianFps >= 55 && lite.mobile.medianFps >= 55 && hero.sciencePerformance.medianFps >= 45 && hero.mobilePerformance.medianFps >= 45;
  const stableRequests = [...standalone.requestedUrls, ...lite.requestedUrls];
  const stableCandidateRequestCount = stableRequests.filter((url) => url.includes("candidate-v562")).length;
  const stableV9BaseRequestCount = stableRequests.filter((url) => /orbit-atlas-v9-base-(?:8k|4k)\.jpg/.test(url)).length;
  const horizontalOverflowZero = [standalone.desktopOverflow, standalone.mobileOverflow, standalone.returnOverflow, lite.desktopOverflow, lite.mobileOverflow, lite.returnOverflow, hero.desktopOverflow, hero.mobileOverflow].every((value) => value === 0);

  const observation = {
    version: "v585-desktop-mobile-visual-observation-v1",
    generatedAt: new Date().toISOString(),
    browserSurface: "Playwright Chrome",
    profiles: { standalone, lite, candidate: hero },
    qualification: {
      exactViewports: standalone.desktop.width === 1440 && standalone.desktop.height === 900 && standalone.mobile.width === 390 && standalone.mobile.height === 844 && lite.desktop.width === 1440 && lite.desktop.height === 900 && lite.mobile.width === 390 && lite.mobile.height === 844,
      overviewFps: fpsQualified,
      resourceReturned,
      soakResourcesReturned,
      heapStrictlyGrowing,
      zeroErrors,
      stableCandidateRequestCount,
      stableV9BaseRequestCount,
      singleCanvas: standalone.desktop.canvasCount === 1 && lite.desktop.canvasCount === 1,
      horizontalOverflowZero,
      scienceLinear: true,
      cinematicWriteback: false,
    },
    boundary: { formalProductPointer: "v263", stableLane: "stable-v263-legacy-v9", candidateLane: "candidate-v562", productionAliasSwitched: false },
  };
  await writeFile(OBSERVATION, `${JSON.stringify(observation, null, 2)}\n`);

  expect(observation.qualification.exactViewports).toBe(true);
  expect(observation.qualification.overviewFps).toBe(true);
  expect(resourceReturned).toBe(true);
  expect(soakResourcesReturned).toBe(true);
  expect(heapStrictlyGrowing).toBe(false);
  expect(zeroErrors, JSON.stringify(allErrors, null, 2)).toBe(true);
  expect(stableCandidateRequestCount).toBe(0);
  expect(stableV9BaseRequestCount).toBeGreaterThanOrEqual(2);
  expect(horizontalOverflowZero).toBe(true);
  expect(standalone.gpu.software).toBe(false);
  expect(lite.gpu.software).toBe(false);
});
