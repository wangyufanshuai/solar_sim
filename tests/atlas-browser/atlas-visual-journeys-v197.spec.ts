import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  ATLAS_VISUAL_JOURNEY_MANIFEST_V193,
  atlasVisualJourneyScreenshotName,
  type AtlasVisualJourneyDefinition,
  type AtlasVisualJourneyKeyframe,
  type AtlasVisualViewportId,
} from "../../app/lib/atlasVisualJourneyManifestV193";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const CANDIDATE_ROOT = path.resolve("output/playwright/v197-visual-candidates");
const BASELINE_ROOT = path.resolve("tests/atlas-browser/visual-baselines/v197");
const UPDATE_BASELINES = process.env.ATLAS_UPDATE_VISUAL_BASELINES === "1";

type FrameEvidence = {
  journey: string;
  keyframe: AtlasVisualJourneyKeyframe;
  candidate: string;
  baseline: string;
  baselineStatus: "updated" | "compared" | "candidate-only";
  perceptualSimilarity: number | null;
  subjectCoverage: number | null;
  subjectBodyDiscCoverage: number | null;
  subjectSilhouetteCoverage: number | null;
  safeSceneRect: { left: number; top: number; right: number; bottom: number } | null;
  subjectCenterInsideSafeScene: boolean | null;
  visibleLabels: number;
  labelViolations: unknown[];
  cameraCommandMs: number | null;
};

const evidenceByViewport = new Map<AtlasVisualViewportId, FrameEvidence[]>();

function viewportId(testInfo: TestInfo): AtlasVisualViewportId {
  return testInfo.project.name.includes("390x844")
    ? "mobile-390x844"
    : "desktop-1440x900";
}

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function perceptualSimilarity(candidate: Buffer, baselineFile: string): Promise<number> {
  const [candidatePixels, baselinePixels] = await Promise.all([
    sharp(candidate).resize(96, 60, { fit: "fill" }).removeAlpha().raw().toBuffer(),
    sharp(baselineFile).resize(96, 60, { fit: "fill" }).removeAlpha().raw().toBuffer(),
  ]);
  let absoluteDifference = 0;
  const length = Math.min(candidatePixels.length, baselinePixels.length);
  for (let index = 0; index < length; index += 1) {
    absoluteDifference += Math.abs(candidatePixels[index]! - baselinePixels[index]!);
  }
  return 1 - absoluteDifference / Math.max(1, length * 255);
}

async function freshOverview(page: Page): Promise<void> {
  await page.goto("/?presentation=sandbox&visualDiagnostics=1", { waitUntil: "domcontentloaded" });
  const root = page.locator(ROOT);
  await expect(root).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(root).toHaveAttribute("data-atlas-render-programs", /[1-9]\d*/, { timeout: 30_000 });
  await expect(root).toHaveAttribute("data-atlas-runtime-scene-mode", "atlas", { timeout: 30_000 });
}

async function openNavigatorResult(
  page: Page,
  query: string,
  itemId: string,
  expectedMode: string,
  expectFocusDispatch = true,
): Promise<number | null> {
  await page.locator('[data-atlas-accessibility-return-target="search"]').click();
  const navigator = page.locator('[role="dialog"][data-atlas-navigator-open="true"]');
  await expect(navigator).toBeVisible();
  await navigator.locator("input[data-no-escape-clear]").fill(query);
  const item = page.locator(`[data-atlas-navigator-item-id="${itemId}"]`);
  await expect(item).toHaveCount(1);
  const responseMs = expectFocusDispatch ? await item.evaluate((element) => new Promise<number>((resolve, reject) => {
    const onDispatch = (event: Event) => {
      window.clearTimeout(timeout);
      const detail = (event as CustomEvent<{ durationMs?: number }>).detail;
      resolve(detail?.durationMs ?? Number.POSITIVE_INFINITY);
    };
    const timeout = window.setTimeout(() => {
      window.removeEventListener("atlas:focus-command-dispatched", onDispatch);
      reject(new Error("Focus command dispatch evidence was not emitted"));
    }, 8_000);
    window.addEventListener("atlas:focus-command-dispatched", onDispatch, { once: true });
    (element as HTMLElement).click();
  })) : (await item.click(), null);
  await expect(navigator).toBeHidden();
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", expectedMode, { timeout: 8_000 });
  return responseMs;
}

