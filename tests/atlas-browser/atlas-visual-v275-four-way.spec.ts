import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { expect, test, type Page, type TestInfo } from "./atlasBrowserTestV263";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const DEFAULT_OUTPUT_ROOT = "output/playwright/v275-visual-four-way-current-memory";
const PROFILES = [
  { id: "legacy-v9", label: "Legacy V9", slug: "legacy" },
  { id: "science-cinematic-v256", label: "Cinematic V1", slug: "v261" },
  { id: "science-cinematic-v2-v269", label: "Cinematic V2", slug: "v269" },
  { id: "science-cinematic-v3-v274", label: "Cinematic V3", slug: "v274" },
] as const;
const SCENES = ["solar-overview", "earth-inspect", "stellar-catalog", "exoplanet", "launch", "kerr"] as const;

type Frame = {
  profile: typeof PROFILES[number]["id"];
  scene: typeof SCENES[number];
  path: string;
  sha256: string;
  bytes: number;
  width: number;
  height: number;
  meanLuma: number;
  p05Luma: number;
  p95Luma: number;
};

const framesByViewport = new Map<string, Frame[]>();
const sha256 = (value: Buffer) => createHash("sha256").update(value).digest("hex");
const viewportId = (testInfo: TestInfo) => testInfo.project.name.includes("mobile") ? "mobile-390x844" : "desktop-1440x900";
const visualOutputRoot = (testInfo: TestInfo) => path.resolve(
  typeof testInfo.config.metadata.visualOutputRoot === "string"
    ? testInfo.config.metadata.visualOutputRoot
    : DEFAULT_OUTPUT_ROOT,
);

async function freshOverview(page: Page): Promise<void> {
  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator(ROOT)).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-render-programs", /[1-9]\d*/, { timeout: 30_000 });
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "atlas", { timeout: 30_000 });
}

async function selectProfile(page: Page, profile: typeof PROFILES[number]): Promise<void> {
  const button = page.locator('[data-atlas-visual-ab="v274-four-way-local-shadow"]').getByRole("button", { name: profile.label, exact: true });
  await expect(button).toBeVisible();
  if (await button.getAttribute("aria-pressed") !== "true") await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  const surface = page.locator("[data-atlas-science-cinematic-profile]");
  if (profile.id === "legacy-v9") await expect(surface).toHaveCount(0);
  else await expect(surface).toHaveAttribute("data-atlas-science-cinematic-profile", profile.id);
}

async function openNavigatorResult(page: Page, query: string, itemId: string, mode: string): Promise<void> {
  await page.locator('[data-atlas-accessibility-return-target="search"]').click();
  const navigator = page.locator('[role="dialog"][data-atlas-navigator-open="true"]');
  await expect(navigator).toBeVisible();
  await navigator.locator("input[data-no-escape-clear]").fill(query);
  const item = page.locator(`[data-atlas-navigator-item-id="${itemId}"]`);
  await expect(item).toBeVisible();
  await item.click();
  await expect(navigator).toBeHidden();
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", mode, { timeout: 15_000 });
}

async function returnToAtlas(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (await page.locator(ROOT).getAttribute("data-atlas-runtime-scene-mode") === "atlas") return;
    await page.keyboard.press("Escape");
  }
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "atlas", { timeout: 15_000 });
}

async function selectWorkbenchSection(page: Page, testInfo: TestInfo, section: "launch"): Promise<void> {
  const visibleSection = page.locator(`[data-atlas-section="${section}"]:visible`);
  if (await visibleSection.count() === 0 && testInfo.project.name.includes("mobile")) {
    const mobileMoreButton = page
      .locator('[data-atlas-cinematic-control-cluster="camera-tools"]')
      .getByRole("button")
      .last();
    await expect(mobileMoreButton).toBeVisible();
    await mobileMoreButton.click();
  }
  await expect(visibleSection).toHaveCount(1);
  await visibleSection.click();
}

