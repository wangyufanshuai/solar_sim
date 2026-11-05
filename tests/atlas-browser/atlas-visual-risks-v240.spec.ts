import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  atlasVisualRiskFramesForViewportV240,
  type AtlasVisualRiskFrameV240,
} from "../../app/lib/atlasVisualAcceptanceV240";
import type { AtlasVisualViewportId } from "../../app/lib/atlasVisualJourneyManifestV193";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const CANDIDATE_ROOT = path.resolve("output/playwright/v240-visual-candidates");

function viewportId(testInfo: TestInfo): AtlasVisualViewportId {
  return testInfo.project.name.includes("390x844")
    ? "mobile-390x844"
    : "desktop-1440x900";
}

async function freshOverview(page: Page): Promise<void> {
  await page.goto("/?presentation=sandbox&visualDiagnostics=1", {
    waitUntil: "commit",
    timeout: 30_000,
  });
  await expect(page.locator(ROOT)).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-render-programs", /[1-9]\d*/, {
    timeout: 30_000,
  });
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "atlas", {
    timeout: 30_000,
  });
}

async function openNavigatorItem(
  page: Page,
  query: string,
  itemId: string,
  expectedMode: string,
): Promise<void> {
  await page.locator('[data-atlas-accessibility-return-target="search"]').click();
  const dialog = page.locator('[role="dialog"][data-atlas-navigator-open="true"]');
  await expect(dialog).toBeVisible();
  await dialog.locator("input[data-no-escape-clear]").fill(query);
  await page.locator(`[data-atlas-navigator-item-id="${itemId}"]`).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", expectedMode, {
    timeout: 15_000,
  });
}

async function assertViewportIntegrity(page: Page): Promise<void> {
  const integrity = await page.evaluate(() => ({
    viewportWidth: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(integrity.documentWidth).toBeLessThanOrEqual(integrity.viewportWidth);
  expect(integrity.bodyWidth).toBeLessThanOrEqual(integrity.viewportWidth);
}

async function captureRiskFrame(
  page: Page,
  viewport: AtlasVisualViewportId,
  frame: AtlasVisualRiskFrameV240,
): Promise<string> {
  await assertViewportIntegrity(page);
  const relative = `${viewport}/risk-${frame.id}.png`;
  const output = path.join(CANDIDATE_ROOT, relative);
  await mkdir(path.dirname(output), { recursive: true });
  await page.screenshot({ path: output, animations: "disabled", fullPage: false });
  return relative;
}

const RISK_FRAME_IDS = [
  "mobile-launch-telemetry",
  "mobile-kerr",
  "desktop-overview",
  "desktop-saturn-rings",
] as const;

for (const frameId of RISK_FRAME_IDS) {
  test(`captures isolated v240 risk frame: ${frameId}`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const viewport = viewportId(testInfo);
    const frame = atlasVisualRiskFramesForViewportV240(viewport)
      .find((candidate) => candidate.id === frameId);
    test.skip(!frame, `${frameId} does not belong to ${viewport}`);
    if (!frame) return;

    await freshOverview(page);
    if (frame.id === "mobile-launch-telemetry") {
      await page.getByRole("button", { name: "更多" }).click();
      await page.locator('[data-atlas-section="launch"]:visible').click();
      const panel = page.locator('[data-launch-control-panel="true"]');
      await expect(panel).toBeVisible();
      const panelHeight = await panel.evaluate((element) => element.getBoundingClientRect().height);
      expect(panelHeight).toBeLessThanOrEqual(844 * 0.46 + 1);
      await page.locator('[data-atlas-launch-action="ignite"]').click();
      await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "launch", {
        timeout: 15_000,
      });
      const dock = page.locator('[data-launch-telemetry-dock="true"]');
      await expect(dock).toBeVisible();
      const abortBox = await dock.locator('[data-atlas-launch-action="abort"]').boundingBox();
      expect(abortBox?.height ?? 0).toBeGreaterThanOrEqual(40);
    } else if (frame.id === "mobile-kerr") {
      await openNavigatorItem(page, "Kerr", "panel:kerr-relativity-lab", "kerr");
      await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-selected-body-closeup-active", "false");
      const panel = page.locator('[data-kerr-accretion-boundary="display-model-not-grmhd"]');
      await expect(panel).toBeVisible();
      await expect(panel).toContainText("GRMHD");
    } else if (frame.id === "desktop-saturn-rings") {
      await openNavigatorItem(page, "Saturn", "solar-body:saturn", "inspect");
      const diagnostics = page.locator('[data-atlas-visual-diagnostics-surface="v217"]');
      await expect(diagnostics).toHaveAttribute("data-atlas-subject-id", "saturn");
      const silhouette = Number(await diagnostics.getAttribute(
        "data-atlas-subject-silhouette-coverage",
      ));
      expect(silhouette).toBeLessThanOrEqual(0.65);
    } else {
      await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "atlas");
    }

    await page.waitForTimeout(viewport === "mobile-390x844" ? 1_200 : 1_000);
    const evidence = {
      id: frame.id,
      candidate: await captureRiskFrame(page, viewport, frame),
      review: frame.review,
    };
    const report = path.join(CANDIDATE_ROOT, viewport, `risk-${frame.id}.json`);
    await writeFile(report, `${JSON.stringify({
      version: "v240-isolated-risk-frame",
      viewport,
      automaticBaselineReplacement: false,
      evidence,
    }, null, 2)}\n`);
  });
}