async function setWorkbenchSection(page: Page, section: "simulation" | "launch" | "lab"): Promise<void> {
  const button = page.locator(`[data-atlas-section="${section}"]`);
  await expect(button).toHaveCount(1);
  await button.evaluate((element) => (element as HTMLElement).click());
}

async function captureFrame(
  page: Page,
  testInfo: TestInfo,
  journey: AtlasVisualJourneyDefinition,
  keyframe: AtlasVisualJourneyKeyframe,
  cameraCommandMs: number | null = null,
): Promise<void> {
  const viewport = viewportId(testInfo);
  const settle = viewport === "mobile-390x844"
    ? ATLAS_VISUAL_JOURNEY_MANIFEST_V193.metrics.mobileSettleMs[1]
    : ATLAS_VISUAL_JOURNEY_MANIFEST_V193.metrics.desktopSettleMs[1];
  await page.waitForTimeout(keyframe === "exit"
    ? ATLAS_VISUAL_JOURNEY_MANIFEST_V193.metrics.exitSettleMs[1]
    : settle);

  const screenshotName = atlasVisualJourneyScreenshotName(viewport, journey.id, keyframe);
  const candidateFile = path.join(CANDIDATE_ROOT, screenshotName);
  const baselineFile = path.join(BASELINE_ROOT, screenshotName);
  await mkdir(path.dirname(candidateFile), { recursive: true });
  const screenshot = await page.screenshot({ animations: "disabled", fullPage: false });
  await writeFile(candidateFile, screenshot);

  let baselineStatus: FrameEvidence["baselineStatus"] = "candidate-only";
  let similarity: number | null = null;
  if (UPDATE_BASELINES) {
    await mkdir(path.dirname(baselineFile), { recursive: true });
    await writeFile(baselineFile, screenshot);
    baselineStatus = "updated";
    similarity = 1;
  } else if (await exists(baselineFile)) {
    similarity = await perceptualSimilarity(screenshot, baselineFile);
    baselineStatus = "compared";
    expect(
      similarity,
      `${journey.id}/${keyframe} perceptual similarity fell below the v197 review floor`,
    ).toBeGreaterThanOrEqual(ATLAS_VISUAL_JOURNEY_MANIFEST_V193.metrics.perceptualReviewWarningBelow);
  }

  const margin = viewport === "mobile-390x844" ? 12 : 10;
  const gap = viewport === "mobile-390x844"
    ? ATLAS_VISUAL_JOURNEY_MANIFEST_V193.metrics.mobileOccluderGapPx
    : ATLAS_VISUAL_JOURNEY_MANIFEST_V193.metrics.desktopOccluderGapPx;
  const layout = await page.evaluate(({ marginPx, gapPx }) => {
    const labels = Array.from(document.querySelectorAll<HTMLElement>(
      "[data-orbit-atlas-label], [data-gaia-star-label], [data-deep-sky-label-id], [data-constellation-label]",
    )).filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && rect.width >= 1 && rect.height >= 1;
    });
    const occluders = Array.from(document.querySelectorAll<HTMLElement>(
      '[data-atlas-cinematic-hud="bottom-dock"], [data-physics-performance-hud="true"], [data-launch-control-panel="true"], [data-atlas-scene-lab], [data-atlas-accessibility-surface-id], #universe-object-browser',
    )).filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
    });
    const violations = labels.flatMap((label) => {
      const rect = label.getBoundingClientRect();
      const id = label.dataset.orbitAtlasLabel ?? label.dataset.gaiaStarLabel ?? label.dataset.deepSkyLabelId ?? label.dataset.constellationLabel ?? "unknown";
      const issues: string[] = [];
      if (rect.left < marginPx || rect.top < marginPx || rect.right > innerWidth - marginPx || rect.bottom > innerHeight - marginPx) {
        issues.push("safe-viewport");
      }
      for (const occluder of occluders) {
        if (occluder.contains(label)) continue;
        const other = occluder.getBoundingClientRect();
        const separated = rect.right + gapPx <= other.left || rect.left >= other.right + gapPx || rect.bottom + gapPx <= other.top || rect.top >= other.bottom + gapPx;
        if (!separated) {
          issues.push(`ui-gap:${occluder.dataset.atlasAccessibilitySurfaceId ?? occluder.id ?? occluder.tagName}`);
          break;
        }
      }
      return issues.length ? [{ id, rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }, issues }] : [];
    });
    return { visibleLabels: labels.length, violations };
  }, { marginPx: margin, gapPx: gap });
  expect(layout.violations, `${journey.id}/${keyframe} label layout violations`).toEqual([]);

  const diagnostics = page.locator('[data-atlas-visual-diagnostics-surface="v217"]');
  await expect(diagnostics).toHaveCount(1);
  const subjectMetrics = await diagnostics.evaluate((element) => {
    const positiveNumber = (name: string) => {
      const value = Number(element.getAttribute(name));
      return Number.isFinite(value) && value > 0 ? value : null;
    };
    const finiteNumber = (name: string) => {
      const raw = element.getAttribute(name);
      if (raw == null || raw === "") return null;
      const value = Number(raw);
      return Number.isFinite(value) ? value : null;
    };
    const inside = element.getAttribute("data-atlas-subject-center-inside-safe-scene");
    const bodyInside = element.getAttribute("data-atlas-subject-body-disc-inside-safe-scene");
    const silhouetteInside = element.getAttribute("data-atlas-subject-silhouette-inside-safe-scene");
    const left = finiteNumber("data-atlas-visual-safe-left");
    const top = finiteNumber("data-atlas-visual-safe-top");
    const right = finiteNumber("data-atlas-visual-safe-right");
    const bottom = finiteNumber("data-atlas-visual-safe-bottom");
    return {
      subjectId: element.getAttribute("data-atlas-subject-id"),
      subjectX: finiteNumber("data-atlas-subject-screen-x"),
      subjectY: finiteNumber("data-atlas-subject-screen-y"),
      bodyDiameter: finiteNumber("data-atlas-subject-body-disc-diameter-px"),
      cameraSafeRect: element.getAttribute("data-atlas-camera-safe-rect"),
      bodyDiscCoverage: positiveNumber("data-atlas-subject-body-disc-coverage"),
      silhouetteCoverage: positiveNumber("data-atlas-subject-silhouette-coverage"),
      centerInsideSafeScene: inside === "true" ? true : inside === "false" ? false : null,
      bodyDiscInsideSafeScene: bodyInside === "true" ? true : bodyInside === "false" ? false : null,
      silhouetteInsideSafeScene: silhouetteInside === "true" ? true : silhouetteInside === "false" ? false : null,
      safeSceneRect: left !== null && top !== null && right !== null && bottom !== null
        ? { left, top, right, bottom }
        : null,
    };
  });
  const subjectCoverage = subjectMetrics.bodyDiscCoverage;
  if (subjectCoverage !== null && journey.id === "inspect" && keyframe !== "exit") {
    const range = subjectMetrics.subjectId === "saturn"
      ? ATLAS_VISUAL_JOURNEY_MANIFEST_V193.metrics.saturnBodyDiscCoverage
      : ATLAS_VISUAL_JOURNEY_MANIFEST_V193.metrics.planetCoverage;
    expect(subjectCoverage).toBeGreaterThanOrEqual(range[0]);
    expect(subjectCoverage).toBeLessThanOrEqual(range[1]);
    expect(subjectMetrics.centerInsideSafeScene).toBe(true);
    expect(
      subjectMetrics.bodyDiscInsideSafeScene,
      `${journey.id}/${keyframe} subject bounds ${JSON.stringify(subjectMetrics)}`,
    ).toBe(true);
    if (subjectMetrics.subjectId === "saturn" && subjectMetrics.silhouetteCoverage !== null) {
      expect(subjectMetrics.silhouetteCoverage).toBeLessThanOrEqual(
        ATLAS_VISUAL_JOURNEY_MANIFEST_V193.metrics.saturnTotalSilhouetteCoverageMax,
      );
    }
  }
  if (subjectCoverage !== null && journey.id === "stellar-exoplanet" && keyframe !== "exit") {
    expect(subjectCoverage).toBeGreaterThanOrEqual(ATLAS_VISUAL_JOURNEY_MANIFEST_V193.metrics.stellarCoverage[0]);
    expect(subjectCoverage).toBeLessThanOrEqual(ATLAS_VISUAL_JOURNEY_MANIFEST_V193.metrics.stellarCoverage[1]);
  }
  if (cameraCommandMs !== null) {
    expect(cameraCommandMs).toBeLessThan(ATLAS_VISUAL_JOURNEY_MANIFEST_V193.metrics.cameraResponseMaxMs);
  }

  const evidence = evidenceByViewport.get(viewport) ?? [];
  evidence.push({
    journey: journey.id,
    keyframe,
    candidate: path.relative(process.cwd(), candidateFile),
    baseline: path.relative(process.cwd(), baselineFile),
    baselineStatus,
    perceptualSimilarity: similarity,
    subjectCoverage,
    subjectBodyDiscCoverage: subjectMetrics.bodyDiscCoverage,
    subjectSilhouetteCoverage: subjectMetrics.silhouetteCoverage,
    safeSceneRect: subjectMetrics.safeSceneRect,
    subjectCenterInsideSafeScene: subjectMetrics.centerInsideSafeScene,
    visibleLabels: layout.visibleLabels,
    labelViolations: layout.violations,
    cameraCommandMs,
  });
  evidenceByViewport.set(viewport, evidence);
}