async function capture(page: Page, testInfo: TestInfo, profile: typeof PROFILES[number], scene: typeof SCENES[number]): Promise<void> {
  await page.waitForTimeout(testInfo.project.name.includes("mobile") ? 900 : 1_100);
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.getByText("Renderer Fault", { exact: true })).toHaveCount(0);
  const buffer = await page.screenshot({ animations: "disabled", fullPage: false });
  const metadata = await sharp(buffer).metadata();
  const pixels = await sharp(buffer).resize(64, 36, { fit: "fill" }).removeAlpha().raw().toBuffer();
  const luma: number[] = [];
  for (let index = 0; index < pixels.length; index += 3) {
    luma.push(0.2126 * pixels[index]! + 0.7152 * pixels[index + 1]! + 0.0722 * pixels[index + 2]!);
  }
  luma.sort((left, right) => left - right);
  const percentile = (fraction: number) => luma[Math.min(luma.length - 1, Math.floor((luma.length - 1) * fraction))]!;
  const meanLuma = luma.reduce((sum, value) => sum + value, 0) / luma.length;
  const p05Luma = percentile(0.05);
  const p95Luma = percentile(0.95);
  expect(buffer.byteLength, `${profile.id}/${scene} screenshot bytes`).toBeGreaterThan(20_000);
  expect(meanLuma, `${profile.id}/${scene} mean luma`).toBeGreaterThan(2);
  expect(meanLuma, `${profile.id}/${scene} mean luma`).toBeLessThan(250);
  expect(p95Luma - p05Luma, `${profile.id}/${scene} luma dynamic range`).toBeGreaterThan(8);
  const viewport = viewportId(testInfo);
  const file = path.join(visualOutputRoot(testInfo), viewport, `${profile.slug}-${scene}.png`);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buffer);
  const frames = framesByViewport.get(viewport) ?? [];
  frames.push({
    profile: profile.id,
    scene,
    path: path.relative(process.cwd(), file).replaceAll("\\", "/"),
    sha256: sha256(buffer),
    bytes: buffer.byteLength,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    meanLuma: Number(meanLuma.toFixed(3)),
    p05Luma: Number(p05Luma.toFixed(3)),
    p95Luma: Number(p95Luma.toFixed(3)),
  });
  framesByViewport.set(viewport, frames);
}

test("captures the four-profile v275 local-shadow visual matrix", async ({ page }, testInfo) => {
  test.setTimeout(900_000);
  for (const profile of PROFILES) {
    await freshOverview(page);
    await selectProfile(page, profile);
    await capture(page, testInfo, profile, "solar-overview");

    await openNavigatorResult(page, "Earth", "solar-body:earth", "inspect");
    await capture(page, testInfo, profile, "earth-inspect");
    await returnToAtlas(page);

    const scale = page.locator("[data-atlas-scale-band]");
    const scaleButtons = scale.getByRole("button");
    await scaleButtons.nth(1).click();
    await expect(scale).toHaveAttribute("data-atlas-scale-band", "stellar", { timeout: 15_000 });
    await expect(scale).toHaveAttribute("data-atlas-scale-journey", "idle", { timeout: 15_000 });
    await capture(page, testInfo, profile, "stellar-catalog");
    await scaleButtons.nth(0).click();
    await expect(scale).toHaveAttribute("data-atlas-scale-band", "solar", { timeout: 15_000 });
    await expect(scale).toHaveAttribute("data-atlas-scale-journey", "idle", { timeout: 15_000 });

    await openNavigatorResult(page, "TRAPPIST-1", "exoplanet-system:trappist-1", "exoplanet-system");
    await capture(page, testInfo, profile, "exoplanet");
    await returnToAtlas(page);

    await selectWorkbenchSection(page, testInfo, "launch");
    await expect(page.locator('[data-launch-control-panel="true"]')).toBeVisible();
    await page.locator('[data-atlas-launch-action="ignite"]').click();
    await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "launch", { timeout: 15_000 });
    await capture(page, testInfo, profile, "launch");
    await page.locator('[data-atlas-launch-action="abort"]').click();
    await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "atlas", { timeout: 15_000 });

    await openNavigatorResult(page, "Kerr", "panel:kerr-relativity-lab", "kerr");
    await capture(page, testInfo, profile, "kerr");
    await returnToAtlas(page);
  }
});

test.afterAll(async ({}, testInfo) => {
  const viewport = viewportId(testInfo);
  const frames = framesByViewport.get(viewport) ?? [];
  const reportPath = path.resolve(
    typeof testInfo.config.metadata.visualReportOutput === "string"
      ? testInfo.config.metadata.visualReportOutput
      : `dist/science/visual-matrix-v275-${viewport}.json`,
  );
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify({
    version: "v275-four-profile-six-scene-visual-matrix-v1",
    generatedAt: new Date().toISOString(),
    viewport,
    profiles: PROFILES.map((entry) => entry.id),
    scenes: SCENES,
    expectedFrameCount: 24,
    frameCount: frames.length,
    frames,
    formalQualificationApplied: false,
    boundary: "current-memory-local-shadow-visual-matrix-formal-v263-retained",
  }, null, 2)}\n`);
  expect(frames).toHaveLength(24);
});