for (const journey of ATLAS_VISUAL_JOURNEY_MANIFEST_V193.journeys) {
  test(`${journey.label} captures entry, hero, and exit`, async ({ page }, testInfo) => {
    await freshOverview(page);
    if (journey.id === "overview") {
      await captureFrame(page, testInfo, journey, "entry");
      await captureFrame(page, testInfo, journey, "hero");
      await page.keyboard.press("Escape");
      await captureFrame(page, testInfo, journey, "exit");
      return;
    }
    if (journey.id === "inspect") {
      const earthMs = await openNavigatorResult(page, "Earth", "solar-body:earth", "inspect");
      await captureFrame(page, testInfo, journey, "entry", earthMs);
      const saturnMs = await openNavigatorResult(page, "Saturn", "solar-body:saturn", "inspect");
      await captureFrame(page, testInfo, journey, "hero", saturnMs);
      await page.keyboard.press("Escape");
    } else if (journey.id === "stellar-exoplanet") {
      const siriusMs = await openNavigatorResult(page, "Sirius", "celestial-object:nearby-star:sirius", "inspect");
      await captureFrame(page, testInfo, journey, "entry", siriusMs);
      const trappistMs = await openNavigatorResult(page, "TRAPPIST-1", "exoplanet-system:trappist-1", "exoplanet-system");
      await captureFrame(page, testInfo, journey, "hero", trappistMs);
      await page.keyboard.press("Escape");
    } else if (journey.id === "launch") {
      await setWorkbenchSection(page, "launch");
      await expect(page.locator('[data-launch-control-panel="true"]')).toBeVisible();
      await captureFrame(page, testInfo, journey, "entry");
      await page.locator('[data-atlas-launch-action="ignite"]').click();
      await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "launch", { timeout: 15_000 });
      await captureFrame(page, testInfo, journey, "hero");
      await page.locator('[data-atlas-launch-action="abort"]').click();
    } else if (journey.id === "relativity") {
      const mercuryMs = await openNavigatorResult(page, "Mercury", "solar-body:mercury", "inspect");
      await captureFrame(page, testInfo, journey, "entry", mercuryMs);
      await openNavigatorResult(page, "Kerr", "panel:kerr-relativity-lab", "kerr", false);
      await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-selected-body-closeup-active", "false");
      await expect(page.locator('[data-kerr-accretion-boundary="display-model-not-grmhd"]')).toBeVisible();
      await captureFrame(page, testInfo, journey, "hero");
      await page.keyboard.press("Escape");
      if (await page.locator(ROOT).getAttribute("data-atlas-runtime-scene-mode") === "kerr") {
        await page.keyboard.press("Escape");
      }
    } else {
      await setWorkbenchSection(page, "lab");
      await expect(page.locator('[data-atlas-scene-lab="v138-controlled-scene-lab"]')).toBeVisible();
      await captureFrame(page, testInfo, journey, "entry");
      await page.locator('[data-atlas-scene-lab-parameter="displayExposure"]').fill("1.1");
      await captureFrame(page, testInfo, journey, "hero");
      await setWorkbenchSection(page, "simulation");
    }
    await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "atlas", { timeout: 15_000 });
    await captureFrame(page, testInfo, journey, "exit");
  });
}

test.afterAll(async ({}, testInfo) => {
  const viewport = viewportId(testInfo);
  const frames = evidenceByViewport.get(viewport) ?? [];
  const output = path.join(CANDIDATE_ROOT, viewport, "visual-report.json");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify({
    version: "v197-six-journey-visual-candidate-matrix",
    generatedAt: new Date().toISOString(),
    viewport,
    updateBaselines: UPDATE_BASELINES,
    expectedFrameCount: 18,
    frameCount: frames.length,
    frames,
  }, null, 2)}\n`);
  if (!testInfo.config.grep) expect(frames).toHaveLength(18);
});
